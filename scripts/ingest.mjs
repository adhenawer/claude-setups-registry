import { mkdir, writeFile, rename, access } from 'node:fs/promises';
import { join } from 'node:path';
import { validate } from './validate-descriptor.mjs';

export async function ingestIssue({ dataRoot, issueBody, issueAuthor, aliases = {} }) {
  let descriptor;
  try {
    descriptor = JSON.parse(issueBody);
  } catch (e) {
    return { ok: false, reason: `invalid JSON in issue body: ${e.message}` };
  }
  try {
    await validate(descriptor, { issueAuthor });
  } catch (e) {
    return { ok: false, reason: `validation: ${e.message}` };
  }

  descriptor.tags = descriptor.tags.map(t => aliases[t] || t);

  const setupDir = join(dataRoot, 'setups', descriptor.id.author);
  await mkdir(setupDir, { recursive: true });
  const setupPath = join(setupDir, `${descriptor.id.slug}.json`);
  await writeFile(setupPath, JSON.stringify(descriptor, null, 2));

  // Handle bundle move from the pending branch
  if (descriptor.bundle?.present) {
    const bundleDir = join(dataRoot, 'bundles', descriptor.id.author);
    await mkdir(bundleDir, { recursive: true });
    const src = join('bundle-pending', `${descriptor.id.author}-${descriptor.id.slug}.tar.gz`);
    const dst = join(bundleDir, `${descriptor.id.slug}.tar.gz`);
    try {
      await access(src);
    } catch {
      return { ok: false, reason: `bundle file not found at ${src}` };
    }
    await rename(src, dst);
  }

  return { ok: true, path: setupPath, slug: descriptor.id.slug };
}
