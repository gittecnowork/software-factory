#!/usr/bin/env node
// Chequeos deterministas de la fábrica (etapa 1). Sin IA, sin secretos, sin dependencias.
//
// Uso:
//   node .github/scripts/chequeos-fabrica.mjs --base <ref|sha>   (CI: sha anterior o base del PR)
//   node .github/scripts/chequeos-fabrica.mjs                    (local: compara contra origin/main)
//
// Compara commits. Con el árbol sucio (incluidos archivos sin trackear) falla: se corre después
// del commit y antes del push.
// Sale con código 0 si todo pasa; con 1 si algún chequeo falla. Cada falla dice archivo y motivo.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const fallas = [];
const avisos = [];
const falla = (chequeo, detalle) => fallas.push(`[${chequeo}] ${detalle}`);
const aviso = (detalle) => avisos.push(detalle);

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const gitOk = (...args) => {
  try { git(...args); return true; } catch { return false; }
};

// ---------------------------------------------------------------- base de comparación
function resolverBase() {
  const i = process.argv.indexOf('--base');
  let base = i > -1 ? process.argv[i + 1] : '';
  if (!base || /^0+$/.test(base)) {
    // push que crea la rama, o corrida local sin --base
    if (!base && gitOk('rev-parse', '--verify', 'origin/main')) base = 'origin/main';
    else if (gitOk('rev-parse', '--verify', 'HEAD~1')) base = 'HEAD~1';
    else return null;
  }
  if (!gitOk('rev-parse', '--verify', `${base}^{commit}`)) {
    falla('base', `no existe el commit base "${base}" (¿checkout con fetch-depth: 0?)`);
    return null;
  }
  // En un PR la base puede haber avanzado: comparar desde el ancestro común.
  return git('merge-base', base, 'HEAD');
}

const base = resolverBase();
const cambiados = base ? git('diff', '--name-only', `${base}`, 'HEAD').split('\n').filter(Boolean) : [];
// Árbol sucio = falla, no aviso. El chequeo toma la lista de cambios de los commits pero lee los
// archivos del disco: con cambios sin commitear mezcla las dos cosas y puede dar 0 sin haber mirado
// lo nuevo (pasó en 0.7.0). `git diff --quiet` no veía los archivos sin trackear; `status` sí.
// En CI el checkout está siempre limpio. --no-optional-locks: correrlo no deja index.lock.
const sucio = git('--no-optional-locks', 'status', '--porcelain', '--untracked-files=all');
if (sucio) {
  const rutas = sucio.split('\n');
  falla('arbol', `${rutas.length} ruta/s sin commitear o sin trackear (${rutas.slice(0, 3).map((r) => r.trim()).join('; ')}${rutas.length > 3 ? '; …' : ''}). Commitear y volver a correr: la corrida que vale es después del commit y antes del push`);
}

// ---------------------------------------------------------------- marketplace (C4)
const MARKET = '.claude-plugin/marketplace.json';
let plugins = [];
try {
  const m = JSON.parse(readFileSync(MARKET, 'utf8'));
  for (const p of m.plugins ?? []) {
    const dir = String(p.source ?? '').replace(/^\.\//, '').replace(/\/$/, '');
    const manifiesto = join(dir, '.claude-plugin/plugin.json');
    if (!dir || !existsSync(dir)) { falla('marketplace', `"${p.name}": source "${p.source}" no existe`); continue; }
    if (!existsSync(manifiesto)) { falla('marketplace', `"${p.name}": falta ${manifiesto}`); continue; }
    const pj = JSON.parse(readFileSync(manifiesto, 'utf8'));
    if (pj.name !== p.name) falla('marketplace', `"${p.name}" en ${MARKET}, pero "${pj.name}" en ${manifiesto}`);
    if (!pj.version) falla('marketplace', `${manifiesto} no tiene "version"`);
    plugins.push({ name: p.name, dir, manifiesto, version: pj.version });
  }
} catch (e) {
  falla('marketplace', `${MARKET} no se pudo leer: ${e.message}`);
}

// ---------------------------------------------------------------- validate (C1)
for (const destino of ['.', ...plugins.map((p) => `./${p.dir}`)]) {
  try {
    execFileSync('claude', ['plugin', 'validate', destino], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    if (e.code === 'ENOENT') { falla('validate', 'no está el CLI "claude" en el PATH'); break; }
    const salida = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim().split('\n').slice(-5).join(' | ');
    falla('validate', `claude plugin validate ${destino} salió con código ${e.status}: ${salida}`);
  }
}

// ---------------------------------------------------------------- frontmatter (C2)
function frontmatter(archivo) {
  const texto = readFileSync(archivo, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const campos = {};
  const lineas = m[1].split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const c = lineas[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!c) continue;
    const siguienteIndentada = i + 1 < lineas.length && /^\s+\S/.test(lineas[i + 1]);
    campos[c[1]] = { valor: c[2].replace(/^["']|["']$/g, '').trim(), multilinea: /^[>|]/.test(c[2]) || (c[2] === '' && siguienteIndentada) };
  }
  return campos;
}

function listar(dir, filtro, salida = []) {
  if (!existsSync(dir)) return salida;
  for (const n of readdirSync(dir)) {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) listar(ruta, filtro, salida);
    else if (filtro(ruta)) salida.push(ruta);
  }
  return salida;
}

const skills = [
  ...plugins.flatMap((p) => listar(join(p.dir, 'skills'), (r) => basename(r) === 'SKILL.md')),
  ...listar('.claude/skills', (r) => basename(r) === 'SKILL.md'),
];
const agentes = plugins.flatMap((p) => listar(join(p.dir, 'agents'), (r) => r.endsWith('.md')));

function chequearFicha(archivo, nombreEsperado, tipo) {
  const fm = frontmatter(archivo);
  if (!fm) return falla('frontmatter', `${archivo}: no empieza con un bloque --- ... ---`);
  if (!fm.name?.valor) falla('frontmatter', `${archivo}: falta "name"`);
  else if (fm.name.valor !== nombreEsperado) falla('frontmatter', `${archivo}: name "${fm.name.valor}" no coincide con ${tipo} "${nombreEsperado}"`);
  if (!fm.description?.valor || fm.description.multilinea) falla('frontmatter', `${archivo}: "description" tiene que estar en una sola línea y no vacía`);
}
for (const s of skills) chequearFicha(s, basename(dirname(s)), 'la carpeta');
for (const a of agentes) chequearFicha(a, basename(a, '.md'), 'el archivo');

// ---------------------------------------------------------------- bump de versión (C3, regla 16)
const mayor = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
};
if (base) {
  for (const p of plugins) {
    const tocados = cambiados.filter((f) => f.startsWith(`${p.dir}/`));
    if (tocados.length === 0) continue;
    let antes = null;
    try { antes = JSON.parse(git('show', `${base}:${p.manifiesto}`)).version; } catch { /* plugin nuevo */ }
    if (antes === null) continue;
    if (!mayor(p.version, antes)) {
      falla('bump', `${p.name}: cambió contenido (${tocados.length} archivo/s, p. ej. ${tocados[0]}) y la versión sigue en ${antes}${p.version !== antes ? ` → ${p.version} no es mayor` : ''} (regla 16)`);
    }
  }
} else {
  aviso('sin commit base: no se pudo chequear el bump (regla 16)');
}

// ---------------------------------------------------------------- README (C5)
try {
  const readme = readFileSync('README.md', 'utf8');
  for (const p of plugins) {
    const fila = readme.split('\n').find((l) => l.startsWith(`| \`${p.name}\``));
    if (!fila) { falla('readme', `no hay fila para "${p.name}" en la tabla "Qué hay hoy"`); continue; }
    const v = fila.match(/`\s*v(\d+\.\d+\.\d+)/);
    if (v && v[1] !== p.version) falla('readme', `"${p.name}" figura v${v[1]} y plugin.json dice ${p.version}`);
    const reales = {
      agente: listar(join(p.dir, 'agents'), (r) => r.endsWith('.md')).length,
      skill: listar(join(p.dir, 'skills'), (r) => basename(r) === 'SKILL.md').length,
      hook: listar(join(p.dir, 'hooks'), (r) => !/hooks\.json$|\.gitkeep$/.test(r)).length,
    };
    const celda = fila.split('|')[2] ?? '';
    if (/vac[ií]o/i.test(celda)) {
      if (reales.agente + reales.skill + reales.hook > 0) falla('readme', `"${p.name}" figura vacío y tiene ${reales.agente} agente/s, ${reales.skill} skill/s, ${reales.hook} hook/s`);
      continue;
    }
    for (const [tipo, patron] of [['agente', /(\d+)\s+agentes?/], ['skill', /(\d+)\s+skills?/], ['hook', /(\d+)\s+hooks?/]]) {
      const n = celda.match(patron);
      if (n && Number(n[1]) !== reales[tipo]) falla('readme', `"${p.name}" figura con ${n[1]} ${tipo}/s y tiene ${reales[tipo]}`);
    }
  }
} catch (e) {
  falla('readme', `README.md no se pudo leer: ${e.message}`);
}

// ---------------------------------------------------------------- datos sensibles en lo agregado (C6)
// El repo es público: se revisan solo las líneas agregadas desde la base, no el historial.
const PATRONES = [
  ['clave de Anthropic', /sk-ant-[A-Za-z0-9_-]{10,}/],
  ['token de GitHub', /\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ['clave de AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['clave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['clave secreta de Supabase', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ['connection string con contraseña', /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]+@/],
  ['dirección IP pública', /\b(?!(?:10|127|0)\.)(?!192\.168\.)(?!172\.(?:1[6-9]|2\d|3[01])\.)(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/],
];
const EXCLUIDOS = ['.github/scripts/chequeos-fabrica.mjs'];
if (base) {
  const diff = git('diff', '--unified=0', '--no-color', base, 'HEAD');
  let archivo = '';
  let linea = 0;
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) { archivo = l.replace(/^\+\+\+ (b\/)?/, ''); continue; }
    const h = l.match(/^@@ -\S+ \+(\d+)/);
    if (h) { linea = Number(h[1]); continue; }
    if (!l.startsWith('+') || EXCLUIDOS.includes(archivo)) continue;
    for (const [nombre, patron] of PATRONES) {
      if (patron.test(l)) falla('sensible', `${archivo}:${linea}: parece ${nombre}. El repo es público: sacalo antes de pushear`);
    }
    linea++;
  }
}

// ---------------------------------------------------------------- reporte
console.log(`Base: ${base ?? '(ninguna)'} · archivos cambiados: ${cambiados.length} · plugins: ${plugins.map((p) => `${p.name}@${p.version}`).join(', ')}`);
console.log(`Fichas revisadas: ${skills.length} skills, ${agentes.length} agentes`);
for (const a of avisos) console.log(`AVISO  ${a}`);
if (fallas.length) {
  for (const f of fallas) console.log(`FALLA  ${f}`);
  console.log(`\n${fallas.length} falla/s.`);
  process.exit(1);
}
console.log('\nTodos los chequeos pasaron.');
