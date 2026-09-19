---
name: overlays-en-ionic-y-stacking-contexts
description: Diagnosticar y resolver overlays (keypads, sheets, modales propios) que quedan pintados debajo de ion-footer, la TabBar u otras páginas en Ionic/Angular por contextos de apilamiento, y elementos absolutos que anclan al body por falta de position en el contenedor. Activar cuando un botón está en el DOM pero no se puede tocar, cuando subir z-index no cambia nada, cuando Playwright dice "intercepts pointer events", o cuando un click produce un scroll inesperado.
---

# Overlays en Ionic y stacking contexts

## Cuándo aplica
Cualquier elemento propio que tenga que pintarse encima de la estructura de Ionic (footer, tab bar, otra página), o cualquier elemento `position: absolute` cuyo contenedor no tiene `position`.

## La lección
Dos bugs, una raíz:

**El botón de aceptar del keypad no existía en pantalla.** Estaba en el DOM, con `z-index: 1000`, pintado debajo de `ion-footer` y de la TabBar. En desktop se confirmaba con Enter y nadie lo notó; en un teléfono no hay Enter, y el usuario no podía confirmar el peso de una serie — la acción central de la app. El cliente lo había reportado y quedó como "sin causa encontrada" durante un mes. Causa: el keypad vivía dentro de `ion-content`, y `.ion-page { position: absolute; contain: layout size style; z-index: 0 }` abre un contexto de apilamiento propio — nada de adentro compite con nada de afuera. Y `contain: layout` vuelve a `.ion-page` el bloque contenedor de los `fixed` que cuelgan de ella: el keypad ni siquiera estaba fijo al viewport. La TabBar vive en `tabs.page`, hermana del router outlet: **inalcanzable desde adentro de una página ruteada por diseño**.

**La pantalla se ponía negra al tocar un toggle.** Un `<input>` absoluto e invisible dentro de un `<label>` sin `position`: su bloque contenedor era el `body`, quedaba anclado ~1900 px abajo del documento generando 972 px de vacío, y el click en el label lo enfocaba y scrolleaba la ventana al fondo. Ni excepción, ni DOM roto: layout puro.

## Reglas
1. **Un overlay propio que deba ganarle a Ionic se monta fuera de `ion-content`**: portal al `<body>` (lo mismo que hace Ionic con sus overlays). Subir el `z-index` no sirve si el contexto de apilamiento es otro.
2. **Con portal, `ngOnDestroy` desprende el nodo a mano.** Al destruirse la página, Angular remueve la raíz de la vista y da por removidos a sus hijos — y el nodo mudado ya no es hijo: quedaría un sheet huérfano tapando la app.
3. **Todo `position: absolute` tiene un contenedor con `position: relative`** explícito. Si no, ancla al primer ancestro posicionado, que puede ser el `body`.
4. **Diagnosticar con el navegador, no con la teoría:** `document.elementFromPoint(x, y)` en el centro del botón dice quién lo tapa; `document.scrollHeight` vs `innerHeight` dice si hay vacío; `getComputedStyle(el).position` y `offsetParent` dicen a qué está anclado.
5. **Los tests tocan, no envían Enter.** Un test que confirma con teclado no ve un botón tapado. Assert con `elementFromPoint` para que el fallo diga quién tapa, no "timeout".
6. **Un modal de verdad bloquea lo de atrás.** Si el backdrop cubre la TabBar y ya no se puede cambiar de tab con el keypad abierto, es correcto — cambiar de pantalla con un valor a medio confirmar era una vía para perder datos. Si el diseño quiere la barra tocable, se recorta el backdrop; no se baja el overlay.

## Checklist
- [ ] ¿El overlay está dentro de `ion-content` o de una página ruteada? → portal.
- [ ] ¿Hay `ngOnDestroy` que lo saque del body?
- [ ] ¿Cada `absolute` tiene contenedor posicionado?
- [ ] `elementFromPoint` sobre el control devuelve el control.
- [ ] `scrollHeight === innerHeight` cuando no debería haber scroll.
- [ ] El test lo toca con el gesto del usuario.

## Trampas conocidas
- **"Subí el z-index a 9999 y sigue igual"** → contexto de apilamiento distinto. Mirar el árbol, no el número.
- **`toBeVisible()` verde con botón intocable** → visible según el DOM, tapado según el usuario.
- **Diagnóstico por hipótesis** ("debe ser una excepción de Angular") sin mirar consola: la consola estaba limpia.
