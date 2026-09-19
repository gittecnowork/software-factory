---
name: diagnostico-antes-de-parche
description: Diagnosticar la causa raíz de un bug reproduciéndolo a mano antes de tocar código, y arreglar la causa en vez del síntoma. Activar ante cualquier bug reportado, test en rojo, comportamiento raro de UI o sesión, y especialmente cuando la tentación es agregar un try/catch, un optional chaining, un timeout o un reintento. También activar cuando alguien diga "es pre-existente" o "es flaky" como cierre.
---

# Diagnóstico antes de parche

## Cuándo aplica
Cualquier bug. Cualquier test rojo. Cualquier "pasa a veces".

## La lección
Tres casos del mismo proyecto:

- **La pantalla que se ponía negra** al tocar un toggle. Hipótesis del orquestador: excepción durante la detección de cambios de Angular. Realidad: consola limpia, DOM intacto. Un checkbox invisible de 13px estaba anclado al `body` porque su label no tenía `position`, generaba 972px de vacío debajo del viewport, y el click lo enfocaba y scrolleaba la ventana al fondo. Ningún `try/catch` lo habría arreglado.
- **Once tests rojos "por lo mismo"** que parecían una feature muerta (botón deshabilitado en el primer paso de un formulario). Reproducido a mano: la feature estaba viva. El test clickeaba "Seguir" sin cumplir la condición que el botón exige a propósito. Y los otros rojos ni tocaban esa pantalla: era carga de máquina.
- **Un 401 en bucle** que parecía bug de sesión, después de invitaciones, después de copy. Era siempre lo mismo: un auto-login de desarrollo que se re-disparaba tras cada logout. Tres rondas de diagnóstico confuso porque nadie miró primero al sospechoso obvio.

## Reglas
1. **Reproducir a mano primero.** En el navegador, con la app real, siguiendo los pasos del usuario. Leer el código viene después.
2. **Mirar la consola y la red antes de hipotetizar.** El error real suele estar escrito. Si la consola está limpia, no es una excepción — es layout, estado o timing.
3. **"Pre-existente" no es diagnóstico.** Dice cuándo se rompió. Sigue habiendo que saber si el producto está roto o el test está mal.
4. **"Flaky" tampoco.** Un test que pasa en aislamiento y falla en la corrida completa tiene una causa: carga, rate limiter, datos que otro spec dejó. Encontrarla o anotarla con su síntoma, nunca taparla con `retries` o timeouts inflados.
5. **Prohibido el parche ciego.** Antes de un `?.`, un `try/catch` o un `if (x)`: ¿qué era null y por qué? Si no se sabe, el guard esconde el próximo bug.
6. **N síntomas iguales no son N causas iguales** ni una sola. Verificar cada uno; la coincidencia es hipótesis, no conclusión.
7. **Sospechar del andamiaje de desarrollo** (auto-login, seeds, mocks, flags) antes que del producto cuando algo raro pasa sólo en local.

## Checklist
- [ ] Lo reproduje a mano, con los pasos del usuario, en la app real.
- [ ] Miré consola y Network en el momento exacto del síntoma.
- [ ] Sé qué era null / qué se scrolleó / qué llamada falló — no sólo dónde.
- [ ] El fix toca la causa. Si toca el síntoma, está escrito por qué y es temporal.
- [ ] Hay un test que falla sin el fix (ver `verificar-tests-por-mutacion`).
- [ ] Si era "pre-existente": determiné si el roto es producto o test.

## Trampas conocidas
- **Hipótesis del orquestador tomada como diagnóstico.** El orquestador propone; el ejecutor verifica. Pedir explícitamente "confirmá o refutá la hipótesis".
- **Timeout de Playwright leído como "el botón no anda".** Puede ser que el botón esté correctamente deshabilitado, o tapado por otro elemento (`elementFromPoint` dice quién).
- **Rate limiter en memoria contando tests como ataques.** Un 429 se ve como un rojo aleatorio si el error no viene con la respuesta del backend. Incluir el body del error en los helpers de test.
- **Contexto de navegador limpio en los tests.** Los bugs de estado persistente sólo aparecen con perfil persistente. Ver `matriz-estado-de-partida`.
