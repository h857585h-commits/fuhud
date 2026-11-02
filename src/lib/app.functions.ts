import { createServerFn } from '@tanstack/react-start';

/** Full site snapshot for the current visitor (anonymous or signed in). */
export const fetchSnapshot = createServerFn({ method: 'POST' }).handler(async () => {
  const { getSnapshot } = await import('@/lib/data');
  return getSnapshot();
});

/** Runs one app action (same contract as the original /api/action endpoint). */
export const runAction = createServerFn({ method: 'POST' })
  .inputValidator((input: { action: string; payload?: Record<string, unknown> }) => {
    if (!input || typeof input.action !== 'string' || input.action.length > 60) throw new Error('طلب غير صالح');
    return { action: input.action, payload: input.payload && typeof input.payload === 'object' ? input.payload : {} };
  })
  .handler(async ({ data }) => {
    const { POST } = await import('@/lib/action-handler');
    const response = await POST({ json: async () => data, headers: new Headers() });
    // JSON string keeps the exact wire format the original fetch('/api/action') produced.
    return JSON.stringify(response);
  });

/** Public invite lookup used by the team-admin invite page. */
export const fetchInvite = createServerFn({ method: 'GET' })
  .inputValidator((token: string) => String(token || '').slice(0, 100))
  .handler(async ({ data: token }) => {
    const { eq } = await import('drizzle-orm');
    const { db } = await import('@/db');
    const { invites, teams } = await import('@/db/schema');
    const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
    const team = invite ? await db.select().from(teams).where(eq(teams.id, invite.teamId)).limit(1) : [];
    return { teamName: team[0]?.name || 'الفريق', valid: !!invite && !invite.used && invite.expiresAt > new Date() };
  });
