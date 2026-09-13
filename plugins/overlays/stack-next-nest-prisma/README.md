# Overlay: stack Next + Nest + Prisma

Qué va acá: lo que se repite entre proyectos que comparten este stack y **no** aplica fuera de él.
Ejemplos: migrar Postgres con Prisma conservando RLS, contratos OpenAPI con SDK generado,
convenciones de monorepo pnpm + Turborepo para este combo.

Qué NO va acá: lo genérico de cualquier despliegue o revisión (va en `software-factory`) ni lo
irrepetible de un repo puntual (va en su propio overlay).

Se instala a nivel **proyecto**, en los repos que usan este stack.
