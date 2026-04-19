import { unlink, access } from 'node:fs/promises';
import { join } from 'node:path';

export async function processRevoke({ dataRoot, issueBody, issueAuthor }) {
  let parsed;
  try {
    parsed = JSON.parse(issueBody);
  } catch (e) {
    return { ok: false, reason: `invalid JSON in revoke body: ${e.message}` };
  }
  const { author, slug } = parsed;
  if (!author || !slug) return { ok: false, reason: 'missing author or slug' };

  if (author !== issueAuthor) {
    return { ok: false, reason: `authorization failed: issue author "${issueAuthor}" does not match setup author "${author}"` };
  }

  const path = join(dataRoot, 'setups', author, `${slug}.json`);
  try {
    await access(path);
  } catch {
    return { ok: false, reason: `not found: ${author}/${slug}` };
  }
  await unlink(path);
  return { ok: true, path };
}
