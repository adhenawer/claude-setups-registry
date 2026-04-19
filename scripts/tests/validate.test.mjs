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
  bundle: { present: false },
};

describe('validateDescriptor (registry-side)', () => {
  it('accepts a well-formed descriptor', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    assert.doesNotThrow(() => validate(VALID));
  });

  it('rejects missing schemaVersion', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    const bad = { ...VALID }; delete bad.schemaVersion;
    assert.throws(() => validate(bad), /schemaVersion/i);
  });

  it('rejects unsupported major schemaVersion', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    assert.throws(() => validate({ ...VALID, schemaVersion: '99.0.0' }), /unsupported/i);
  });

  it('rejects invalid slug', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    assert.throws(() => validate({ ...VALID, id: { author: 'a', slug: 'BAD slug' } }), /slug/i);
  });

  it('rejects author handle mismatch with issue author param', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    assert.throws(() => validate(VALID, { issueAuthor: 'someone-else' }), /author.*match/i);
  });

  it('accepts when author handle matches issue author', async () => {
    const { validate } = await import('../validate-descriptor.mjs');
    assert.doesNotThrow(() => validate(VALID, { issueAuthor: 'alice' }));
  });
});
