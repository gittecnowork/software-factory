# Software Factory

Biblioteca reutilizable de agentes, skills, hooks y plugins de Claude (Code y Cowork).
Esta carpeta **no contiene proyectos**: contiene lo que se aplica *en* otros proyectos.
Las decisiones y el estado del trabajo viven en el Proyecto de Claude
("Creador de agentes, skills y plugins"), bajo `software-factory/`.

Este repositorio es además un **marketplace de plugins** de Claude Code
(`.claude-plugin/marketplace.json`).

## Estructura

```
.claude-plugin/marketplace.json   Catálogo: qué plugins publica este repo.
docs/
  decisiones/      Una decisión por archivo, con fecha.
  investigacion/   Hallazgos verificados, con fecha y fuente.
plugins/
  software-factory/          CAPA 1 — universal. Se instala a nivel usuario.
    .claude-plugin/plugin.json
    agents/    Roles estables (pocos): analista, arquitecto, implementador, revisor, verificador.
    skills/    Capacidades genéricas de cualquier proyecto.
    hooks/     Puertas de calidad deterministas.
    workflows/ Orquestación determinista.
  overlays/
    stack-next-nest-prisma/  CAPA 2 — por stack. Se instala a nivel proyecto.
    tw-finance/              CAPA 2 — por proyecto, solo para lo irrepetible.
```

La CAPA 3 no vive acá: es el `CLAUDE.md` de cada repo, que guarda **hechos e invariantes** de ese
proyecto. El **proceso** va en las skills, que se reutilizan; el `CLAUDE.md` guarda lo que solo es
cierto ahí.

## Cómo se conecta a un proyecto

Una vez, en cada máquina:

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

Así cualquier sesión que abra ese repo tiene los agentes y skills correctos sin instalar nada.
⚠️ Si el `.gitignore` del proyecto ignora `.claude/` entero, hay que dejar de ignorar
`.claude/settings.json` (y seguir ignorando `.claude/settings.local.json`, que es personal), o la
configuración no viaja con el repo.

## Cuándo se activa cada cosa

| Disparador | Mecanismo | Cuándo usarlo |
|---|---|---|
| Por intención | El campo `description` de la skill | Lo normal. Barato, pero depende del criterio del modelo. |
| Por evento | `hooks` del plugin | Cuando la regla **no puede** depender de que alguien se acuerde: puede bloquear el paso. |
| Explícito | Invocar la skill por nombre | Cuando vos decidís el procedimiento. |

## Reglas de la fábrica

1. El criterio de éxito de un comando es su **código de salida 0**, nunca la existencia de un archivo.
2. Antes de editar un archivo compartido, buscar **todos sus consumidores** (Docker, CI, EAS, scripts).
3. Una **hipótesis no verificada no se escribe como hecho**; se anota como tal, con la comprobación que la cerraría.
4. Ningún paso **pago o destructivo** antes de terminar un preflight gratuito.
5. Cuando el documento y el código se contradicen, la pregunta es **cuál de los dos está mal**, no cuál editar.
6. Toda condición de parada lleva **alcance**: sin él, cualquier tarea se vuelve una auditoría infinita.
7. Toda skill pre-investigada lleva fecha de verificación y un paso de re-chequeo.
8. Agentes = roles, pocos y fijos. Skills = capacidades, muchas y acumulables.
