---
name: matriz-estado-de-partida
description: Diseñar tests e2e de sesión, autenticación y estado persistente declarando explícitamente el estado inicial (storage limpio, sesión previa, logout explícito, token vencido, flags de dev) en vez de heredar el contexto por defecto del runner. Activar al escribir o revisar tests de login, logout, auto-login, tokens, onboarding, o cualquier flujo donde localStorage/sessionStorage o cookies cambien el camino. También activar cuando un bug "no se reproduce en los tests" pero sí en la máquina de un dev.
---

# Matriz de estado de partida

## Cuándo aplica
Tests de cualquier flujo que dependa de estado persistente: sesión, tokens, flags, onboarding, preferencias guardadas.

## La lección
Un fix del auto-login de desarrollo pasó todos los tests y seguía roto: con `devCode` vacío pero una sesión previa en `localStorage`, la app seguía entrando sola. Los tests no lo veían porque **todos arrancaban con contexto de navegador limpio** — y un desarrollador que toca ese flag nunca estrena navegador. Lo encontró un agente escéptico usando perfil persistente.

El estado de partida no es un detalle de setup: es la mitad del caso de prueba.

## Reglas
1. **Declarar el estado inicial en cada test**, no heredarlo. "Con sesión válida", "con marca de logout", "con token vencido", "storage limpio". Si el test necesita "ya entró antes", lo escribe.
2. **Plantar el estado ANTES de que arranque la app** (`addInitScript` en Playwright): si el servicio de auth decide en su constructor, sembrar después de cargar la página llega tarde.
3. **Centinela para las recargas.** Un F5 dentro del test re-ejecuta el init script y replanta la sesión que el test acaba de cerrar — el caso "recargar tras logout" se probaría a sí mismo. Un flag en `sessionStorage` evita el doble sembrado.
4. **La sesión "válida" es real, pedida al backend.** Un token inventado pasa `isTokenExpired()` (sólo mira `exp`) pero el primer pedido vuelve 401 y el test termina probando el camino de sesión caída sin avisar. Cachearla por proceso para no gastar cupo.
5. **Cruzar estado × acción.** Estados: limpio · sesión válida · sesión + logout explícito · token vencido · flag de dev on/off. Acciones: arranque en frío · logout · recarga tras logout · login manual con otro usuario · abrir enlace de invitación · cambiar el flag.
6. **"Que no pase nada" se prueba esperando y volviendo a mirar.** Un `toHaveURL('/access')` que pasa en milisegundos no prueba que la app no te vuelva a meter después. Esperar, re-verificar.
7. **Las constantes de compilación (flags de dev) se fuerzan sin tocar el código de producción.** Parchear el bundle servido, con un contador que haga fallar el test si el patrón deja de matchear — mejor un test que dice "no encontré el flag" que uno que corre con el valor real y pasa por el motivo equivocado.

## Checklist
- [ ] Cada test dice explícitamente con qué storage arranca.
- [ ] El estado se planta antes del boot de la app.
- [ ] Los casos de "recargar" no replantan estado.
- [ ] Hay al menos un caso con sesión previa + flag apagado (el que se escapó).
- [ ] Hay al menos un caso "usuario nuevo no se convierte en el usuario del flag de dev".
- [ ] Los asserts de "queda afuera" esperan y re-verifican.

## Trampas conocidas
- **Perfil limpio por defecto en Playwright.** Cómodo, ciego a todo lo persistente.
- **Sembrar `localStorage` después de `page.goto`.** La app ya decidió.
- **Token fabricado con `exp` futuro.** Sobrevive al chequeo local, muere en el primer request.
- **Suite que corre proyectos en serie (ios → android)** con un spec que muta credenciales sin devolverlas: el segundo proyecto arranca con el estado roto. Ver `suite-e2e-repetible`.
