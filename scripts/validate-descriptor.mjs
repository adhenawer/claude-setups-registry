import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPECIALTIES_PATH = join(__dirname, '../data/specialties.yml');

const SUPPORTED_MAJOR = 1;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,49}$/;

let _specialties = null;
async function getSpecialties() {
  if (_specialties) return _specialties;
  const text = await readFile(SPECIALTIES_PATH, 'utf-8');
  const map = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([a-z0-9][a-z0-9-]*)\s*:\s*(?:"(.*)"|(.+))\s*$/i);
    if (m) map[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  _specialties = map;
  return map;
}

export async function validate(d, opts = {}) {
  if (!d || typeof d !== 'object') throw new Error('descriptor not an object');
  if (!d.schemaVersion) throw new Error('missing schemaVersion');
  const major = parseInt(d.schemaVersion.split('.')[0], 10);
  if (major !== SUPPORTED_MAJOR) {
    throw new Error(`unsupported schemaVersion ${d.schemaVersion}`);
  }
  if (!d.id?.author || !d.id?.slug) throw new Error('missing id.author or id.slug');
  if (!SLUG_RE.test(d.id.slug)) throw new Error(`invalid slug: ${d.id.slug}`);
  if (!d.title || typeof d.title !== 'string') throw new Error('invalid title');
  if (!d.description || typeof d.description !== 'string') throw new Error('invalid description');
  if (!Array.isArray(d.tags) || d.tags.length === 0) throw new Error('invalid tags');
  if (!Array.isArray(d.plugins)) throw new Error('plugins must be array');
  if (!Array.isArray(d.marketplaces)) throw new Error('marketplaces must be array');
  if (!Array.isArray(d.mcpServers)) throw new Error('mcpServers must be array');
  for (const s of d.mcpServers) {
    if ('env' in s) throw new Error(`mcpServers[${s.name}] must not include env`);
  }

  // Specialties
  if (!Array.isArray(d.specialties) || d.specialties.length === 0) {
    throw new Error('specialties: at least one required');
  }
  if (d.specialties.length > 3) {
    throw new Error('specialties: at most 3 allowed');
  }
  const known = await getSpecialties();
  for (const s of d.specialties) {
    if (!(s in known)) throw new Error(`specialties: unknown "${s}"`);
  }

  if (opts.issueAuthor && opts.issueAuthor !== d.id.author) {
    throw new Error(`descriptor author "${d.id.author}" does not match issue author "${opts.issueAuthor}"`);
  }
  return true;
}
