---
name: orquestar-claude-code
description: Escribir prompts para un agente ejecutor (Claude Code u otro) desde el rol de orquestador, cuando el trabajo se delega en vez de hacerse directo. Activar cuando el usuario pida "generame el prompt", "armá el prompt para Claude Code", o cuando la tarea es de implementación multi-archivo con verificación y conviene que la corra un agente con el repo completo. Incluye la estructura del prompt, qué verificaciones exigir, y cuándo decirle al ejecutor que pare.
---

# Orquestar a Claude Code

## Cuándo aplica
Cada vez que el trabajo lo hace un ejecutor con acceso al repo y el orquestador sólo escribe el pedido y revisa el resultado.

## La lección
Los mejores resultados salieron de prompts que tenían **contexto ya diagnosticado, tareas numeradas, verificación observable y reglas de parada**. Los peores, de prompts que decían "arreglá X" y dejaban al ejecutor adivinar qué significaba "arreglado".

Y la falla más cara vino de aceptar el reporte del ejecutor sin verificarlo (ver `verificar-reportes-de-agentes`). El prompt tiene que pedir la evidencia, no la conclusión.

## Estructura que funciona

```
# Contexto
Repo, rama, estado (qué está commiteado, qué no, qué está verde).
El diagnóstico YA HECHO si lo hay — con la instrucción "no re-diagnostiques,
ejecutá" cuando corresponde, o "confirmá o refutá esta hipótesis" cuando no.

# Tareas (numeradas)
Cada una con el qué y el POR QUÉ. El porqué es lo que le permite al ejecutor
decidir bien en lo que no está escrito.

# Qué NO hacer
Los atajos que parecen razonables y no lo son (partir un scss sin partir el
componente, un ?. sin saber qué era null, retries para tapar flaky).

# Verificar
Observable y específico: "pasame la salida de grep X", "Network sin llamadas
a Y", "curl con el flag → 401", "suite completa sobre db reset, números".
Nunca "que funcione".

# Después
Commit (con mensaje sugerido o criterios), push o no, qué reportar.

# Reglas
- No commitear hasta revisar (cuando aplica).
- Qué archivos/carpetas no tocar.
- "Si encontrás X y no es trivial, PARÁ y contame antes de improvisar."
```

## Reglas
1. **Un prompt, una tanda verificable.** Si tiene dos mitades que se verifican distinto (lectura vs escritura, contexto vs tools), son dos prompts.
2. **Diagnóstico y ejecución separados.** Si el orquestador ya diagnosticó, decirlo y evitar que el ejecutor gaste tiempo re-descubriendo. Si no, pedir el diagnóstico y frenar antes del fix.
3. **La verificación pide artefactos, no adjetivos.** Salidas de comandos, capturas, números de la suite, respuestas de curl.
4. **Reglas de parada explícitas.** "Si el merge da conflicto, abort y contame." "Si hay otra ruta que dependa de esto, pará." Un ejecutor sin permiso para parar improvisa.
5. **Mensajes de commit escritos por el orquestador** (o criterios claros): el commit es la historia que queda. Ver `commits-que-cuentan-la-historia`.
6. **Pedir que reporte lo que encontró y NO tocó.** Los mejores hallazgos de seguridad salieron de esa sección.
7. **Nunca aceptar el reporte como cierre.** El cierre es la verificación del orquestador contra código/red, o al menos la evidencia pedida en el prompt.

## Checklist del prompt
- [ ] ¿El ejecutor sabe qué está hecho y qué no, sin tener que adivinarlo?
- [ ] ¿Cada tarea tiene su porqué?
- [ ] ¿Las verificaciones producen algo que puedo mirar?
- [ ] ¿Está escrito cuándo debe parar?
- [ ] ¿Está escrito qué NO tocar (docs de contexto, carpetas de diseño, secretos)?
- [ ] ¿Pedí la sección "lo que encontré y no toqué"?

## Trampas conocidas
- **El usuario pega el prompt de vuelta en vez del resultado.** Pasa. Señalarlo sin drama y seguir.
- **Prompts que crecen hasta cubrir tres tandas.** Se pierde la verificación por partes. Cortar.
- **"Verificado en el navegador"** sin decir qué se vio. Pedir capturas o Network.
- **Los push desde la shell del ejecutor** pueden colgarse en el gestor de credenciales. Tener el plan B (push desde la terminal del humano) escrito en el prompt.
- **Pedir "no commitees" y después olvidarse de commitear.** Cerrar cada tanda con el commit explícito.
