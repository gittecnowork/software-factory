---
name: configuracion-del-operador-en-el-panel
description: Sacar de los archivos de environment todo dato del operador o del negocio que pueda cambiar sin un release (links de agenda, teléfonos de contacto, textos, horarios) y llevarlo a la base con una pantalla de edición en el panel y un endpoint público de lectura con proyección mínima. Activar cuando un environment.prod.ts tenga valores del cliente, cuando un cambio de dato requiera rebuild, o al diseñar la pantalla "Mis datos" / "Configuración" de un panel de operador.
---

# Configuración del operador en el panel

## Cuándo aplica
Cualquier valor que sea del cliente/operador (no de la infraestructura) y que hoy viva compilado.

## La lección
El Calendly y el WhatsApp del operador estaban en `environment.prod.ts` del mobile. Consecuencias en cadena: el archivo de producción no los tenía y el build fallaba; los otros environments tenían un **placeholder inventado** que parecía real; y cambiar cualquiera de los dos habría requerido un build y un deploy de la app de los usuarios. Con el valor vacío, el botón de agendar llevaba a la home de Calendly: callejón sin salida silencioso.

Se movió a la base: `operadores.calendly_url` (que ya existía y nadie editaba) + `operadores.whatsapp`, pantalla "Mis datos" en el panel, y un endpoint público de lectura. Los tres environments quedaron sin nada del operador.

## Reglas
1. **Infraestructura va en environment; negocio va en la base.** `apiUrl` sí; el teléfono del dueño, no.
2. **El dueño edita lo suyo desde su panel.** Pantalla mínima con validación (URL https del dominio esperado, teléfono con código de país) y aviso cuando falta algo que los usuarios ven.
3. **Endpoint público de lectura con proyección mínima**: sólo lo que la pantalla sin sesión necesita. La tabla del operador tiene al lado `password_hash`, API keys y secretos TOTP — la ruta se sirve sin sesión, así que la lista de columnas es explícita (ver `proyeccion-explicita-de-columnas`).
4. **El cliente cachea una vez por arranque** (memoria + `localStorage` como red si la API falla), no en cada render.
5. **Estado vacío diseñado.** Sin dato configurado, el botón se oculta o dice que todavía no está disponible — en la voz del operador, sin reproche. Nunca un link genérico que parezca funcionar.
6. **Sacar las claves de TODOS los environments** cuando ya no las lea nadie, y verificar con grep que quedó cero. El objetivo es que no exista nada del cliente compilado.
7. **Cómo identifica el cliente al operador antes de loguearse** es una decisión: con un solo operador, un endpoint sin id que devuelva el único; con varios, hay que llegar identificado (subdominio, id en la invitación). Dejar escrito qué reemplazar el día que haya más de uno.
8. **Claude no inventa esos datos.** Si el asistente del panel puede proponer "agendá una call", usa el link de la base o no pone link. Regla explícita en el prompt.

## Checklist
- [ ] `grep` de valores del cliente en `environment*` → cero.
- [ ] Pantalla del panel guarda, valida y persiste.
- [ ] Endpoint público devuelve sólo lo necesario (curl, pegar respuesta).
- [ ] Cambio en el panel → visible en el cliente sin rebuild.
- [ ] Estado vacío: cero apariciones del link genérico en el HTML.
- [ ] Paso operativo anotado en el runbook de deploy: "el dueño carga sus datos después del deploy".

## Trampas conocidas
- **Placeholder plausible** (`calendly.com/un-nombre-plausible/consulta`) que pasa por real y llega a producción.
- **`select('*')` en la ruta pública** de una tabla con secretos.
- **Estado vacío con fallback "razonable"** (`|| 'https://calendly.com'`) que esconde el problema en vez de mostrarlo.
