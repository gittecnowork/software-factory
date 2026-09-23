# Software Factory: condiciones para trabajar en este repo

Este repo es la biblioteca **y** el marketplace `tecnowork`: lo que se publica acá termina en
cada proyecto que lo consume. No contiene proyectos.

Este archivo guarda solo las condiciones que **bloquean**. Las 26 reglas completas y su porqué
están en `README.md`, sección "Reglas de la fábrica". Leer esa sección antes de cambiar una regla,
una skill o un agente. Los números de las reglas no se reciclan, porque los citan las skills y los
mensajes de commit.

## Condiciones duras

1. **Bump en el mismo commit (regla 16).** Todo cambio bajo `plugins/<x>/` sube el `version` de
   `plugins/<x>/.claude-plugin/plugin.json` en ese mismo commit. Lo que está fuera de `plugins/`
   (`registro/`, `docs/`, `.claude/`, `README.md`, `CLAUDE.md`) no es contenido de ningún plugin y
   no lleva bump.
2. **`--scope` explícito (regla 17).** `claude plugin update` e `install` llevan `--scope`
   siempre. `claude plugin list` no lo acepta y muestra todos los scopes juntos.
3. **Una publicación termina cuando llegó, no cuando se pusheó.** Ninguna de las dos vías trajo
   sola la 0.6.2 (medición del 2026-09-23). En cada máquina: `update --scope user`, y
   `update --scope project` desde cada repo del registro con `usa_fabrica: true`, revisando que no
   haya dos entradas del mismo repo; y en la app, Buscar actualizaciones → Actualizar, para Cowork.
   El ciclo completo está en README, "Cómo se comprueba un cambio al plugin".
4. **Validar no es instalar (reglas 12 y 24).** `claude plugin validate` no alcanza. Un cambio de
   plugin se da por bueno cuando se instaló desde el marketplace y se vio cargar. Cómo se comporta
   una herramienta se comprueba corriéndola, no se deduce.
5. **Cada repo desde su sesión (regla 18).** Desde acá, sobre otro repo, solo se hacen lecturas.
   `registro/proyectos.yaml` se edita solo desde esta sesión, con la skill local
   `auditar-registro`.
6. **El repo es público, historial incluido (regla 27 para los aportes).** No entran claves, tokens, connection strings,
   IPs, datos personales ni nombres reales de clientes: ni en el registro, ni en las skills, ni en
   los ejemplos. Lo que se commitea y se borra después sigue en el historial.
7. **Después de commitear y antes de pushear, `node .github/scripts/chequeos-fabrica.mjs` con
   código 0.** Es el mismo chequeo que corre en GitHub en cada push y cada PR (README, "Chequeos
   automáticos"). Compara commits: con cambios sin commitear o sin trackear falla a propósito.
8. **Commits solo cuando se piden**, con `software-factory:commitear-con-verificacion`, y
   confirmados contra el remoto (`git ls-remote`), no contra la ref local.

## Dónde va cada cosa

- ¿Seguiría siendo cierto en cualquier proyecto? → `plugins/software-factory`.
- ¿Solo en proyectos con ese stack? → overlay de stack.
- ¿Solo en un proyecto? → overlay de ese proyecto (si es un procedimiento) o el `CLAUDE.md` de
  ese repo (si es un hecho).
- ¿Solo sirve para mantener la fábrica? → `.claude/skills/` de este repo.
- Una decisión → `docs/decisiones/AAAA-MM-DD-tema.md`. Un hallazgo con fuente →
  `docs/investigacion/`.
