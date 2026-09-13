---
name: contrato-de-traspaso
description: "Escribir la ficha con la que se le pasa trabajo a un agente, a otra sesión o a una persona, y el formato con el que se devuelve. Usar antes de delegar cualquier tarea, y cuando lo que devuelve un agente no se puede aprovechar porque el encargo era ambiguo."
---

# Contrato de traspaso

Un agente arranca con **contexto cero**: no hereda la conversación, ni los archivos que otro leyó,
ni las skills que otro invocó. Todo lo que no esté en la ficha, lo va a suponer. La ficha no es
burocracia: es el único canal.

El trabajo de referencia sobre por qué fallan los sistemas multiagente —Cemri et al., *Why Do
Multi-Agent LLM Systems Fail?*, arXiv:2503.13657, v3 de octubre de 2025— agrupa 14 modos de falla en
**tres categorías: diseño del sistema, desalineación entre agentes y verificación de la tarea**. Su
taxonomía se construyó analizando 150 trazas, sobre un conjunto de más de 1.600 en 7 frameworks.
Las tres categorías se atacan acá.

*Verificado contra el resumen del paper en arXiv el 2026-09-13. Es un preprint: no se le atribuye
venue. Circulan porcentajes por categoría en artículos de terceros; no se citan acá porque no se
comprobaron contra la fuente primaria.*

## La ficha (quien delega)

Siete campos. Ninguno es opcional; "no aplica" es una respuesta válida, omitirlo no.

1. **Objetivo** — una frase. Qué tiene que ser cierto cuando termine.
2. **Alcance** — qué entra y, explícitamente, **qué queda afuera**. Lo segundo evita más problemas
   que lo primero.
3. **Insumos** — rutas, archivos, URLs, y qué hay que leer de cada uno. Si algo hay que leerlo
   completo antes de actuar, decilo con esas palabras.
4. **Criterios de aceptación** — observables, cada uno con cómo se comprueba. Si no se puede
   comprobar, no es un criterio.
5. **Restricciones** — invariantes que no se pueden romper, y **por qué** existen. Sin el porqué,
   alguien los va a "mejorar".
6. **Salida esperada** — qué contenido se espera. Ojo: esto describe **lo que va adentro del bloque
   "Resultado"**, no reemplaza los cinco bloques de la devolución, que son fijos.
7. **Condición de parada, con alcance** — qué hace frenar y qué no. Sin alcance, cualquier tarea se
   convierte en una auditoría infinita.

## La devolución (quien ejecuta)

Cinco bloques fijos, siempre en este orden. Son el sobre; el campo 6 de la ficha describe el
contenido del primero.

1. **Resultado** — qué se hizo.
2. **Evidencia** — cómo se comprueba cada afirmación. La forma admisible **depende de las
   herramientas del rol**: quien ejecuta comandos reporta el comando y su **código de salida**;
   quien solo lee reporta `archivo:línea`; quien consulta fuentes externas reporta URL y **fecha**.
   Pedirle un código de salida a un rol sin shell es un error de la ficha, no del ejecutor.
3. **No verificado** — hipótesis usadas, marcadas como tales, con la comprobación que las cerraría.
   "Documentado por el proveedor" y "verificado por nosotros" se escriben distinto.
4. **Fuera de alcance** — lo que se encontró y **no** se tocó. Es un cajón de hallazgos, no una
   lista de tareas propias.
5. **Correcciones al insumo** — qué estaba mal, incompleto, ambiguo o de más en el encargo.

El quinto es el que hace que la fábrica mejore. Un ejecutor que devuelve "todo bien" sin criticar
el encargo tira la información más valiosa del ciclo: esa ficha se va a volver a usar.

## Si frenás antes de empezar

Devolvés igual los cinco bloques. "Evidencia" y "Fuera de alcance" pueden decir "no aplica": lo que
importa es que "Resultado" explique **por qué** frenaste y que "Correcciones al insumo" diga qué
faltaba y dónde se conseguiría. El formato no se acorta aunque el trabajo no haya empezado, porque
quien recibe la respuesta espera siempre la misma forma y la lee sin adivinar.

## Quien ejecuta no puede preguntar

Un subagente corre hasta terminar y no tiene interlocutor. Por eso la regla no es "preguntá", es:

- Si lo que falta haría que el trabajo salga **mal o deje algo irreversible**: frenar y devolver lo
  que haya, diciendo qué falta y dónde se conseguiría.
- Si no: tomar el supuesto **más conservador**, seguir, y declararlo en "No verificado".

## Errores que ya pagamos

- **Condición de parada sin alcance**: "frená si encontrás algo falso", en un repo con historia,
  convierte la tarea en una auditoría de toda la documentación. Acotar a lo que invalida *esta*
  tanda o rompe el *próximo* paso.
- **Consecuencia inventada**: afirmar que un cambio evita un problema sin comprobar que el problema
  existía.
- **Éxito por artefacto**: dar por bueno un paso porque quedó un archivo, en vez de mirar el código
  de salida.
- **Ficha que delega el criterio**: pedir "mejorá esto" sin criterios de aceptación. Vuelve el gusto
  de quien ejecutó, y no se puede evaluar.
- **Evidencia imposible**: exigir una forma de prueba que las herramientas del rol no permiten.
