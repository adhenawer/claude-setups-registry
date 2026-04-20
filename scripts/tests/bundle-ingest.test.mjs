import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = {
  schemaVersion: '1.0.0',
  id: { author: 'alice', slug: 'demo' },
  version: 1,
  title: 'T', description: 'D', tags: ['x'],
  author: { handle: 'alice', url: 'https://github.com/alice' },
  createdAt: '2026-04-19T00:00:00Z', license: 'MIT',
  plugins: [], marketplaces: [], mcpServers: [],
  specialties: ['backend'],
};

describe('validate with bundle', () => {
  it('accepts bundle.present=false (no bundle fields needed)', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.doesNotReject(
      validate({ ...BASE, bundle: { present: false } })
    );
  });

  it('requires bundle.sha256, bundle.files, bundle.pendingBranch when present', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(
      validate({ ...BASE, bundle: { present: true } }),
      /bundle\.sha256|bundle\.files|pendingBranch/
    );
  });

  it('rejects bundle.files[] with absolute paths', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(
      validate({
        ...BASE,
        bundle: {
          present: true,
          sha256: 'x', pendingBranch: 'bundle/x',
          files: [{ path: '/etc/passwd', size: 1, sha256: 'x' }],
        },
      }),
      /absolute/i
    );
  });

  it('rejects bundle.files[] with ".." traversal', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(
      validate({
        ...BASE,
        bundle: {
          present: true,
          sha256: 'x', pendingBranch: 'bundle/x',
          files: [{ path: '../etc/passwd', size: 1, sha256: 'x' }],
        },
      }),
      /traversal|\.\./
    );
  });

  it('rejects bundle.files[] referencing settings.json or .claude.json', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(
      validate({
        ...BASE,
        bundle: {
          present: true,
          sha256: 'x', pendingBranch: 'bundle/x',
          files: [{ path: 'settings.json', size: 1, sha256: 'x' }],
        },
      }),
      /settings\.json/
    );

    await assert.rejects(
      validate({
        ...BASE,
        bundle: {
          present: true,
          sha256: 'x', pendingBranch: 'bundle/x',
          files: [{ path: '.claude.json', size: 1, sha256: 'x' }],
        },
      }),
      /\.claude\.json/
    );
  });

  it('accepts files under hooks/, skills/, commands/, agents/, and root *.md', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.doesNotReject(
      validate({
        ...BASE,
        bundle: {
          present: true, sha256: 'x', pendingBranch: 'bundle/x',
          files: [
            { path: 'hooks/a.sh', size: 1, sha256: 'a' },
            { path: 'CLAUDE.md', size: 1, sha256: 'b' },
            { path: 'skills/x/SKILL.md', size: 1, sha256: 'c' },
            { path: 'commands/y.md', size: 1, sha256: 'd' },
            { path: 'agents/z.md', size: 1, sha256: 'e' },
          ],
        },
      })
    );
  });

  it('rejects files outside allowed prefixes (e.g. projects/, docs/)', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(
      validate({
        ...BASE,
        bundle: {
          present: true, sha256: 'x', pendingBranch: 'bundle/x',
          files: [{ path: 'docs/anything.md', size: 1, sha256: 'x' }],
        },
      }),
      /allowed prefix|disallowed path/i
    );
  });
});
