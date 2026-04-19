import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = 'data/setups';
const SITE_DIR = 'site';
const OUT_DIR = 'site-build';

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
  results.sort((a, b) => b.descriptor.createdAt.localeCompare(a.descriptor.createdAt));
  return results;
}

function renderCard(d) {
  const tags = d.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const specs = (d.specialties || []).join(',');
  const specsHtml = (d.specialties || []).map(s => `<span class="specialty">${escapeHtml(s)}</span>`).join('');
  const href = `s/${d.id.author}/${d.id.slug}.html`;
  return `
    <article class="setup-card" data-specialties="${escapeHtml(specs)}">
      <h2><a href="${href}">${escapeHtml(d.title)}</a></h2>
      <p class="author">by <a href="${escapeHtml(d.author.url)}">${escapeHtml(d.id.author)}</a> · ${d.createdAt.slice(0, 10)}</p>
      <p>${escapeHtml(d.description)}</p>
      <div class="specialties">${specsHtml}</div>
      <div class="tags">${tags}</div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderDetail(template, d) {
  const mirror = `https://${process.env.GITHUB_REPOSITORY_OWNER || 'adhenawer'}.github.io/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'claude-setups-registry'}/s/${d.id.author}/${d.id.slug}.json`;
  const specialtiesHtml = (d.specialties || []).map(s => `<span class="specialty">${escapeHtml(s)}</span>`).join('');
  return template
    .replace(/%%TITLE%%/g, escapeHtml(d.title))
    .replace(/%%AUTHOR%%/g, escapeHtml(d.id.author))
    .replace(/%%AUTHOR_URL%%/g, escapeHtml(d.author.url))
    .replace(/%%VERSION%%/g, String(d.version))
    .replace(/%%CREATED_AT%%/g, d.createdAt.slice(0, 10))
    .replace(/%%DESCRIPTION%%/g, escapeHtml(d.description))
    .replace(/%%MIRROR_URL%%/g, mirror)
    .replace(/%%SPECIALTIES_HTML%%/g, specialtiesHtml)
    .replace(/%%DESCRIPTOR_JSON%%/g, escapeHtml(JSON.stringify(d, null, 2)));
}

async function build() {
  await mkdir(OUT_DIR, { recursive: true });
  await copyFile(join(SITE_DIR, 'styles.css'), join(OUT_DIR, 'styles.css'));

  const setups = await listSetups();

  const uniqueSpecs = [...new Set(setups.flatMap(s => s.descriptor.specialties || []))].sort();
  const options = uniqueSpecs.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

  const indexTpl = await readFile(join(SITE_DIR, 'index.html'), 'utf-8');
  const index = indexTpl
    .replace('<!-- CARDS -->', setups.map(s => renderCard(s.descriptor)).join(''))
    .replace('<!-- FILTER OPTIONS -->', options);
  await writeFile(join(OUT_DIR, 'index.html'), index);

  const detailTpl = await readFile(join(SITE_DIR, 'setup.html'), 'utf-8');
  for (const { descriptor } of setups) {
    const outDir = join(OUT_DIR, 's', descriptor.id.author);
    await mkdir(outDir, { recursive: true });
    const outPath = join(outDir, `${descriptor.id.slug}.html`);
    await writeFile(outPath, renderDetail(detailTpl, descriptor));
    await writeFile(
      join(outDir, `${descriptor.id.slug}.json`),
      JSON.stringify(descriptor, null, 2)
    );
  }
  console.log(`Built site: ${setups.length} setup(s) → ${OUT_DIR}/`);
}

build().catch(e => { console.error(e); process.exit(1); });
