#!/usr/bin/env node
// Puerta de calidad: la primera vez en una sesión que se edita un archivo que
// otros consumen (build, contenedores, CI, empaquetado), corta una vez y pide
// listar quién lo usa. La segunda vez pasa: es un badén, no un muro.
//
// Entrada: JSON por stdin (hook PreToolUse). Salida: código 2 = bloquea, 0 = sigue.
// En Node para no depender de bash ni de jq: funciona igual en Windows, macOS y Linux.

import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const SENSIBLES = [
  /^turbo\.json$/i,
  /^package\.json$/i,
  /^pnpm-workspace\.yaml$/i,
  /^pnpm-lock\.yaml$/i,
  /^\.npmrc$/i,
  /^\.gitignore$/i,
  /^\.easignore$/i,
  /^eas\.json$/i,
  /^app\.json$/i,
  /^vercel\.json$/i,
  /^dockerfile$/i,
  /^docker-compose.*\.ya?ml$/i,
  /^compose.*\.ya?ml$/i,
  /^next\.config\.(js|mjs|ts)$/i,
  /^tsconfig(\..+)?\.json$/i,
  /^tailwind\.config\.(js|cjs|mjs|ts)$/i,
  /^schema\.prisma$/i,
];

const leerEntrada = async () => {
  let bruto = '';
  for await (const parte of process.stdin) bruto += parte;
  try { return JSON.parse(bruto); } catch { return null; }
};

const entrada = await leerEntrada();
if (!entrada) process.exit(0); // sin datos utilizables: no estorbar

const ruta = entrada?.tool_input?.file_path ?? entrada?.tool_input?.notebook_path ?? '';
if (!ruta) process.exit(0);

const nombre = basename(String(ruta));
const enWorkflows = /[\\/]\.github[\\/]workflows[\\/].+\.ya?ml$/i.test(String(ruta));
const esSensible = enWorkflows || SENSIBLES.some((re) => re.test(nombre));
if (!esSensible) process.exit(0);

// Un solo aviso por archivo y por sesión.
const sesion = String(entrada.session_id ?? 'sin-sesion').replace(/[^a-zA-Z0-9_-]/g, '');
const clave = createHash('sha1').update(String(ruta)).digest('hex').slice(0, 16);
const carpeta = join(tmpdir(), 'fabrica-claude', sesion);
const marca = join(carpeta, `${clave}.marca`);

if (existsSync(marca)) process.exit(0);

try {
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(marca, String(ruta));
} catch {
  process.exit(0); // si no se puede marcar, no bloquear en bucle
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
