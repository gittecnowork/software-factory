---
name: sesion-mobile-e-interceptor-401
description: Manejar la sesión en una app Ionic/Angular con JWT en localStorage sin bucles de 401 ni componentes que asumen sesión: interceptor que expulsa una sola vez ante fallos concurrentes y excluye las rutas de acceso, guards de "hay sesión" en cada llamada autenticada, separación entre logout explícito y limpieza de sesión, y cuidado con componentes que Ionic mantiene vivos. Activar ante 401 repetidos en consola, al implementar logout o expiración de token, o cuando un componente sigue llamando a la API después de cerrar sesión.
---

# Sesión mobile e interceptor 401

## Cuándo aplica
Cualquier app con token en el cliente y varias pantallas que llaman a la API por su cuenta.

## La lección
Al cerrar sesión, la consola se llenaba de 401 a `/badge/state`: la barra de tabs consultaba el estado del badge en cada `NavigationEnd`, y como ir a `/access` es una navegación, se retroalimentaba. **Ionic mantiene `TabsPage` viva** entre navegaciones (`IonicRouteStrategy`), así que la suscripción sobrevivía al logout. Lo mismo pasa en producción cuando el token vence a los 7 días.

El panel tenía un interceptor de 401; el mobile no, y por eso cada componente resolvía (o no) el caso por su cuenta. Además, `home.page` mantenía un `user` viejo en memoria al desloguear porque `if (cached)` no reasignaba en null: podía pasar un guard que debía fallar.

## Reglas
1. **Interceptor de 401 en el cliente**, siempre. Limpia sesión y navega a la pantalla de acceso **una vez**: un flag para que N fallos concurrentes produzcan un logout y una navegación, no seis. El flag se resetea con el próximo login exitoso.
2. **El interceptor excluye las rutas de acceso** (`/auth/*`): un 401 de "ese código no me figura" es la respuesta esperada del formulario, no una sesión caída.
3. **Guards de raíz además del interceptor.** `badge/state`, refresh, badges: si no hay sesión, la llamada **no sale**. El interceptor es la red, no el diseño.
4. **`logout()` ≠ `clearSession()`.** El logout explícito del usuario deja una marca (para que ningún auto-login lo deshaga, ver `auto-login-de-desarrollo`); la limpieza por 401 o por token vencido no la deja (la sesión se cayó, el usuario no se fue). Los internos usan `clearSession()`.
5. **Componentes que Ionic mantiene vivos** (tabs, páginas cacheadas): sus suscripciones a `router.events` sobreviven al logout. Chequear sesión dentro del handler, no sólo al montar.
6. **Al desloguear, reasignar a null**, no sólo "no sobreescribir". `if (cached) this.user = cached` deja el objeto viejo cuando `cached` es null.
7. **Token vencido se detecta local** (`exp`) antes de pegarle a la red: la app cae en acceso sin ninguna llamada fallida.
8. **Verificar con Network:** logout → cero llamadas fallidas; token vencido forzado en localStorage → mismo resultado; código equivocado en el formulario → mensaje, sin expulsión.

## Checklist
- [ ] Hay interceptor de 401 con flag de "ya expulsando".
- [ ] Excluye `/auth/*`.
- [ ] Cada llamada autenticada en tabs/badges/refresh chequea sesión antes de salir.
- [ ] `logout()` y `clearSession()` son funciones distintas con semántica escrita.
- [ ] Los handlers de `router.events` en componentes vivos chequean sesión.
- [ ] Logout deja `user = null`, no el viejo.
- [ ] Network limpio en logout, token vencido y código equivocado.

## Trampas conocidas
- **Retroalimentación por navegación:** expulsar a `/access` dispara `NavigationEnd`, que dispara la consulta, que da 401, que expulsa...
- **Interceptor que también captura los 401 del login** → el usuario tipea mal el código y la app lo "expulsa" de una pantalla en la que no había entrado.
- **Refresh que usa una ruta de login** (ver `refresh-no-es-login`).
