# Software Factory

Biblioteca reutilizable de agentes, skills, hooks y plugins de Claude (Code y Cowork).
Esta carpeta **no contiene proyectos**: contiene lo que se aplica *en* otros proyectos.
Las decisiones y el estado del trabajo viven en el Proyecto de Claude
("Creador de agentes, skills y plugins"), bajo `software-factory/`.

Este repositorio es además un **marketplace de plugins** de Claude Code
(`.claude-plugin/marketplace.json`). Es **privado**: instalarlo exige acceso de lectura a
`gittecnowork/software-factory` en GitHub.

## Qué hay hoy

| Plugin | Contenido |
|---|---|
| `software-factory` v0.5.2 | 5 agentes, 4 skills, 1 hook |
| `stack-next-nest-prisma` v0.2.0 | 1 skill: `migrar-postgres-a-supabase-con-prisma` |
| `tw-finance` | vacío — solo manifiesto y README de alcance |

**Agentes** (`plugins/software-factory/agents/`): `analista-de-requerimiento`, `arquitecto`,
`implementador`, `revisor`, `verificador`. Cinco roles, fijos. El revisor **lee** y el verificador
**ejecuta**: están separados a propósito, porque un cambio puede leerse impecable y fallar.

**Skills** (`plugins/software-factory/skills/`): `contrato-de-traspaso` (cómo se delega trabajo),
`desplegar-next-en-vercel-monorepo` (validada contra un despliegue real),
`alta-de-proyecto-en-la-fabrica` (conectar un repo nuevo o existente: marketplace, overlays,
`.claude/settings.json` y `CLAUDE.md`) y `commitear-con-verificacion` (qué entra de verdad al repo
antes de commitear, y cómo se confirma contra el remoto después de pushear).

**Hook** (`plugins/software-factory/hooks/`): al editar por primera vez en una sesión un archivo
**que ya existe** y que otros consumen (`turbo.json`, `package.json`, `Dockerfile` y sus variantes,
workflows de CI, `eas.json`, cualquier `*.config.*`, `schema.prisma`, lockfiles), corta una vez y
pide listar quién lo usa. La segunda edición pasa: es un badén, no un muro. Crear un archivo nuevo
nunca se bloquea, porque todavía no tiene consumidores. Escrito en Node para no depender de bash ni
de `jq`; normaliza mayúsculas en Windows y limpia sus marcas a los dos días.

El contrato de entrega común vive **una sola vez** en la skill `contrato-de-traspaso`; cada agente
lleva un resumen corto que apunta a ella, en vez de una copia completa.

`workflows/` sigue vacío.

## Estructura

```
.claude-plugin/marketplace.json   Catálogo: qué plugins publica este repo.
docs/
  decisiones/      Una decisión por archivo, con fecha.
  investigacion/   Hallazgos verificados, con fecha y fuente.
plugins/
  software-factory/          CAPA 1 — universal. Se instala a nivel usuario.
    agents/ skills/ hooks/ workflows/
  overlays/
    stack-next-nest-prisma/  CAPA 2 — por stack. Se instala a nivel proyecto.
    tw-finance/              CAPA 2 — por proyecto, solo para lo irrepetible.
```

La CAPA 3 no vive acá: es el `CLAUDE.md` de cada repo, con los **hechos e invariantes** de ese
proyecto. El **proceso** va en las skills, que se reutilizan; el `CLAUDE.md` guarda lo que solo es
cierto ahí.

## Cómo se conecta a un proyecto

Una vez, en cada máquina (requiere acceso de lectura al repo privado):

```bash
claude plugin marketplace add gittecnowork/software-factory
claude plugin install software-factory@tecnowork --scope user
```

Y en cada repo de proyecto, versionado en su `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "tecnowork": { "source": { "source": "github", "repo": "gittecnowork/software-factory" } }
  },
  "enabledPlugins": {
    "software-factory@tecnowork": true,
    "stack-next-nest-prisma@tecnowork": true
  }
}
```

⚠️ Si el `.gitignore` del proyecto ignora `.claude/` entero, hay que dejar de ignorar
`.claude/settings.json` (y seguir ignorando `.claude/settings.local.json`, que es personal), o la
configuración no viaja con el repo.

## Cuándo se activa cada cosa

| Disparador | Mecanismo | Cuándo |
|---|---|---|
| Intención | El campo `description` de la skill o del agente | Lo normal. Barato; depende del criterio del modelo. |
| Evento | `hooks` del plugin | Cuando la regla no puede depender de que alguien se acuerde: **bloquea** el paso. |
| Explícito | El nombre completo, con prefijo: `software-factory:contrato-de-traspaso` | Cuando la persona decide el procedimiento. |

## Estado de verificación

### Cómo se comprueba un cambio al plugin

⚠️ **`claude plugin validate .` en la raíz valida solo el manifiesto del marketplace, no el
plugin.** Un agente con el frontmatter roto pasa esa validación y después carga con los metadatos
vacíos, en silencio.

⚠️ **Y ninguna validación reemplaza a instalar de verdad.** Probar con `--plugin-dir` saltea
comprobaciones que solo corren en la instalación desde el marketplace: así se coló un `"hooks":
"./hooks/hooks.json"` en el manifiesto que rompía la carga, porque `hooks/hooks.json` ya se toma por
convención y declararlo lo cargaba dos veces. Validó bien, funcionó con `--plugin-dir`, y falló al
instalar.

El ciclo completo, después de cualquier cambio al plugin:

```bash
claude plugin validate .
claude plugin validate ./plugins/software-factory
# subir la version en plugin.json (regla 16), publicar, y recién entonces:
claude plugin marketplace update tecnowork
claude plugin update software-factory@tecnowork --scope user   # el scope donde está instalado
claude plugin list                  # cada entrada trae su Scope, su Version y su Status
```

El `--scope` va **siempre explícito en `update` e `install`** (regla 17): sin él asumen `user`, y un
plugin habilitado desde el `.claude/settings.json` de un repo está a `project`. `list` es la
excepción —no acepta `--scope`— y por eso es el comando con el que se lee el estado: imprime **todos
los scopes juntos**, cada uno etiquetado, así que muestra si el mismo plugin está a `user` con una
versión vieja y a `project` con la nueva. Si `update` no trae el contenido nuevo pese al bump, ahí
sí recurrir a `uninstall` + `install` en ese mismo scope.

**Verificado en esta máquina:** agregar el marketplace e instalar `software-factory` a nivel
usuario; que la skill de despliegue aparezca en una sesión nueva fuera de este repo con el prefijo
del plugin; que los cinco agentes aparezcan en el arranque de una sesión y que `software-factory:revisor`
responda con su rol y sus herramientas, tanto con ficha completa como con ficha incompleta (donde
frena y dice qué falta); que el hook corte la primera edición de un archivo compartido existente,
deje pasar la segunda, no moleste en un archivo común y no bloquee la creación de uno nuevo; la
**instalación real desde el marketplace**, con el plugin cargando habilitado; y —confirmado el
2026-09-14, registrado acá el 2026-09-15— que la skill de un **overlay** aparezca en la sesión de un
proyecto que lo habilita por `settings.json`, después de subir la versión del overlay, con
`marketplace update` + `plugin update --scope project` y **sin borrar caché a mano**.

**No verificado todavía** (no se afirma como hecho):

- Que `extraKnownMarketplaces` + `enabledPlugins` en un repo habilite los plugins sin intervención:
  se sospecha que Claude Code pide confirmar el marketplace al confiar la carpeta.
- Que un plugin cargue `workflows/`. Está en la referencia oficial de plugins; acá no se ejecutó
  ninguno.
- El overlay `tw-finance`, que sigue vacío: no tiene contenido que pueda cargar, así que no hay nada
  que verificar todavía. (Lo del overlay `stack-next-nest-prisma` ya se verificó: está arriba.)

## Reglas de la fábrica

1. El criterio de éxito de un comando es su **código de salida 0**, nunca la existencia de un archivo.
2. Antes de editar un archivo compartido, buscar **todos sus consumidores** (Docker, CI, EAS, scripts).
3. Una **hipótesis no verificada no se escribe como hecho**. "Documentado por el proveedor" y "verificado por nosotros" se escriben distinto.
4. Ningún paso **pago o destructivo** antes de terminar un preflight gratuito.
5. Cuando el documento y el código se contradicen, la pregunta es **cuál de los dos está mal**, no cuál editar.
6. Toda condición de parada lleva **alcance**: sin él, cualquier tarea se vuelve una auditoría infinita.
7. Toda skill pre-investigada lleva fecha de verificación y un paso de re-chequeo.
8. Agentes = roles, pocos y fijos. Skills = capacidades, muchas y acumulables.
9. Quien ejecuta devuelve siempre **correcciones al insumo**. Sin ese bloque, el ciclo no mejora.
10. La **evidencia admisible depende de las herramientas del rol**: código de salida para quien ejecuta, `archivo:línea` para quien lee, fuente con fecha para lo externo. Pedir una prueba que el rol no puede dar es un error de la ficha.
11. Un subagente **no puede preguntar**: o frena porque lo que falta haría el trabajo mal o irreversible, o asume lo más conservador y lo declara.
12. **Validar no es instalar.** Un plugin se prueba instalándolo desde el marketplace, no solo con `validate` ni con `--plugin-dir`.
13. **Una cita lleva fuente primaria y fecha.** Un dato tomado de un artículo que cita a otro no está verificado: o se abre la fuente, o se dice que no se abrió.
14. **Que Cowork escriba un archivo no se da por hecho hasta releerlo desde el disco.** Ya falló dos veces reportando éxito sin escribir.
15. **Un texto entregado para aplicar literalmente saltea la revisión crítica.** Si el contenido importa, se pide juicio, no obediencia.
16. **Todo cambio de contenido de un plugin sube su `version` en `plugin.json`, en el mismo commit.** El caché de plugins se indexa por versión, no por contenido: si la versión no cambia, `marketplace update` y `plugin update` no traen nada y la máquina se queda con el contenido viejo sin ningún error. Se detecta tarde y se confunde con "la skill no cargó". Un cambio publicado sin bump obliga a borrar el caché a mano en cada máquina que ya lo tenía. **Confirmada empíricamente el 2026-09-14, registrada acá el 2026-09-15**: el bump `0.1.0 → 0.2.0` de `stack-next-nest-prisma` (commit `6f67f1f`), más `marketplace update` y `plugin update --scope project`, trajo la skill nueva a una máquina que ya tenía cacheada la versión vieja, sin borrar caché a mano. Las dos fechas van separadas a propósito: entre medio, el commit `9b41783` todavía declara la carga del overlay como no verificada, y leer una sola fecha contra esa historia hace dudar de la regla.
17. **El `--scope` va explícito en `update` e `install`. `list` no lo acepta: muestra todos los scopes a la vez.** `claude plugin update` y `claude plugin install` asumen `user` si no se les pasa `--scope`, y un plugin habilitado por el `.claude/settings.json` versionado de un repo está a `project`. Por eso `Plugin X is not installed at scope user` es un **error de scope**, no de instalación ni de caché: se lee como si el plugin no estuviera, y acá casi hace descartar la regla 16 por falsa. Antes de dudar del contenido publicado, repetir el comando en el scope correcto. `claude plugin list` **no tiene** `--scope` —comprobado el 2026-09-15: responde `error: unknown option '--scope'`—; imprime cada plugin instalado con su `Scope`, su `Version` y su `Status`, y por eso es el comando con el que se lee el estado real. Escribirle un `--scope` que no existe no falla en silencio, pero sí corta la verificación a mitad de camino: la versión anterior de esta regla lo daba por hecho, y la skill `alta-de-proyecto-en-la-fabrica` lo había copiado.
18. **Cada repo se toca desde su propia sesión.** La sesión de la fábrica puede leer un proyecto y correr verificaciones de **solo lectura** sobre él, pero todo cambio dentro de un proyecto se decide y se ejecuta en la sesión de ese proyecto. Mezclarlos produce pedidos con premisas inventadas sobre el estado de un repo que nadie está mirando.
19. **Una frase ambigua en un reporte no es un defecto del sistema.** Antes de abrir una investigación sobre el repo, se pide que se aclare la frase. Acá una redacción imprecisa —"el directorio volvió a estar ignorado" por "el contenido del directorio salvo `settings.json`"— costó dos vueltas de verificación sobre un problema inexistente.

Las cuatro que siguen son sobre **cómo tiene que estar escrito un pedido** para que se pueda ejecutar. No describen el trabajo: describen el encargo. Un pedido que las incumple se devuelve corregido, no se ejecuta adivinando.

20. **Lo que un pedido afirma sobre el estado de un repo va escrito como premisa a verificar, con el comando que la verifica.** Una versión, un sha, una fecha, "ese archivo ya está commiteado": todo eso envejece entre que se escribe el pedido y se ejecuta, y quien lo escribe suele estar mirando otra sesión u otra máquina. La premisa que no se sostiene **se reporta con su evidencia y ahí frena el trabajo**; no se corrige por cuenta propia, porque quien escribió el pedido puede estar apoyando el resto de sus decisiones en ese mismo dato falso. Costo pagado: un pedido afirmó como hecho que el `.claude/settings.json` de un proyecto ya estaba commiteado, no lo estaba, y frenó el trabajo entero. Es la regla 18 vista desde el otro lado: ahí se prohíbe tocar un repo desde otra sesión, acá se prohíbe **afirmar** su estado desde otra sesión.
21. **Todo pedido con más de una sección normativa declara qué manda sobre qué y qué hacer ante un empate.** Alcance, restricciones, criterios y condiciones duras se escriben por separado y se leen juntos: en el caso límite casi siempre ordenan cosas distintas. La instrucción ante el empate es explícita —"si se contradicen, frená y preguntá; no elijas una"—, porque un ejecutor que desempata solo entrega trabajo coherente con una mitad del pedido y lo descubre recién al final. Costo pagado: ALCANCE y RESTRICCIONES mandaban cosas opuestas exactamente en el caso intermedio que se dio, y no en ninguno de los que el pedido había previsto.
22. **Lo que aparece POR el cambio bajo revisión nunca queda fuera de alcance.** Un archivo o un efecto que existe *a causa* del cambio es evidencia de ese cambio, no ruido ajeno, aunque el alcance lo excluya por nombre: el alcance se escribió antes de conocer las consecuencias. Excluirlo parte el trabajo en dos, y la primera mitad no funciona. Costo pagado: un `.gitignore` modificado hizo aparecer un archivo que el alcance trataba como ajeno y que era síntoma del propio diff. La skill `commitear-con-verificacion` ya lo aplica al `git status` previo al commit; acá vale para cualquier alcance, no solo el de un commit.
23. **Cada criterio dice cómo se observa y en qué máquina o sesión se observa.** Las dos mitades: sin comando no es un criterio, y con comando pero sin el lugar donde corre tampoco, porque "en una sesión limpia" o "desde el proyecto" no se pueden ver desde donde se está trabajando. Lo que no sea observable por quien ejecuta **va listado aparte, como pendiente**, no mezclado con los demás. Costo pagado: "en una sesión limpia quedan habilitados sin pasos manuales" viajó como sexto criterio junto a cinco que sí se podían correr en la máquina de trabajo; no era comprobable ahí, y el trabajo se reportó completo con un criterio abierto adentro. Extiende la regla 10: la evidencia admisible no depende solo de las herramientas del rol, también de dónde está parado quien observa.
