# Clasificación sugerida de las 23 skills

Fecha: 2026-09-19. Cada skill se leyó completa. La capa sale de la pregunta de la fábrica: ¿seguiría
siendo cierto en otro proyecto? Es una **sugerencia** de la sesión de origen (ver `DEVOLUCION.md`,
"No verificado"): la decisión es de la sesión de la fábrica.

Todas nacieron de un caso real del proyecto origen y traen la misma forma: cuándo aplica, la
lección, reglas, checklist, trampas conocidas. Ninguna trae fecha de verificación ni paso de
re-chequeo, que la regla 7 pide para las skills pre-investigadas: habría que agregarlos al
incorporarlas. Los identificadores del proyecto se reemplazaron por genéricos (operador, usuario,
`USUARIO01`); los ejemplos de código son ilustrativos, no copias del repo.

## Proceso de trabajo con agentes

| Skill | Capa sugerida | Nota |
|---|---|---|
| `verificar-reportes-de-agentes` | Base | Es la regla 3 y la 5 de la fábrica contadas con su caso más caro: un fix reportado que nunca se escribió y llegó al commit, al doc de contexto y a la memoria. Candidata a lectura obligada del verificador |
| `diagnostico-antes-de-parche` | Base | Sin equivalente en la fábrica. Universal |
| `verificar-tests-por-mutacion` | Base | Sin equivalente. Complementa al verificador: un test que no puede ponerse en rojo no es evidencia |
| `orquestar-claude-code` | **Fusionar** con `contrato-de-traspaso` | El contrato la supera en casi todo. Lo que tiene y el contrato no: separar diagnóstico de ejecución ("no re-diagnostiques" / "confirmá o refutá"), una tanda verificable por pedido, y el plan B del push colgado en el gestor de credenciales |
| `commits-que-cuentan-la-historia` | **Fusionar** con `commitear-con-verificacion` | Se pisa con su punto 6. Lo que agrega: corregir la historia nombrando el hash del commit que mintió, y merge `--no-ff` en vez de squash para no perder diagnósticos |

## Testing

| Skill | Capa sugerida | Nota |
|---|---|---|
| `matriz-estado-de-partida` | Base | El principio es universal (el estado inicial es la mitad del caso). Los ejemplos son de Playwright |
| `suite-e2e-repetible` | Base | Universal para cualquier suite contra una base real. Una sola trampa es de Angular |

## Backend y seguridad

| Skill | Capa sugerida | Nota |
|---|---|---|
| `proyeccion-explicita-de-columnas` | Base | Universal. La sintaxis de los ejemplos es la del cliente de Supabase |
| `rate-limiting-sensato` | Base | Universal. Ejemplos con `express-rate-limit` |
| `refresh-no-es-login` | Base | Universal |
| `secretos-y-entornos` | Base | Universal. El punto de paridad de `environment*.ts` es de Angular y podría bajar al overlay |
| `no-guardar-credenciales-en-conversaciones` | Base | Universal, y toca directo a cualquier sesión de la fábrica |
| `checks-alineados-con-el-codigo` | Base | Universal |

## Patrones de producto

| Skill | Capa sugerida | Nota |
|---|---|---|
| `acceso-por-invitacion-y-codigo-propio` | Ver nota 1 | Diseño completo de acceso sin email para productos "operador + usuarios finales" |
| `tools-de-claude-para-un-panel` | Ver nota 2 | Diseño de tool use con confirmación humana |
| `configuracion-del-operador-en-el-panel` | Ver nota 2 | Lo que cambia sin release no va compilado |

## Propias del stack Ionic/Angular + Node + Supabase

| Skill | Capa sugerida | Nota |
|---|---|---|
| `overlays-en-ionic-y-stacking-contexts` | Overlay de stack nuevo | Solo Ionic |
| `sesion-mobile-e-interceptor-401` | Overlay de stack nuevo | Ionic mantiene vivas las páginas de tabs; el resto es Angular |
| `presupuesto-css-con-motivo` | Overlay de stack nuevo | Presupuestos de `angular.json` |
| `auto-login-de-desarrollo` | Overlay de stack nuevo | El patrón es general, el mecanismo (`environment.devCode`) es de Angular |
| `migraciones-a-supabase-cloud` | Ver nota 3 | Solo Supabase, cualquier stack |

## Despliegue

| Skill | Capa sugerida | Nota |
|---|---|---|
| `runbook-de-deploy-en-fases` | Base | Universal. Aplica la regla 4 (preflight) a un release entero |
| `builds-de-produccion-antes-de-mergear` | Base | La regla 8 (la configuración del host se prueba contra un preview del host, no contra un simulador) es prima directa de la regla 24 de la fábrica |

## Notas

1. **Decisión de Juan antes del push.** `acceso-por-invitacion-y-codigo-propio` describe completo el
   modelo de acceso de una app que está en producción; `refresh-no-es-login`,
   `proyeccion-explicita-de-columnas` y `rate-limiting-sensato` cuentan partes del mismo diseño. Un diseño de seguridad no debería depender de ser
   secreto, y la skill no trae claves ni valores reales, pero publicarla en un repo público junto
   al nombre del repo de origen es una decisión del dueño, no de la sesión que arma el paquete. Si
   la respuesta es no, se saca de la rama **antes** del push: después ya está en el historial.
2. **No son proceso, son diseño de producto.** Pasan la pregunta de las tres capas (serían ciertas
   en otro proyecto del mismo tipo), pero la base de la fábrica hoy solo tiene proceso. Opciones:
   aceptar patrones de diseño en la base, o abrir un overlay temático que no sea ni de stack ni de
   proyecto.
3. **Un servicio que cruza stacks.** `migraciones-a-supabase-cloud` no depende de Ionic ni de
   Angular, y el overlay `stack-next-nest-prisma` ya tiene otra skill de Supabase. Tal vez la capa 2
   necesite overlays por servicio además de por stack.
4. **Trece skills a la base es mucho de una vez.** Cada una se carga en el contexto de todos los
   proyectos conectados como una línea de descripción. Conviene incorporarlas en tandas y mirar si
   las descripciones disparan cuando deben: varias son largas.
