# Propuesta 01: todo hallazgo dice quién puede dispararlo

Toca: `agents/revisor.md`, `agents/analista-de-requerimiento.md` y "Errores que ya pagamos" de
`skills/contrato-de-traspaso/SKILL.md`. Capa: base. Lleva bump (regla 16).

## El caso que lo pagó

En el proyecto origen se escribió un plan de trabajo que leen el desarrollador **y el cliente**.
Una migración ya publicada incluía un `UPDATE` que ponía en `NULL` una columna de todos los
usuarios. El plan lo presentó como riesgo: "si alguien pega este SQL a mano en el editor del
proveedor, borra datos cargados".

El desarrollador lo devolvió con una pregunta: ¿quién es ese alguien? Solo él, con su acceso al
proyecto. Ni el cliente, ni un usuario final, ni la app pueden correr una migración. Presentado
como riesgo en un documento que lee el cliente, era ruido que además hacía quedar mal un
procedimiento controlado. Lo que sí importaba era una nota de orden para el propio equipo: aplicar
la migración **antes** de que el cliente cargue datos en esa columna.

El mismo criterio se aplicó después al resto del plan y cambió el orden de prioridades: lo que
exige un acceso que solo tiene el equipo bajó, lo que alcanza alguien de afuera subió.

## Qué falta hoy

`revisor.md:24` pide que cada hallazgo diga `archivo:línea`, qué falla y qué pasa si no se arregla.
No pide el actor. Sin actor, una consecuencia grave pero inalcanzable y una menor pero pública se
leen con el mismo peso.

## Texto propuesto

Para el revisor, a continuación de la frase actual:

> Y **quién puede dispararlo**: alguien de afuera (un usuario final, un ex usuario, cualquiera en
> internet) o solo quien opera el sistema con un acceso que el equipo controla. Lo primero es un
> riesgo y se ordena por lo que ese actor necesita para lograrlo. Lo segundo es una nota de
> procedimiento: se escribe como tal, corta, y no compite con los riesgos.

Para el analista, en "Invariantes que el requerimiento toca": cada invariante dice frente a quién
protege.

Para "Errores que ya pagamos" del contrato:

> **Riesgo sin actor**: presentar como riesgo algo que solo puede ejecutar el propio equipo con
> acceso controlado. Infla el reporte, y si el documento lo lee un cliente, le hace dudar de un
> procedimiento que está bien.

## Lo que esta propuesta no dice

No dice que lo interno no importe. Una nota de procedimiento puede evitar una pérdida de datos,
como en el caso de arriba. Dice que son dos listas distintas.
