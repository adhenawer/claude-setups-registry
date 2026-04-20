import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function setupFake() {
  const root = await mkdtemp(join(tmpdir(), 'cs-rev-'));
  const setupsDir = join(root, 'setups', 'alice');
  await mkdir(setupsDir, { recursive: true });
  await writeFile(join(setupsDir, 'demo.json'), '{}');
  await writeFile(join(setupsDir, 'other.json'), '{}');
  return root;
}

describe('processRevoke', () => {
  it('deletes the targeted setup when author matches', async () => {
    const { processRevoke } = await import('../revoke.mjs');
    const root = await setupFake();
    try {
      const r = await processRevoke({
        dataRoot: root,
        issueBody: JSON.stringify({ author: 'alice', slug: 'demo' }),
        issueAuthor: 'alice',
      });
      assert.equal(r.ok, true);
      const remaining = await readdir(join(root, 'setups', 'alice'));
      assert.deepEqual(remaining.sort(), ['other.json']);
    } finally { await rm(root, { recursive: true }); }
  });

  it('rejects when issue author does not match setup author', async () => {
    const { processRevoke } = await import('../revoke.mjs');
    const root = await setupFake();
    try {
      const r = await processRevoke({
        dataRoot: root,
        issueBody: JSON.stringify({ author: 'alice', slug: 'demo' }),
        issueAuthor: 'mallory',
      });
      assert.equal(r.ok, false);
      assert.match(r.reason, /authorization|not match/i);
      const remaining = await readdir(join(root, 'setups', 'alice'));
      assert.equal(remaining.length, 2, 'no file removed');
    } finally { await rm(root, { recursive: true }); }
  });

  it('is idempotent when target file does not exist (already revoked)', async () => {
    const { processRevoke } = await import('../revoke.mjs');
    const root = await setupFake();
    try {
      const r = await processRevoke({
        dataRoot: root,
        issueBody: JSON.stringify({ author: 'alice', slug: 'nonexistent' }),
        issueAuthor: 'alice',
      });
      assert.equal(r.ok, true);
      assert.equal(r.alreadyRevoked, true);
    } finally { await rm(root, { recursive: true }); }
  });

  it('also removes the bundle tar.gz when present', async () => {
    const { processRevoke } = await import('../revoke.mjs');
    const root = await setupFake();
    const bundlesDir = join(root, 'bundles', 'alice');
    await mkdir(bundlesDir, { recursive: true });
    await writeFile(join(bundlesDir, 'demo.tar.gz'), 'binary');
    try {
      const r = await processRevoke({
        dataRoot: root,
        issueBody: JSON.stringify({ author: 'alice', slug: 'demo' }),
        issueAuthor: 'alice',
      });
      assert.equal(r.ok, true);
      assert.equal(r.setupRemoved, true);
      assert.equal(r.bundleRemoved, true);
      const remainingBundles = await readdir(bundlesDir);
      assert.equal(remainingBundles.length, 0);
    } finally { await rm(root, { recursive: true }); }
  });
});
