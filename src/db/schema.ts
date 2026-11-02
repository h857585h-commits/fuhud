import { pgTable, integer, text, boolean, timestamp, jsonb, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// ─── Core football domain ───
export const teams = pgTable('teams', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  name: text().notNull(), shortName: text().notNull(), neighborhood: text().notNull(),
  founded: integer().notNull().default(2020), stadium: text().notNull(), manager: text().notNull(),
  color: text().notNull().default('#63dda2'), awayColor: text().notNull().default('#ffffff'),
  emblem: text().notNull().default('shield'), bio: text().notNull().default(''),
  achievements: jsonb('achievements').$type<string[]>().notNull().default([]),
  logo: text().notNull().default(''), approved: boolean().notNull().default(false), views: integer().notNull().default(0),
});
export const players = pgTable('players', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), teamId: integer().references(() => teams.id, { onDelete: 'cascade' }),
  name: text().notNull(), age: integer().notNull(), position: text().notNull(), number: integer().notNull(),
  photo: text().notNull().default(''), bio: text().notNull().default(''),
});
export const careers = pgTable('careers', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), playerId: integer().notNull().references(() => players.id, { onDelete: 'cascade' }),
  teamName: text().notNull(), fromYear: integer().notNull(), toYear: integer(),
});
export const tournaments = pgTable('tournaments', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), name: text().notNull(),
  format: text().notNull().default('league'), season: text().notNull().default('2026'),
  teamIds: jsonb('team_ids').$type<number[]>().notNull().default([]), status: text().notNull().default('active'),
  startDate: text().notNull(), description: text().notNull().default(''),
  sourceTournamentId: integer(), qualifiers: integer().notNull().default(0),
  qualificationRule: text().notNull().default('top'), seasonLabel: text().notNull().default(''),
});
export const seasons = pgTable('seasons', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), name: text().notNull(), description: text().notNull().default(''),
  active: boolean().notNull().default(false),
  summary: jsonb().$type<{ tournament: string; format: string; champion: string; table: { rank: number; team: string; played: number; points: number; gd: number }[]; scorers: { name: string; goals: number }[]; matches: number }[]>().notNull().default([]),
  createdAt: timestamp().notNull().defaultNow(),
});
export const matches = pgTable('matches', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), homeId: integer().notNull().references(() => teams.id, { onDelete: 'cascade' }),
  awayId: integer().notNull().references(() => teams.id, { onDelete: 'cascade' }), tournamentId: integer().references(() => tournaments.id, { onDelete: 'cascade' }),
  date: text().notNull(), time: text().notNull(), stadium: text().notNull(), referee: text().notNull().default(''),
  status: text().notNull().default('scheduled'), homeScore: integer().notNull().default(0), awayScore: integer().notNull().default(0),
  minute: integer().notNull().default(0), penaltyHome: integer(), penaltyAway: integer(), round: text().notNull().default(''), stage: text().notNull().default('league'),
  group: text().notNull().default(''), bracketSlot: integer(), refereeId: integer(), report: text().notNull().default(''), views: integer().notNull().default(0),
});
export const matchEvents = pgTable('match_events', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), matchId: integer().notNull().references(() => matches.id, { onDelete: 'cascade' }),
  teamId: integer().notNull().references(() => teams.id), playerId: integer().references(() => players.id, { onDelete: 'set null' }),
  assistId: integer().references(() => players.id, { onDelete: 'set null' }), type: text().notNull(), minute: integer().notNull(),
});
export const lineups = pgTable('lineups', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), matchId: integer().notNull().references(() => matches.id, { onDelete: 'cascade' }),
  teamId: integer().notNull().references(() => teams.id, { onDelete: 'cascade' }), formation: text().notNull().default('4-3-3'),
  published: boolean().notNull().default(false),
  positions: jsonb().$type<{ playerId: number; x: number; y: number }[]>().notNull().default([]),
}, t => [uniqueIndex('lineup_match_team').on(t.matchId, t.teamId)]);
export const news = pgTable('news', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), title: text().notNull(), excerpt: text().notNull(), body: text().notNull(),
  image: text().notNull(), category: text().notNull(), teamId: integer().references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(), views: integer().notNull().default(0),
});
export const gallery = pgTable('gallery', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), teamId: integer().notNull().references(() => teams.id, { onDelete: 'cascade' }),
  type: text().notNull().default('image'), url: text().notNull(), caption: text().notNull(),
});
export const polls = pgTable('polls', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), question: text().notNull(), description: text().notNull().default(''),
  active: boolean().notNull().default(true), options: jsonb().$type<{ id: number; label: string; votes: number }[]>().notNull().default([]),
});
export const pollVotes = pgTable('poll_votes', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), pollId: integer().notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId: integer().notNull(), voterId: text().notNull(),
}, t => [uniqueIndex('poll_voter').on(t.pollId, t.voterId)]);
export const motmVotes = pgTable('motm_votes', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), matchId: integer().notNull().references(() => matches.id, { onDelete: 'cascade' }),
  playerId: integer().notNull().references(() => players.id, { onDelete: 'cascade' }), voterId: text().notNull(),
}, t => [uniqueIndex('motm_voter').on(t.matchId, t.voterId)]);

// ─── Accounts, roles & moderation ───
export const users = pgTable('users', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), name: text().notNull(), email: text().notNull().unique(),
  username: text().notNull().default('').unique(), passwordHash: text().notNull().default(''), authId: uuid().unique(),
  role: text().notNull().default('fan'), teamId: integer().references(() => teams.id, { onDelete: 'cascade' }),
  avatar: text().notNull().default(''), bio: text().notNull().default(''),
  socials: jsonb().$type<Record<string, string>>().notNull().default({}),
  verified: boolean().notNull().default(false), banned: boolean().notNull().default(false),
  restrictedUntil: timestamp(), mutedUntil: timestamp(), showFollowers: boolean().notNull().default(true),
  badge: text().notNull().default(''), badgeTeamId: integer(),
  verifiedAt: timestamp(), verifiedNote: text().notNull().default(''), verifiedById: integer(),
  permissions: jsonb().$type<Record<string, boolean>>().notNull().default({}),
  preferences: jsonb().$type<{ favoriteTeams: number[]; favoritePlayers: number[]; settings: Record<string, boolean | string> }>().notNull().default({ favoriteTeams: [], favoritePlayers: [], settings: {} }),
  createdAt: timestamp().notNull().defaultNow(),
});
export const sessions = pgTable('sessions', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), tokenHash: text().notNull().unique(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp().notNull(),
});
export const invites = pgTable('invites', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), token: text().notNull().unique(), teamId: integer().notNull().references(() => teams.id, { onDelete: 'cascade' }),
  used: boolean().notNull().default(false), expiresAt: timestamp().notNull(),
});
export const referees = pgTable('referees', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), name: text().notNull(), phone: text().notNull().default(''),
  userId: integer().unique().references(() => users.id, { onDelete: 'set null' }),
  photo: text().notNull().default(''), badgeNumber: text().notNull().default(''),
  officialStatus: text().notNull().default('official'), leagueName: text().notNull().default('دوري الناصرية الشعبي'),
});
export const announcements = pgTable('announcements', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), text: text().notNull(), active: boolean().notNull().default(true),
  tone: text().notNull().default('gold'), createdAt: timestamp().notNull().defaultNow(),
});
export const siteSettings = pgTable('site_settings', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  social: jsonb('social').$type<Record<string, { url: string; handle: string }>>().notNull().default({}),
  labels: jsonb('labels').$type<Record<string, string>>().notNull().default({}),
  moderation: jsonb('moderation').$type<{ posts: boolean; stories: boolean; comments: boolean }>().notNull().default({ posts: false, stories: false, comments: true }),
  privacy: jsonb('privacy').$type<{ followerLists: 'public' | 'logged' | 'self' }>().notNull().default({ followerLists: 'logged' }),
  branding: jsonb('branding').$type<Record<string, string>>().notNull().default({}),
});

// ─── Social layer (الساحة) ───
export const posts = pgTable('posts', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text().notNull().default('text'), body: text().notNull().default(''),
  mediaType: text().notNull().default(''), mediaUrl: text().notNull().default(''),
  mediaUrls: jsonb('media_urls').$type<string[]>().notNull().default([]),
  hashtags: jsonb().$type<string[]>().notNull().default([]),
  pollOptions: jsonb().$type<{ id: number; label: string; votes: number }[]>().notNull().default([]),
  pollVoters: jsonb().$type<Record<string, number>>().notNull().default({}),
  privacy: text().notNull().default('public'), audience: jsonb('audience').$type<number[]>().notNull().default([]),
  teamId: integer(), matchId: integer(), repostOf: integer(),
  status: text().notNull().default('approved'), editedAt: timestamp(), createdAt: timestamp().notNull().defaultNow(),
  views: integer().notNull().default(0),
});
export const comments = pgTable('comments', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), targetType: text().notNull(), targetId: integer().notNull(),
  name: text().notNull(), body: text().notNull(), status: text().notNull().default('pending'),
  userId: integer().references(() => users.id, { onDelete: 'cascade' }),
  mediaUrl: text().notNull().default(''), parentId: integer(), editedAt: timestamp(), createdAt: timestamp().notNull().defaultNow(),
});
export const interactions = pgTable('interactions', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), targetType: text().notNull(), targetId: integer().notNull(),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), kind: text().notNull(), createdAt: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('interaction_unique').on(t.targetType, t.targetId, t.userId, t.kind)]);
export const stories = pgTable('stories', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text().notNull().default('image'), url: text().notNull(), caption: text().notNull().default(''),
  durationHours: integer().notNull().default(24), viewers: jsonb().$type<number[]>().notNull().default([]),
  archived: boolean().notNull().default(false), status: text().notNull().default('approved'),
  createdAt: timestamp().notNull().defaultNow(), expiresAt: timestamp().notNull(),
});
export const highlights = pgTable('highlights', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text().notNull(), coverUrl: text().notNull().default(''), storyIds: jsonb().$type<number[]>().notNull().default([]),
  createdAt: timestamp().notNull().defaultNow(),
});
export const notes = pgTable('notes', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text().notNull(), durationHours: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(), expiresAt: timestamp().notNull(),
});
export const follows = pgTable('follows', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), followerId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), createdAt: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('follow_unique').on(t.followerId, t.followingId)]);
export const friendRequests = pgTable('friend_requests', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), fromId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  toId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), status: text().notNull().default('pending'),
  createdAt: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('friend_req_unique').on(t.fromId, t.toId)]);
export const conversations = pgTable('conversations', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), kind: text().notNull().default('direct'),
  title: text().notNull().default(''), description: text().notNull().default(''), avatarUrl: text().notNull().default(''),
  ownerId: integer().references(() => users.id, { onDelete: 'cascade' }), inviteToken: text().notNull().default(''),
  poll: jsonb().$type<{ question: string; options: { id: number; label: string; votes: number[] }[] } | null>(),
  createdAt: timestamp().notNull().defaultNow(),
});
export const conversationMembers = pgTable('conversation_members', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), conversationId: integer().notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), role: text().notNull().default('member'),
  lastReadAt: timestamp().notNull().defaultNow(), joinedAt: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('conv_member_unique').on(t.conversationId, t.userId)]);
export const messages = pgTable('messages', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), conversationId: integer().notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text().notNull().default(''), mediaType: text().notNull().default(''), mediaUrl: text().notNull().default(''),
  replyTo: integer(), editedAt: timestamp(), createdAt: timestamp().notNull().defaultNow(),
});
export const messageReads = pgTable('message_reads', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), messageId: integer().notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), readAt: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('msg_read_unique').on(t.messageId, t.userId)]);
export const typingSignals = pgTable('typing_signals', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), conversationId: integer().notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }), at: timestamp().notNull().defaultNow(),
}, t => [uniqueIndex('typing_unique').on(t.conversationId, t.userId)]);
export const notifications = pgTable('notifications', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: integer().references(() => users.id, { onDelete: 'cascade' }), kind: text().notNull(),
  text: text().notNull(), href: text().notNull().default('/'), read: boolean().notNull().default(false), createdAt: timestamp().notNull().defaultNow(),
});
export const pinnedMessages = pgTable('pinned_messages', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(), conversationId: integer().notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  messageId: integer().notNull().references(() => messages.id, { onDelete: 'cascade' }),
}, t => [uniqueIndex('pin_unique').on(t.conversationId, t.messageId)]);
