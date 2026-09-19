---
name: migraciones-a-supabase-cloud
description: Aplicar migraciones locales a un proyecto Supabase en la nube de forma segura: backup manual con el CLI antes de tocar nada, `migration list` para ver el historial remoto, `migration repair` cuando la nube se armó a mano y no registró nada, `db push` incremental, y los detalles que rompen en cloud pero no en local (pgcrypto en el esquema `extensions`, search_path de funciones SQL). Activar antes de cualquier `supabase db push`, cuando `migration list` muestra la columna Remote vacía, o cuando una migración falla en cloud con "function does not exist".
---

# Migraciones a Supabase cloud

## Cuándo aplica
Cada vez que una migración local tiene que llegar a producción. Con más cuidado si la base cloud tiene datos reales o fue creada a mano.

## La lección
La base cloud del proyecto tenía **todas** las tablas hasta cierta migración, pero **cero historial**: se había armado a mano y con parches ad-hoc. `migration list` mostraba 24 migraciones locales y la columna Remote vacía. Un `db push` directo habría intentado crear el esquema entero contra tablas existentes.

Se resolvió determinando el punto exacto donde la nube se había quedado (grep sobre el dump del esquema buscando marcadores de cada migración), marcando esas como aplicadas con `migration repair`, y empujando el resto.

Y el resto falló en la 027: `gen_random_bytes` "no existe". Existía — en el esquema `extensions`, donde Supabase instala todo. La función `LANGUAGE sql` se valida al crearse con un `search_path` que en cloud no lo incluye. Local no fallaba porque ahí sí. Un `SET search_path = public, extensions` en la función lo resolvió en los dos lados.

## Reglas
1. **Backup antes, fuera del repo.** `supabase db dump -f <ruta>` (esquema) y `--data-only` (datos), a una carpeta que no está en git: el de datos tiene usuarios reales. Verificar que el de datos pesa y tiene `INSERT` de las tablas principales — un dump vacío parece exitoso.
2. **`migration list` siempre antes de `push`.** Si Remote está vacío o incompleto, no pushear.
3. **Determinar hasta dónde llegó la nube con evidencia**, no con memoria: grep sobre el dump del esquema buscando una columna/tabla/función distintiva de cada migración. Anotar el corte.
4. **`migration repair --status applied <versiones>`** para las que la nube ya tiene. Sólo esas. Las que están escritas con `IF NOT EXISTS` toleran aplicarse sobre una base que ya tenga parte; las que no (el esquema inicial), no.
5. **`db push` aplica en orden y se corta en el primer error**; las anteriores quedan registradas. Arreglar la que falló (es un archivo del repo: commitear el fix) y volver a pushear, que retoma.
6. **Extensiones en cloud viven en `extensions`.** Funciones SQL que usen pgcrypto (`gen_random_bytes`, `digest`, `crypt`) llevan `SET search_path = public, extensions` en su definición. `CREATE EXTENSION IF NOT EXISTS` no alcanza si ya existe en otro esquema.
7. **Migraciones aditivas se pueden aplicar antes del deploy del código**: la app vieja las ignora, y el día D queda sólo el push de código. Verificar después que la app vieja sigue viva (abrir el panel de producción).
8. **Migraciones idempotentes por defecto** (`IF NOT EXISTS`, `OR REPLACE`, `DROP ... IF EXISTS` antes de recrear índices que cambian de tipo). Un `CREATE INDEX IF NOT EXISTS` sobre un índice que existe sin `UNIQUE` lo deja no-único para siempre, sin avisar.
9. **Los seeds no van a la nube**: lo que use `digest()` o `crypt()` en seeds no importa; sólo las migraciones.

## Checklist
- [ ] Backup de esquema y datos, fuera del repo, con contenido verificado.
- [ ] `migration list` leído. ¿Remote completo, vacío o parcial?
- [ ] Si parcial/vacío: corte determinado con grep sobre el dump, `repair` sólo hasta ahí.
- [ ] Funciones SQL con pgcrypto llevan `SET search_path`.
- [ ] `db push` → todas aplicadas; `migration list` con las dos columnas iguales.
- [ ] La app en producción sigue funcionando sobre la base migrada.
- [ ] Los backfills esperados corrieron (ej. tokens generados para usuarios reales).

## Trampas conocidas
- **Marcar 001-N como aplicadas "porque seguro están"**: la 017 no estaba, y su backfill migraba datos.
- **`IF NOT EXISTS` sobre índices que cambian de UNIQUE a no-UNIQUE** o viceversa: no hace nada y no avisa.
- **CHECK en la base distinto de la validación del código** (ver `checks-alineados-con-el-codigo`).
- **El fix de una migración fallida sin commitear:** el próximo `db reset` local usa la versión vieja.
