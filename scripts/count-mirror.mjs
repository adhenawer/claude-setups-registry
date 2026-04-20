import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export async function countMirror({ dataRoot, issueBody }) {
  let parsed;
  try {
    parsed = JSON.parse(issueBody);
  } catch (e) {
    return { ok: false, reason: `invalid JSON: ${e.message}` };
  }
  const target = parsed.target || parsed;
  const { author, slug } = target || {};
  if (!author || !slug) return { ok: false, reason: 'missing target.author or target.slug' };

  const setupPath = join(dataRoot, 'setups', author, `${slug}.json`);
  try {
    await access(setupPath);
  } catch {
    return { ok: false, reason: `setup not found: ${author}/${slug}` };
  }

  const descriptor = JSON.parse(await readFile(setupPath, 'utf-8'));
  descriptor.mirrors = (Number(descriptor.mirrors) || 0) + 1;
  await writeFile(setupPath, JSON.stringify(descriptor, null, 2));

  return { ok: true, path: setupPath, mirrors: descriptor.mirrors };
}
