const SUPPORTED_MAJOR = 1;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,49}$/;

export function validate(d, opts = {}) {
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
  // Forbidden fields (server-side check — defense in depth)
  for (const s of d.mcpServers) {
    if ('env' in s) throw new Error(`mcpServers[${s.name}] must not include env`);
  }

  if (opts.issueAuthor && opts.issueAuthor !== d.id.author) {
    throw new Error(`descriptor author "${d.id.author}" does not match issue author "${opts.issueAuthor}"`);
  }
  return true;
}
