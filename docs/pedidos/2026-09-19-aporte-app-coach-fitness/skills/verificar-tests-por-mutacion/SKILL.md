---
name: verificar-tests-por-mutacion
description: Comprobar que un test nuevo o modificado realmente detecta el bug que dice cubrir, revirtiendo el fix (stash o mutación puntual) y viendo que el test falla, antes de darlo por válido. Activar cada vez que se agregue un test de regresión, se arregle un test rojo, o un agente reporte "agregué tests" — sobre todo si el test y el fix entraron en el mismo cambio.
---

# Verificar tests por mutación

## Cuándo aplica
Todo test de regresión. Todo test que un agente agregue junto con el fix. Todo test que "ahora pasa".

## La lección
Un test que no puede ponerse en rojo no documenta nada: pasa con el fix, pasa sin el fix, y da una sensación de cobertura que no existe. En el proyecto origen:

- Los unitarios de una regla de auto-login se escribieron contra `environment.ts` de producción (el target `test` no aplica `fileReplacements`), donde el flag está vacío: sin declarar el entorno en el `beforeEach`, **la mitad del archivo era verde vacío**.
- Un test de switches contaba cards antes del re-render: pasaba por timing, no por corrección.
- Los tests del keypad confirmaban con Enter, que en un teléfono no existe: el botón tapado durante un mes nunca hizo fallar nada.

La mutación es la única prueba de que el test mira lo que dice mirar.

## Reglas
1. **Revertir el fix y correr el test.** `git stash` del fix, esperar el rebuild, correr, ver rojo, `stash pop`. Si no da rojo, el test no cubre el bug.
2. **Mutar la condición exacta.** Sacar el freno del logout → ¿cuántos tests fallan? Devolver el `if (devCode)` del bug original → ¿cuál falla? Anotar la tabla mutación → rojos.
3. **El mensaje de fallo tiene que decir qué pasó**, no "timeout". `elementFromPoint` para saber qué tapa un botón; el body del 401/429 para saber por qué rechazó.
4. **Probar el gesto del usuario real.** Si el usuario toca, el test toca. Enter, atajos y `page.evaluate` para "ir más rápido" esconden bugs de interacción.
5. **Los tests que documentan reglas puras (unitarios) valen aunque no atrapen el bug de la ronda** — pero se escribe en la cabecera del archivo que no lo atrapan, para que nadie los cuente como red de seguridad.
6. **Verificar el entorno contra el que compila el test.** Fallbacks de entorno, mocks por defecto y fixtures pueden dejar la mitad de las ramas sin ejercitar.

## Checklist
- [ ] Sin el fix, el test falla. Lo vi.
- [ ] El mensaje de fallo identifica la causa (quién tapa, qué respondió).
- [ ] El test usa el mismo gesto que el usuario (toque, no Enter; click, no evaluate).
- [ ] Si es unitario de una regla: la cabecera dice qué NO cubre.
- [ ] El test no depende de un entorno que hace trivial la aserción.

## Trampas conocidas
- **Stash sin esperar el rebuild** del dev server: el test corre contra el bundle viejo y "falla" o "pasa" por el motivo equivocado.
- **Aserción con dos valores aceptados** para que no falle en la segunda corrida: eso no es un test, es deriva silenciosa.
- **`toBeVisible()` en un botón tapado:** es visible según el DOM, intocable según el usuario. Usar `elementFromPoint` o intentar el click real.
