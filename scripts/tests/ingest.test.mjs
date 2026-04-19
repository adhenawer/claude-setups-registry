import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VALID_BODY = JSON.stringify({
  schemaVersion: '1.0.0',
  id: { author: 'alice', slug: 'my-setup' },
  version: 1,
  title: 'T', description: 'D', tags: ['python'],
  author: { handle: 'alice', url: 'https://github.com/alice' },
  createdAt: '2026-04-19T00:00:00Z', license: 'MIT',
  plugins: [], marketplaces: [], mcpServers: [],
  specialties: ['backend'],
  bundle: { present: false }
}, null, 2);

describe('ingestIssue', () => {
  it('writes descriptor to data/setups/<author>/<slug>.json on success', async () => {
    const { ingestIssue } = await import('../ingest.mjs');
    const dir = await mkdtemp(join(tmpdir(), 'cs-ingest-'));
    try {
      const result = await ingestIssue({
        dataRoot: dir,
        issueBody: VALID_BODY,
        issueAuthor: 'alice',
      });
      assert.equal(result.ok, true);
      const saved = JSON.parse(
        await readFile(join(dir, 'setups/alice/my-setup.json'), 'utf-8')
      );
      assert.equal(saved.id.slug, 'my-setup');
    } finally { await rm(dir, { recursive: true }); }
  });

  it('canonicalizes tags via aliases map', async () => {
    const { ingestIssue } = await import('../ingest.mjs');
    const dir = await mkdtemp(join(tmpdir(), 'cs-ingest-'));
    try {
      const body = JSON.parse(VALID_BODY);
      body.tags = ['py', 'JS', 'unknown-tag'];
      await ingestIssue({
        dataRoot: dir,
        issueBody: JSON.stringify(body),
        issueAuthor: 'alice',
        aliases: { py: 'python', JS: 'javascript' },
      });
      const saved = JSON.parse(
        await readFile(join(dir, 'setups/alice/my-setup.json'), 'utf-8')
      );
      assert.deepEqual(saved.tags.sort(), ['javascript', 'python', 'unknown-tag']);
    } finally { await rm(dir, { recursive: true }); }
  });

  it('returns ok=false + reason when validation fails', async () => {
    const { ingestIssue } = await import('../ingest.mjs');
    const dir = await mkdtemp(join(tmpdir(), 'cs-ingest-'));
    try {
      const r = await ingestIssue({
        dataRoot: dir,
        issueBody: '{}',
        issueAuthor: 'alice',
      });
      assert.equal(r.ok, false);
      assert.match(r.reason, /schemaVersion|validation/i);
    } finally { await rm(dir, { recursive: true }); }
  });
});
