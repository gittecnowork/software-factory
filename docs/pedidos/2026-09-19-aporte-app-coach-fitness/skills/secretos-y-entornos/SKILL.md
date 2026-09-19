---
name: secretos-y-entornos
description: Manejar secretos y variables de entorno sin que pasen por chats ni queden en el repo: generarlos localmente, cargarlos sólo en el destino, inventariar qué variables lee realmente el código, verificar NODE_ENV=production como trampa silenciosa, y mantener paridad entre los archivos de environment del frontend. Activar al configurar Railway/Vercel/Supabase, al rotar keys, al agregar una variable, o cuando un build de producción falla por una clave que "los otros environments sí tienen".
---

# Secretos y entornos

## Cuándo aplica
Cualquier operación sobre variables de entorno, keys de terceros, o archivos `environment.*.ts`.

## La lección
- Se borró sin querer `ANTHROPIC_API_KEY` de Railway. **No rompió nada**: el código nunca la leía (la key vive en la base, por operador). Estaba en `.env.example` como resto de otra época, y nadie sabía si hacía falta.
- `environment.prod.ts` del mobile no tenía dos claves que los otros dos environments sí tenían. El build de producción fallaba — y de haber compilado, la pantalla de acceso habría mandado a la home genérica de Calendly, sin forma de agendar. Un callejón sin salida silencioso.
- El valor que había en los otros environments era un **placeholder inventado** que parecía real.
- `NODE_ENV=production` es lo único que activa el chequeo que impide arrancar sin pepper. Sin esa variable, el backend arranca igual y hashea sin protección.

## Reglas
1. **Los secretos se generan en la máquina del humano y no pasan por ningún chat.** Dar el comando (`-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | % {[char]$_})` en PowerShell, `openssl rand -base64 36` en Unix), no el valor.
2. **Inventario real de variables:** `grep -rho "process\.env\.[A-Z_]*" src/ | sort -u`. Lo que no aparece ahí no hace falta, aunque esté en `.env.example`. Borrar lo sobrante del entorno: un secreto sin uso es riesgo sin contrapartida.
3. **`NODE_ENV=production` explícito y verificado** en el entorno de producción. Es la llave de todos los chequeos "sólo en prod".
4. **Paridad de environments del frontend:** comparar clave por clave los tres archivos (`environment.ts`, `.development.ts`, `.prod.ts`) y cruzar contra lo que el código lee (`grep "environment\."`). Cada divergencia, justificada o corregida.
5. **Lo que puede cambiar sin release no va compilado.** Calendly, teléfono, textos del operador: a la base, editables desde el panel (ver `configuracion-del-operador-en-el-panel`).
6. **Los valores de ejemplo se ven como ejemplo.** `https://calendly.com/COMPLETAR` o vacío con `TODO`, nunca un slug plausible.
7. **Rotación con timing:** rotar `JWT_SECRET` desloguea a todos; hacerlo en el mismo corte que el deploy que ya los desloguea. Las keys de servicios (Supabase, Anthropic, Google) se regeneran en su consola y el valor nuevo va directo al destino.
8. **Los legacy que no se pueden rotar se reemplazan y luego se desactivan**, en ese orden, verificando entre medio. (Supabase: legacy anon/service_role → secret key nueva en el backend → probar → desactivar legacy.)
9. **Guardar los secretos irrecuperables** (pepper) en un gestor de contraseñas antes de cargarlos: perderlos obliga a reinvitar a todos.

## Checklist
- [ ] Inventario `process.env.*` vs variables del entorno: ¿sobran? ¿faltan?
- [ ] `NODE_ENV=production` presente.
- [ ] Los tres environments del frontend: tabla clave × archivo, sin huecos.
- [ ] Ningún valor de ejemplo parece real.
- [ ] Los secretos nuevos están guardados fuera del entorno.
- [ ] El backend en producción responde después del cambio (401 en una ruta autenticada es la respuesta buena).

## Trampas conocidas
- **`.env.example` como documentación:** miente cuando el código cambia. El grep es la fuente.
- **Variable que el frontend compila:** cambiarla es un build y un deploy. Diseñar para que no haga falta.
- **Chequeos de producción que dependen de `NODE_ENV`** y nadie verifica la variable: el chequeo existe y nunca corre.
