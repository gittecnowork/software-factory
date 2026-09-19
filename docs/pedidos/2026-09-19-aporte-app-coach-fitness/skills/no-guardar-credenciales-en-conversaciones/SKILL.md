---
name: no-guardar-credenciales-en-conversaciones
description: Impedir que credenciales, tokens, códigos de invitación, API keys o secretos queden persistidos en historiales de chat, conversaciones con Claude, logs o mensajes de commit. Activar al diseñar tools de Claude que podrían devolver secretos, al decidir qué se loguea, al pedir o compartir keys entre personas, y al escribir prompts que manejen datos sensibles.
---

# No guardar credenciales en conversaciones

## Cuándo aplica
Todo lugar donde un texto se persiste: la tabla de conversaciones, logs del backend, historial del chat del orquestador, mensajes de commit, README.

## La lección
- Se decidió **no** hacer una tool "generale una invitación a X" aunque era trivial: las conversaciones con Claude se guardan en la base, y una credencial viva quedaría escrita en el historial, legible por cualquiera con acceso a esa tabla. La invitación se genera desde un botón del panel que no persiste nada.
- El humano preguntó "¿cuánto mide una API key?" para **no** pegarla en el chat. Esa es la actitud correcta: la key va del proveedor al campo del panel, y de ahí a la base; nunca por un chat.
- Se generaron el pepper y el JWT_SECRET con un comando local en vez de que el asistente los "proponga": un secreto que apareció en un chat ya no es secreto.

## Reglas
1. **Ninguna tool devuelve credenciales.** Ni tokens, ni códigos de invitación, ni hashes, ni keys. Si el operador lo necesita, va por un control del panel que no persiste la respuesta.
2. **Los secretos no se piden ni se muestran en chat.** Se dan instrucciones para generarlos localmente y cargarlos en destino. Si hace falta identificar uno, se describe (prefijo, longitud), no se pega.
3. **Los logs no llevan credenciales ni datos personales.** Un `console.log` de la respuesta del login, de un usuario completo, o de un body de request es una fuga esperando el día del incidente.
4. **Los mensajes de commit y los docs de contexto tampoco.** Un "el código de prueba es NNNNNN" está bien si es del seed de dev; un código real de producción, nunca.
5. **Los reportes de agentes se leen con esto en mente:** si un agente pega un token en su resumen, el token está quemado. Rotar.
6. **La pantalla del operador tampoco muestra lo que no necesita:** `has_own_code: true` en vez del hash; "invitación pendiente" en vez del token si no se está copiando en ese momento.

## Checklist
- [ ] ¿Alguna tool puede devolver un campo que sea credencial?
- [ ] ¿Algún log imprime objetos completos de usuario o respuestas de auth?
- [ ] ¿Pedí o mostré un secreto en el chat? Rotar.
- [ ] ¿La conversación persistida con Claude podría contener un código de acceso?
- [ ] ¿Los seeds de dev usan valores obviamente de dev, distintos de producción?

## Trampas conocidas
- **"Es sólo para probar"** y el valor termina en la tabla de conversaciones.
- **Logs que sanitizan la respuesta pero no el request** (o viceversa).
- **Capturas de pantalla** con el modal de invitación abierto, pegadas en un chat: el código y el enlace están ahí. Regenerar después de compartir.
