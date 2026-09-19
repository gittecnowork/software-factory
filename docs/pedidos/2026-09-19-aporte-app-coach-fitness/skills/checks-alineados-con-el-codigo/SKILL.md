---
name: checks-alineados-con-el-codigo
description: Mantener las restricciones de la base (CHECK, NOT NULL, UNIQUE) alineadas con lo que el código valida, y respetar las escalas de instrumentos validados (cuestionarios clínicos, índices compuestos) sin comprimirlas ni invertir ítems. Activar al cambiar una validación en el código, al agregar un campo con rango, al implementar escalas tipo Hooper/VAS/Likert, o cuando la base acepta un valor que el código rechaza (o al revés).
---

# CHECKs alineados con el código

## Cuándo aplica
Cualquier campo con rango, enumeración o regla que exista en dos lugares: la base y el código.

## La lección
- El código validaba tres escalas en 1-7 desde hacía semanas; el CHECK de la base seguía en 1-10. No rompía nada (7 pasa un check de 1-10), pero la base aceptaba un 9 que el código consideraba inválido: cualquier inserción que esquivara la API guardaba basura.
- Un índice compuesto (Hooper: suma de sueño, estrés, fatiga y dolor) tenía **un ítem anclado al revés**: sueño iba de 1 "muy mal" a 7 "muy bien", los otros tres de 1 "nada" a 7 "lo peor". Dormir bien empujaba el índice hacia "semana dura". Nadie lo notó hasta que Claude tuvo que leer cada escala con su dirección real.
- Antes de eso, una versión "compactaba" escalas validadas de 1-7 y 1-10 a 1-5 para que entraran en botones. Se revirtió: **un instrumento validado se implementa con su escala**, o deja de ser ese instrumento.

## Reglas
1. **Un rango, una fuente, dos copias iguales.** Si el código pasa a 1-7, sale una migración que aprieta el CHECK a 1-7 en el mismo cambio. Idealmente el test de integración inserta un valor fuera de rango por API y por SQL y espera rechazo en los dos.
2. **Escalas de instrumentos validados no se comprimen ni se extienden.** Hooper 1-7, VAS 1-10, Likert de 5 son lo que son. El control de UI se adapta (7 botones, slider con snap), no la escala.
3. **Dirección de cada ítem, documentada y consistente.** Si un índice suma ítems, todos apuntan al mismo lado, o el que no lo hace se invierte al sumar. Escribir en el modelo qué significa "alto" en cada uno.
4. **Cambiar una fórmula que ya tiene datos guardados es decisión de producto**, no de código: mueve umbrales y comparaciones históricas. Se levanta con evidencia y se decide con el dueño; mientras tanto, se mitiga en la lectura (Claude lee cada ítem con su dirección real y trata el índice como tendencia, no como nota absoluta).
5. **Los CHECK que se aprietan sobre datos existentes** necesitan saber si hay filas fuera del rango nuevo. En dev se van con reset; en producción se migran o se documenta por qué no hay.

## Checklist
- [ ] ¿Qué valida el código para este campo? ¿Qué acepta la base? ¿Coinciden?
- [ ] ¿La escala es la del instrumento original?
- [ ] Si es un índice compuesto: ¿todos los ítems apuntan al mismo lado?
- [ ] ¿Hay test que inserte fuera de rango por API y por SQL?
- [ ] Si se cambia una fórmula con datos guardados: ¿está anotado como decisión del dueño?

## Trampas conocidas
- **"No rompe nada"** porque los valores válidos pasan: rompe el día que algo inserta por fuera de la API.
- **Compactar para que quepa en la UI.** El diseño se adapta a la escala, no al revés.
- **Ítems con etiquetas de extremos invertidas** (1 = "muy bien" en uno, 1 = "nada" en otro): la suma miente.
