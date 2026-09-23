#!/usr/bin/env node
// Puerta de calidad: la primera vez en una sesión que se edita un archivo EXISTENTE que otros
// consumen (build, contenedores, CI, empaquetado), corta una vez y pide listar quién lo usa.
// La segunda vez pasa: es un badén, no un muro.
//
// Entrada: JSON por stdin (hook PreToolUse). Salida: 2 = bloquea, 0 = sigue.
// En Node para no depender de bash ni de jq: funciona igual en Windows, macOS y Linux.

import { mkdirSync, existsSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const SENSIBLES = [
  /^turbo\.json$/i,
  /^package\.json$/i,
  /^pnpm-workspace\.yaml$/i,
  /^pnpm-lock\.yaml$/i,
  /^package-lock\.json$/i,
  /^\.npmrc$/i,
  /^\.nvmrc$/i,
  /^\.gitignore$/i,
  /^\.dockerignore$/i,
  /^\.easignore$/i,
  /^eas\.json$/i,
  /^app\.json$/i,
  /^app\.config\.(js|ts)$/i,
  /^vercel\.json$/i,
  /^netlify\.toml$/i,
  /^railway\.(json|toml)$/i,
  /^nest-cli\.json$/i,
  /^dockerfile(\..+)?$/i,            // Dockerfile, Dockerfile.api, Dockerfile.web
  /^.+\.dockerfile$/i,
  /^(docker-)?compose.*\.ya?ml$/i,
  /^tsconfig(\..+)?\.json$/i,
  /^schema\.prisma$/i,
  /^\.env\.example$/i,
  /^.+\.config\.(js|cjs|mjs|ts|mts|cts)$/i, // next, vite, tailwind, jest, eslint, vitest, etc.
  /^\.eslintrc(\..+)?$/i,
  /^babel\.config\.(js|cjs|mjs|json)$/i,
  /^metro\.config\.(js|cjs)$/i,
];

const leerEntrada = async () => {
  let bruto = '';
  for await (const parte of process.stdin) bruto += parte;
  try { return JSON.parse(bruto); } catch { return null; }
};

// Borra marcas de sesiones de más de 2 días, para que %TEMP% no crezca sin fin.
const limpiarViejas = (raiz) => {
  try {
    const corte = Date.now() - 2 * 24 * 60 * 60 * 1000;
    for (const entrada of readdirSync(raiz)) {
      const ruta = join(raiz, entrada);
      try {
        if (statSync(ruta).mtimeMs < corte) rmSync(ruta, { recursive: true, force: true });
      } catch { /* ignorar */ }
    }
  } catch { /* ignorar */ }
};

const entrada = await leerEntrada();
if (!entrada) process.exit(0); // sin datos utilizables: no estorbar

const rutaBruta = entrada?.tool_input?.file_path ?? entrada?.tool_input?.notebook_path ?? '';
if (!rutaBruta) process.exit(0);

const ruta = resolve(String(rutaBruta));

// Un archivo que todavía no existe no tiene consumidores: crear no se bloquea.
if (!existsSync(ruta)) process.exit(0);

const nombre = basename(ruta);
const enWorkflows = /[\\/]\.github[\\/]workflows[\\/][^\\/]+\.ya?ml$/i.test(ruta);
// Una migración ya escrita puede estar aplicada en una base: editarla no cambia esa base y sí
// cambia lo que obtiene el próximo reset. Es el archivo compartido más caro de tocar.
const esMigracion = /[\\/](prisma|supabase)[\\/]migrations[\\/].+\.sql$/i.test(ruta);
const esSensible = enWorkflows || esMigracion || SENSIBLES.some((re) => re.test(nombre));
if (!esSensible) process.exit(0);

// Un solo aviso por archivo y por sesión.
// En Windows las rutas no distinguen mayúsculas: normalizar para no marcar dos veces el mismo archivo.
const claveRuta = process.platform === 'win32' ? ruta.toLowerCase() : ruta;
const sesion = String(entrada.session_id ?? 'sin-sesion').replace(/[^a-zA-Z0-9_-]/g, '');
const clave = createHash('sha1').update(claveRuta).digest('hex').slice(0, 16);
const raiz = join(tmpdir(), 'fabrica-claude');
const carpeta = join(raiz, sesion);
const marca = join(carpeta, `${clave}.marca`);

if (existsSync(marca)) process.exit(0);

try {
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(marca, claveRuta);
  limpiarViejas(raiz);
} catch {
  process.exit(0); // si no se puede marcar, no bloquear en bucle
}

if (esMigracion) {
  process.stderr.write(
    `"${nombre}" es una migración que ya existe: puede estar aplicada en una o más bases.\n\n` +
    `Editarla no cambia esas bases, y sí cambia lo que obtiene el próximo reset o un entorno nuevo. ` +
    `Antes de tocarla, confirmá si ya se aplicó en algún entorno; si se aplicó, el cambio va en ` +
    `una migración nueva.\n\n` +
    `Si igual corresponde editarla, repetí la edición: este aviso sale una sola vez por archivo y ` +
    `por sesión.\n`,
  );
  process.exit(2);
}

process.stderr.write(
  `"${nombre}" es un archivo compartido: lo leen otros procesos además del que estás tocando ` +
  `(imágenes de contenedor, CI, empaquetado de la app, otras aplicaciones del monorepo).\n\n` +
  `Antes de editarlo, buscá quién más lo consume y decilo en tu evidencia. Un cambio pensado ` +
  `"solo para este caso" rompe otro camino con facilidad.\n\n` +
  `Cuando lo hayas comprobado, repetí la edición: este aviso sale una sola vez por archivo y ` +
  `por sesión.\n`,
);
process.exit(2);
