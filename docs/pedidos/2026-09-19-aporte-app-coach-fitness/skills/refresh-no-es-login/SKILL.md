---
name: refresh-no-es-login
description: Garantizar que ninguna ruta emita una sesión a cambio de un identificador sin credencial, y que el refresco de datos de sesión use un endpoint autenticado con el token vigente en vez de una ruta de login. Activar al auditar rutas de /auth, al ver un cliente que "refresca" llamando a login, al apagar un mecanismo de acceso legado, o al diseñar el reemplazo de un identificador que hacía de credencial.
---

# Refresh no es login

## Cuándo aplica
Cualquier sistema donde un identificador legible (código de usuario, email, número) alguna vez sirvió como credencial, y se está migrando a credenciales reales.

## La lección
El identificador del usuario (`USUARIO01`) fue durante meses **identificador y credencial**: `GET /auth/user/USUARIO01` devolvía un token. Se diseñó el reemplazo (token de invitación + código propio hasheado), se implementó, y la ruta vieja quedó "para apagar después con un flag".

Nunca se pudo apagar: `refreshUser()` del mobile la llamaba **en cada navegación** para refrescar los datos del usuario. 258 llamadas por corrida de tests. Cualquiera que supiera el código de un usuario —visible en el panel, en conversaciones, en capturas— obtenía su sesión. El agujero que toda la migración vino a cerrar siguió abierto porque un refresh usaba una ruta de login.

Y un agente reportó haberlo cerrado sin escribir el código (ver `verificar-reportes-de-agentes`).

## Reglas
1. **Refrescar datos ≠ autenticar.** El refresh va a un endpoint autenticado (`GET /me`) con el token vigente, devuelve datos, **no emite token nuevo**.
2. **Ninguna ruta bajo `/auth/*` devuelve sesión a cambio de un identificador.** Si existe una legada, se apaga con flag y el flag va **off** en todos los entornos del repo (`.env`, `.env.example`) y en producción.
3. **Antes de apagar, buscar quién la usa:** `grep -rn "auth/user/"` en cliente, admin, tests y helpers. Los tests suelen ser los últimos consumidores escondidos.
4. **Test de regresión del apagado:** con el flag puesto, la ruta rechaza sin consultar la base; sin el flag, un test de control prueba que sí consultaría; otro fija que `.env.example` está en off.
5. **Verificar contra la red, no contra el código:** navegar la app entera con Network abierto y confirmar cero llamadas a la ruta legada, y las de refresh con `Bearer`.
6. **El identificador legible queda como identificador**: se puede mostrar, decir por teléfono, poner en una planilla. No tiene poder.

## Checklist
- [ ] `grep` de la ruta legada en todo el repo → sólo definición y comentarios.
- [ ] Endpoint de refresh: requiere token, devuelve datos, no devuelve token.
- [ ] Flag en off en `.env`, `.env.example` y producción.
- [ ] `curl` a la ruta legada → rechazada.
- [ ] Network en la app: cero llamadas a la legada.
- [ ] Un token de otro rol (operador) contra `/me` del usuario → 403.

## Trampas conocidas
- **"Se apaga después con un flag"** que nadie setea porque algo lo usa. Buscar el algo primero.
- **El fix reportado y no escrito.** Ver el diff, contar las llamadas en el log.
- **`GET` para login.** Aparece en logs, historial y caches. Si hay que mantener una ruta de acceso, es `POST`.
