---
name: tools-de-claude-para-un-panel
description: Diseñar e integrar tools de Claude (tool use) en un panel operativo donde un humano confirma acciones: separar tools de lectura (loop agéntico inmediato) de tools de escritura (propuesta + modal de confirmación + ejecución server-side), construir el contexto reusando los services del producto en vez de recalcular fórmulas, separar el contexto del operador del contexto del usuario final, y nunca devolver credenciales. Activar al agregar o revisar tools, al actualizar el contexto que Claude recibe, o cuando una feature nueva del producto no es alcanzable desde Claude.
---

# Tools de Claude para un panel

## Cuándo aplica
Un panel donde el operador (coach, admin, soporte) conversa con Claude y Claude puede leer y modificar datos del producto.

## La lección
El operador usaba Claude **más que el panel manual** — era su interfaz principal. Y las tools tenían meses de atraso respecto del producto: no podían tocar la mitad de las features nuevas, y el **contexto** que Claude recibía leía una tabla deprecada. Claude decidía a ciegas sobre la mitad del producto y nadie lo notaba porque respondía con confianza.

Además:
- Una tool escribía en una columna que **no existía** desde hacía meses (una migración la había reemplazado). Cada llamada tiraba error de Postgres. Nadie había probado las tools de punta a punta desde entonces.
- El contexto era compartido entre la consulta del operador y el resumen que lee el **usuario final**. Meter las señales del operador ahí (alertas, índices internos) se las filtraba al usuario por esa vía.

## Reglas
1. **Dos clases de tools, dos contratos.** Lectura: se ejecuta server-side al instante en loop agéntico, sin modal. Escritura: Claude propone, el humano confirma en un modal con descripción legible, el backend ejecuta. Ninguna escritura directa.
2. **El contexto se construye con los services del producto.** Cero fórmulas recalculadas: si el cockpit dice "disposición 6.1", Claude tiene que decir 6.1. Exportar la función antes que duplicarla.
3. **Contexto por audiencia.** Lo que ve el operador (alertas, índices de riesgo, notas internas) va en un bloque que **sólo** cuelga de la consulta del operador. El resumen para el usuario final usa otro contexto. Marcar los datos que el usuario no debe ver ("nunca se lo menciones") cuando ambos usan el mismo modelo.
4. **Compacto y honesto.** Una línea por concepto. Cuando falta un dato, decir que falta ("sin sesiones cerradas todavía"), nunca un cero que parezca medición ("responde el 100%" de alguien que nunca entrenó).
5. **Degradación sin romper.** Tabla o columna que no existe (entorno sin migrar) → contexto más corto, nunca error. Reintento por columna: pedir una columna inexistente tumba el select entero y Claude diría "no tiene rutinas" teniéndolas.
6. **Cada feature nueva del producto pregunta: ¿Claude la ve? ¿Claude la puede tocar?** Si no, es una feature a medias para el operador que vive en Claude.
7. **Ninguna tool devuelve credenciales.** Las conversaciones se persisten. Invitaciones, tokens, códigos: se generan desde el botón del panel, que no guarda nada.
8. **El system prompt lleva reglas de uso, no descripciones:** "RIR es por ejercicio", "el pago es una fecha, sin montos", "descartar alertas sólo a pedido explícito", "ante ambigüedad entre dos tools, preguntá".
9. **Nunca exponer nombres internos.** El operador le habla a un asistente, no a una API: jamás "usé `clear_all_exercises`" ni "la tool X". Cuando se equivoca, lo dice en lenguaje del producto ("vacié sólo la rutina de Piernas, no las otras") y ofrece corregirlo. Regla explícita en el prompt, porque el modelo tiende a citar el nombre de la tool al explicar un error.
10. **"Todos" con más de un contenedor pide aclaración.** "Borra todos los ejercicios" de un usuario con tres rutinas es ambiguo entre "los de esta rutina" y "los de todas". Ante alcance destructivo ambiguo, preguntar antes de proponer — nunca elegir el alcance menor en silencio y contarlo después.
9. **Probar tool por tool contra la base real** (`/execute-tool` directo) con reset limpio, y la vuelta completa con la API key real al menos una vez: un 401 de Anthropic prueba que el pedido se armó, pero no que Claude elija bien.

## Checklist
- [ ] Lista de features del producto vs lista de tools: ¿qué no alcanza Claude?
- [ ] ¿El contexto lee alguna tabla deprecada?
- [ ] ¿Alguna fórmula está duplicada entre el panel y el contexto?
- [ ] ¿El contexto del operador es el mismo que el del usuario final? Separar.
- [ ] ¿Alguna tool puede devolver un token, código o hash?
- [ ] ¿Cada tool nueva tiene su caso en el modal de confirmación?
- [ ] ¿Probé cada tool contra la base, no sólo `tsc`?

## Trampas conocidas
- **Tool que escribe en una columna renombrada por una migración.** Sin test de integración, rota en silencio para siempre.
- **PRs/records que inundan el contexto** (4 filas por levantamiento): colapsar a uno por concepto.
- **Placeholder de API key en `.env`** con formato inventado: el 401 de Anthropic dice "llegó armado", nada más.
- **Claude inventando un link** ("agendale una call en calendly.com/...") cuando no tiene el dato: prohibirlo en el prompt, o darle el dato.
