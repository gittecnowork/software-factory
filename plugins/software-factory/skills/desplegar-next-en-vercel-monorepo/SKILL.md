---
name: desplegar-next-en-vercel-monorepo
description: Desplegar una app Next.js que vive dentro de un monorepo pnpm + Turborepo en Vercel, desde cero hasta el primer deploy verificado. Usar cuando haya que publicar o migrar un frontend Next a Vercel, o cuando un deploy de monorepo en Vercel falle por configuración.
---

# Desplegar Next.js de un monorepo pnpm + Turborepo en Vercel

Versión 3 — corregida contra una ejecución real con deploy exitoso (tw-finance, 2026-09-12).
Verificado contra documentación oficial de Vercel (`/docs/monorepos`,
`/docs/monorepos/turborepo`, `/docs/git/vercel-for-github`, `/docs/plans/hobby`) y de Next
(`output`). **Antes de ejecutar, revisar que esas páginas no hayan cambiado.**

## Tres reglas que ordenan todo

1. **Nada pago ni destructivo antes de terminar el preflight.** El preflight es gratis.
2. **El criterio de éxito de un comando es su código de salida 0, nunca la existencia de un
   archivo.** Un build fallido deja artefactos a medias que parecen éxito.
3. **Antes de editar un archivo compartido, buscar todos sus consumidores.** `turbo.json`,
   `package.json`, `next.config` y `.gitignore` los leen también Docker, CI, EAS y los
   scripts de despliegue. Un cambio "solo para Vercel" puede romper producción por otra vía.

---

## Fase 0 — Preflight (gratis, obligatorio)

Cada punto se responde con evidencia. Si alguno falla, se detiene acá.

1. **Identidad.** ¿Qué cuenta de Git está vinculada al usuario de Vercel que va a importar?
   Se lee en `vercel.com/account/authentication`. Para un repo de **cuenta personal**, esa
   cuenta tiene que ser la **dueña**; un colaborador no puede importar ni conectar. Para un
   repo de **organización**, Owner, o Member con acceso al repo (Outside Collaborator no).
2. **Instalación de la app.** En `github.com/settings/installations`, pestaña **"Installed
   GitHub Apps"** — NO "Authorized GitHub Apps" ni "Authorized OAuth Apps", que solo
   permiten iniciar sesión y no dan acceso a ningún repositorio. Verificar que el repo esté
   en "Repository access" ("All repositories" ya lo cubre).
3. **Plan.** Hobby está restringido por las *fair use guidelines* a uso personal **no
   comercial**. El plan se paga **por equipo**: confirmar en qué equipo va a vivir el
   proyecto antes de pagar, o el upgrade queda en el equipo equivocado.
4. **Alcance de las herramientas de quien ejecuta.** Un conector/MCP de Vercel se autoriza
   por equipo **y** por alcance de proyectos: sin proyectos en su lista, `list_projects`
   devuelve vacío y `get_project` da 404 **aunque el proyecto exista**. Ese 404 se confunde
   con un permiso de GitHub faltante. Descartarlo antes de tocar nada en GitHub.
   El conector tampoco expone variables de entorno: para verlas, CLI (`vercel env ls`) o panel.
5. **Node.** Anotar qué declara `engines` en el `package.json` raíz, qué imagen usan los
   Dockerfile y qué versión ofrece hoy la plataforma. Un `>=20` no fija nada: la plataforma
   elige. Y una versión puede estar ya fuera de soporte (Node 20 terminó su vida útil el
   2026-04-30). No "fijar la del repo" por reflejo: decidir si lo que hay que actualizar es
   el repo.

---

## Fase 1 — Relevar antes de configurar (preguntas bloqueantes)

Ninguna se contesta de memoria: todas con ruta y línea.

1. **¿La app llama a la API desde el navegador o desde el servidor?** Buscar el prefijo
   público (`NEXT_PUBLIC_`) sobre la URL de la API, y si el módulo que la lee es
   `server-only`.
   - **Si es BFF** (URL no pública): todo el tráfico sale del servidor de Next, **CORS no
     interviene**. No agregar el dominio de Vercel a los orígenes del backend aunque la
     variable exista y aunque el nombre del dominio invite a hacerlo: sería abrir superficie
     sin necesidad.
   - **Si la URL es pública**: hay que sumar el dominio de producción **y los de preview** a
     los orígenes permitidos.
2. **¿El backend limita por IP?** Buscar el middleware de rate limiting y si define
   `keyGenerator`. Sin él, limita por `req.ip`. Con la web en Vercel **todos los usuarios
   comparten el cupo de las IP de egreso de Vercel**, y un render de servidor hace varias
   llamadas por página. Es invisible probando con una persona y revienta al cortar el DNS.
   **Esta pregunta bloquea la Fase 2**: hay que anotar el límite exacto y la decisión
   (subirlo por variable de entorno como puente, o mover el límite de IP a cuenta/token).
3. **`next.config`.** Anotar `output`, `outputFileTracingRoot` y `transpilePackages`.
   ⚠️ **`output: 'standalone'` no se toca.** Es una comodidad para auto-hospedaje; en Vercel
   no estorba, y si hay un Dockerfile de producción que sirve `.next/standalone`, quitarlo o
   condicionarlo **rompe producción**. Si molesta en la verificación local, el problema es
   dónde se verifica (ver Fase 3), no la configuración.
4. **Dependencias de workspace.** Qué paquetes consume la app, con qué script se construyen,
   y cuáles no tienen `build` (los que exportan archivos tal cual). Los que la app transpila
   desde su `dist` **tienen que construirse antes**.
5. **Consumidores de los archivos que vas a editar.** Buscar `turbo.json`, `vercel.json` y
   `.gitignore` en Dockerfiles, workflows de CI, `.easignore` y scripts de despliegue.
   Anotar si el consumidor realmente los usa o solo los copia.

---

## Fase 2A — Cambios en el repo

1. **⚠️ `turbo.json`: los `outputs` de la app.** Si la tarea `build` declara outputs
   genéricos (`dist/**`) y la app genera `.next/`, el primer deploy pasa y el **segundo
   falla** con *"build outputs cannot be found on cache hit"*: turbo reporta acierto de
   caché y no restaura nada porque nunca guardó `.next`.

   Dos formas, según el repo:

   - **Entrada por app** (cuando la app necesita outputs distintos del resto):
     ⚠️ una entrada `<app>#build` **reemplaza** a la genérica, no se fusiona con ella.
     Copiar el `dependsOn` de la genérica tal cual y cambiar **solo** `outputs`. Si la
     genérica trae `["^build", "generar"]` y escribís `["^build"]`, estás salteando una
     generación de código en silencio.

     ```json
     "web#build": {
       "dependsOn": ["^build", "generar"],
       "outputs": [".next/**", "!.next/cache/**"]
     }
     ```

   - **Sumar a la genérica** (más simple, si ninguna otra app se perjudica):
     agregar `".next/**"` y `"!.next/cache/**"` a los `outputs` de `build`.

   Verificar con `turbo run build --filter=<app> --dry-run=json`: el `!...` aparece como
   `excludedOutputs`, eso es correcto.

2. **⚠️ Variables de entorno y turbo: dos problemas distintos.**

   **(a) Modo estricto.** Turbo 2 corre en `envMode: strict`: durante el build **solo
   llegan** las variables declaradas, y las no declaradas **tampoco entran en el hash de
   caché**. Si algo se evalúa en tiempo de build leyendo una variable, un acierto de caché
   puede servir un valor viejo. Confirmar el modo en `--dry-run=json` (`envMode`, `env`).

   **(b) Variables de la plataforma.** Turbo compara las variables cargadas en el proyecto
   de la plataforma contra **cada tarea que corre**, y avisa por las que no estén
   contempladas: *"the following environment variables are set on your Vercel project, but
   missing from turbo.json ... WILL NOT be available to your application and may cause your
   build to fail"*. Declararlas solo en la tarea de la app **no alcanza**: el aviso sale
   igual por las tareas de los paquetes de workspace.

   Cuál usar depende de si la tarea usa la variable:

   | Caso | Declarar en | Efecto |
   |---|---|---|
   | La tarea **sí** la usa | `env` (por tarea) o `globalEnv` | Disponible y **entra en el hash**: al cambiar el valor, la caché se invalida |
   | La tarea **no** la usa | `passThroughEnv` (por tarea) o `globalPassThroughEnv` | Disponible y **no entra en el hash**: evita invalidar caché de tareas ajenas |

   Poner todo en `globalEnv` para callar el aviso es el error fácil: invalida la caché de
   todos los paquetes cada vez que cambia una variable que solo usa la app.

   Ante la duda sobre si una variable se lee en tiempo de build, elegir `env`: el costo es
   reconstruir de más, y el costo del error contrario es servir un valor viejo.

3. **Instalación filtrada** (opcional, acelera). En el `vercel.json` de la carpeta de la app:
   `{ "installCommand": "pnpm install --filter <app>..." }`. Los tres puntos incluyen las
   dependencias de workspace; sin ellos no se instalan.
   ⚠️ Ese filtro **no instala las devDependencies de la raíz**, que es donde suele vivir
   `turbo`. Vercel provee un `turbo` global y funciona, pero puede no ser la versión del
   lockfile. Verificarlo en el log del build (Fase 3) y, si no coincide, sumar la raíz al
   filtro o no filtrar.

4. **Preferir el repo al panel.** Todo lo que `vercel.json` admita va versionado ahí.

5. **Higiene tras `vercel link`.** El CLI crea `.vercel/` y un `.env.local` en la raíz, y
   edita el `.gitignore`. Revisar esa edición: suele agregar patrones amplios (`.env*`) que
   pueden tapar archivos que el repo versiona a propósito (plantillas `*.example`). Dejar
   `.vercel` ignorado y quitar lo redundante.

---

## Fase 2B — Ajustes que NO están en el repo (panel o CLI)

Ejecutar la Fase 2A sin esto deja el trabajo por la mitad.

1. **Root Directory** = la carpeta de la app. Es ajuste de proyecto, no va en `vercel.json`.
   De él Vercel deriva el filtro de Turborepo.
2. **Build Command**: con Turborepo detectado, el default es `turbo run build` con el filtro
   inferido del Root Directory. No tocar salvo que falle.
3. **Variables de entorno**, en Production, Preview y Development. Las que apuntaban a red
   privada (`http://api:3000`) pasan a la URL pública. Los secretos de firma de cookies o
   sesión se generan **nuevos** para este entorno.
4. Verificable sin panel: `vercel link`, luego `vercel project inspect` y `vercel env ls`
   (lista nombres y entornos, no valores: se puede pegar en un reporte).

---

## Fase 3 — Verificación

1. **No verificar el build en Windows.** El `output: 'standalone'` con pnpm crea symlinks, y
   Windows no los permite sin Modo de desarrollador o privilegios de administrador: el build
   falla con `EPERM: operation not permitted, symlink` en "Collecting build traces", después
   de haber compilado bien. Es un falso negativo y **no justifica ningún cambio de código**.
   Además un build en Windows no representa a Vercel, que compila en Linux, y toma los
   `.env.local` locales que la plataforma no va a tener.
   Verificar en Linux (WSL, Docker o CI) o directamente en el build de la plataforma.
2. **Criterio de éxito: código de salida 0.** `.next/BUILD_ID` existe aunque el build falle
   (Next lo escribe antes de copiar dependencias). No usarlo como prueba.
3. En el log del build de la plataforma: que las dependencias de workspace se construyan
   **antes** que la app, y qué versión de `turbo` corrió.
4. **Segundo deploy sin cambios**: tiene que terminar bien. Es el único que caza el problema
   de los `outputs` de turbo; el primero nunca lo muestra.
5. La página pública responde 200.
6. Recorrido con sesión real: iniciar sesión, entrar a una pantalla con datos, confirmar que
   la cookie sale con `Secure` y `HttpOnly`.
7. Un preview desde una rama, para comprobar que las variables llegaron al entorno Preview.
8. Logs de runtime: buscar timeouts, 429 y errores de certificado contra el backend.

---

## Fase 4 — Corte de dominio (recién después de la verificación)

Bajar el TTL del DNS **el día anterior**. Resolver antes el punto 2 de la Fase 1 (límite por
IP), que hasta acá era invisible. Agregar el dominio, apuntar el DNS, y dejar el origen
anterior encendido hasta confirmar tráfico. La vuelta atrás es volver a apuntar el DNS: no
se apaga nada hasta que haya una semana limpia.

---

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| El repo no aparece al importar | La app de GitHub no está instalada o el repo no está en su lista. La autorización OAuth no alcanza. |
| "Project not found" / 404 sobre un proyecto que existe | Alcance del conector o del token, no permisos de GitHub. |
| El segundo deploy falla y el primero pasó | Los `outputs` de la tarea de build no incluyen `.next/**`. |
| `EPERM ... symlink` en "Collecting build traces" | Windows sin permiso de symlinks + `output: 'standalone'`. Falso negativo: verificar en Linux, no cambiar el código. |
| El build "pasó" pero el deploy falla | Se usó la existencia de un archivo como criterio en vez del código de salida. |
| Una generación de código dejó de correr | Una entrada `<app>#build` reemplazó el `dependsOn` de la tarea genérica. |
| Caché que sirve un valor de configuración viejo | Variable leída en build sin declarar en `env`/`globalEnv` con `envMode: strict`. |
| Aviso de variables "missing from turbo.json" pese a haberlas declarado | Se declararon solo en la tarea de la app; las tareas de los paquetes de workspace necesitan `passThroughEnv` si no las usan. |
| 429 masivos después del corte de DNS | Rate limit por IP en el backend contra las IP de egreso de Vercel. |
| Se pagó un plan y el problema seguía | Se saltó el preflight: el plan casi nunca es la causa de un fallo de importación. |
| Un archivo `*.example` dejó de versionarse | `vercel link` amplió el `.gitignore` con un patrón `.env*`. |
