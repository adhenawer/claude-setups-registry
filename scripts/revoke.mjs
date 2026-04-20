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

  const setupPath = join(dataRoot, 'setups', author, `${slug}.json`);
  const bundlePath = join(dataRoot, 'bundles', author, `${slug}.tar.gz`);

  let setupRemoved = false;
  let bundleRemoved = false;

  try {
    await access(setupPath);
    await unlink(setupPath);
    setupRemoved = true;
  } catch {}

  try {
    await access(bundlePath);
    await unlink(bundlePath);
    bundleRemoved = true;
  } catch {}

  // Idempotent: already-revoked is still success
  return {
    ok: true,
    path: setupPath,
    setupRemoved,
    bundleRemoved,
    alreadyRevoked: !setupRemoved && !bundleRemoved,
  };
}
