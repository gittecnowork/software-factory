---
name: verificar-reportes-de-agentes
description: Verificar contra el código y la red lo que un agente reporta como hecho, antes de aceptarlo, documentarlo o commitearlo. Activar siempre que un agente (Claude Code, subagente, ejecutor) entregue un resumen de trabajo terminado, especialmente si toca seguridad, autenticación, migraciones o cualquier cosa que después va a producción. También activar cuando un documento de contexto o un mensaje de commit afirme que algo está resuelto y no haya evidencia directa.
---

# Verificar reportes de agentes

## Cuándo aplica
Cada vez que un agente dice "hecho", "verificado", "arreglado". Sin excepción para lo que toca auth, datos sensibles, migraciones o deploy.

## La lección
Un agente reportó haber cerrado un agujero de seguridad: el refresh de sesión del mobile usaba una ruta de login que devolvía token a cambio de un identificador, sin credencial. El reporte fue detallado y convincente. Se aceptó, se escribió en el mensaje del commit, en el documento de contexto del proyecto y en la memoria del orquestador.

**El código nunca se escribió.** Se descubrió un día después, cuando otro agente contó 258 llamadas a la ruta legada en una corrida de tests. La afirmación falsa se había propagado a tres fuentes de verdad, y cualquiera que investigara después habría encontrado "está hecho" en las tres.

Un reporte no es evidencia. Es una afirmación.

## Reglas
1. **Verificar contra el artefacto, no contra el relato.** Código (`grep`, leer la función), red (pestaña Network, `curl`), base (query directa). El resumen del agente es el mapa, no el territorio.
2. **Pedir la evidencia en el prompt.** No "arreglalo y contame": "arreglalo y pasame la salida de `grep -rn X`", "pasame las llamadas de Network al navegar", "pasame el `curl` con el flag puesto".
3. **Lo que va a un documento de contexto o a un commit tiene que haberse visto.** Si no se puede verificar en el momento, se anota como "reportado, sin verificar", nunca como hecho.
4. **Sospechar más cuando el reporte es mejor.** Un resumen prolijo y bien argumentado produce más confianza de la que merece. El nivel de detalle del reporte no correlaciona con que el código exista.
5. **Cuando se descubre un reporte falso, corregir las tres fuentes** (commit siguiente que lo diga explícitamente, doc de contexto, memoria) y dejar escrito que pasó. La próxima persona tiene que poder encontrar la corrección donde va a buscar.

## Checklist
- [ ] ¿Vi el diff o el archivo, o sólo el resumen?
- [ ] ¿Hay una verificación observable (grep, curl, Network, query) en el reporte? ¿La pedí?
- [ ] Si es seguridad o auth: ¿probé yo el camino que se supone cerrado?
- [ ] Antes de escribirlo en CLAUDE.md / memoria / commit: ¿lo confirmé por fuera del reporte?
- [ ] Si el reporte contradice a otro anterior, ¿cuál tiene evidencia y cuál tiene sólo relato?

## Trampas conocidas
- **El commit que describe un fix que no contiene.** Mensaje perfecto, diff sin el cambio. Revisar el diff del commit, no su mensaje.
- **"Verificado con tests"** cuando los tests fueron modificados en el mismo cambio. Verificar por mutación (ver `verificar-tests-por-mutacion`).
- **Reportes de dos agentes que se contradicen.** No promediar: uno de los dos tiene evidencia y el otro no. Ir al código.
- **Aceptar un "pre-existente" como cierre.** Que un rojo ya estuviera antes dice cuándo apareció, no que no sea un bug. Ver `diagnostico-antes-de-parche`.
