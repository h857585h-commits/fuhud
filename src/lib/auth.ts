import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { getRequestHeader } from '@tanstack/react-start/server';
import { db } from '@/db';
import * as s from '@/db/schema';

const fields = { id: s.users.id, name: s.users.name, role: s.users.role, teamId: s.users.teamId, email: s.users.email, username: s.users.username, avatar: s.users.avatar, verified: s.users.verified, badge: s.users.badge, badgeTeamId: s.users.badgeTeamId, permissions: s.users.permissions, preferences: s.users.preferences, bio: s.users.bio, socials: s.users.socials, showFollowers: s.users.showFollowers, restrictedUntil: s.users.restrictedUntil, mutedUntil: s.users.mutedUntil, banned: s.users.banned };

type AuthIdentity = { id: string; email: string; emailConfirmed: boolean; name: string; invite: string };

/** Verifies the Lovable Cloud bearer token sent by the browser. */
export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  let header: string | undefined;
  try { header = getRequestHeader('authorization') || undefined; } catch { return null; }
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const u = data.user; const meta = (u.user_metadata || {}) as Record<string, unknown>;
  return { id: u.id, email: (u.email || '').toLowerCase().trim(), emailConfirmed: !!u.email_confirmed_at, name: String(meta.name || meta.full_name || '').slice(0, 70), invite: typeof meta.invite === 'string' ? meta.invite : '' };
}

const usernameFor = (email: string) => `${(email.split('@')[0] || '').replace(/[^a-z0-9_.]/gi, '').slice(0, 20).toLowerCase() || 'fan'}.${randomBytes(2).toString('hex')}`;

/**
 * Maps the signed-in Lovable Cloud account to the app's user row:
 * 1. already linked → that row;
 * 2. imported user (same verified email, not yet linked) → link once, keeping their profile and data;
 * 3. otherwise create a row (first account ever becomes the owner; a valid invite grants team-admin).
 */
export async function getCurrentUser() {
  const identity = await getAuthIdentity();
  if (!identity) return null;
  const [linked] = await db.select(fields).from(s.users).where(eq(s.users.authId, identity.id)).limit(1);
  if (linked) return linked;
  if (!identity.emailConfirmed || !identity.email) return null;
  const [imported] = await db.select({ id: s.users.id }).from(s.users).where(and(sql`lower(${s.users.email}) = ${identity.email}`, isNull(s.users.authId))).limit(1);
  if (imported) {
    await db.update(s.users).set({ authId: identity.id }).where(and(eq(s.users.id, imported.id), isNull(s.users.authId)));
  } else {
    const [taken] = await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = ${identity.email}`).limit(1);
    if (taken) return null; // email already linked to another sign-in; never merge silently
    const [any] = await db.select({ id: s.users.id }).from(s.users).limit(1);
    let role = any ? 'fan' : 'super'; let teamId: number | undefined;
    if (identity.invite && any) {
      const [invite] = await db.update(s.invites).set({ used: true }).where(and(eq(s.invites.token, identity.invite), eq(s.invites.used, false), gt(s.invites.expiresAt, new Date()))).returning();
      if (invite) { role = 'team'; teamId = invite.teamId; }
    }
    await db.insert(s.users).values({ name: identity.name || identity.email.split('@')[0], email: identity.email, username: usernameFor(identity.email), role, teamId, authId: identity.id }).onConflictDoNothing();
  }
  const [row] = await db.select(fields).from(s.users).where(eq(s.users.authId, identity.id)).limit(1);
  return row || null;
}
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Deletes the Lovable Cloud sign-in that belongs to an app user (used on account deletion). */
export async function deleteAuthAccount() {
  const identity = await getAuthIdentity(); if (!identity) return;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  await supabaseAdmin.auth.admin.deleteUser(identity.id);
}

/** Admin-created sign-in (e.g. referee accounts made from the dashboard). Already confirmed. */
export async function createAuthAccount(email: string, password: string, name: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error || !data.user) throw new Error(error?.message?.includes('registered') ? 'هذا البريد مستخدم في حساب آخر' : 'تعذّر إنشاء حساب الحكم');
  return data.user.id;
}
