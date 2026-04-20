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

const ALLOWED_PREFIXES = ['hooks/', 'skills/', 'commands/', 'agents/'];

function isAllowedBundlePath(p) {
  if (/^[a-z0-9_-]+\.md$/i.test(p)) return true;
  return ALLOWED_PREFIXES.some(prefix => p.startsWith(prefix));
}

function validateBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') throw new Error('bundle must be an object');
  if (typeof bundle.present !== 'boolean') throw new Error('bundle.present must be boolean');
  if (!bundle.present) return;

  if (!bundle.sha256) throw new Error('bundle.sha256 required when present');
  if (!bundle.pendingBranch) throw new Error('bundle.pendingBranch required when present');
  if (!Array.isArray(bundle.files)) throw new Error('bundle.files must be array');

  for (const f of bundle.files) {
    if (!f.path) throw new Error('bundle.files[].path required');
    if (f.path.startsWith('/')) throw new Error(`bundle.files[]: absolute path rejected: ${f.path}`);
    if (f.path.includes('..')) throw new Error(`bundle.files[]: traversal rejected: ${f.path}`);
    if (f.path === 'settings.json' || f.path.startsWith('settings.')) {
      throw new Error(`bundle must NEVER include settings.json: ${f.path}`);
    }
    if (f.path === '.claude.json' || f.path.includes('/.claude.json')) {
      throw new Error(`bundle must NEVER include .claude.json: ${f.path}`);
    }
    if (!isAllowedBundlePath(f.path)) {
      throw new Error(`bundle.files[]: disallowed path (not under allowed prefix): ${f.path}`);
    }
  }
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

  if (d.bundle) validateBundle(d.bundle);

  return true;
}
