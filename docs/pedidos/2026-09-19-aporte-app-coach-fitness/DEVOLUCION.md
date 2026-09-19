# Devolución: `software-factory` 0.6.1 usado desde un proyecto en producción

Fecha: 2026-09-19. Proyecto: `app-coach-fitness` (app de un cliente con usuarios reales, Ionic/Angular
+ Node/Express + Supabase, backend en Railway, frontends en Vercel). Sesión: Cowork en la nube,
vinculada a la PC donde vive el repo, con el plugin sincronizado desde la cuenta.

Formato: los cinco bloques de `contrato-de-traspaso`.

## Resultado

Se leyó el plugin completo (cinco agentes, cuatro skills, el hook, el manifiesto), el README y el
`CLAUDE.md` de la fábrica, y la decisión del 2026-09-17 sobre revisión de contribuciones. Se probó
un agente de la fábrica desde esta sesión. El protocolo funciona y se entiende sin explicación
externa; lo que sigue son los cuatro lugares donde choca con un proyecto que no es el que lo vio
nacer.

**Choque 1. Los agentes con lista cerrada de herramientas no ven el repo desde Cowork en la nube.**
Se lanzó `software-factory:revisor` con una ficha de sondeo: leer un archivo del repo. El agente
corre en un contenedor Linux con `Read`, `Glob` y `Grep`; el repo vive en la PC vinculada y solo se
alcanza con las herramientas del puente al dispositivo, que la lista `tools:` del agente deja
afuera. Los tres intentos fallaron. Afecta igual a `analista-de-requerimiento` y `arquitecto`
(mismas herramientas de lectura), y a `implementador` y `verificador`, cuyo `Bash` es el del
contenedor, no el de la PC. En Claude Code local no pasa. Propuesta 04.

**Choque 2. El alta supone un `CLAUDE.md` versionable y este repo lo ignora a propósito.**
El `.gitignore` del proyecto excluye `CLAUDE.md`, `CLAUDE-*.md` y `.claude/` entera. Lo de
`.claude/` ya está en "Trampas ya pagadas" del alta. Lo de `CLAUDE.md` no: la Fase 4 lo trata como
la casa de los invariantes del repo, y acá esos invariantes viven en un archivo que no viaja con el
código. Una auditoría hecha sobre un zip de `main` encontró una migración que citaba "ver
CLAUDE.md" y no pudo seguir la referencia. Propuesta 03.

**Choque 3. La lista de archivos compartidos del hook es la de otro stack.**
En este repo cubre `package.json`, los lockfiles, `vercel.json`, los `tsconfig*.json`,
`capacitor.config.ts` y `playwright.config.ts`. No cubre `angular.json` (donde viven los
presupuestos de build y los `fileReplacements`), `ionic.config.json`, `karma.conf.js`,
`supabase/config.toml`, los `environment*.ts` ni una migración SQL ya aplicada, que acá es el
archivo compartido más caro de editar: la base de producción ya la corrió y el archivo deja de
describir lo que hay. Propuesta 02.

**Choque 4. El hook solo ve ediciones hechas con las herramientas de edición.**
El `matcher` es `Edit|Write|MultiEdit|NotebookEdit`. En esta sesión los archivos del proyecto se
editan por un shell remoto en la PC (`sed`, scripts), y cualquier agente con `Bash` puede hacer lo
mismo. El hook no corta ninguna de esas ediciones. No es un defecto del hook, es su alcance real, y
hoy el texto del `implementador` lo presenta como una red que siempre está. Va dentro de la
propuesta 02.

**Lo que funcionó y conviene no tocar.** El agente del sondeo devolvió los cinco bloques sin que la
ficha se los recordara, no inventó contenido, y usó "Correcciones al insumo" para decir exactamente
lo que fallaba del encargo (ruta de Windows en un sandbox Linux). Es el comportamiento que el
contrato busca. Las fechas de verificación y el historial de correcciones dentro de cada skill
hicieron posible confiar en ellas sin re-verificarlas.

**Un criterio que este proyecto pagó y la fábrica no tiene: quién puede disparar un riesgo.**
Propuesta 01. Es la que más cambia el día a día.

## Evidencia

Lecturas del plugin, como `archivo:línea` del repo de la fábrica en `f330a06`:

- `plugins/software-factory/agents/revisor.md:4` — `tools: Read, Glob, Grep`.
- `plugins/software-factory/agents/revisor.md:24` — "Cada hallazgo va con `archivo:línea`, qué
  falla concretamente, y qué pasa si no se arregla."
- `plugins/software-factory/hooks/hooks.json:6` — `"matcher": "Edit|Write|MultiEdit|NotebookEdit"`.
- `plugins/software-factory/hooks/consumidores-de-archivo-compartido.mjs:14-42` — la lista
  `SENSIBLES`.
- `plugins/software-factory/skills/alta-de-proyecto-en-la-fabrica/SKILL.md:59` — Fase 0, punto 2.
- `registro/proyectos.yaml`, entrada `app-al` — "Aporta por rama + pedido en su docs/pedidos/".

Sondeo del agente (2026-09-19, sesión de origen): tres intentos, tres errores textuales.
`Read` de la ruta de Windows del repo → "File does not exist. Note: your current working directory
is /home/claude."; `Read` de la misma ruta relativa bajo `/home/claude` → mismo error; `Glob` de
`**/<archivo>` → "No files found". Herramientas que el agente declaró tener: `Read`, `Glob`, `Grep`.

En el repo del proyecto: el `.gitignore` tiene en las líneas 150 a 152 `CLAUDE.md`, `CLAUDE-*.md`
y `.claude/`. No existe carpeta `.claude/` en la raíz. Archivos compartidos que el hook no cubre,
listados con `ls`: `apps/admin/angular.json`, `apps/mobile/angular.json`,
`apps/mobile/ionic.config.json`, `supabase/config.toml`.

Limpieza de datos privados antes de armar esta carpeta: reemplazo por script y `grep -rniE` de los
patrones privados sobre toda la carpeta, con salida vacía. Los patrones no se escriben acá.

## No verificado

- **Que el choque 1 aparezca en Cowork local de escritorio.** Solo se probó en una sesión en la
  nube vinculada a una PC. Lo cerraría el mismo sondeo corrido desde una sesión local.
- **Que un overlay pueda publicar hooks propios.** La referencia oficial de plugins lo admite para
  cualquier plugin; acá no se probó (regla 24). Lo cerraría un overlay de prueba con un hook que
  escriba una marca.
- **La clasificación por capa de las 23 skills.** Se hizo leyendo cada skill completa, pero con la
  pregunta de las tres capas aplicada por alguien que conoce un solo stack de los dos que la fábrica
  ya tiene. Es una sugerencia, no una verificación.
- **Que `main` de la fábrica sea la rama que lee el marketplace.** Se deduce de `chequeos.yml`. No
  se leyó en la documentación del proveedor.

## Fuera de alcance

Encontrado y no tocado:

- `desplegar-next-en-vercel-monorepo` vive en `plugins/software-factory/skills/`, la capa
  universal, y su propio título nombra un stack. Por la pregunta de las tres capas parece de
  `stack-next-nest-prisma`. Puede haber un motivo que no vimos.
- Las tres secciones finales de los cinco agentes ("Cómo entregás", "Cuando falta algo", "Con qué
  contás") son texto idéntico repetido cinco veces. Es coherente con que un agente arranca con
  contexto cero y no puede incluir otro archivo, pero un cambio en esas reglas hay que replicarlo a
  mano en cinco lugares. Preferencia, no defecto.
- `workflows/` está vacío. El ciclo analista → arquitecto → implementador → revisor → verificador
  lo arma hoy la sesión principal de memoria.
- Supabase aparece en el stack de este proyecto y también en el overlay de otro stack
  (`stack-next-nest-prisma` trae `migrar-postgres-a-supabase-con-prisma`). El modelo de capas tiene "stack" y "proyecto", pero no un lugar obvio para una
  capacidad atada a un **servicio** que cruza stacks (ver `CLASIFICACION.md`, nota 3).

## Correcciones al insumo

El insumo de este trabajo fue el plugin mismo y su documentación.

1. **El README no dice cómo un proyecto devuelve aprendizajes.** La única pista es una nota dentro
   de una entrada del registro ("rama + pedido en su docs/pedidos/"), y no queda claro si "su" es
   el repo del proyecto o el de la fábrica. Esta carpeta asume el de la fábrica. La decisión del
   2026-09-17 deja escribir "cómo contribuir por PR" para después de la etapa 3; mientras tanto
   alcanzaría una línea en el README.
2. **El `implementador` promete un hook que no siempre está** ("Hay un hook que corta la primera
   edición de esos archivos"). Es cierto solo para ediciones con herramientas de edición, en un
   entorno donde el hook cargó. Conviene que el texto lo diga.
3. **El alta no contempla un repo que ignora `CLAUDE.md`.**
4. **Ninguna pieza dice desde qué superficies funciona.** El plugin se sincroniza a Cowork igual que
   a Claude Code, los agentes aparecen listados y se pueden invocar, y fallan recién al intentar
   leer. Una línea de "dónde corre cada rol" habría ahorrado el sondeo (regla 23 aplicada al propio
   plugin).
