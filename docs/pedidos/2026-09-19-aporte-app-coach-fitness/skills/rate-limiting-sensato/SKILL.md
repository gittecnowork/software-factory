---
name: rate-limiting-sensato
description: Diseñar rate limiting para login y API que frene enumeración sin dejar afuera a usuarios legítimos: contar sólo fallos, throttle por objetivo (código/cuenta) además de por IP, límites medidos contra el tráfico real, y conciencia de que los limitadores en memoria se resetean con el proceso y no con la base. Activar al configurar express-rate-limit o equivalente, al ver 429 en tests o en producción, o cuando varios usuarios comparten IP (mismo router, misma oficina).
---

# Rate limiting sensato

## Cuándo aplica
Cualquier endpoint de autenticación o cualquier API con límite por IP.

## La lección
El límite de login contaba **todas** las llamadas a `/api/auth`, exitosas incluidas, y corría antes de la lógica: bloqueaba ingresos **con el código correcto**. En producción eso deja afuera a varios usuarios detrás del mismo router, y el login del operador también gastaba cupo.

Y para enumerar códigos aportaba poco: quien lo intente rota IPs. El que protege de verdad es el throttle **por código de destino** — unos pocos fallos contra el mismo código y ese código se enfría, venga de donde venga.

Del otro lado, la suite e2e rozaba el límite de API (120/min por IP, ~20 peticiones por usuario abierto) y fabricaba rojos que parecían bugs de producto.

## Reglas
1. **El límite por IP cuenta sólo fallos** (`skipSuccessfulRequests` o equivalente): 401 y superiores. Un usuario que entra bien no gasta cupo.
2. **Throttle por objetivo, independiente del de IP.** N fallos contra la misma cuenta/código → ese objetivo se enfría por X minutos. Es el que frena la enumeración distribuida.
3. **Umbrales medidos, no adivinados.** Anotar el tráfico real (peticiones/min del panel por usuario abierto, pico de la suite e2e) y dejar el número con su medición en el comentario. Revisarlo cuando el tráfico cambie.
4. **En memoria = se resetea con el proceso.** Un `db reset` no limpia el limitador; un reinicio del backend sí. Documentarlo donde se explica cómo correr los tests.
5. **El 429 tiene que ser legible en el cliente y en los tests.** Mensaje claro al usuario ("demasiados intentos, esperá unos minutos"), y el body del error incluido en los helpers de test — sin eso, un 429 se ve como timeout aleatorio.
6. **Ventanas no alineadas al minuto.** Un límite "por minuto" con ventana deslizante puede cortar a 500 peticiones reales en un tráfico de 460-513: dejar margen, no calcular al borde.
7. **Aviso previo antes del bloqueo** cuando hay usuario humano del otro lado ("te quedan 2 intentos"), nunca bloqueo mudo.

## Checklist
- [ ] ¿El límite de login cuenta éxitos? Si sí, está mal.
- [ ] ¿Hay throttle por cuenta/código además del de IP?
- [ ] ¿El número tiene su medición en el comentario?
- [ ] ¿El README de tests dice que hay que reiniciar el backend?
- [ ] ¿El 429 llega con mensaje al usuario y con body a los tests?
- [ ] ¿Probé N usuarios detrás de la misma IP?

## Trampas conocidas
- **Limiter antes de la lógica** → bloquea también lo correcto.
- **Suite e2e como atacante accidental:** una corrida completa es un pico de tráfico real. Medirla.
- **Subir el límite "para que pasen los tests"** sin medir: se vuelve a romper cuando el tráfico cambia. Medir, anotar, y revisar cuando se saque tráfico (ej. un refresh por navegación).
- **`code-throttle` y `authLimiter` compartiendo la confusión:** dos mecanismos con nombres parecidos que cuentan cosas distintas. Nombrarlos por lo que cuentan.
