# Propuesta 02: el hook de archivos compartidos, fuera del stack donde nació

Toca: `hooks/consumidores-de-archivo-compartido.mjs` y `agents/implementador.md`. Lleva bump.

## Qué se observó

Contra un repo Ionic/Angular + Node + Supabase, la lista `SENSIBLES` (`.mjs:14-42`) cubre lo común
a todo proyecto Node y deja afuera lo propio de este stack:

| Archivo | Quién más lo consume |
|---|---|
| `angular.json` | Build de producción de cada app, presupuestos de tamaño, `fileReplacements`, el host que despliega |
| `ionic.config.json` | CLI de Ionic, Capacitor |
| `capacitor.config.json` | Proyecto nativo de Android e iOS. Las variantes `.ts` y `.js` ya entran por el patrón `*.config.*` |
| `karma.conf.js` | Los unitarios. No entra: es `.conf.`, no `.config.` |
| `environment*.ts` | Se compila adentro del bundle: lo leen todas las pantallas y el build de producción usa otro archivo que el de desarrollo |
| `supabase/config.toml` | El entorno local de todo el equipo |
| `supabase/migrations/*.sql` **ya existente** | La base de producción, que ya lo corrió. Editarlo no cambia producción y sí cambia lo que obtiene el próximo `db reset` |

El último pide otro mensaje que el genérico: el consumidor no es otro proceso de build, es una base
que ya ejecutó el archivo.

## La decisión que hay que tomar primero

Por la pregunta de las tres capas, estos patrones no van a la base: van a un overlay de stack. Eso
requiere que un overlay pueda publicar su propio hook, y no se comprobó (regla 24). Si no puede,
las salidas son que el hook de la base lea patrones extra de un archivo del repo, o aceptar en la
base una lista que crece con cada stack.

## El alcance real del hook

El `matcher` es `Edit|Write|MultiEdit|NotebookEdit` (`hooks.json:6`). Una edición por shell (`sed`,
un script, el shell remoto de Cowork sobre la PC del usuario) no pasa por ahí. `implementador.md:16`
dice "Hay un hook que corta la primera edición de esos archivos". Texto propuesto:

> Hay un hook que corta la primera edición de esos archivos **cuando se editan con las herramientas
> de edición**. Una edición hecha por shell no lo dispara, y no en todos los entornos el hook está
> cargado. La búsqueda de consumidores es tu trabajo; el hook es solo un recordatorio.
