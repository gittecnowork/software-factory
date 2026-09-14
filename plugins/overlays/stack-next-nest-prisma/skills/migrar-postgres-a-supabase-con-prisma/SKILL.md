---
name: migrar-postgres-a-supabase-con-prisma
description: "Mover una base Postgres autogestionada a Supabase conservando el esquema, los roles y la RLS, en un proyecto que usa Prisma con migraciones versionadas. Usar cuando haya que migrar la base a Supabase, o cuando una app con Prisma y RLS no se comporte igual en Supabase que en su Postgres propio."
---

# Migrar Postgres a Supabase en un proyecto con Prisma y RLS

Verificado: 2026-09-13 contra la documentación oficial de Supabase (conexión a Postgres, roles,
migración desde Postgres, endurecer la Data API) y de Prisma (Supabase). **Antes de ejecutar,
revisar que esas páginas no hayan cambiado**, sobre todo lo de los permisos por defecto en `public`:
Supabase anunció que va a invertir ese default.

## La decisión que ordena todo: quién crea el esquema

Hay dos caminos, y elegir mal cuesta un día.

**Si las migraciones son la fuente de verdad del esquema** (hay `prisma/migrations/` versionado),
el camino correcto es **migrar primero y restaurar solo los datos**. Corrés `prisma migrate deploy`
contra la base vacía y después restaurás con `pg_dump --data-only`. Motivo: la documentación de
Supabase avisa que en un dump-restore **los roles no se migran y el estado de RLS tampoco**. Si tu
RLS y tu rol de aplicación se crean en una migración, al correr las migraciones se recrean tal como
están versionados, y esos dos avisos dejan de aplicar.

**Si el esquema vive solo en la base** (sin migraciones, o con derivas no versionadas), va el dump
completo: `pg_dump --no-owner --no-privileges --no-subscriptions`, restaurar con
`pg_restore --no-owner --no-privileges`, y después **volver a habilitar RLS y recrear los roles a
mano**, porque no viajan.

El resto de esta skill asume el primer caso, que es el del stack. Al final está lo que cambia en el
segundo.

---

## Fase 0 — Preflight (gratis, y hay un bloqueante de seguridad)

1. **⚠️ La API automática de Supabase y tu RLS.** En Supabase las tablas creadas en `public`
   reciben por defecto `SELECT`, `INSERT`, `UPDATE` y `DELETE` para `anon`, `authenticated` y
   `service_role`: los roles de la Data API, que es pública. Leé tus políticas RLS y preguntate
   **qué pasa cuando nadie fija el contexto de inquilino**. Es muy común escribir la política como
   "si el GUC no está seteado, acceso total", para que migraciones, seeds y jobs de fondo funcionen.
   Detrás de un Postgres privado eso es correcto; en Supabase significa que **cualquiera con la
   clave anónima lee y escribe toda la base**, porque PostgREST no fija ese GUC.

   Resolverlo **antes** de restaurar datos. Tres caminos, de más fuerte a más quirúrgico:
   apagar la Data API entera desde el panel (si la app no usa las librerías de Supabase, ninguna
   ruta autogenerada responde, sin importar permisos ni RLS); mover el esquema de la aplicación
   fuera de `public` a uno que no esté expuesto; o revocar los permisos y los permisos por defecto:

   ```sql
   revoke all on all tables in schema public from anon, authenticated;
   alter default privileges for role postgres in schema public
     revoke select, insert, update, delete on tables from anon, authenticated, service_role;
   ```

2. **Plan.** El plan gratuito **pausa el proyecto tras una semana de inactividad** y no tiene
   respaldos: no sirve para producción. Confirmar el plan antes de mover nada.

3. **Red: IPv4 o IPv6.** La conexión directa (`db.<ref>.supabase.co:5432`) es **IPv6** salvo que se
   compre el complemento de IPv4. El *shared pooler* es **IPv4 en todos los planes**. Averiguar qué
   soporta la salida de quien se va a conectar (el contenedor de la API, el CI, tu máquina) antes de
   elegir cadena, o vas a depurar un "no conecta" que no es de credenciales.

4. **Extensiones.** Listar las que usa la base hoy (`\dx` o `select * from pg_extension`) y
   confirmar que Supabase las ofrece. Una extensión faltante frena la restauración a mitad.

5. **Tamaño.** Medir la base. Supabase pide avisar antes de mover bases de más de 150 GB.

6. **Región.** Elegir la más cercana a donde va a correr la aplicación, no a donde estás vos. Cada
   consulta paga ese viaje.

---

## Fase 1 — Preparar el proyecto Supabase (antes de cualquier migración)

1. **Crear el rol de aplicación a mano, con contraseña fuerte, ANTES de correr las migraciones.**
   Este es el error que más se repite. Las migraciones que crean un rol suelen hacerlo con un
   `IF NOT EXISTS` y una contraseña de desarrollo. Si la migración corre primero, el rol queda
   creado con la contraseña débil, y la app arranca con la fuerte: falla la autenticación en bucle.
   En un Postgres propio esto se resuelve con un script de inicialización; **en Supabase no hay
   `/docker-entrypoint-initdb.d`**, así que se hace a mano en el editor SQL:

   ```sql
   create role <rol_app> login password '<contraseña fuerte>';
   ```

   Después, las migraciones lo respetan por el `IF NOT EXISTS`.

2. **Anotar las dos cadenas de conexión**, que no son la misma y cumplen funciones distintas:

   | Para qué | Cadena | Notas |
   |---|---|---|
   | Runtime de la app (`DATABASE_URL` de Prisma Client) | *transaction pooler*, puerto **6543**, con `?pgbouncer=true` | El modo transacción **no soporta prepared statements**; `pgbouncer=true` es lo que le dice a Prisma que los desactive. |
   | CLI de Prisma: migraciones e introspección (`DIRECT_URL`) | conexión directa **5432**, o el *session pooler* 5432 | El *session pooler* evita el problema de IPv6. |

   El usuario del pooler lleva la referencia del proyecto: `<rol>.<project-ref>`. Un rol propio
   también se conecta así.

3. **Declarar `directUrl` en el `datasource`** del `schema.prisma`, o las migraciones van a intentar
   correr por el pooler de transacciones y fallar de formas raras.

---

## Fase 2 — Esquema por migraciones

```bash
prisma migrate deploy    # contra DIRECT_URL, base vacía
```

Verificación, y el criterio es el **código de salida 0** más estas tres comprobaciones:

- Volver a correr `prisma migrate deploy`: tiene que reportar que no hay migraciones pendientes.
- `select rolname from pg_roles where rolname = '<rol_app>'` devuelve la fila.
- `select relname, relrowsecurity, relforcerowsecurity from pg_class where relrowsecurity` lista las
  tablas esperadas. Si tu diseño usa `FORCE ROW LEVEL SECURITY` porque la app se conecta como dueña
  de las tablas, comprobá que `relforcerowsecurity` sea verdadero: sin eso, el dueño saltea las
  políticas y la segunda barrera no existe.

---

## Fase 3 — Datos

```bash
pg_dump --data-only --no-owner --no-privileges -Fc -f datos.dump <origen>
pg_restore --data-only --no-owner --no-privileges --disable-triggers -d <destino> datos.dump
```

Tres cosas que decidir antes de apretar enter:

- **La RLS puede bloquear la restauración, y quién restaura importa más que la política.** Antes de
  nada, averiguá qué es el rol con el que vas a restaurar:

  ```sql
  select rolname, rolsuper, rolbypassrls from pg_roles where rolname = current_user;
  ```

  Un rol con `rolsuper` o `rolbypassrls` **saltea las políticas siempre**, incluso con `FORCE ROW
  LEVEL SECURITY`: ahí la restauración pasa y la política ni se evalúa. Ojo con esto porque explica
  por qué "en mi Postgres andaba": la imagen oficial de Postgres crea al usuario del contenedor como
  superusuario del clúster, así que en desarrollo la RLS nunca se puso a prueba de verdad. Los
  proveedores gestionados no suelen dar superusuario, así que en el destino la política **sí** se
  evalúa.

  Si el rol que restaura no saltea RLS, entonces sí manda la política: si da acceso total cuando el
  contexto de inquilino no está seteado, la restauración pasa (la sesión de `pg_restore` no lo fija);
  si es restrictiva por defecto, hay que desactivar las políticas durante la carga y volver a
  activarlas, o restaurar con un rol que las saltee.
- **`--disable-triggers`** evita que triggers de auditoría o de integridad se disparen con datos
  históricos. Requiere privilegios suficientes; si falla, restaurá por orden de dependencias.
- **Ventana de mantenimiento.** Todo lo que se escriba en el origen después del dump se pierde.
  Cortar escrituras, dumpear, restaurar, verificar, cambiar la aplicación.

Al terminar: `vacuum verbose analyze;` — la documentación de Supabase lo pide explícitamente para
que el planificador tenga estadísticas.

---

## Fase 4 — Verificación (ninguna de estas es opcional)

1. **Conteos por tabla**, origen contra destino. Una diferencia de una fila es una migración fallida.
2. **La RLS aísla de verdad**: conectarse **con el rol de aplicación** (no con el administrador),
   fijar el contexto de un inquilino y comprobar que no ve filas de otro. Probarlo con dos
   inquilinos distintos, no con uno.
3. **El rol de aplicación no puede saltear RLS**: `select rolbypassrls from pg_roles where rolname =
   '<rol_app>'` tiene que ser falso.
4. **La Data API no expone nada** que no deba: intentar leer una tabla del dominio con la clave
   anónima y comprobar que **no** devuelve filas. Si devuelve, volvé a la Fase 0 punto 1.
5. **La aplicación real** contra la base nueva: una operación de escritura completa, no solo un
   health check.
6. **Secuencias**: si el esquema usa columnas autoincrementales, comprobar que la secuencia quedó
   por encima del máximo valor existente. Un restore de datos no siempre la reposiciona, y el
   síntoma aparece recién en el primer insert. (Con identificadores UUID generados en la
   aplicación, este punto no aplica.)
7. **Dejá la garantía puesta, no solo comprobada.** Verificar la RLS el día de la migración no
   impide que dentro de seis meses alguien agregue una tabla con la columna de inquilino y se olvide
   de la política. Un test que enumere las tablas y falle solo es barato y permanente:

   ```sql
   -- toda tabla con la columna de inquilino tiene que tener RLS y al menos una política
   select c.relname
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   join information_schema.columns col
     on col.table_name = c.relname and col.column_name = '<columna_de_inquilino>'
   where n.nspname = 'public' and c.relkind = 'r'
     and (not c.relrowsecurity
          or not exists (select 1 from pg_policies p where p.tablename = c.relname));
   ```

   Si devuelve filas, falta RLS o falta política. Llevarlo a un test de integración con una lista de
   excepciones explícita —vacía por defecto— convierte el olvido en un test rojo en vez de en una
   fuga de datos.

---

## Fase 5 — Corte y vuelta atrás

Cambiar las variables de la aplicación, no el código. Dejar la base vieja **encendida y sin
escrituras** hasta tener una semana limpia: la vuelta atrás es apuntar las variables de nuevo. Recién
después dar de baja los respaldos propios, si los del proveedor ya están verificados (probar una
restauración, no confiar en que el panel diga que existen).

---

## Si el esquema NO está en migraciones

Dump completo con `--no-owner --no-privileges --no-subscriptions`, restore con `--no-owner
--no-privileges`, y después, a mano: recrear los roles, volver a habilitar RLS tabla por tabla
(`relrowsecurity` no viaja), recrear las políticas y re-otorgar los permisos. Es más trabajo y más
frágil: si el proyecto va a seguir vivo, conviene aprovechar la migración para empezar a versionar
el esquema.

---

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| Toda la base legible desde internet | Permisos por defecto a `anon`/`authenticated` en `public` + una política RLS que da acceso total cuando el contexto de inquilino no está seteado. |
| La app falla al autenticar contra la base, en bucle | La migración creó el rol con la contraseña de desarrollo porque corrió antes de que el rol existiera. Crear el rol a mano primero. |
| "No conecta" y las credenciales son correctas | La conexión directa es IPv6 sin el complemento de IPv4; el *shared pooler* es IPv4 siempre. |
| Errores raros solo al migrar | Las migraciones van por el pooler de transacciones en vez de `DIRECT_URL`. |
| Errores de prepared statements en runtime | Modo transacción sin `?pgbouncer=true`. |
| RLS "activa" pero el dueño ve todo | Falta `FORCE ROW LEVEL SECURITY`; o el rol tiene `rolsuper`/`rolbypassrls`, que saltean las políticas igual. |
| "En desarrollo andaba" y en el destino no | En desarrollo se conectaba un superusuario y la RLS nunca se evaluó. |
| Primer insert falla por clave duplicada | La secuencia quedó atrás tras un restore de datos. |
| El proyecto se apagó solo | Plan gratuito: se pausa tras una semana de inactividad. |
