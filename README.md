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
| `software-factory` v0.3.0 | 5 agentes, 2 skills, 1 hook |
| `stack-next-nest-prisma` | vacío — solo manifiesto y README de alcance |
| `tw-finance` | vacío — solo manifiesto y README de alcance |

**Agentes** (`plugins/software-factory/agents/`): `analista-de-requerimiento`, `arquitecto`,
`implementador`, `revisor`, `verificador`. Cinco roles, fijos. El revisor **lee** y el verificador
**ejecuta**: están separados a propósito, porque un cambio puede leerse impecable y fallar.

**Skills** (`plugins/software-factory/skills/`): `contrato-de-traspaso` (cómo se delega trabajo) y
`desplegar-next-en-vercel-monorepo` (validada contra un despliegue real).

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

⚠️ **`claude plugin validate .` en la raíz valida solo el manifiesto del marketplace, no el
plugin.** Un agente con el frontmatter roto pasa esa validación y después carga con los metadatos
vacíos, en silencio. Hay que validar las dos cosas:

```bash
claude plugin validate .
claude plugin validate ./plugins/software-factory
```

**Verificado en esta máquina:** agregar el marketplace e instalar `software-factory` a nivel
usuario; que la skill de despliegue aparezca en una sesión nueva fuera de este repo con el prefijo
del plugin; que los cinco agentes aparezcan en el arranque de una sesión y que `software-factory:revisor`
responda con su rol y sus herramientas; y que el hook corte la primera edición de `package.json`,
deje pasar la segunda y no moleste en un archivo común.

**No verificado todavía** (no se afirma como hecho):

- La versión instalada desde el marketplace: las pruebas de agentes y hook se hicieron con
  `--plugin-dir`. Después de publicar hay que correr `claude plugin marketplace update tecnowork` y
  actualizar el plugin, o la instalación de usuario se queda en una versión vieja.
- Que `extraKnownMarketplaces` + `enabledPlugins` en un repo habilite los plugins sin intervención:
  se sospecha que Claude Code pide confirmar el marketplace al confiar la carpeta.
- Que un plugin cargue `workflows/`. Está en la referencia oficial de plugins; acá no se ejecutó
  ninguno.
- Los dos overlays, que están vacíos.

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
