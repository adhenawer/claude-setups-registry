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
      <div class="card-header">
        <a class="identity" href="${href}">
          <span class="author">@${escapeHtml(d.id.author)}</span><span class="separator">/</span><span class="slug">${escapeHtml(d.id.slug)}</span>
        </a>
        <div class="specialties">${specsHtml}</div>
      </div>
      <h3 class="descriptor"><a href="${href}">${escapeHtml(d.title)}</a></h3>
      <p class="description">${escapeHtml(d.description)}</p>
      <div class="card-footer">
        <span class="date">${d.createdAt.slice(0, 10)}</span>
        <div class="tags">${tags}</div>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hup]|<li|<pre|<ul)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

function renderOverviewSection(d) {
  if (!d.overview) return '';
  return `<h2>About this setup</h2>\n<div class="overview-content">${markdownToHtml(d.overview)}</div>`;
}

function renderBundleSection(d) {
  if (!d.bundle?.present || !d.bundle.files?.length) {
    return '<p>No bundle (descriptor-only setup — only plugin/marketplace/MCP identifiers).</p>';
  }
  const rows = d.bundle.files.map(f => `
    <tr>
      <td><code>${escapeHtml(f.path)}</code></td>
      <td>${f.size} bytes</td>
      <td><code>${f.sha256.slice(0, 12)}…</code></td>
    </tr>
  `).join('');
  const bundleUrl = `../../../bundles/${d.id.author}/${d.id.slug}.tar.gz`;
  return `
    <p>Download the bundle: <a href="${bundleUrl}">${d.id.slug}.tar.gz</a></p>
    <table>
      <thead><tr><th>path</th><th>size</th><th>sha256</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderDetail(template, d) {
  const mirror = `https://${process.env.GITHUB_REPOSITORY_OWNER || 'adhenawer'}.github.io/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'claude-setups-registry'}/s/${d.id.author}/${d.id.slug}.json`;
  const specialtiesHtml = (d.specialties || []).map(s => `<span class="specialty">${escapeHtml(s)}</span>`).join('');
  return template
    .replace(/%%TITLE%%/g, escapeHtml(d.title))
    .replace(/%%AUTHOR%%/g, escapeHtml(d.id.author))
    .replace(/%%SLUG%%/g, escapeHtml(d.id.slug))
    .replace(/%%SHORT_ID%%/g, escapeHtml(`${d.id.author}/${d.id.slug}`))
    .replace(/%%AUTHOR_URL%%/g, escapeHtml(d.author.url))
    .replace(/%%VERSION%%/g, String(d.version))
    .replace(/%%CREATED_AT%%/g, d.createdAt.slice(0, 10))
    .replace(/%%DESCRIPTION%%/g, escapeHtml(d.description))
    .replace(/%%MIRROR_URL%%/g, mirror)
    .replace(/%%SPECIALTIES_HTML%%/g, specialtiesHtml)
    .replace(/%%DESCRIPTOR_JSON%%/g, escapeHtml(JSON.stringify(d, null, 2)))
    .replace(/%%BUNDLE_SECTION%%/g, renderBundleSection(d))
    .replace(/%%OVERVIEW_SECTION%%/g, renderOverviewSection(d));
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
