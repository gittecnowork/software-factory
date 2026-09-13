---
name: contrato-de-traspaso
description: Escribir la ficha con la que se le pasa trabajo a un agente, a otra sesión o a una persona. Usar antes de delegar cualquier tarea, y cuando un agente devuelve algo que no se puede aprovechar porque el encargo era ambiguo.
---

# Contrato de traspaso

Un agente arranca con **contexto cero**: no hereda la conversación, ni los archivos que otro leyó,
ni las skills que otro invocó. Todo lo que no esté en la ficha, lo va a suponer. Por eso la ficha no
es burocracia: es el único canal.

Las dos causas dominantes de fracaso en equipos de agentes son la **especificación ambigua** y la
**coordinación**, muy por encima de los problemas de infraestructura. Las dos se atacan acá.

## La ficha (quien delega)

Siete campos. Ninguno es opcional; "no aplica" es una respuesta válida, omitirlo no.

1. **Objetivo** — una frase. Qué tiene que ser cierto cuando termines.
2. **Alcance** — qué entra y, explícitamente, **qué queda afuera**. Lo segundo evita más problemas
   que lo primero.
3. **Insumos** — rutas, archivos, URLs y qué hay que leer de cada uno. Si hay que leer algo
   completo antes de actuar, decilo con esas palabras.
4. **Criterios de aceptación** — observables, cada uno con cómo se comprueba. Si no se puede
   comprobar, no es un criterio.
5. **Restricciones** — invariantes que no se pueden romper, y por qué existen. Sin el "por qué",
   alguien los va a "mejorar".
6. **Salida esperada** — el formato exacto de la respuesta.
7. **Condición de parada, con alcance** — qué hace frenar y qué no. Sin alcance, cualquier tarea se
   convierte en una auditoría infinita.

## La devolución (quien ejecuta)

Cinco bloques, siempre en este orden: **Resultado**, **Evidencia**, **No verificado**,
**Fuera de alcance**, **Correcciones al insumo**.

El último es el que hace que la fábrica mejore. Un ejecutor que devuelve "todo bien" sin criticar el
encargo está tirando la información más valiosa del ciclo: la ficha que le dieron vuelve a usarse, y
si nadie dice qué estaba mal, el error se repite con otro.

## Errores que ya pagamos

- **Condición de parada sin alcance**: "frená si encontrás algo falso" en un repo con historia
  convierte la tarea en una auditoría de toda la documentación. Acotá a lo que invalida *esta*
  tanda o rompe el *próximo* paso.
- **Consecuencia inventada**: afirmar que un cambio evita un problema sin comprobar que el problema
  existía. Si no lo verificaste, va en "No verificado".
- **Éxito por artefacto**: dar por bueno un paso porque quedó un archivo, en vez de mirar el código
  de salida.
- **Ficha que delega el criterio**: pedir "mejorá esto" sin criterios de aceptación. Lo que vuelve
  es el gusto de quien ejecutó, y no se puede evaluar.
