---
name: presupuesto-css-con-motivo
description: Resolver un build de producción de Angular/Ionic que falla por presupuesto de estilos (anyComponentStyle) sin hacer trampa: borrar CSS muerto verificado contra el HTML actual, quitar fallbacks redundantes de tokens, y si no alcanza, subir el tope con el motivo y el peso real escritos al lado. Activar cuando `ng build` de producción falle por budget, cuando un archivo de estilos de componente supere el tope, o al decidir si partir un componente grande.
---

# Presupuesto de CSS con motivo

## Cuándo aplica
Build de producción rojo por `anyComponentStyle` o `initial`. También al revisar por qué un tope está donde está.

## La lección
El panel no compilaba en producción desde hacía **cuatro meses**: un componente de 109 kB de SCSS contra un tope de 40 kB. El tope había subido de 30 a 40 en un commit que no decía por qué, el archivo cruzó 40 poco después, y como nadie deployaba, nadie lo vio.

El diagnóstico dio ~10 kB de CSS 100% muerto (el chat viejo entero, reemplazado y nunca borrado, más una docena de selectores huérfanos), ~1,5 kB de fallbacks `var(--token, #hex)` redundantes, y **~93 kB de CSS vivo** de 13 áreas de producto en un solo componente. Limpiar no alcanzaba ni de cerca. El arreglo real es partir el componente; el arreglo del día fue subir el tope **con el motivo escrito**.

Y un detalle que cambia la lectura: el presupuesto mide el CSS **compilado y minificado**, no el `.scss`. 105 kB de fuente eran 76 kB compilados.

## Reglas
1. **Borrar muerto sólo con referencia verificada contra el HTML/TS de hoy.** Un selector "muerto" en el diagnóstico de la semana pasada puede haber revivido con un commit posterior (pasó con un selector del editor de objetivos).
2. **Fallbacks de tokens: sacar sólo los redundantes.** `var(--x, #hex)` donde `--x` existe en el global y vale lo mismo → sacar. Donde `--x` **no existe en ningún lado**, el fallback es lo único que sostiene el color: **no tocar**. Y cuidado con los contradictorios (fallback distinto del token): gana el token, el fallback miente al que lee.
3. **Nunca partir el `.scss` sin partir el componente.** Varios `styleUrls` bajan los bytes por archivo y el navegador carga lo mismo. Es hacerle trampa al chequeo.
4. **Subir el tope con el porqué escrito** en `angular.json` (acepta comentarios) y en la cabecera del archivo: peso real de hoy, que el número está inflado a propósito, la causa (componente que concentra N áreas), y el arreglo real pendiente. Un tope movido en silencio es lo que trajo el problema.
5. **Warning ajustado al peso real (+~3 kB), error con aire.** El aviso tiene que molestar apenas el archivo crezca, porque no tiene que crecer: tiene que partirse.
6. **Verificación visual pixel a pixel** antes/después en las pantallas cuyos estilos se tocaron. Borrar CSS "muerto" que no lo era se ve ahí, no en `tsc`.
7. **Medir compilado, no fuente**, y decirlo en el comentario.

## Checklist
- [ ] Lista de selectores muertos, cada uno greppeado contra HTML/TS actual.
- [ ] Fallbacks: tabla token → ¿existe en global? → sacar / conservar / corregir.
- [ ] Peso compilado antes y después.
- [ ] Tope nuevo con comentario: peso real, motivo, arreglo pendiente.
- [ ] Capturas antes/después idénticas en las pantallas afectadas.
- [ ] `ng build` producción verde en TODOS los proyectos (el mobile también tiene tope).

## Trampas conocidas
- **Tope subido sin comentario** → nadie sabe si fue decisión o descuido.
- **Diagnóstico viejo aplicado sin re-verificar** → se borra algo que volvió a usarse.
- **Comparación visual con un texto que cambia por timing** (badge que alterna según qué request llega primero): enmascarar ese texto, no ignorar el diff entero.
- **Mobile con tope distinto** (10 kB) y páginas de tres vistas en un componente: mismo criterio, otro número.
