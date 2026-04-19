import { mkdir, writeFile } from 'node:fs/promises';
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

  // Canonicalize tags
  descriptor.tags = descriptor.tags.map(t => aliases[t] || t);

  const setupDir = join(dataRoot, 'setups', descriptor.id.author);
  await mkdir(setupDir, { recursive: true });
  const setupPath = join(setupDir, `${descriptor.id.slug}.json`);
  await writeFile(setupPath, JSON.stringify(descriptor, null, 2));

  return { ok: true, path: setupPath, slug: descriptor.id.slug };
}
