---
name: alta-de-proyecto-en-la-fabrica
description: "Conectar un repo a la fábrica: agregar el marketplace, elegir qué overlays instalar, versionar el .claude/settings.json y escribir o corregir el CLAUDE.md del proyecto. Usar al conectar un repo nuevo o existente a la fábrica, o cuando un proyecto ya conectado 'no ve' los agentes o las skills que debería. Cierra con la entrada para el registro de proyectos de la fábrica."
---

# Alta de un proyecto en la fábrica

Verificado: 2026-09-14, contra el README de la fábrica y la instalación real en esta máquina
(`software-factory@tecnowork` a nivel usuario, marketplace `tecnowork` agregado). Lo que el README
marca como no verificado —si `extraKnownMarketplaces` + `enabledPlugins` alcanza sin más, o si
además hace falta instalar cada plugin a mano— sigue sin cerrar acá: la Fase 5 de esta skill es
donde se comprueba cada vez, y lo que se descubra pasa a "Trampas ya pagadas".

Corregida el 2026-09-15 por la regla 17 del README: la Fase 5 atribuía a "falta instalarlo con
`--scope project`" un síntoma que muchas veces es el `--scope` faltante en el comando, no una
instalación ausente. Eso mandaba a reinstalar para arreglar un comando mal escrito.

Y corregida otra vez el mismo día contra el CLI real, corriéndolo: `claude plugin list` **no acepta
`--scope`** —devuelve `error: unknown option '--scope'`— y lista todos los scopes de una, cada uno
etiquetado. `update` e `install` sí lo aceptan y asumen `user` sin él. La regla 17 los trataba a los
tres igual y esta skill lo había copiado; se comprobó con `claude plugin list --help`,
`update --help` e `install --help` en la máquina de trabajo.

Ampliada el 2026-09-17: la Fase 0 activa la actualización automática del marketplace, que en
los marketplaces de terceros viene apagada.

Corregida el 2026-09-17: el repo de la fábrica pasó a ser público, y el marketplace ya no pide
acceso de lectura.

Ampliada el 2026-09-16 con la Fase 6: toda alta termina con la entrada para
`registro/proyectos.yaml` del repo de la fábrica.

## Lo que ordena todo

- El marketplace es de la **máquina**; los plugins habilitados son del **repo**. Confundirlos hace
  perder tiempo: un repo con `enabledPlugins` perfecto sigue sin ver nada si esta máquina nunca
  agregó `tecnowork`.
- La pregunta de las tres capas decide dónde va cada cosa, no la comodidad: ¿seguiría siendo cierto
  en otro proyecto? Siempre → `software-factory`. Solo con este stack → overlay de stack. Solo acá →
  overlay de proyecto o `CLAUDE.md`, según si es proceso o es un hecho.
- Nada de esto reemplaza instalar de verdad: `claude plugin list`, corrido con la sesión abierta
  **en el repo**, es la única prueba de que un plugin de alcance `project` está activo. Los dos
  comandos se usan distinto y confundirlos cuesta caro:
  - `update` e `install` **exigen `--scope` explícito**: sin él asumen `user`, y lo que habilita el
    `.claude/settings.json` de un repo está a `project`. Un `update` sin scope no actualiza lo que
    se quería actualizar; responde por otro scope.
  - `list` **no acepta `--scope`** (`error: unknown option '--scope'`). Imprime todos los scopes
    juntos, cada entrada con su `Scope`, su `Version` y su `Status`. Eso es una ventaja, no una
    limitación: es lo que deja ver que el mismo plugin está a `user` en una versión vieja y a
    `project` en la nueva. Ojo con `Scope: project`: lista los installs de **otros** repos también.
    Lo que cambia según dónde se corra el comando es el `Status` —comprobado: el mismo install de
    un overlay sale `enabled` en el repo que lo habilita y `disabled` en otro—, así que la prueba
    de que un plugin está activo *acá* es el `Status`, con la sesión abierta en este repo.

---

## Fase 0 — Preflight (gratis)

1. **Marketplace agregado en esta máquina, y con el nombre que usa el `settings.json`.**
   `claude plugin marketplace list` tiene que listar `tecnowork`. El nombre importa: `enabledPlugins`
   declara `plugin@marketplace`, y ese nombre es el que el marketplace tiene **en esta máquina**,
   no el del repo. Un mismo repo agregado con otro nombre —se vio `software-factory` en una máquina
   donde se agregó desde la app de escritorio— no resuelve `...@tecnowork`. Si el nombre no
   coincide, esa es la causa antes que cualquier otra.
   Además, la app de escritorio tiene su propia lista de plugins y su propio diálogo "Administrar
   mercados", con un toggle de sincronización aparte. Son superficies distintas del mismo repo: al
   diagnosticar, decir por cuál se instaló. Si no está: `claude plugin marketplace add gittecnowork/software-factory`. El repo
   es público desde el 2026-09-17: no pide credenciales.

   Con el marketplace agregado, **activar su actualización automática** en esta máquina:
   `/plugin` → Marketplaces → `tecnowork` → Enable auto-update.
   - [doc] En los marketplaces de terceros viene apagada. Sin este paso, la máquina se queda con la
     versión que instaló hasta que alguien corra `update` a mano, y no da ningún error.
   - Con la actualización activa, el chequeo corre en segundo plano, hasta 10 minutos después de
     abrir la sesión. La sesión abierta sigue con la versión que cargó, y un aviso pide
     `/reload-plugins`.
   - Está sin verificar si alcanza también a los installs de scope `project` (README, "No
     verificado todavía"). Mientras tanto, la Fase 5 sigue siendo la prueba.
2. **El repo no ignora `.claude/settings.json`.** Abrir el `.gitignore` y buscar `.claude`. Si
   excluye la carpeta entera, no alcanza con agregar una línea `!.claude/settings.json` debajo:
   Git no vuelve a mirar dentro de un directorio ya excluido, así que la excepción no tiene efecto.
   Hay que cambiar la exclusión de carpeta por una de archivos:

   ```gitignore
   .claude/*
   !.claude/settings.json
   ```

   Eso versiona `settings.json` y sigue ignorando todo lo demás de `.claude/`, `settings.local.json`
   incluido (que es personal y no debe versionarse).

   Para comprobarlo, `git check-ignore -v <archivo>` no alcanza solo: devuelve **código de salida
   0** con cualquier patrón que matchee, incluida una negación (`!...`), así que un match no prueba
   que el archivo siga ignorado. Mirar qué línea imprime (si empieza con `!`, no está ignorado) o,
   más directo, `git add -n .claude/settings.json`: si lo lista para agregar, quedó bien.
3. **Si ya existe `CLAUDE.md`, leerlo entero antes de tocar nada.** Un alta no es la oportunidad
   para reescribirlo: es para no contradecirlo. Si algo de lo que dice ya no es cierto, es un
   hallazgo para el reporte, no una licencia para reescribir de paso.

---

## Fase 1 — Relevar el stack real

Leer el repo, no lo que un README o un `CLAUDE.md` declaren: el `package.json` de la raíz y el de
cada paquete/aplicación del workspace, el gestor de paquetes y su lockfile, el ORM si hay uno, el
framework de cada app. La documentación de un repo con historia suele quedar vieja apenas el código
avanza. Con el stack real en mano, revisar la tabla de overlays existentes en
`.claude-plugin/marketplace.json` de la fábrica: puede que ya exista uno para ese stack.

---

## Fase 2 — Elegir capas

Por cada capacidad candidata (una convención, un checklist, una skill), una sola pregunta:
**¿esto seguiría siendo cierto en otro proyecto?**

- **Sí, siempre** → `plugins/software-factory` (CAPA 1).
- **Sí, pero solo en proyectos con este mismo stack** → el overlay de stack (CAPA 2), o uno nuevo
  si todavía no existe.
- **No, solo en este repo** → acá se bifurca de nuevo: si es un **hecho o invariante** (algo cierto
  del dominio o del sistema, no un procedimiento) va al `CLAUDE.md` del repo. Si es un
  **procedimiento** que se va a repetir, va a un overlay de proyecto (CAPA 2, propio de ese repo).

Un overlay de proyecto que crece mucho es una señal de que hay una capacidad reutilizable sin
extraer todavía — moverla a un overlay de stack o a la base, no dejarla ahí por inercia.

---

## Fase 3 — Escribir el `.claude/settings.json` del repo

Versionado, con el marketplace y **todos** los plugins que el repo necesita — el plugin base
incluido, aunque ya esté instalado a nivel usuario en esta máquina: sin listarlo acá, el repo no es
autosuficiente en una máquina nueva.

```json
{
  "extraKnownMarketplaces": {
    "tecnowork": { "source": { "source": "github", "repo": "gittecnowork/software-factory" } }
  },
  "enabledPlugins": {
    "software-factory@tecnowork": true,
    "<overlay-de-stack>@tecnowork": true,
    "<overlay-de-proyecto>@tecnowork": true
  }
}
```

Si `.claude/settings.local.json` existe, confirmar que sigue ignorado y que no repite ninguna de
estas claves: es personal, y una entrada duplicada ahí puede pisar en silencio a la versionada.

---

## Fase 4 — `CLAUDE.md`

Qué va: hechos e invariantes de **este** repo — y de cada invariante, el porqué, porque sin el
porqué alguien lo va a "mejorar". Qué NO va: proceso. Un paso a paso, un checklist, una secuencia de
comandos son skill, no `CLAUDE.md`: si se escriben ahí, se duplican y divergen la primera vez que
la skill cambie.

Si el repo es **existente** y ya tiene `CLAUDE.md`: no se reescribe de cero. Cada afirmación que se
toque se **verifica contra el código antes de escribirse** —ruta y línea, no memoria ni el README
del propio repo— y el documento tiene que contar el **presente**: una migración en curso, un
componente reemplazado o un runbook dado de baja se actualizan, no se dejan describiendo un estado
que ya pasó.

---

## Fase 5 — Verificación

Ninguna es opcional; todas se corren con una **sesión nueva, abierta en el repo del proyecto**, no
en la fábrica.

1. Los agentes de cada plugin habilitado aparecen con su prefijo (`software-factory:revisor`,
   etc.) y al menos uno responde con su rol al invocarlo.
2. Si el repo tiene un archivo que el hook de la fábrica vigila (`package.json`, `turbo.json`,
   `Dockerfile`, un lockfile...), editarlo una vez: el hook tiene que cortar y pedir los
   consumidores.
3. `claude plugin list` muestra cada plugin de `enabledPlugins` con `Scope: project`, la versión
   esperada y `enabled`. **Leer la línea `Scope` de cada entrada, no solo el nombre**: el mismo
   plugin puede aparecer dos veces, a `user` con una versión vieja y a `project` con la nueva, y
   quedarse en el primer renglón es concluir que el bump no llegó cuando sí llegó.

   Si falta alguno pese a estar en `settings.json`, hay **tres causas posibles y se descartan en
   este orden**, de la más barata a la más cara:

   1. **El scope del comando.** Es lo primero y lo más barato. `list` los muestra todos, así que si
      acá el plugin no está, no está en ninguno. Pero si el síntoma vino de un `update` que
      respondió `Plugin X is not installed at scope user`, eso **no** es "no está instalado": es
      que faltó `--scope project` en ese `update`. Repetirlo con el scope correcto antes de tocar
      cualquier otra cosa.
   2. **El plugin no está instalado en ese scope.** Recién si `list` tampoco lo muestra a
      `project`: `claude plugin install <plugin>@tecnowork --scope project`. Si `extraKnownMarketplaces`
      + `enabledPlugins` alcanza sin este paso es justo lo que el README de la fábrica marca como
      no verificado; esta fase es donde se comprueba, y lo que se descubra pasa a "Trampas ya
      pagadas".
   3. **El marketplace no está en esta máquina.** Se descarta en la Fase 0, pero si se salteó, es
      esto.

   El orden importa: invertirlo hace reinstalar, desinstalar y borrar caché para arreglar un
   comando mal escrito, y de paso ensucia el estado real del que se partía.
4. **Si un agente o una skill que se acaba de agregar a un plugin no aparece**, y `claude plugin
   list` sí muestra el plugin como `enabled` **con la versión nueva**: el caché
   local de plugins se indexa por **número de versión**, no por contenido. `claude plugin
   marketplace update` refresca el catálogo, pero si el `plugin.json` del plugin no subió de
   versión, el contenido cacheado de esa versión **no se vuelve a bajar** — ni con `marketplace
   update` ni con `claude plugin update --scope <el que corresponda>`. La causa no es un
   settings.json mal escrito ni una sesión vieja: es que quien publicó el cambio no subió la
   versión del plugin. La solución es esa —subir la versión y volver a instalar—, no reinstalar en
   bucle.

   La versión que `list` reporta es lo que separa este caso del punto 3: si dice la versión
   **vieja**, es caché y falta el bump; si dice la **nueva** y la skill igual no aparece, el
   problema está en el contenido publicado, no en el caché.

---

## Fase 6 — Entrada para el registro de proyectos

La fábrica lleva un inventario de todo proyecto que ocupa recursos de Tecnowork:
`registro/proyectos.yaml`, en el repo `gittecnowork/software-factory`. **Esta fase no escribe
ese archivo.** Esta skill corre en la sesión del proyecto, y la regla 18 prohíbe que una sesión
modifique un repo que no es el suyo. Lo que hace esta fase es devolver la entrada lista, como un
bloque aparte del reporte, para que la sesión de la fábrica la pegue y la audite.

1. Armar la entrada con el esquema que está en la cabecera del registro. Los datos se sacan de
   este repo y de los MCP, no de memoria:
   - `repo`: `git remote get-url origin`.
   - `plugins`: las claves de `enabledPlugins` del `.claude/settings.json` que se escribió en la
     Fase 3, **sin versión**. `enabledPlugins` no fija versión, así que registrar una sería
     inventarla.
   - `recursos`: ids reales, leídos por MCP (Supabase `list_projects`, Vercel `list_projects`,
     Railway `list-projects`) o del panel. Si un recurso todavía no existe, va `null`. No se
     completa con el nombre que "va a tener".
2. Todo dato que no se pudo observar va con `verificado: false` y una nota que dice qué falta y
   por qué (regla 3). Un campo que no se conoce se escribe `"sin confirmar"`; no se deja vacío
   ni se adivina.
3. **Nunca** van claves, contraseñas, connection strings ni tokens, aunque estén a mano en un
   `.env`. Tampoco costos ni estado en vivo: eso se consulta, no se copia.
4. Si el proyecto ya tenía una entrada (un alta repetida, o un repo que ya ocupaba recursos antes
   de conectarse), se devuelve **solo lo que cambia**, con el `id` existente, y no una entrada
   nueva.

Salida esperada: un bloque YAML con la entrada (o el cambio) y, debajo, la lista de campos con
`verificado: false`. El alta no se da por cerrada sin ese bloque.

---

## Repo nuevo vs. repo existente

En un repo **nuevo**, el alta se parte en dos tiempos. Al crearlo: la base (`software-factory`),
un `CLAUDE.md` mínimo con lo poco que ya se sabe (qué es, para quién) y la entrada del registro con
`estado: desarrollo` y los recursos que ya existan. El overlay de stack recién
se agrega **después** de la decisión de arquitectura — antes no hay stack que overlayear, y
elegirlo antes de tiempo es adivinar. En un repo **existente**, las tres fases (relevar, elegir
capas, escribir) se hacen en la misma alta, porque el stack y la historia ya están.

---

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| El repo tiene `.claude/settings.json` bien escrito y la sesión no ve nada | Esta máquina nunca agregó el marketplace `tecnowork`: el marketplace es de la máquina, no del repo. |
| El `settings.json` declara `...@tecnowork` y la máquina no ve nada | El marketplace está agregado con otro nombre en esa máquina (por ejemplo `software-factory`, si se agregó desde la app de escritorio). El nombre del marketplace es local a la máquina. |
| Se publicó una versión nueva y una máquina sigue con la anterior, sin ningún error | `tecnowork` es un marketplace de terceros y su actualización automática viene apagada. Se activa en `/plugin` → Marketplaces, o se actualiza a mano con `marketplace update` + `update --scope`. Sin bump de versión no llega nada por ninguno de los dos caminos. |
| Se agregó `!.claude/settings.json` al `.gitignore` y sigue sin versionarse | El directorio `.claude/` estaba excluido entero: Git no evalúa excepciones dentro de una carpeta ya ignorada. Hay que excluir por archivo (`.claude/*` + `!archivo`), no por carpeta. |
| Un overlay listado en `enabledPlugins` no aparece en `claude plugin list` | `list` muestra todos los scopes, así que si no está ahí no está en ninguno: puede hacer falta instalarlo además, con `install --scope project`. Distinto es si el síntoma vino de un `update`: ahí lo primero a descartar es el `--scope` faltante. |
| `claude plugin list --scope project` responde `error: unknown option '--scope'` | `list` no acepta `--scope`, a diferencia de `update` e `install`. Correrlo sin la opción: ya lista todos los scopes, etiquetados. |
| `list` muestra el plugin dos veces con versiones distintas | No es un error: está instalado a `user` y a `project`. Vale el de `project`, que es el que el repo habilita. Leer la entrada equivocada hace creer que el bump no llegó. |
| `claude plugin update` responde `Plugin X is not installed at scope user` | Error de scope, no de instalación ni de caché. El plugin está a `project`, habilitado por el `.claude/settings.json` del repo. Repetir con `--scope project`. Acá esta lectura casi hace descartar por falsa la regla del bump de versión. |
| El plugin figura `enabled` **con la versión vieja** y una skill o un agente nuevos no aparecen | El caché local quedó en esa versión: el `plugin.json` no subió de versión cuando se agregó contenido, y ni `marketplace update` ni `plugin update` vuelven a bajarlo. |
| El plugin figura `enabled` **con la versión nueva** y la skill nueva igual no aparece | No es caché ni scope: el contenido publicado no trae la skill, o su frontmatter está roto. Mirar el árbol publicado, no reinstalar. |
