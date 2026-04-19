import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const VALID = {
  schemaVersion: '1.0.0',
  id: { author: 'alice', slug: 'my-setup' },
  version: 1,
  title: 'T',
  description: 'D',
  tags: ['python'],
  author: { handle: 'alice', url: 'https://github.com/alice' },
  createdAt: '2026-04-19T00:00:00Z',
  license: 'MIT',
  plugins: [],
  marketplaces: [],
  mcpServers: [],
  specialties: ['backend'],
  bundle: { present: false },
};

describe('validateDescriptor (registry-side)', () => {
  it('accepts a well-formed descriptor', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await validate(VALID);
  });

  it('rejects missing schemaVersion', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    const bad = { ...VALID }; delete bad.schemaVersion;
    await assert.rejects(async () => await validate(bad), /schemaVersion/i);
  });

  it('rejects unsupported major schemaVersion', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate({ ...VALID, schemaVersion: '99.0.0' }), /unsupported/i);
  });

  it('rejects invalid slug', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate({ ...VALID, id: { author: 'a', slug: 'BAD slug' } }), /slug/i);
  });

  it('rejects author handle mismatch with issue author param', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate(VALID, { issueAuthor: 'someone-else' }), /author.*match/i);
  });

  it('accepts when author handle matches issue author', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await validate(VALID, { issueAuthor: 'alice' });
  });
});

describe('validateDescriptor — specialties', () => {
  const VALID = {
    schemaVersion: '1.0.0',
    id: { author: 'a', slug: 'ok' },
    version: 1, title: 'T', description: 'D', tags: ['x'],
    author: { handle: 'a', url: 'https://github.com/a' },
    createdAt: '2026-04-19T00:00:00Z', license: 'MIT',
    plugins: [], marketplaces: [], mcpServers: [],
    bundle: { present: false },
  };

  it('accepts 1-3 specialties from the known list', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await validate({ ...VALID, specialties: ['backend'] });
    await validate({ ...VALID, specialties: ['backend', 'devops', 'data-engineer'] });
  });

  it('rejects missing specialties', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate(VALID), /specialties/);
  });

  it('rejects more than 3', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate({ ...VALID, specialties: ['a','b','c','d'] }), /at most 3|too many/i);
  });

  it('rejects unknown key', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    await assert.rejects(async () => await validate({ ...VALID, specialties: ['ninja-rockstar'] }), /unknown/i);
  });
});
