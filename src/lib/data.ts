import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { ensureSeeded } from './seed';
import { getCurrentUser } from './auth';
export { dateKey, shiftDate } from './seed';
export { calculateTable, playerStats, positionLabels, statusLabels, arabicDate, arabicTime, getTeam, getPlayer } from './stats';
export type { TeamStats, PlayerStats } from './stats';
export type Team = typeof s.teams.$inferSelect;
export type Player = typeof s.players.$inferSelect;
export type Match = typeof s.matches.$inferSelect;
export type Tournament = typeof s.tournaments.$inferSelect;
export type Lineup = typeof s.lineups.$inferSelect;
export type Season = typeof s.seasons.$inferSelect;
export type NewsItem = typeof s.news.$inferSelect;
export type Post = typeof s.posts.$inferSelect;
export type Story = typeof s.stories.$inferSelect;
export type Profile = { id: number; name: string; username: string; avatar: string; bio: string; socials: Record<string, string>; verified: boolean; role: string; teamId: number | null; showFollowers: boolean; createdAt: string; badge: string; badgeTeamId: number | null; permissions: Record<string, boolean>; verifiedAt: string | null; verifiedNote: string; verifiedByName: string | null };

const teamsSafeSelect = () => db.select({
  id: s.teams.id, name: s.teams.name, shortName: s.teams.shortName,
  neighborhood: s.teams.neighborhood, founded: s.teams.founded,
  stadium: s.teams.stadium, manager: s.teams.manager, color: s.teams.color,
  awayColor: s.teams.awayColor, emblem: s.teams.emblem, bio: s.teams.bio,
  achievements: s.teams.achievements,
  logo: sql<string>`case when length(${s.teams.logo}) > 2000 then '' else ${s.teams.logo} end`.as('logo'),
  approved: s.teams.approved, views: s.teams.views,
}).from(s.teams);

async function loadCore() {
  await ensureSeeded();
  const [teams, players, tournaments, matches, events, lineups, news, gallery, comments, polls, pollVotes, motmVotes, referees, careers, users, invites, seasons, settingsRow, me] = await Promise.all([
    teamsSafeSelect(), db.select().from(s.players), db.select().from(s.tournaments), db.select().from(s.matches), db.select().from(s.matchEvents), db.select().from(s.lineups),

    db.select().from(s.news).orderBy(desc(s.news.createdAt)), db.select().from(s.gallery), db.select().from(s.comments).orderBy(desc(s.comments.createdAt)), db.select().from(s.polls),
    db.select().from(s.pollVotes), db.select().from(s.motmVotes), db.select().from(s.referees), db.select().from(s.careers), db.select().from(s.users), db.select().from(s.invites),
    db.select().from(s.seasons).orderBy(desc(s.seasons.createdAt)), db.select().from(s.siteSettings).limit(1), getCurrentUser(),
  ]);
  const isSuper = me?.role === 'super';
  const [postRows, interactionRows, storyRows, highlightRows, noteRows, followRows, requestRows, conversationRows, memberRows, messageRows, readRows, notificationRows, announcementRows, pinRows, typingRows] = await Promise.all([
    db.select().from(s.posts).orderBy(desc(s.posts.createdAt)), db.select().from(s.interactions),
    db.select().from(s.stories).orderBy(desc(s.stories.createdAt)), db.select().from(s.highlights).orderBy(desc(s.highlights.createdAt)),
    db.select().from(s.notes), db.select().from(s.follows), db.select().from(s.friendRequests),
    db.select().from(s.conversations), db.select().from(s.conversationMembers),
    db.select().from(s.messages).orderBy(desc(s.messages.id)), db.select().from(s.messageReads),
    me ? db.select().from(s.notifications).where(eq(s.notifications.userId, me.id)).orderBy(desc(s.notifications.createdAt)).limit(isSuper ? 200 : 80) : Promise.resolve([] as (typeof s.notifications.$inferSelect)[]),
    db.select().from(s.announcements),
    db.select().from(s.pinnedMessages), db.select().from(s.typingSignals).where(sql`${s.typingSignals.at} > now() - interval '8 seconds'`),
  ]);
  const now = Date.now();
  const settings = settingsRow[0];
  const moderation = settings?.moderation ?? { posts: false, stories: false, comments: true };
  const privacy = settings?.privacy ?? { followerLists: 'logged' as const };

  const myFollowers = new Set(followRows.filter(f => f.followingId === me?.id).map(f => f.followerId));
  const friendIds = followRows.filter(f => f.followerId === me?.id)
    .flatMap(f => followRows.some(x => x.followerId === f.followingId && x.followingId === me!.id) ? [f.followingId] : []);
  const visiblePost = (p: (typeof s.posts.$inferSelect)) => {
    if (p.status !== 'approved' && !(me && (me.id === p.userId || isSuper))) return false;
    if (!me || p.userId === me.id || isSuper || p.privacy === 'public') return true;
    if (p.privacy === 'followers') return myFollowers.has(p.userId);
    if (p.privacy === 'friends') return friendIds.includes(p.userId);
    if (p.privacy === 'specific') return p.audience.includes(me.id);
    if (p.privacy === 'exclude') return !p.audience.includes(me.id);
    return true;
  };
  const visibleStories = storyRows.filter(x => x.expiresAt.getTime() > now && (x.status === 'approved' || me?.id === x.userId || isSuper));
  const myConversationIds = me ? memberRows.filter(m => m.userId === me.id).map(m => m.conversationId) : [];
  const myMessages = messageRows.filter(m => myConversationIds.includes(m.conversationId));

  const unreadConversations: Record<string, number> = {};
  if (me) for (const cid of myConversationIds) {
    const mine = memberRows.find(x => x.conversationId === cid && x.userId === me.id);
    const since = mine?.lastReadAt ? new Date(mine.lastReadAt).getTime() : 0;
    unreadConversations[cid] = myMessages.filter(m => m.conversationId === cid && m.userId !== me.id && new Date(m.createdAt).getTime() > since).length;
  }
  // Snapchat-style streaks: consecutive days (ending today or yesterday) with messages from both sides.
  const streaks: Record<string, number> = {};
  for (const cid of myConversationIds) {
    const participants = new Set(myMessages.filter(m => m.conversationId === cid).map(m => m.userId));
    if (participants.size !== 2) continue;
    const days = new Map<string, Set<number>>();
    myMessages.filter(m => m.conversationId === cid).forEach(m => {
      const d = new Date(m.createdAt); const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!days.has(key)) days.set(key, new Set());
      days.get(key)!.add(m.userId);
    });
    let streak = 0; const cursor = new Date();
    for (let i = 0; i < 400; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (days.get(key)?.size === participants.size) streak++;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    streaks[cid] = streak;
  }
  const profiles: Profile[] = users.map(u => ({ id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio, socials: u.socials, verified: u.verified, role: u.role, teamId: u.teamId, showFollowers: u.showFollowers, createdAt: u.createdAt.toISOString(), badge: u.badge, badgeTeamId: u.badgeTeamId, permissions: u.permissions,
    verifiedAt: u.verifiedAt ? u.verifiedAt.toISOString() : null, verifiedNote: u.verifiedNote,
    verifiedByName: u.verifiedById ? (users.find(x => x.id === u.verifiedById)?.name || null) : null }));
  const followersOf: Record<string, number[]> = {}; const followingOf: number[] = [];
  followRows.forEach(f => { (followersOf[f.followingId] ||= []).push(f.followerId); if (f.followerId === me?.id) followingOf.push(f.followingId); });

  return {
    teams, players, tournaments, matches, events, lineups, news, gallery,
    comments: comments.filter(c => c.status === 'approved' || (me && (me.id === c.userId || isSuper))),
    polls, pollVotes: pollVotes.map(({ pollId, optionId }) => ({ pollId, optionId })), motmVotes: motmVotes.map(({ matchId, playerId }) => ({ matchId, playerId })),
    referees: referees.map(r => ({ ...r, phone: isSuper || r.userId === me?.id ? r.phone : '' })), careers,
    users: isSuper ? users.map(({ passwordHash: _passwordHash, authId: _authId, ...u }) => u) : [],
    invites: isSuper ? invites : [], seasons,
    social: settings?.social ?? {}, labels: settings?.labels ?? {}, moderation, privacy,
    posts: postRows.filter(visiblePost), interactions: interactionRows,
    stories: visibleStories, highlights: highlightRows, notes: noteRows.filter(n => n.expiresAt.getTime() > now),
    follows: followRows.map(f => ({ followerId: f.followerId, followingId: f.followingId })),
    requests: isSuper ? requestRows : requestRows.filter(r => r.toId === me?.id || r.fromId === me?.id),
    conversations: conversationRows.filter(c => myConversationIds.includes(c.id) || isSuper),
    members: memberRows.filter(m => myConversationIds.includes(m.conversationId) || isSuper),
    messages: myMessages.slice(0, 400), reads: readRows.filter(r => myMessages.some(m => m.id === r.messageId)),
    notifications: notificationRows, announcements: announcementRows.filter(a => a.active),
    branding: settings?.branding ?? {},
    pins: pinRows, typing: typingRows.map(t => ({ conversationId: t.conversationId, userId: t.userId })),
    profiles, followersOf, followingOf, myConversationIds, streaks, unreadConversations, friendIds,
    pending: { posts: postRows.filter(p => p.status === 'pending'), stories: storyRows.filter(x => x.status === 'pending'), comments: comments.filter(c => c.status === 'pending') },
    ownerExists: users.length > 0, me,
    myProfile: me ? { id: me.id, name: me.name, username: me.username, avatar: me.avatar, bio: '', socials: {}, verified: me.verified, role: me.role, teamId: me.teamId, showFollowers: true, createdAt: '' } : null,
  };
}

type Core = Awaited<ReturnType<typeof loadCore>>;
export type Snapshot = Core & { dbError: string | null };

const blankCore = (dbError: string): Snapshot => ({
  teams: [], players: [], tournaments: [], matches: [], events: [], lineups: [], news: [], gallery: [], comments: [],
  polls: [], pollVotes: [], motmVotes: [], referees: [], careers: [], users: [], invites: [], seasons: [],
  social: {}, labels: {}, moderation: { posts: false, stories: false, comments: true }, privacy: { followerLists: 'logged' },
  posts: [], interactions: [], stories: [], highlights: [], notes: [], follows: [], requests: [],
  conversations: [], members: [], messages: [], reads: [], notifications: [], announcements: [],
  profiles: [], followersOf: {}, followingOf: [], myConversationIds: [], streaks: {}, unreadConversations: {}, friendIds: [], myProfile: null,
  branding: {}, pins: [], typing: [],
  pending: { posts: [], stories: [], comments: [] }, ownerExists: false, me: null, dbError,
} as unknown as Snapshot);

/**
 * A missing/unreachable database must never crash the site into a generic
 * "server error" page — we return an empty snapshot plus `dbError` so the UI
 * can explain and fix the deployment while every page stays renderable.
 */
const loadSnapshot = async (): Promise<Snapshot> => {
  try {
    return { ...(await loadCore()), dbError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[manar] database unavailable:', message);
    return blankCore(message.slice(0, 300));
  }
};
export async function getSnapshot() { return loadSnapshot(); }
