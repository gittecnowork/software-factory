---
name: runbook-de-deploy-en-fases
description: Llevar a producción una rama grande que lleva meses sin deployar, en tres fases con criterio de salida cada una: A) cerrar la rama (suite completa verde, seguridad verificada, builds de producción), B) preparar infraestructura sin deployar (secretos, rotación, migraciones aditivas a la base), C) deploy coordinado con el dueño, smoke test y rollback escrito. Activar cuando el cliente pide "que pruebe en producción", cuando main lleva meses congelado, o al planificar cualquier release que corte sesiones o requiera acciones del cliente.
---

# Runbook de deploy en fases

## Cuándo aplica
Releases grandes, ramas viejas, cambios que desloguean usuarios o requieren pasos manuales del dueño después.

## La lección
El cliente apuraba: "que lo pruebe directamente en producción". Pero producción **no podía recibir la versión** aunque quisiéramos: el panel no compilaba en modo producción desde hacía cuatro meses (presupuesto de CSS), el deploy iba a desloguear a todos los usuarios reales (se apagaba el acceso legado), y había once tests rojos que podían ser una feature muerta. Nada de eso era lento de resolver — pero había que verlo antes, no el día D.

Separarlo en fases con criterio de salida convirtió "deployar" de una apuesta en una secuencia. La Fase B (infra) se hizo **días antes** del deploy porque las migraciones eran aditivas y la app vieja las ignoraba: el día D quedó sólo el push de código.

## Las fases

### Fase A — Cerrar la rama (local, sin tocar producción)
1. Candidatos a feature muerta, verificados **a mano** (no "pre-existente").
2. Suite e2e completa en verde sobre reset limpio, dos corridas (ver `suite-e2e-repetible`).
3. Seguridad verificada contra código y red, no contra reportes (ver `verificar-reportes-de-agentes`).
4. Builds de producción de **todos** los proyectos en verde, e inspección del bundle (ver `builds-de-produccion-antes-de-mergear`).
**Salida:** nada pendiente que sólo se vea en producción.

### Fase B — Preparar infraestructura (sin deployar)
1. Secretos generados localmente y cargados en destino; inventario de variables contra `process.env.*`; `NODE_ENV=production` verificado (ver `secretos-y-entornos`).
2. Rotación de keys expuestas, en el mismo corte que el deploy (rotar JWT ya desloguea).
3. Backup de la base y migraciones aditivas aplicadas a la nube (ver `migraciones-a-supabase-cloud`). Verificar que la app vieja sigue viva.
4. Datos que el cliente debe aportar (Calendly, teléfono, usuarios activos), pedidos ahora.
**Salida:** el día D es sólo código.

### Fase C — Deploy coordinado
1. **Aviso al dueño**: día y hora, qué cambia, qué tiene que hacer después (cargar su API key, sus datos, reinvitar usuarios), y que avise a sus usuarios que van a reingresar.
2. Merge en cascada con `--no-ff` (feature → develop → main), chequeos previos: **`git diff develop main --stat` vacío** (sin hotfixes perdidos en main), sin conflictos. Ojo: el gate correcto es el *diff*, no `git log develop..main` vacío — el log siempre va a contener el merge commit del release anterior, que por diseño vive sólo en main. Verificar contenido, no topología.
3. Verificación local sobre `main` mergeado ANTES del push: tsc, builds, tests.
4. Push a `main` → deploy automático.
5. **Logs del backend** hasta verlo escuchando (buscar el mensaje de "falta X" si muere).
6. **Smoke test** en producción: login del operador, un endpoint nuevo que no existía en la versión anterior (prueba que el código nuevo está vivo), el flujo de acceso completo con un usuario de prueba.
7. El dueño hace sus pasos manuales.
**Rollback escrito antes de empezar:** `git revert -m 1 <merge>` + push. Con migraciones aditivas, la versión anterior vuelve a funcionar sobre la base nueva.

## Reglas
1. **Cada fase tiene criterio de salida escrito.** No se pasa a la siguiente por apuro.
2. **Lo que puede hacerse antes del día D, se hace antes.** Migraciones aditivas, secretos, rotaciones.
3. **El dueño sabe qué va a pasar y qué tiene que hacer**, por escrito, antes del push.
4. **Un endpoint nuevo como prueba de vida:** si responde, el código nuevo está deployado y arrancó con sus chequeos.
5. **Rollback ensayado mentalmente**, con el comando escrito, antes del push.

## Checklist del día D
- [ ] Dueño avisado, hora acordada.
- [ ] `git diff develop main --stat` vacío (contenido, no `log`).
- [ ] Builds y tests sobre `main` mergeado, en local.
- [ ] Push. Logs del backend hasta "listening".
- [ ] Endpoint nuevo responde en producción.
- [ ] Panel nuevo visible (no caché).
- [ ] Flujo de acceso completo con usuario de prueba.
- [ ] Pasos manuales del dueño hechos.

## Trampas conocidas
- **"Probar en producción" con el build roto.** Primero que compile.
- **Deploy que desloguea sin avisar.** Los usuarios creen que la app se rompió.
- **Plan Free de la base que se pausa por inactividad.** Con usuarios reales es una caída segura: conversación de costo antes del deploy.
- **Placeholder del cliente compilado** (ver `configuracion-del-operador-en-el-panel`).
