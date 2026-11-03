import { NextResponse, type NextRequest } from '@/lib/next-shims/server';
import { randomBytes } from 'node:crypto';
import { cookies } from '@/lib/next-shims/headers';
import { and, eq, inArray, ne, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { ensureSeeded } from '@/lib/seed';
import { createAuthAccount, deleteAuthAccount, getCurrentUser, type CurrentUser } from '@/lib/auth';
import { calculateTable, playerStats } from '@/lib/stats';
import { handleSocial } from '@/lib/social-api';
import type { Snapshot } from '@/lib/data';

type Payload = Record<string, unknown>;
function text(p: Payload, key: string, max = 500, required = true) { const v = p[key]; if (v === undefined || v === null || v === '') { if (required) throw new Error('يرجى إكمال الحقل المطلوب: ' + key); return ''; } if (typeof v !== 'string' || v.length > max) throw new Error('قيمة غير صالحة أو طويلة جداً: ' + key); const result = v.trim(); if (required && !result) throw new Error('يرجى إكمال الحقل المطلوب'); return result; }
function num(p: Payload, key: string, min: number = 0, max: number = 100000) { const v = Number(p[key]); if (!Number.isInteger(v) || v < min || v > max) throw new Error('يرجى إدخال رقم صحيح: ' + key); return v; }
function ids(p: Payload, key: string, max = 100) { if (!Array.isArray(p[key]) || p[key].some(v => !Number.isInteger(v) || v < 1)) throw new Error('اختيارات غير صالحة'); return [...new Set(p[key] as number[])]; }
function mediaUrl(value: string) { if (!value) return ''; if (!/^(https?:\/\/|\/|data:image\/(png|jpeg|webp);base64,)/i.test(value)) throw new Error('رابط الصورة أو الفيديو غير صالح'); return value; }
const attempts = new Map<string, { count: number; at: number }>();

async function voter() { const jar = await cookies(); let token = jar.get('manar_voter')?.value; if (!token) { token = randomBytes(24).toString('hex'); jar.set('manar_voter', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false', maxAge: 31536000, path: '/' }); } return token; }
async function advanceMatch(matchId: number) {
  const [m] = await db.select().from(s.matches).where(eq(s.matches.id, matchId));
  if (!m || m.status !== 'finished' || !m.tournamentId) return;
  const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, m.tournamentId));
  if (!t || t.format === 'league') return;
  const all = await db.select().from(s.matches).where(eq(s.matches.tournamentId, t.id));
  const teamList = await db.select().from(s.teams);
  if (t.format === 'groups' && m.stage === 'group') {
    const groups = ['المجموعة الأولى', 'المجموعة الثانية'];
    const complete = groups.every(g => all.filter(x => x.stage === 'group' && x.group === g).every(x => x.status === 'finished'));
    if (complete) for (let i = 0; i < 2; i++) {
      const tables = groups.map(g => calculateTable(all, teamList, t.id, g));
      const semi = all.find(x => x.stage === 'semi' && x.bracketSlot === i);
      if (semi && semi.status === 'scheduled') await db.update(s.matches).set({ homeId: tables[i][0].teamId, awayId: tables[1 - i][1].teamId }).where(eq(s.matches.id, semi.id));
    }
    return;
  }
  if (m.stage === 'final') { await db.update(s.tournaments).set({ status: 'finished' }).where(eq(s.tournaments.id, t.id)); return; }
  const winner = m.homeScore > m.awayScore ? m.homeId : m.awayScore > m.homeScore ? m.awayId : (m.penaltyHome ?? 0) > (m.penaltyAway ?? 0) ? m.homeId : m.awayId;
  const stages = t.format === 'groups' ? ['group', 'semi', 'final'] : ['round32', 'round16', 'quarter', 'semi', 'final'];
  const nextStage = stages[stages.indexOf(m.stage) + 1];
  const next = all.find(x => x.stage === nextStage && x.bracketSlot === Math.floor((m.bracketSlot || 0) / 2));
  if (next) await db.update(s.matches).set((m.bracketSlot || 0) % 2 === 0 ? { homeId: winner } : { awayId: winner }).where(eq(s.matches.id, next.id));
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const { action, payload: p = {} } = await request.json() as { action: string; payload: Payload };
    const me = await getCurrentUser();
    // Sign-in, sign-up, sign-out and owner setup run through Lovable Cloud auth in the browser.
    if (['login', 'logout', 'register', 'bootstrap.setup'].includes(action)) throw new Error('العملية تتم عبر نافذة الدخول');
    if (['view.team', 'view.match', 'view.news'].includes(action)) {
      const id = num(p, 'id'); const table = action === 'view.team' ? s.teams : action === 'view.match' ? s.matches : s.news;
      await db.update(table).set({ views: (await import('drizzle-orm')).sql`${table.views} + 1` }).where(eq(table.id, id)); return NextResponse.json({ ok: true });
    }
    if (action === 'comment.add') {
      if (!me) return NextResponse.json({ error: 'سجّل حسابك أولاً ثم شارك رأيك — التعليقات متاحة للأعضاء فقط' }, { status: 401 });
      await db.insert(s.comments).values({ targetType: text(p, 'targetType'), targetId: num(p, 'targetId'), name: me.name, userId: me.id, body: text(p, 'body', 1000), status: 'pending' });
      return NextResponse.json({ ok: true, message: 'استلمنا تعليقك! سيظهر بعد مراجعة إدارة المنار.' });
    }
    if (action === 'poll.vote') {
      const pollId = num(p, 'pollId'), optionId = num(p, 'optionId'), voterId = await voter();
      await db.transaction(async tx => { const [poll] = await tx.select().from(s.polls).where(eq(s.polls.id, pollId)).for('update'); if (!poll?.active || !poll.options.some(o => o.id === optionId)) throw new Error('الاستفتاء غير متاح'); await tx.insert(s.pollVotes).values({ pollId, optionId, voterId }); await tx.update(s.polls).set({ options: poll.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o) }).where(eq(s.polls.id, pollId)); });
      return NextResponse.json({ ok: true, message: 'تم احتساب صوتك. شكراً لمشاركتك!' });
    }
    if (action === 'motm.vote') {
      const matchId = num(p, 'matchId'), playerId = num(p, 'playerId');
      const [m] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)); const [player] = await db.select().from(s.players).where(eq(s.players.id, playerId));
      if (!m || m.status !== 'finished' || !player || ![m.homeId, m.awayId].includes(player.teamId!)) throw new Error('التصويت غير متاح لهذا اللاعب');
      await db.insert(s.motmVotes).values({ matchId, playerId, voterId: await voter() }); return NextResponse.json({ ok: true, message: 'تم تسجيل صوتك لنجم المباراة' });
    }
    if (!me) return NextResponse.json({ error: 'يرجى تسجيل الدخول للمتابعة' }, { status: 401 });
    const superAdmin = me.role === 'super';
    const requireSuper = () => { if (!superAdmin) throw new Error('هذه العملية متاحة لمدير المنصة فقط'); };
    // Granular permissions granted from the developer panel — enforced here, not only in the UI.
    const perms = (me.permissions || {}) as Record<string, boolean>;
    const can = (key: string) => superAdmin || Boolean(perms[key]);
    const allow = (key: string | string[], message?: string) => {
      const keys = Array.isArray(key) ? key : [key];
      if (superAdmin || keys.some(k => perms[k])) return;
      throw new Error(message || 'هذه الميزة غير مُفعّلة في حسابك — اطلبها من إدارة المنصة');
    };
    const officialRefereeOf = async (matchId: number) => {
      if (me.role !== 'referee') return false;
      const [m] = await db.select({ refereeId: s.matches.refereeId }).from(s.matches).where(eq(s.matches.id, matchId));
      if (!m?.refereeId) return false;
      const [r] = await db.select().from(s.referees).where(eq(s.referees.id, m.refereeId));
      return r?.userId === me.id;
    };
    const canOfficiate = async (matchId: number) => superAdmin || await officialRefereeOf(matchId);
    const ownedTeam = (teamId: number) => { if (!superAdmin && (me.role !== 'team' || me.teamId !== teamId)) throw new Error('لا تملك صلاحية إدارة هذا الفريق'); };
    const findTeam = async (id: number) => { const [t] = await db.select().from(s.teams).where(eq(s.teams.id, id)); if (!t) throw new Error('الفريق غير موجود'); return t; };
    const findPlayer = async (id: number) => { const [player] = await db.select().from(s.players).where(eq(s.players.id, id)); if (!player) throw new Error('اللاعب غير موجود'); return player; };
    const findMatch = async (id: number) => { const [m] = await db.select().from(s.matches).where(eq(s.matches.id, id)); if (!m) throw new Error('المباراة غير موجودة'); return m; };
    const socialResponse = await handleSocial(action, p, me);
    if (socialResponse) return socialResponse;
    if (action === 'admin.permissions') {
      requireSuper(); const target = num(p, 'userId', 1);
      const [row] = await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, target));
      if (!row) throw new Error('العضو غير موجود');
      if (row.role === 'super' && target !== me.id) throw new Error('لا يمكن تعديل صلاحيات حساب المالك');
      const { ALL_PERM_KEYS } = await import('@/lib/perms');
      const keep = (await db.select({ permissions: s.users.permissions }).from(s.users).where(eq(s.users.id, target)))[0]?.permissions || {};
      const permissions: Record<string, boolean> = { ...keep };
      for (const key of ALL_PERM_KEYS) if (p[key] !== undefined) permissions[key] = Boolean(p[key]);
      await db.update(s.users).set({ permissions }).where(eq(s.users.id, target));
      return NextResponse.json({ ok: true, message: 'حُدّثت الصلاحيات — تسري على العضو فوراً', permissions });
    }
    if (action === 'admin.badge') {
      allow(['canAssignBadges', 'canVerifyUsers']); const target = num(p, 'userId', 1);
      const { BADGES } = await import('@/lib/perms'); const badge = String(p.badge || '');
      if (badge && !(badge in BADGES)) throw new Error('شارة غير معروفة');
      await db.update(s.users).set({ badge, badgeTeamId: p.badgeTeamId ? num(p, 'badgeTeamId', 1) : null, ...(p.verified !== undefined ? { verified: Boolean(p.verified) } : {}) }).where(eq(s.users.id, target));
      return NextResponse.json({ ok: true, message: badge ? 'أُسندت الشارة للعضو 🎖️' : 'أُزيلت الشارة' });
    }
    if (action === 'admin.preset') {
      requireSuper(); const target = num(p, 'userId', 1); const presetId = String(p.presetId || '');
      const { ROLE_PRESETS } = await import('@/lib/perms'); const preset = ROLE_PRESETS.find(x => x.id === presetId);
      if (!preset) throw new Error('دور غير معروف');
      const permissions = Object.fromEntries(preset.perms.map(k => [k, true]));
      await db.update(s.users).set({ permissions, badge: preset.badge, badgeTeamId: p.badgeTeamId ? num(p, 'badgeTeamId', 1) : null, verified: preset.perms.length > 0 }).where(eq(s.users.id, target));
      return NextResponse.json({ ok: true, message: `طُبِّق دور «${preset.label}» بصلاحياته وشارته` });
    }
    if (action === 'user.preferences') {
      const favoriteTeams = Array.isArray(p.favoriteTeams) ? p.favoriteTeams.map(Number).filter(n => Number.isInteger(n) && n > 0) : [];
      const favoritePlayers = Array.isArray(p.favoritePlayers) ? p.favoritePlayers.map(Number).filter(n => Number.isInteger(n) && n > 0) : [];
      const prefSettings = (p.settings && typeof p.settings === 'object') ? p.settings as Record<string, boolean | string> : {};
      await db.update(s.users).set({ preferences: { favoriteTeams, favoritePlayers, settings: prefSettings } }).where(eq(s.users.id, me.id));
      return NextResponse.json({ ok: true, message: 'حُفظت تفضيلاتك — سنذكّرك بما يعجبك فقط' });
    }
    if (action === 'branding.save') {
      allow('canCustomizeSite');
      const [row] = await db.select().from(s.siteSettings).limit(1);
      const base: Record<string, string> = { ...(row?.branding || {}) };
      for (const [k, v] of Object.entries(p)) {
        if (!k.startsWith('brand_')) continue;
        const key = k.slice(6); const val = typeof v === 'string' ? v.slice(0, 4000) : '';
        if ((key === 'primary' || key === 'secondary' || key === 'background' || key === 'accent') && val && !/^#[0-9a-fA-F]{3,8}$/.test(val)) throw new Error('اللون يجب أن يكون بصيغة #RRGGBB');
        base[key] = (key === 'logo' || key === 'favicon' || key === 'thumbnail' || key === 'ogImage') ? (val ? mediaUrl(val) : '') : val;
      }
      const labels = p.labels ? Object.fromEntries(Object.entries(p.labels as Record<string, string>).map(([a, b]) => [a, String(b).slice(0, 40)])) : (row?.labels || {});
      if (row) await db.update(s.siteSettings).set({ branding: base, labels }).where(eq(s.siteSettings.id, row.id));
      else await db.insert(s.siteSettings).values({ branding: base, labels });
      return NextResponse.json({ ok: true, message: 'حُدّثت هوية الموقع وطُبّقت على كل الصفحات' });
    }
    let result: Payload = {};
    if (action === 'user.update') {
      const updates: Partial<typeof s.users.$inferInsert> = { name: text(p, 'name', 70) };
      if (p.username !== undefined) { const username = text(p, 'username', 30).toLowerCase(); if (!/^[a-z0-9_.]{3,30}$/.test(username)) throw new Error('اسم المستخدم: أحرف إنجليزية صغيرة أو أرقام، 3 أحرف على الأقل'); const dup = await db.select().from(s.users).where(and(eq(s.users.username, username), ne(s.users.id, me.id))); if (dup.length) throw new Error('اسم المستخدم مستخدم، اختر اسماً آخر'); updates.username = username; }
      if (p.email !== undefined) { const email = text(p, 'email', 150).toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('البريد الإلكتروني غير صالح'); const dup = await db.select().from(s.users).where(and(eq(s.users.email, email), ne(s.users.id, me.id))); if (dup.length) throw new Error('هذا البريد مستخدم في حساب آخر'); updates.email = email; }
      if (p.avatar !== undefined) updates.avatar = mediaUrl(text(p, 'avatar', 2000000, false));
      // Password changes go through Lovable Cloud auth in the browser.
      await db.update(s.users).set(updates).where(eq(s.users.id, me.id));
      return NextResponse.json({ ok: true, message: 'تم تحديث حسابك بنجاح' });
    }
    if (action === 'user.delete') {
      if (me.role === 'super') throw new Error('حساب المالك محمي ولا يُحذف من هنا');
      await db.transaction(async tx => { await tx.delete(s.comments).where(eq(s.comments.userId, me.id)); await tx.delete(s.users).where(eq(s.users.id, me.id)); });
      await deleteAuthAccount();
      return NextResponse.json({ ok: true, message: 'وصلنا إلى نهاية المشوار… تم حذف حسابك بهدوء. نلقاك في المدرجات!' });
    }
    switch (action) {
      case 'team.save': {
        const id = p.id ? num(p, 'id') : 0; if (id) { if (!can('canManageTeams')) ownedTeam(id); } else allow(['canManageTeams', 'canAccessAdmin'], 'إنشاء الفرق متاح لمدير المنصة ومن يملك صلاحية إدارة الفرق');
        const values = { name: text(p, 'name', 70), shortName: text(p, 'shortName', 20), neighborhood: text(p, 'neighborhood', 100), stadium: text(p, 'stadium', 120), manager: text(p, 'manager', 80), founded: num(p, 'founded', 1900, 2026), color: text(p, 'color', 7), awayColor: text(p, 'awayColor', 7), emblem: text(p, 'emblem', 20), logo: mediaUrl(text(p, 'logo', 2000000, false)), bio: text(p, 'bio', 4000, false), achievements: String(p.achievements || '').split('\n').map(v => v.trim()).filter(Boolean), ...(superAdmin || can('canManageTeams') ? { approved: p.approved === true } : {}) };
        if (!/^#[0-9a-f]{6}$/i.test(values.color) || !/^#[0-9a-f]{6}$/i.test(values.awayColor)) throw new Error('لون القميص غير صالح');
        if (id) await db.update(s.teams).set(values).where(eq(s.teams.id, id)); else { const [t] = await db.insert(s.teams).values(values).returning(); result.id = t.id; }
        break;
      }
      case 'team.approve': allow('canManageTeams'); await db.update(s.teams).set({ approved: p.approved !== false }).where(eq(s.teams.id, num(p, 'id'))); break;
      case 'team.delete': allow('canManageTeams'); await db.delete(s.teams).where(eq(s.teams.id, num(p, 'id'))); break;
      case 'player.save': {
        const teamId = num(p, 'teamId'); if (!can('canManagePlayers')) ownedTeam(teamId); await findTeam(teamId);
        const id = p.id ? num(p, 'id') : 0; if (id && !can('canManagePlayers')) ownedTeam((await findPlayer(id)).teamId!);
        const rawNumber = String(p.number ?? '').trim(); const number = rawNumber === '' || rawNumber === '—' || rawNumber === '-' ? 0 : num(p, 'number', 0, 999); const duplicate = number === 0 ? [] : await db.select().from(s.players).where(and(eq(s.players.teamId, teamId), eq(s.players.number, number)));
        if (duplicate.some(pl => pl.id !== id)) throw new Error('رقم القميص مستخدم بالفعل في هذا الفريق');
        const position = text(p, 'position'); if (!['GK', 'DEF', 'MID', 'FW'].includes(position)) throw new Error('المركز غير صالح');
        const values = { teamId, name: text(p, 'name', 100), age: num(p, 'age', 12, 65), number, position, photo: mediaUrl(text(p, 'photo', 2000000, false)), bio: text(p, 'bio', 3000, false) };
        if (id) await db.update(s.players).set(values).where(eq(s.players.id, id)); else { const [player] = await db.insert(s.players).values(values).returning(); result.id = player.id; }
        break;
      }
      case 'player.delete': { if (!can('canManagePlayers')) ownedTeam((await findPlayer(num(p, 'id'))).teamId!); } await db.delete(s.players).where(eq(s.players.id, num(p, 'id'))); break;
      case 'career.save': { const player = await findPlayer(num(p, 'playerId')); ownedTeam(player.teamId!); await db.insert(s.careers).values({ playerId: player.id, teamName: text(p, 'teamName', 100), fromYear: num(p, 'fromYear', 1980, 2026), toYear: p.toYear ? num(p, 'toYear', 1980, 2026) : null }); break; }
      case 'career.delete': { const [career] = await db.select().from(s.careers).where(eq(s.careers.id, num(p, 'id'))); if (career) ownedTeam((await findPlayer(career.playerId)).teamId!); await db.delete(s.careers).where(eq(s.careers.id, num(p, 'id'))); break; }
      case 'referee.save': {
        allow(['canManageTournaments', 'canVerifyUsers']);
        const name = text(p, 'name', 100), phone = text(p, 'phone', 30, false);
        const details = { photo: mediaUrl(text(p, 'photo', 2000000, false)), badgeNumber: text(p, 'badgeNumber', 30, false), officialStatus: ['official', 'assistant', 'trainee', 'suspended'].includes(String(p.officialStatus)) ? String(p.officialStatus) : 'official', leagueName: text(p, 'leagueName', 100, false) || 'دوري الناصرية الشعبي' };
        if (p.id) { await db.update(s.referees).set({ name, phone, ...details }).where(eq(s.referees.id, num(p, 'id'))); const row = (await db.select().from(s.referees).where(eq(s.referees.id, num(p, 'id'))))[0]; if (row?.userId) await db.update(s.users).set({ name }).where(eq(s.users.id, row.userId)); break; }
        let userId: number | undefined;
        if (p.email) {
          const email = text(p, 'email', 150).toLowerCase(); const password = text(p, 'password', 150);
          if (password.length < 8) throw new Error('كلمة مرور الحكم 8 أحرف على الأقل');
          const [refUser] = await db.insert(s.users).values({ name, email, username: `${email.split('@')[0].replace(/[^a-z0-9_.]/gi, '').slice(0, 16) || 'ref'}.${randomBytes(2).toString('hex')}`, role: 'referee', authId: await createAuthAccount(email, password, name) }).returning();
          userId = refUser.id;
        }
        const [r] = await db.insert(s.referees).values({ name, phone, userId }).returning(); result.id = r.id; break;
      }
      case 'referee.delete': allow(['canManageTournaments', 'canVerifyUsers']); await db.delete(s.referees).where(eq(s.referees.id, num(p, 'id'))); break;
      case 'tournament.save': {
        allow('canManageTournaments'); const teamIds = ids(p, 'teamIds', 500); if (teamIds.length < 2 || teamIds.length > 32) throw new Error('اختر من فريقين إلى 32 فريقاً');
        const format = text(p, 'format'); if (!['league', 'cup', 'groups'].includes(format)) throw new Error('نظام البطولة غير صالح');
        let sourceTournamentId: number | null = p.sourceTournamentId ? num(p, 'sourceTournamentId') : null; const qualifiers = p.qualifiers ? num(p, 'qualifiers', 1, 10) : 0;
        if (sourceTournamentId) { if (p.id && sourceTournamentId === num(p, 'id')) throw new Error('لا يمكن ربط البطولة بنفسها'); const [source] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, sourceTournamentId)); if (!source || source.format === 'cup') throw new Error('التأهل يُربط بدوري أو بطولة مجموعات فقط'); if (!qualifiers) throw new Error('حدد عدد المتأهلين من البطولة المصدر'); }
        const qualificationRule = ['top', 'topAndBottom', 'groupWinners'].includes(String(p.qualificationRule)) ? String(p.qualificationRule) : 'top';
        const values = { name: text(p, 'name', 120), season: text(p, 'season', 40), format, teamIds, startDate: text(p, 'startDate'), description: text(p, 'description', 3000, false), sourceTournamentId, qualifiers: sourceTournamentId ? qualifiers : 0, qualificationRule };
        if (p.id) await db.update(s.tournaments).set(values).where(eq(s.tournaments.id, num(p, 'id'))); else { const [t] = await db.insert(s.tournaments).values(values).returning(); result.id = t.id; } break;
      }
      case 'tournament.generate': {
        allow('canManageTournaments'); const [t] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, num(p, 'id'))); if (!t) throw new Error('البطولة غير موجودة');
        if (t.sourceTournamentId && t.qualifiers > 0) {
          const [source] = await db.select().from(s.tournaments).where(eq(s.tournaments.id, t.sourceTournamentId));
          if (!source) throw new Error('بطولة التأهل المصدر غير موجودة');
          const standings = calculateTable(await db.select().from(s.matches).where(eq(s.matches.tournamentId, source.id)), await db.select().from(s.teams).where(inArray(s.teams.id, source.teamIds)), source.id);
          if (!standings.some(r => r.played > 0)) throw new Error('بطولة المصدر لم تُلعب بعد — اعتمد نتائجها أولاً لتحديد المتأهلين');
          const qualified = standings.filter(r => r.played > 0).slice(0, t.qualifiers).map(r => r.teamId);
          await db.update(s.tournaments).set({ teamIds: qualified }).where(eq(s.tournaments.id, t.id));
          t.teamIds = qualified;
        }
        const existing = await db.select().from(s.matches).where(eq(s.matches.tournamentId, t.id));
        if (existing.some(m => m.status !== 'scheduled')) throw new Error('لا يمكن إعادة توليد الجدول بعد بدء البطولة');
        if (t.format === 'groups' && t.teamIds.length < 6) throw new Error('نظام المجموعات يحتاج إلى 6 فرق على الأقل');
        if (existing.length) await db.delete(s.matches).where(inArray(s.matches.id, existing.map(m => m.id)));
        const teamList = await db.select().from(s.teams); const stadium = teamList.find(x => x.id === t.teamIds[0])?.stadium || 'ملعب الناصرية الشعبي';
        const base = { tournamentId: t.id, time: '19:30', stadium, referee: 'تُحدد لاحقاً' }; const fixtures: (typeof s.matches.$inferInsert)[] = [];
        const addRoundRobin = (list: number[], group = '', stage = 'league') => { const rotation = [...list]; if (rotation.length % 2) rotation.push(-1); for (let r = 0; r < rotation.length - 1; r++) { for (let i = 0; i < rotation.length / 2; i++) { const homeId = rotation[i], awayId = rotation[rotation.length - 1 - i]; if (homeId > 0 && awayId > 0) { const d = new Date(t.startDate + 'T12:00:00'); d.setDate(d.getDate() + r * 4); fixtures.push({ ...base, homeId, awayId, round: `الجولة ${r + 1}`, stage, group, date: d.toISOString().slice(0, 10) }); } } rotation.splice(1, 0, rotation.pop()!); } };
        if (t.format === 'league') addRoundRobin(t.teamIds);
        else {
          let firstStage = 'quarter';
          if (t.format === 'groups') { firstStage = 'semi'; const half = Math.ceil(t.teamIds.length / 2); ['المجموعة الأولى', 'المجموعة الثانية'].forEach((group, i) => addRoundRobin(t.teamIds.slice(i * half, (i + 1) * half), group, 'group')); }
          else { const size = 2 ** Math.ceil(Math.log2(t.teamIds.length)); firstStage = ({ 2: 'final', 4: 'semi', 8: 'quarter', 16: 'round16', 32: 'round32' } as Record<number, string>)[size]; const stageCount = Math.log2(size); for (let stage = 0; stage < stageCount; stage++) { const count = 2 ** (stageCount - stage - 1); const stageName = ['final', 'semi', 'quarter', 'round16', 'round32'][Math.log2(count)]; for (let slot = 0; slot < count; slot++) { const d = new Date(t.startDate + 'T12:00:00'); d.setDate(d.getDate() + stage * 5); fixtures.push({ ...base, homeId: t.teamIds[0], awayId: t.teamIds[1], date: d.toISOString().slice(0, 10), stage: stageName, bracketSlot: slot, round: ({ final: 'النهائي', semi: 'نصف النهائي', quarter: 'ربع النهائي', round16: 'دور 16', round32: 'دور 32' } as Record<string, string>)[stageName] }); } } }
          const first = fixtures.filter(f => f.stage === firstStage);
          for (let i = 0; i < first.length; i++) { first[i].homeId = t.format === 'groups' ? t.teamIds[0] : t.teamIds[i * 2]; first[i].awayId = t.format === 'groups' ? t.teamIds[1] : t.teamIds[i * 2 + 1] ?? first[i].homeId; }
          const final = fixtures.find(f => f.stage === 'final');
          if (final && t.teamIds.length === 2) { final.homeId = t.teamIds[0]; final.awayId = t.teamIds[1]; }
        }
        await db.insert(s.matches).values(fixtures);
        if (t.format === 'cup') { const first = await db.select().from(s.matches).where(eq(s.matches.tournamentId, t.id)); for (const match of first.filter(m => m.homeId === m.awayId)) { await db.update(s.matches).set({ status: 'finished', homeScore: 0, awayScore: 0 }).where(eq(s.matches.id, match.id)); await advanceMatch(match.id); } }
        await db.update(s.tournaments).set({ status: 'active' }).where(eq(s.tournaments.id, t.id)); result.count = fixtures.length; break;
      }
      case 'tournament.delete': allow('canManageTournaments'); await db.delete(s.tournaments).where(eq(s.tournaments.id, num(p, 'id'))); break;
      case 'backup.export': {
        allow('canBackupData');
        const backup = { app: 'manar-football', version: 1, createdAt: new Date().toISOString(),
          teams: await db.select().from(s.teams), users: await db.select().from(s.users), tournaments: await db.select().from(s.tournaments), referees: await db.select().from(s.referees), players: await db.select().from(s.players), careers: await db.select().from(s.careers), matches: await db.select().from(s.matches), matchEvents: await db.select().from(s.matchEvents), lineups: await db.select().from(s.lineups), news: await db.select().from(s.news), gallery: await db.select().from(s.gallery), comments: await db.select().from(s.comments), polls: await db.select().from(s.polls), pollVotes: await db.select().from(s.pollVotes), motmVotes: await db.select().from(s.motmVotes), seasons: await db.select().from(s.seasons), invites: await db.select().from(s.invites),
          siteSettings: await db.select().from(s.siteSettings), announcements: await db.select().from(s.announcements), posts: await db.select().from(s.posts), interactions: await db.select().from(s.interactions), stories: await db.select().from(s.stories), highlights: await db.select().from(s.highlights), notes: await db.select().from(s.notes), follows: await db.select().from(s.follows), friendRequests: await db.select().from(s.friendRequests), conversations: await db.select().from(s.conversations), conversationMembers: await db.select().from(s.conversationMembers), messages: await db.select().from(s.messages), messageReads: await db.select().from(s.messageReads), pinnedMessages: await db.select().from(s.pinnedMessages), notifications: await db.select().from(s.notifications) };
        return NextResponse.json({ ok: true, data: backup }, { headers: { 'Cache-Control': 'no-store' } });
      }
      case 'backup.import': {
        allow('canBackupData'); const backup = p.data as Record<string, unknown[]> | undefined;
        if (!backup || !Array.isArray(backup.teams) || !backup.teams.length || !Array.isArray(backup.users)) throw new Error('ملف النسخة الاحتياطية غير صالح — تأكد أنه صادر من كرة المنار');
        type DbTable = Parameters<typeof db.delete>[0];
        const wipe: DbTable[] = [s.messageReads, s.pinnedMessages, s.messages, s.conversationMembers, s.conversations, s.friendRequests, s.follows, s.notes, s.highlights, s.stories, s.interactions, s.posts, s.notifications, s.announcements, s.siteSettings, s.pollVotes, s.motmVotes, s.comments, s.careers, s.gallery, s.lineups, s.matchEvents, s.matches, s.invites, s.news, s.referees, s.tournaments, s.players, s.seasons, s.polls, s.users, s.teams];
        // Ordered parents → children so foreign keys hold during a single restore.
        const restore: { table: DbTable; rows: unknown[] }[] = [
          { table: s.teams, rows: backup.teams }, { table: s.users, rows: backup.users },
          { table: s.polls, rows: backup.polls || [] }, { table: s.seasons, rows: backup.seasons || [] },
          { table: s.tournaments, rows: backup.tournaments || [] }, { table: s.referees, rows: backup.referees || [] },
          { table: s.players, rows: backup.players || [] }, { table: s.news, rows: backup.news || [] },
          { table: s.matches, rows: backup.matches || [] }, { table: s.matchEvents, rows: backup.matchEvents || [] },
          { table: s.lineups, rows: backup.lineups || [] }, { table: s.gallery, rows: backup.gallery || [] },
          { table: s.comments, rows: backup.comments || [] }, { table: s.careers, rows: backup.careers || [] },
          { table: s.pollVotes, rows: backup.pollVotes || [] }, { table: s.motmVotes, rows: backup.motmVotes || [] },
          { table: s.invites, rows: backup.invites || [] },
          { table: s.siteSettings, rows: (backup.siteSettings as unknown[]) || [] }, { table: s.announcements, rows: backup.announcements || [] },
          { table: s.posts, rows: backup.posts || [] }, { table: s.interactions, rows: backup.interactions || [] },
          { table: s.stories, rows: backup.stories || [] }, { table: s.highlights, rows: backup.highlights || [] }, { table: s.notes, rows: backup.notes || [] },
          { table: s.follows, rows: backup.follows || [] }, { table: s.friendRequests, rows: backup.friendRequests || [] },
          { table: s.conversations, rows: backup.conversations || [] }, { table: s.conversationMembers, rows: backup.conversationMembers || [] },
          { table: s.messages, rows: backup.messages || [] }, { table: s.messageReads, rows: backup.messageReads || [] },
          { table: s.pinnedMessages, rows: backup.pinnedMessages || [] }, { table: s.notifications, rows: backup.notifications || [] },
        ];
        await db.delete(s.sessions);
        for (const table of wipe) await db.delete(table);
        // Timestamps arrive as ISO strings in JSON; password hashes from the old platform are never imported
        // (sign-in now goes through Lovable Cloud accounts, linked by verified email on first login).
        const isoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
        const clean = (rows: unknown[], isUsers: boolean) => (rows as Record<string, unknown>[]).map(r => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) out[k] = typeof v === 'string' && /(At|Until)$/.test(k) && isoDate.test(v) ? new Date(v) : v;
          if (isUsers) { out.passwordHash = ''; out.authId = null; }
          return out;
        });
        for (const part of restore) {
          const rows = clean(part.rows, part.table === s.users);
          for (let i = 0; i < rows.length; i += 40) await db.insert(part.table as never).values(rows.slice(i, i + 40) as never[]);
        }
        // Explicit ids were restored, so move every id counter past the highest imported id.
        for (const name of ['teams', 'users', 'polls', 'seasons', 'tournaments', 'referees', 'players', 'news', 'matches', 'match_events', 'lineups', 'gallery', 'comments', 'careers', 'poll_votes', 'motm_votes', 'invites', 'site_settings', 'announcements', 'posts', 'interactions', 'stories', 'highlights', 'notes', 'follows', 'friend_requests', 'conversations', 'conversation_members', 'messages', 'message_reads', 'pinned_messages', 'notifications', 'sessions', 'typing_signals'])
          await db.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('public."${name}"', 'id'), coalesce((SELECT max(id) FROM public."${name}"), 0) + 1, false)`));
        return NextResponse.json({ ok: true, message: `اكتملت الاستعادة: ${backup.teams.length} فريقاً وبياناتها كاملة. سجّل دخولك من جديد — يدخل كل عضو ببريده ويختار كلمة مرور جديدة عبر «أول دخول».` });
      }
      case 'social.save': {
        allow('canCustomizeSite'); const keys = ['facebook', 'instagram', 'whatsapp', 'telegram', 'youtube'] as const; const social: Record<string, { url: string; handle: string }> = {};
        for (const key of keys) {
          const url = text(p, `${key}_url`, 300, false), handle = text(p, `${key}_handle`, 60, false);
          if (url && !/^https?:\/\//i.test(url)) throw new Error('روابط التواصل يجب أن تبدأ بـ https:// — صحّح الرابط وحفظه من جديد');
          social[key] = { url, handle };
        }
        await db.delete(s.siteSettings); await db.insert(s.siteSettings).values({ social }); break;
      }
      case 'tournament.restore': allow('canManageTournaments'); await db.update(s.tournaments).set({ status: 'finished' }).where(eq(s.tournaments.id, num(p, 'id'))); break;
      case 'season.delete': allow('canManageTournaments'); await db.delete(s.seasons).where(eq(s.seasons.id, num(p, 'id'))); break;
      case 'season.start': {
        allow('canManageTournaments'); const seasonName = text(p, 'name', 60); const allTournaments = await db.select().from(s.tournaments); const allTeams = await db.select().from(s.teams); const allMatches = await db.select().from(s.matches);
        const snapshotRows = await Promise.all(allTournaments.filter(t => t.status !== 'archived').map(async t => {
          const table = calculateTable(allMatches, allTeams.filter(team => t.teamIds.includes(team.id)), t.id);
          const tPlayers = await db.select().from(s.players); const tEvents = await db.select().from(s.matchEvents); const line = await db.select().from(s.lineups);
          const stats = playerStats({ players: tPlayers, events: tEvents, matches: allMatches, lineups: line } as Pick<Snapshot, 'players' | 'events' | 'matches' | 'lineups'>, t.id).filter(pl => t.teamIds.includes(pl.teamId!)).sort((a, b) => b.goals - a.goals).slice(0, 3).map(pl => ({ name: pl.name, goals: pl.goals }));
          const champion = t.format === 'league' || t.format === 'groups' ? allTeams.find(x => x.id === table[0]?.teamId)?.name || '' : '';
          return { tournament: t.name, format: t.format, champion, matches: allMatches.filter(m => m.tournamentId === t.id).length, table: table.map((r, i) => ({ rank: i + 1, team: allTeams.find(x => x.id === r.teamId)?.name || '', played: r.played, points: r.points, gd: r.gd })), scorers: stats };
        }));
        if (!snapshotRows.length) throw new Error('لا توجد بطولات نشطة لأرشفتها');
        const previousLabel = allTournaments[0]?.season || 'الموسم السابق';
        await db.transaction(async tx => {
          await tx.update(s.seasons).set({ active: false }).where(eq(s.seasons.active, true));
          await tx.insert(s.seasons).values({ name: previousLabel, description: `أُرشف عند انطلاق ${seasonName}`, summary: snapshotRows, active: false });
          await tx.update(s.tournaments).set({ status: 'archived', seasonLabel: previousLabel });
          for (const t of allTournaments) {
            await tx.insert(s.tournaments).values({ name: t.name, format: t.format, season: seasonName, teamIds: t.format === 'league' || !t.sourceTournamentId ? t.teamIds : [], sourceTournamentId: t.sourceTournamentId, qualifiers: t.sourceTournamentId ? t.qualifiers : 0, status: 'upcoming', startDate: t.startDate, description: t.description });
          }
        });
        result.count = snapshotRows.length; break;
      }
      case 'match.save': {
        allow('canEditMatches'); const homeId = num(p, 'homeId'), awayId = num(p, 'awayId'); if (homeId === awayId) throw new Error('لا يمكن للفريق مواجهة نفسه'); await findTeam(homeId); await findTeam(awayId);
        const date = text(p, 'date'); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('تاريخ غير صالح');
        const time = text(p, 'time'); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('وقت غير صالح');
        const refereeId = p.refereeId ? num(p, 'refereeId') : null; const refereeRow = refereeId ? (await db.select().from(s.referees).where(eq(s.referees.id, refereeId)))[0] : null;
        const values = { homeId, awayId, date, time, stadium: text(p, 'stadium', 120), referee: refereeRow ? refereeRow.name : text(p, 'referee', 100, false), refereeId, round: text(p, 'round', 70, false), tournamentId: p.tournamentId ? num(p, 'tournamentId') : null, report: text(p, 'report', 6000, false) };
        if (p.id) await db.update(s.matches).set(values).where(eq(s.matches.id, num(p, 'id'))); else { const [m] = await db.insert(s.matches).values(values).returning(); result.id = m.id; } break;
      }
      case 'match.score': {
        allow('canEditMatches'); const id = num(p, 'id'), old = await findMatch(id); const status = text(p, 'status'); if (!['scheduled', 'live', 'finished'].includes(status)) throw new Error('حالة غير صالحة');
        const homeScore = num(p, 'homeScore', 0, 99), awayScore = num(p, 'awayScore', 0, 99);
        if (status === 'finished' && old.tournamentId && old.stage !== 'league' && old.stage !== 'group' && homeScore === awayScore && num(p, 'penaltyHome', 0, 30) === num(p, 'penaltyAway', 0, 30)) throw new Error('حدد نتيجة ركلات الترجيح لحسم التعادل في مباراة خروج المغلوب');
        await db.update(s.matches).set({ status, homeScore, awayScore, minute: status === 'finished' ? 90 : num(p, 'minute', 0, 120), penaltyHome: p.penaltyHome === '' || p.penaltyHome === undefined ? null : num(p, 'penaltyHome', 0, 30), penaltyAway: p.penaltyAway === '' || p.penaltyAway === undefined ? null : num(p, 'penaltyAway', 0, 30), ...(p.report !== undefined ? { report: text(p, 'report', 6000, false) } : {}) }).where(eq(s.matches.id, id));
        await advanceMatch(id); break;
      }
      case 'event.add': {
        const matchIdForRef = num(p, 'matchId'); if (!can('canEditMatches') && !can('canRefereeAnyMatch') && !(await canOfficiate(matchIdForRef))) throw new Error('تعديل الأحداث متاح لمدير المنصة، أو من يملك صلاحية تعديل المباريات، أو حكم المباراة المعتمد');
        const m = await findMatch(matchIdForRef); const teamId = num(p, 'teamId'); if (![m.homeId, m.awayId].includes(teamId)) throw new Error('الفريق ليس طرفاً في المباراة');
        const type = text(p, 'type'); if (!['goal', 'yellow', 'red', 'own-goal', 'sub'].includes(type)) throw new Error('نوع الحدث غير صالح');
        const player = await findPlayer(num(p, 'playerId')); if (player.teamId !== teamId) throw new Error('اللاعب لا ينتمي إلى الفريق المحدد');
        const assistId = p.assistId ? num(p, 'assistId') : null; if (assistId && (await findPlayer(assistId)).teamId !== teamId) throw new Error('صانع الهدف لا ينتمي إلى الفريق');
        const addedEvent = await db.transaction(async tx => { const [row] = await tx.insert(s.matchEvents).values({ matchId: m.id, teamId, playerId: player.id, assistId: type === 'goal' ? assistId : null, type, minute: num(p, 'minute', 1, 120) }).returning(); if (type === 'goal' || type === 'own-goal') { const scoring = type === 'own-goal' ? (teamId === m.homeId ? 'awayScore' : 'homeScore') : teamId === m.homeId ? 'homeScore' : 'awayScore'; await tx.update(s.matches).set({ [scoring]: m[scoring] + 1, status: m.status === 'scheduled' ? 'live' : m.status }).where(eq(s.matches.id, m.id)); } return row; }); result.id = addedEvent.id; break;
      }
      case 'event.delete': {
        const [ev] = await db.select().from(s.matchEvents).where(eq(s.matchEvents.id, num(p, 'id'))); if (ev && !can('canEditMatches') && !can('canRefereeAnyMatch') && !(await canOfficiate(ev.matchId))) throw new Error('تعديل الأحداث متاح لمدير المنصة، أو من يملك صلاحية تعديل المباريات، أو حكم المباراة المعتمد'); if (!ev) break; const m = await findMatch(ev.matchId);
        await db.transaction(async tx => { await tx.delete(s.matchEvents).where(eq(s.matchEvents.id, ev.id)); if (['goal', 'own-goal'].includes(ev.type)) { const scoring = (ev.type === 'own-goal' ? ev.teamId !== m.homeId : ev.teamId === m.homeId) ? 'homeScore' : 'awayScore'; await tx.update(s.matches).set({ [scoring]: Math.max(0, m[scoring] - 1) }).where(eq(s.matches.id, m.id)); } }); break;
      }
      case 'match.delete': allow('canEditMatches'); await db.delete(s.matches).where(eq(s.matches.id, num(p, 'id'))); break;
      case 'lineup.save': {
        const matchId = num(p, 'matchId'), teamId = num(p, 'teamId'); if (!can('canEditAnyLineup')) ownedTeam(teamId); const m = await findMatch(matchId); if (![m.homeId, m.awayId].includes(teamId)) throw new Error('الفريق ليس طرفاً في هذه المباراة');
        if (!Array.isArray(p.positions) || p.positions.length > 11) throw new Error('التشكيلة غير صالحة');
        const positions = p.positions as { playerId: number; x: number; y: number }[];
        if (new Set(positions.map(pos => pos.playerId)).size !== positions.length || positions.some(pos => !Number.isInteger(pos.playerId) || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) || pos.x < 5 || pos.x > 95 || pos.y < 5 || pos.y > 95)) throw new Error('مواضع اللاعبين غير صالحة');
        const teamPlayers = await db.select().from(s.players).where(eq(s.players.teamId, teamId)); if (positions.some(pos => !teamPlayers.some(player => player.id === pos.playerId))) throw new Error('يمكن اختيار لاعبي فريقك فقط');
        const published = p.published === true; if (published && positions.length !== 11) throw new Error('أكمل اللاعبين الأحد عشر قبل نشر التشكيلة');
        const values = { matchId, teamId, formation: text(p, 'formation', 15), published, positions };
        await db.insert(s.lineups).values(values).onConflictDoUpdate({ target: [s.lineups.matchId, s.lineups.teamId], set: { formation: values.formation, published, positions } }); break;
      }
      case 'news.save': {
        const teamId = p.teamId ? num(p, 'teamId') : null; if (!superAdmin && !can('canPublishNews') && (!teamId || me.teamId !== teamId)) throw new Error('يمكنك نشر أخبار فريقك فقط — أو اطلب صلاحية نشر الأخبار');
        const values = { title: text(p, 'title', 180), excerpt: text(p, 'excerpt', 400), body: text(p, 'body', 16000), image: mediaUrl(text(p, 'image', 1000000, false) || '/images/stadium.jpg'), category: text(p, 'category', 70), teamId };
        if (p.id) { const [article] = await db.select().from(s.news).where(eq(s.news.id, num(p, 'id'))); if (!article) throw new Error('الخبر غير موجود'); if (!superAdmin) ownedTeam(article.teamId!); await db.update(s.news).set(values).where(eq(s.news.id, article.id)); } else { const [article] = await db.insert(s.news).values(values).returning(); result.id = article.id; } break;
      }
      case 'news.delete': { const [article] = await db.select().from(s.news).where(eq(s.news.id, num(p, 'id'))); if (article) { if (!superAdmin && !can('canPublishNews')) ownedTeam(article.teamId!); await db.delete(s.news).where(eq(s.news.id, article.id)); } break; }
      case 'gallery.save': { const teamId = num(p, 'teamId'); if (!can('canUploadHighlights')) ownedTeam(teamId); const type = text(p, 'type'); if (!['image', 'video'].includes(type)) throw new Error('نوع غير صالح'); await db.insert(s.gallery).values({ teamId, type, url: mediaUrl(text(p, 'url', 1000000)), caption: text(p, 'caption', 160) }); break; }
      case 'gallery.delete': { const [item] = await db.select().from(s.gallery).where(eq(s.gallery.id, num(p, 'id'))); if (item && !can('canUploadHighlights')) ownedTeam(item.teamId); await db.delete(s.gallery).where(eq(s.gallery.id, num(p, 'id'))); break; }
      case 'comment.moderate': allow(['canApproveComments', 'canModeratePosts']); { const status = text(p, 'status'); if (!['approved', 'rejected'].includes(status)) throw new Error('حالة المراجعة غير صالحة'); await db.update(s.comments).set({ status }).where(eq(s.comments.id, num(p, 'id'))); } break;
      case 'comment.delete': allow(['canApproveComments', 'canBanUsers']); await db.delete(s.comments).where(eq(s.comments.id, num(p, 'id'))); break;
      case 'poll.save': { allow(['canPublishNews', 'canAccessAdmin']); const options = String(p.options || '').split('\n').map(v => v.trim()).filter(Boolean); if (options.length < 2 || options.length > 8) throw new Error('أضف من خيارين إلى ثمانية خيارات'); const values = { question: text(p, 'question', 250), description: text(p, 'description', 500, false), active: p.active !== false, options: options.map((label, i) => ({ id: i + 1, label, votes: 0 })) }; if (p.id) { const { options: _options, ...rest } = values; await db.update(s.polls).set(rest).where(eq(s.polls.id, num(p, 'id'))); } else await db.insert(s.polls).values(values); break; }
      case 'poll.delete': allow(['canPublishNews', 'canAccessAdmin']); await db.delete(s.polls).where(eq(s.polls.id, num(p, 'id'))); break;
      case 'invite.create': { requireSuper(); const teamId = num(p, 'teamId'); await findTeam(teamId); const token = randomBytes(24).toString('hex'); const [invite] = await db.insert(s.invites).values({ token, teamId, expiresAt: new Date(Date.now() + 7 * 86400000) }).returning(); result.token = token; break; }
      case 'invite.delete': requireSuper(); await db.delete(s.invites).where(eq(s.invites.id, num(p, 'id'))); break;
      default: throw new Error('العملية المطلوبة غير متوفرة');
    }
    return NextResponse.json({ ok: true, message: 'تم الحفظ بنجاح', ...result });
  } catch (error) {
    const e = error as Error; const duplicate = e.message.includes('unique') || e.message.includes('duplicate');
    return NextResponse.json({ error: duplicate ? 'لقد شاركت من قبل، أو أن هذه البيانات مسجّلة مسبقاً' : e.message.includes('invalid input syntax') ? 'يرجى التحقق من البيانات المدخلة' : e.message || 'حدث خطأ، يرجى المحاولة مجدداً' }, { status: 400 });
  }
}
