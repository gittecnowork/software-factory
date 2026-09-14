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
| `software-factory` v0.4.0 | 5 agentes, 3 skills, 1 hook |
| `stack-next-nest-prisma` v0.2.0 | 1 skill: `migrar-postgres-a-supabase-con-prisma` |
| `tw-finance` | vacío — solo manifiesto y README de alcance |

**Agentes** (`plugins/software-factory/agents/`): `analista-de-requerimiento`, `arquitecto`,
`implementador`, `revisor`, `verificador`. Cinco roles, fijos. El revisor **lee** y el verificador
**ejecuta**: están separados a propósito, porque un cambio puede leerse impecable y fallar.

**Skills** (`plugins/software-factory/skills/`): `contrato-de-traspaso` (cómo se delega trabajo),
`desplegar-next-en-vercel-monorepo` (validada contra un despliegue real) y
`alta-de-proyecto-en-la-fabrica` (conectar un repo nuevo o existente: marketplace, overlays,
`.claude/settings.json` y `CLAUDE.md`).

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
# publicar, y recién entonces:
claude plugin marketplace update tecnowork
claude plugin uninstall software-factory@tecnowork
claude plugin install software-factory@tecnowork --scope user
claude plugin list          # tiene que decir la versión nueva y "enabled"
```

**Verificado en esta máquina:** agregar el marketplace e instalar `software-factory` a nivel
usuario; que la skill de despliegue aparezca en una sesión nueva fuera de este repo con el prefijo
del plugin; que los cinco agentes aparezcan en el arranque de una sesión y que `software-factory:revisor`
responda con su rol y sus herramientas, tanto con ficha completa como con ficha incompleta (donde
frena y dice qué falta); que el hook corte la primera edición de un archivo compartido existente,
deje pasar la segunda, no moleste en un archivo común y no bloquee la creación de uno nuevo; y la
**instalación real desde el marketplace**, con el plugin cargando habilitado.

**No verificado todavía** (no se afirma como hecho):

- Que `extraKnownMarketplaces` + `enabledPlugins` en un repo habilite los plugins sin intervención:
  se sospecha que Claude Code pide confirmar el marketplace al confiar la carpeta.
- Que un plugin cargue `workflows/`. Está en la referencia oficial de plugins; acá no se ejecutó
  ninguno.
- El overlay `tw-finance`, que sigue vacío. El overlay `stack-next-nest-prisma` ya no lo está —tiene
  la skill `migrar-postgres-a-supabase-con-prisma`—, pero que esa skill cargue de verdad en la
  sesión de un proyecto que lo habilita, vía marketplace y sin borrar caché a mano, todavía no se
  verificó desde acá.

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
16. **Todo cambio de contenido de un plugin sube su `version` en `plugin.json`, en el mismo commit.** El caché de plugins se indexa por versión, no por contenido: si la versión no cambia, `marketplace update` y `plugin update` no traen nada y la máquina se queda con el contenido viejo sin ningún error. Se detecta tarde y se confunde con "la skill no cargó". Un cambio publicado sin bump obliga a borrar el caché a mano en cada máquina que ya lo tenía.
