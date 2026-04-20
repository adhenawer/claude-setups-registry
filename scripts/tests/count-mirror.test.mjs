import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function makeFake(descriptor = { mirrors: 0 }) {
  const root = await mkdtemp(join(tmpdir(), 'cs-cm-'));
  const dir = join(root, 'setups', 'alice');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'demo.json'), JSON.stringify({
    schemaVersion: '1.0.0',
    id: { author: 'alice', slug: 'demo' },
    title: 'Demo',
    ...descriptor,
  }));
  return root;
}

describe('countMirror', () => {
  it('increments mirrors from 0 to 1', async () => {
    const { countMirror } = await import('../count-mirror.mjs');
    const root = await makeFake();
    try {
      const r = await countMirror({
        dataRoot: root,
        issueBody: JSON.stringify({ target: { author: 'alice', slug: 'demo' } }),
      });
      assert.equal(r.ok, true);
      assert.equal(r.mirrors, 1);
      const d = JSON.parse(await readFile(join(root, 'setups/alice/demo.json'), 'utf-8'));
      assert.equal(d.mirrors, 1);
    } finally { await rm(root, { recursive: true }); }
  });

  it('increments existing counter', async () => {
    const { countMirror } = await import('../count-mirror.mjs');
    const root = await makeFake({ mirrors: 7 });
    try {
      const r = await countMirror({
        dataRoot: root,
        issueBody: JSON.stringify({ target: { author: 'alice', slug: 'demo' } }),
      });
      assert.equal(r.mirrors, 8);
    } finally { await rm(root, { recursive: true }); }
  });

  it('fails when setup does not exist', async () => {
    const { countMirror } = await import('../count-mirror.mjs');
    const root = await makeFake();
    try {
      const r = await countMirror({
        dataRoot: root,
        issueBody: JSON.stringify({ target: { author: 'alice', slug: 'nope' } }),
      });
      assert.equal(r.ok, false);
      assert.match(r.reason, /not found/i);
    } finally { await rm(root, { recursive: true }); }
  });

  it('fails on invalid JSON', async () => {
    const { countMirror } = await import('../count-mirror.mjs');
    const r = await countMirror({ dataRoot: '/tmp', issueBody: 'not json' });
    assert.equal(r.ok, false);
    assert.match(r.reason, /invalid JSON/i);
  });

  it('fails when target.author or target.slug is missing', async () => {
    const { countMirror } = await import('../count-mirror.mjs');
    const r = await countMirror({
      dataRoot: '/tmp',
      issueBody: JSON.stringify({ target: { author: 'alice' } }),
    });
    assert.equal(r.ok, false);
    assert.match(r.reason, /missing/i);
  });
});
