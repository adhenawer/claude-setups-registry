import { readdir, readFile, writeFile, mkdir, copyFile, rm, stat, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const DATA_DIR = 'data/setups';
const BUNDLES_DIR = 'data/bundles';
const SITE_DIR = 'site';
const OUT_DIR = 'site-build';
const SPECIALTIES_YML = 'data/specialties.yml';
const MAX_FILE_BYTES = 120 * 1024;

const TEXT_EXTS = new Set([
  'md', 'sh', 'bash', 'zsh', 'fish', 'txt', 'json', 'yml', 'yaml', 'toml',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'rb', 'rs', 'go', 'java',
  'css', 'scss', 'html', 'xml', 'ini', 'cfg', 'env', 'conf', 'lua', 'vim',
  'sql', 'dockerfile', 'makefile', 'gitignore', 'editorconfig',
]);

function kindFor(path) {
  const lower = path.toLowerCase();
  const base = lower.split('/').pop();
  if (base === 'dockerfile' || base === 'makefile') return base;
  const ext = extname(lower).slice(1);
  return ext || 'txt';
}

function isTextFile(path) {
  const lower = path.toLowerCase();
  const base = lower.split('/').pop();
  if (base.startsWith('.') && base.length > 1) return true;
  if (base === 'dockerfile' || base === 'makefile' || base === 'license' || base === 'readme') return true;
  const ext = extname(lower).slice(1);
  return TEXT_EXTS.has(ext);
}

function parseFlatYaml(src) {
  const out = {};
  for (const raw of src.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

async function loadSpecialtyLabels() {
  try {
    const src = await readFile(SPECIALTIES_YML, 'utf-8');
    return parseFlatYaml(src);
  } catch { return {}; }
}

async function listSetups() {
  const results = [];
  let authors;
  try { authors = await readdir(DATA_DIR); } catch { return []; }
  for (const author of authors) {
    if (author.startsWith('.')) continue;
    const authorDir = join(DATA_DIR, author);
    let files;
    try { files = await readdir(authorDir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const p = join(authorDir, f);
      const d = JSON.parse(await readFile(p, 'utf-8'));
      results.push({ path: p, descriptor: d });
    }
  }
  results.sort((a, b) => (b.descriptor.createdAt || '').localeCompare(a.descriptor.createdAt || ''));
  return results;
}

function avatarBg(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 45%)`;
}

function avatarChar(name) {
  const s = String(name || '?').trim();
  return (s.charAt(0) || '?').toUpperCase();
}

async function extractBundleFiles(descriptor) {
  const { author, slug } = descriptor.id;
  const tarPath = join(BUNDLES_DIR, author, `${slug}.tar.gz`);
  if (!existsSync(tarPath)) return null;
  const tmp = join(tmpdir(), `cs-bundle-${author}-${slug}-${Date.now()}`);
  await mkdir(tmp, { recursive: true });
  try {
    execFileSync('tar', ['-xzf', tarPath, '-C', tmp], { stdio: 'ignore' });
  } catch (e) {
    console.warn(`[bundle] extract failed for ${author}/${slug}: ${e.message}`);
    await rm(tmp, { recursive: true, force: true });
    return null;
  }
  const contents = new Map();
  const walk = async (dir, prefix = '') => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const abs = join(dir, ent.name);
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) { await walk(abs, rel); continue; }
      if (!ent.isFile()) continue;
      const st = await stat(abs);
      if (st.size > MAX_FILE_BYTES) { contents.set(rel, { skipped: 'too-large' }); continue; }
      if (!isTextFile(rel)) { contents.set(rel, { skipped: 'binary' }); continue; }
      try {
        const text = await readFile(abs, 'utf-8');
        contents.set(rel, { text });
      } catch { contents.set(rel, { skipped: 'read-error' }); }
    }
  };
  await walk(tmp);
  await rm(tmp, { recursive: true, force: true });
  return contents;
}

function computeStats(descriptor, fileList) {
  const plugins = (descriptor.plugins || []).length;
  const mcps = (descriptor.mcpServers || descriptor.mcps || []).length;
  let hooks = 0, skills = 0;
  for (const f of fileList) {
    if (f.path.startsWith('hooks/')) hooks++;
    else if (f.path.startsWith('skills/')) skills++;
  }
  return { plugins, mcps, hooks, skills };
}

async function toGalleryEntry(descriptor) {
  const author = descriptor.id.author;
  const slug = descriptor.id.slug;
  const contents = await extractBundleFiles(descriptor);

  const files = (descriptor.bundle?.files || []).map(f => {
    const entry = contents?.get(f.path);
    const kind = kindFor(f.path);
    const base = { path: f.path, size: f.size, sha256: f.sha256, kind };
    if (entry && entry.text != null) return { ...base, content: entry.text };
    return base;
  });

  const mcps = (descriptor.mcpServers || []).map(m => ({
    name: m.name || m.id || 'mcp',
    cmd: m.command || m.cmd || (Array.isArray(m.args) ? m.args.join(' ') : ''),
  }));

  const plugins = (descriptor.plugins || []).map(p => ({
    name: p.name,
    version: p.version || 'unknown',
    from: p.from || (p.marketplace ? `marketplace:${p.marketplace}` : 'npm'),
    marketplace: p.marketplace,
  }));

  const stats = computeStats(descriptor, files);

  return {
    slug,
    author,
    authorName: descriptor.author?.handle || author,
    authorUrl: descriptor.author?.url || `https://github.com/${author}`,
    avatar: avatarChar(descriptor.author?.handle || author),
    avatarBg: avatarBg(author + slug),
    title: descriptor.title,
    description: descriptor.description,
    overview: descriptor.overview || '',
    specialties: descriptor.specialties || [],
    tags: descriptor.tags || [],
    published: descriptor.createdAt,
    mirrors: descriptor.mirrors || 0,
    stats,
    plugins,
    mcps,
    files,
    bundleUrl: descriptor.bundle?.url || null,
  };
}

async function copyDirIfExists(src, dst) {
  if (!existsSync(src)) return false;
  await cp(src, dst, { recursive: true });
  return true;
}

async function build() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  await copyFile(join(SITE_DIR, 'styles.css'), join(OUT_DIR, 'styles.css'));
  await copyFile(join(SITE_DIR, 'index.html'), join(OUT_DIR, 'index.html'));
  await copyFile(join(SITE_DIR, 'app.js'), join(OUT_DIR, 'app.js'));

  const setups = await listSetups();
  const specLabels = await loadSpecialtyLabels();

  const gallery = [];
  for (const { descriptor } of setups) {
    gallery.push(await toGalleryEntry(descriptor));
  }

  const js = 'window.SPECIALTY_LABELS=' + JSON.stringify(specLabels) + ';\n' +
    'window.SETUPS_DATA=' + JSON.stringify(gallery) + ';\n';
  await writeFile(join(OUT_DIR, 'setups.js'), js);

  for (const { descriptor } of setups) {
    const outDir = join(OUT_DIR, 's', descriptor.id.author);
    await mkdir(outDir, { recursive: true });
    await writeFile(
      join(outDir, `${descriptor.id.slug}.json`),
      JSON.stringify(descriptor, null, 2),
    );
  }

  await copyDirIfExists(BUNDLES_DIR, join(OUT_DIR, 'bundles'));

  console.log(`Built site: ${setups.length} setup(s) → ${OUT_DIR}/`);
}

build().catch(e => { console.error(e); process.exit(1); });
