import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionCatalog } from '../src/host/catalog.js';

test('catalog uses baseline archive state, closes observation and excludes child sessions', async () => {
  let closed = false;
  const ctx = {
    workspaceController: { follow: () => ({ next: async () => ({ value: { type: 'baseline', value: { archivedSessionIds: ['b'] } } }), return: async () => { closed = true; } }) },
    workspaceRegistry: { list: () => [{ sessionIds: ['a', 'b', 'child'] }] },
    sessionController: { list: async () => ({ items: [{ sessionId: 'a', updatedAt: 5, running: true }] }) },
    sessionQuery: {
      listSessions: async () => ['a', 'b', 'child'].map(id => ({ header: { id, cwd: '/fixture', createdAt: 1, ...(id === 'child' ? { origin: 'subagent' } : {}) } })),
      readTitleSnapshots: async () => [{ sessionId: 'a', status: 'fulfilled', value: { session: { id: 'a', cwd: '/fixture', createdAt: 1 }, title: { title: 'Alpha' } } }],
    },
  };
  const catalog = await createSessionCatalog(ctx)();
  assert.equal(closed, true);
  assert.equal(catalog.get('a').title, 'Alpha');
  assert.equal(catalog.get('a').running, true);
  assert.equal(catalog.get('a').updatedAt, 5);
  assert.equal(catalog.get('b').archived, true);
  assert.equal(catalog.has('child'), false);
});

test('invalid baseline rejects and still closes observation', async () => {
  let closed = false;
  const catalog = createSessionCatalog({ workspaceController: { follow: () => ({ next: async () => ({ done: true }), return: async () => { closed = true; } }) } });
  await assert.rejects(catalog(), /归档状态/);
  assert.equal(closed, true);
});
