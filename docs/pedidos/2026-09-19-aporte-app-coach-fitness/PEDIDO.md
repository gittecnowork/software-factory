# Pedido: primer aporte del proyecto app-coach-fitness a la fábrica

Fecha: 2026-09-19. Escrito por la sesión del proyecto `app-coach-fitness` (cuenta `juanchyhall`),
corriendo en Cowork con el plugin `software-factory` 0.6.1 sincronizado.
Para: la sesión de la fábrica.

**Nada de esta carpeta se entrega para aplicar literal (regla 15).** Los textos de `propuestas/`
son borradores: se pide juicio, no obediencia. Si una propuesta no se sostiene, la respuesta
esperada es la refutación con su evidencia.

## Correcciones a este pedido

Este bloque manda sobre todo lo demás (regla 25). Hoy está vacío porque el pedido todavía no se
ejecutó. Lo que la sesión de la fábrica encuentre falso o ambiguo acá se anota en este bloque antes
de seguir, y frena lo que dependa de eso.

## Precedencia (regla 21)

De mayor a menor: **Correcciones a este pedido** → **condiciones duras del `CLAUDE.md` de la
fábrica** → **Restricciones** → **Alcance** → **Salida esperada**. Si dos secciones se contradicen
en un caso que este pedido no previó: frenar y preguntar, no elegir una.

## 1. Objetivo

Que la fábrica decida, pieza por pieza, qué incorpora de lo que aprendió un proyecto en producción
con otro stack (Ionic/Angular + Node/Express + Supabase), y que quede definido cómo un proyecto
devuelve aprendizajes de acá en adelante.

## 2. Alcance

Entra:

- Leer `DEVOLUCION.md`: cuatro choques del plugin con este proyecto, con evidencia.
- Evaluar las cuatro propuestas de `propuestas/`.
- Evaluar las 23 skills de `skills/` con la tabla de `CLASIFICACION.md` y decidir capa, fusión o
  descarte de cada una.
- Decidir si `docs/pedidos/` pasa a ser la convención de entrada de aportes.

Queda afuera, explícitamente:

- Todo lo que vive bajo `plugins/`. Esta rama **no** lo toca: mover una skill a su capa, subir
  versiones y actualizar el README lo hace la sesión de la fábrica (reglas 16 y 18).
- `registro/proyectos.yaml`. La entrada de este proyecto llega cuando se haga el alta formal con la
  skill `alta-de-proyecto-en-la-fabrica`, que todavía no se corrió (ver `DEVOLUCION.md`, choque 2).
- El código, los datos y la documentación de producto del proyecto origen.

## 3. Insumos

| Archivo | Qué leer |
|---|---|
| `DEVOLUCION.md` | Completo, antes que nada. Tiene los cinco bloques del contrato |
| `CLASIFICACION.md` | Completo. Una fila por skill: capa sugerida, solapamientos y dudas |
| `propuestas/01` a `04` | Cada una es independiente y se puede aceptar o rechazar sola |
| `skills/<nombre>/SKILL.md` | 23 archivos. Leer completo el que se vaya a incorporar; la tabla alcanza para descartar |

## 4. Premisas sobre el estado del repo de la fábrica (regla 20)

Se escribieron mirando un clon de solo lectura del 2026-09-19. Envejecen: verificar antes de
apoyarse en ellas. La que no se sostenga se reporta y frena lo que dependa de ella.

| # | Premisa | Comando que la verifica (en el repo de la fábrica) |
|---|---|---|
| P1 | `main` estaba en `f330a06` | `git log -1 --format=%h origin/main` |
| P2 | `software-factory` está en 0.6.1 | `node -p "require('./plugins/software-factory/.claude-plugin/plugin.json').version"` |
| P3 | No existe `docs/pedidos/` en `main` | `git ls-tree -d origin/main docs/pedidos` sale vacío |
| P4 | El chequeo de frontmatter solo recorre `plugins/*/skills` y `.claude/skills`, así que las skills de esta carpeta no se validan ni cuentan para el README | `grep -n "listar(" .github/scripts/chequeos-fabrica.mjs` |
| P5 | Esta rama no toca `plugins/` | `git diff --stat origin/main...HEAD -- plugins/` sale vacío |

## 5. Criterios de aceptación (regla 23: cómo y dónde se observa)

Todos se observan **en la máquina de la sesión de la fábrica**, con la rama de este pedido
descargada.

1. `node .github/scripts/chequeos-fabrica.mjs` sale con código 0.
2. `git diff --stat origin/main...HEAD -- plugins/ registro/ README.md CLAUDE.md` sale vacío.
3. `grep -rniE "<patrones privados del proyecto>" docs/pedidos/2026-09-19-aporte-app-coach-fitness/`
   no devuelve nada. Los patrones (nombre real del cliente, nombres de usuarios reales, ref de
   Supabase, dominios de producción) **no se escriben acá** porque el repo es público: los tiene
   Juan y ya se corrieron en la sesión de origen antes del push (ver `DEVOLUCION.md`, Evidencia).
4. Cada una de las 23 skills y cada una de las 4 propuestas termina con una decisión escrita
   (incorporada en tal capa, fusionada con tal skill, o descartada con motivo) en un documento de
   `docs/decisiones/`.

Pendientes, no observables desde la sesión de origen (se listan aparte, regla 23):

- Si un overlay puede publicar sus propios hooks, que es lo que decide dónde va la propuesta 02.
- Si la limitación de la propuesta 04 también aparece en una sesión de Cowork local de escritorio,
  o solo en las sesiones en la nube vinculadas a una PC.

## 6. Restricciones

- **El repo es público, historial incluido** (condición dura 6). Si al revisar aparece un dato del
  proyecto origen que se nos escapó, no se corrige con un commit encima: se avisa, porque un dato
  pusheado ya está en el historial y hay que decidir si se reescribe la rama antes del merge.
- **Regla 16:** cuando una pieza entre a `plugins/`, el bump va en ese mismo commit. Por eso este
  pedido no mete nada ahí.
- **Regla 18:** la sesión de origen no edita el repo de la fábrica más allá de esta carpeta, y la
  sesión de la fábrica no edita el repo del proyecto.

## 7. Salida esperada

Dentro del bloque "Resultado" de la devolución: una tabla con las 27 piezas (23 skills + 4
propuestas) y la decisión de cada una, y la convención de aportes que quede vigente. Se admiten
varios commits (regla 26): incorporar skills a `plugins/` obliga a publicar y a volver a verificar
la carga.

## Condición de parada, con alcance

Frena: una premisa P1 a P5 falsa, un dato privado encontrado en la carpeta, o el chequeo en rojo.
No frena: que una skill parezca mejorable, que el estilo no coincida con el de la fábrica, o
cualquier hallazgo sobre el proyecto origen. Eso va a "Fuera de alcance".
