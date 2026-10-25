// Read only the supported summary and title APIs; never activate agents for listing.
export function createSessionCatalog(ctx) {
  return async function catalog(signal) {
    const controller = new AbortController();
    const stream = ctx.workspaceController.follow(controller.signal);
    let archived;
    try {
      const first = await stream.next();
      if (first.done || first.value.type !== 'baseline') throw new Error('工作区归档状态不可用');
      archived = new Set(first.value.value.archivedSessionIds);
    } finally { controller.abort(); await stream.return(); }
    const ids = [...new Set(ctx.workspaceRegistry.list().flatMap(w => [...w.sessionIds]))];
    const [summaries, records, titles] = await Promise.all([
      ctx.sessionController.list({}, signal ?? new AbortController().signal),
      ctx.sessionQuery.listSessions(signal),
      ctx.sessionQuery.readTitleSnapshots(ids, signal),
    ]);
    const headers = new Map(records.map(r => [r.header.id, r.header]));
    const byId = new Map(summaries.items.map(s => [s.sessionId, s]));
    const titleById = new Map(titles.map(t => [t.sessionId, t]));
    return new Map(ids.map(id => {
      const title = titleById.get(id);
      const header = title?.status === 'fulfilled' ? title.value.session : headers.get(id);
      const summary = byId.get(id);
      if (!header || header.origin === 'subagent') return [id, null];
      return [id, { sessionId: id, title: title?.status === 'fulfilled' ? title.value.title?.title ?? '' : '', path: header.cwd ?? '', createdAt: header.createdAt, updatedAt: summary?.updatedAt ?? header.createdAt, archived: archived.has(id), running: summary?.running ?? false, ...(title?.status === 'rejected' ? { error: String(title.reason?.message ?? title.reason) } : {}) }];
    }).filter(([, value]) => value));
  };
}
