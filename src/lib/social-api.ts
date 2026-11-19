import { NextResponse, type ActionResponse } from '@/lib/next-shims/server';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import type { CurrentUser } from '@/lib/auth';

type Payload = Record<string, unknown>;
const str = (p: Payload, key: string, max = 2000, required = false) => {
  const v = p[key];
  if (v === undefined || v === null || v === '') { if (required) throw new Error('حقل مطلوب: ' + key); return ''; }
  if (typeof v !== 'string') throw new Error('قيمة غير صالحة: ' + key);
  const out = v.trim();
  if (out.length > max) throw new Error('النص طويل جداً في: ' + key);
  if (required && !out) throw new Error('حقل مطلوب: ' + key);
  return out;
};
const int = (p: Payload, key: string, min = 0, max = 1e6) => { const v = Number(p[key]); if (!Number.isInteger(v) || v < min || v > max) throw new Error('رقم غير صالح: ' + key); return v; };
const list = (p: Payload, key: string) => Array.isArray(p[key]) ? [...new Set((p[key] as unknown[]).map(Number).filter(n => Number.isInteger(n) && n > 0))] : [];
const media = (value: string, kind: string) => {
  if (!value) return '';
  if (/^data:(image|video|audio)\/(png|jpeg|jpg|webp|gif|mp4|webm|ogg);base64,/i.test(value)) return value;
  if (/^https?:\/\//i.test(value) && (kind !== 'file' || /\.(mp4|webm|mov|pdf|png|jpe?g|webp|gif|txt|docx?)$/i.test(value))) return value;
  throw new Error('الرابط غير مدعوم — ارفع ملفاً أو استخدم رابطاً مباشراً يبدأ بـ https://');
};
const hashtags = (body: string) => [...new Set((body.match(/#[\u0600-\u064Fa-z0-9_]{2,30}/gi) || []).map(h => h.toLowerCase()))].slice(0, 8);

async function actor(id: number) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, id)).limit(1);
  if (!u) throw new Error('الحساب غير موجود');
  if (u.banned) throw new Error('حسابك موقوف من إدارة المنصة — راسلهم للمراجعة');
  if (u.restrictedUntil && u.restrictedUntil > new Date()) throw new Error(`حسابك مقيّد عن النشر حتى ${u.restrictedUntil.toLocaleDateString('ar-IQ')}`);
  return u;
}
async function notify(userId: number, kind: string, text: string, href: string, actorId?: number) {
  if (!userId || userId === actorId) return;
  await db.insert(s.notifications).values({ userId, actorId: actorId ?? null, kind, text, href });
}
async function settings() { const [row] = await db.select().from(s.siteSettings).limit(1); return row; }

/** Returns a Response when the action was handled here, or null to fall through. */
export async function handleSocial(action: string, p: Payload, me: CurrentUser | null): Promise<ActionResponse | null> {
  const needsAccount = () => { if (!me) throw new Error('سجّل دخولك أولاً لهذه الميزة'); return me; };
  const isSuper = me?.role === 'super';

  // ─────────── Posts & reels ───────────
  if (action === 'post.create') {
    if ((await settings())?.moderation?.allowPosts === false && !isSuper) throw new Error('نشر المنشورات متوقف حالياً من إدارة المنصة');
    const user = needsAccount(); await actor(user.id);
    const cfg = await settings();
    const type = str(p, 'type', 12) || 'text';
    if (!['text', 'image', 'video', 'reel', 'poll', 'repost'].includes(type)) throw new Error('نوع المنشور غير مدعوم');
    const body = str(p, 'body', 4000);
    // Multi-image carousel: up to 10 images in a single post, kept in order.
    const rawList = Array.isArray(p.mediaUrls) ? (p.mediaUrls as unknown[]).map(v => String(v)) : [];
    const singleMedia = str(p, 'mediaUrl', 3000000);
    const mediaKind = type === 'reel' || type === 'video' ? 'video' : 'image';
    const mediaList = (rawList.length ? rawList : singleMedia ? [singleMedia] : []).map(u => media(u, mediaKind)).slice(0, 10);
    if (rawList.length > 10) throw new Error('الحد الأقصى 10 صور في المنشور الواحد');
    const mediaUrl = mediaList[0] || '';
    if (type !== 'text' && type !== 'poll' && type !== 'repost' && !mediaUrl) throw new Error('أضف وسائط للمنشور أو اختر منشوراً نصياً');
    let pollOptions: { id: number; label: string; votes: number }[] = [];
    if (type === 'poll') {
      pollOptions = str(p, 'pollOptions', 1200).split('\n').map(v => v.trim()).filter(Boolean).slice(0, 6).map((label, i) => ({ id: i + 1, label, votes: 0 }));
      if (pollOptions.length < 2) throw new Error('استطلاع الرأي يحتاج خيارين على الأقل');
    }
    const privacy = str(p, 'privacy', 12) || 'public';
    if (!['public', 'friends', 'followers', 'specific', 'exclude'].includes(privacy)) throw new Error('خيار خصوصية غير صالح');
    const audience = list(p, 'audience');
    if ((privacy === 'specific' || privacy === 'exclude') && !audience.length) throw new Error('اختر أشخاصاً لقائمة الخصوصية');
    const repostOf = type === 'repost' ? int(p, 'repostOf', 1) : null;
    const needsReview = Boolean(cfg?.moderation?.posts) && type !== 'repost';
    const [row] = await db.insert(s.posts).values({
      userId: user.id, type: repostOf ? 'repost' : type, body,
      mediaType: mediaUrl ? (type === 'reel' ? 'reel' : type === 'video' ? 'video' : mediaList.length > 1 ? 'album' : 'image') : '',
      mediaUrls: type === 'image' ? mediaList : [],
      mediaUrl, hashtags: hashtags(body), pollOptions, privacy, audience,
      teamId: p.teamId ? int(p, 'teamId', 1, 1e5) : null, matchId: p.matchId ? int(p, 'matchId', 1, 1e6) : null,
      repostOf, status: needsReview ? 'pending' : 'approved',
    }).returning();
    if (repostOf) { const [orig] = await db.select().from(s.posts).where(eq(s.posts.id, repostOf)); if (orig) await notify(orig.userId, 'repost', `${user.name} أعاد نشر منشورك`, `/social?post=${orig.id}`, user.id); }
    return NextResponse.json({ ok: true, id: row.id, message: needsReview ? 'أُرسل للمراجعة، وسيظهر بعد اعتماد الإدارة' : 'نُشر منشورك في الساحة 🎉' });
  }
  if (action === 'post.edit') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [post] = await db.select().from(s.posts).where(eq(s.posts.id, id)); if (!post || post.userId !== user.id) throw new Error('لا يمكنك تعديل منشور غيرك');
    const body = str(p, 'body', 4000, true);
    const kept = Array.isArray(p.mediaUrls) ? (p.mediaUrls as unknown[]).map(v => String(v)).filter(Boolean).slice(0, 10).map(u => media(u, 'image')) : post.mediaUrls;
    await db.update(s.posts).set({ body, hashtags: hashtags(body), mediaUrls: post.type === 'image' ? kept : post.mediaUrls, mediaUrl: post.type === 'image' ? (kept[0] || post.mediaUrl) : post.mediaUrl, privacy: str(p, 'privacy', 12) || post.privacy, audience: list(p, 'audience'), editedAt: new Date() }).where(eq(s.posts.id, id));
    return NextResponse.json({ ok: true, message: 'عُدّل منشورك' });
  }
  if (action === 'post.delete') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [post] = await db.select().from(s.posts).where(eq(s.posts.id, id)); if (!post) return NextResponse.json({ ok: true });
    if (post.userId !== user.id && !isSuper) throw new Error('لا يمكنك حذف منشور غيرك');
    await db.delete(s.posts).where(eq(s.posts.id, id));
    return NextResponse.json({ ok: true, message: 'حُذف المنشور' });
  }
  if (action === 'post.view') { const id = int(p, 'id', 1); await db.update(s.posts).set({ views: sql`${s.posts.views} + 1` }).where(eq(s.posts.id, id)); return NextResponse.json({ ok: true, silent: true }); }
  if (action === 'post.moderate') {
    const granted = (me as { permissions?: Record<string, boolean> }).permissions?.canModeratePosts;
    if (!isSuper && !granted) throw new Error('المراجعة متاحة لمدير المنصة أو من يملك صلاحية مراجعة المحتوى');
    const id = int(p, 'id', 1); const status = str(p, 'status', 12, true);
    if (!['approved', 'rejected'].includes(status)) throw new Error('حالة غير صالحة');
    if (status === 'rejected') await db.delete(s.posts).where(eq(s.posts.id, id)); else await db.update(s.posts).set({ status: 'approved' }).where(eq(s.posts.id, id));
    const [post] = await db.select().from(s.posts).where(eq(s.posts.id, id));
    if (post && status === 'approved') await notify(post.userId, 'moderation', 'تم اعتماد منشورك في الساحة', `/social?post=${post.id}`);
    return NextResponse.json({ ok: true, message: status === 'approved' ? 'اعتمدنا المنشور' : 'رُفض المنشور' });
  }
  if (action === 'post.vote') {
    const user = needsAccount(); const id = int(p, 'id', 1); const optionId = int(p, 'optionId', 1);
    const [post] = await db.select().from(s.posts).where(eq(s.posts.id, id));
    if (!post || post.type !== 'poll') throw new Error('الاستطلاع غير متاح');
    if (post.pollVoters[String(user.id)]) throw new Error('صوّت مسبقاً على هذا الاستطلاع');
    if (!post.pollOptions.some(o => o.id === optionId)) throw new Error('خيار غير صالح');
    await db.update(s.posts).set({
      pollOptions: post.pollOptions.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
      pollVoters: { ...post.pollVoters, [String(user.id)]: optionId },
    }).where(eq(s.posts.id, id));
    return NextResponse.json({ ok: true, message: 'شكراً لصوتك 🗳️' });
  }

  // ─────────── Reactions & comments ───────────
  if (action === 'react') {
    const user = needsAccount(); const targetType = str(p, 'targetType', 12, true); const targetId = int(p, 'targetId', 1);
    const kind = str(p, 'kind', 12) || 'like';
    if (!['post', 'comment', 'story'].includes(targetType) || !['like', 'love', 'save', 'repost'].includes(kind)) throw new Error('تفاعل غير معروف');
    const existing = await db.select().from(s.interactions).where(and(eq(s.interactions.targetType, targetType), eq(s.interactions.targetId, targetId), eq(s.interactions.userId, user.id), eq(s.interactions.kind, kind)));
    if (existing.length) { await db.delete(s.interactions).where(eq(s.interactions.id, existing[0].id)); return NextResponse.json({ ok: true, removed: true }); }
    await db.insert(s.interactions).values({ targetType, targetId, userId: user.id, kind });
    const ownerRow = targetType === 'post' ? await db.select({ userId: s.posts.userId, body: s.posts.body }).from(s.posts).where(eq(s.posts.id, targetId)) : targetType === 'comment' ? await db.select({ userId: s.comments.userId, body: s.comments.body }).from(s.comments).where(eq(s.comments.id, targetId)) : [];
    const owner = ownerRow[0]?.userId;
    if (typeof owner === 'number' && kind !== 'save') await notify(owner, 'like', `${user.name} ${kind === 'love' ? 'أحب' : 'أعجب بـ'} ${targetType === 'comment' ? 'تعليقك' : 'منشورك'}`, `/social?post=${targetId}`, user.id);
    return NextResponse.json({ ok: true, added: true });
  }
  if (action === 'comment.create') {
    const user = needsAccount(); const account = await actor(user.id);
    if (account.mutedUntil && account.mutedUntil > new Date()) throw new Error('أنت مكتوم مؤقتاً — لا يمكنك التعليق الآن');
    const cfg = await settings();
    if (cfg?.moderation?.allowComments === false && !isSuper) throw new Error('التعليقات متوقفة حالياً من إدارة المنصة');
    const targetType = str(p, 'targetType', 12, true); const targetId = int(p, 'targetId', 1);
    const body = str(p, 'body', 1000, true); const mediaUrl = media(str(p, 'mediaUrl', 900000), 'image');
    const parentId = p.parentId ? int(p, 'parentId', 1) : null;
    const status = cfg?.moderation?.comments === false ? 'approved' : 'pending';
    const [row] = await db.insert(s.comments).values({ targetType, targetId, name: user.name, userId: user.id, body, mediaUrl, parentId, status }).returning();
    if (targetType === 'post') {
      const [post] = await db.select({ userId: s.posts.userId }).from(s.posts).where(eq(s.posts.id, targetId));
      if (post) await notify(post.userId, 'comment', `${user.name} علّق: ${body.slice(0, 60)}`, `/social?post=${targetId}`, user.id);
      if (parentId) { const [parent] = await db.select({ userId: s.comments.userId }).from(s.comments).where(eq(s.comments.id, parentId)); if (parent?.userId) await notify(parent.userId, 'reply', `${user.name} ردّ عليك`, `/social?post=${targetId}`, user.id); }
    }
    return NextResponse.json({ ok: true, id: row.id, message: status === 'pending' ? 'تعليقك بانتظار اعتماد الإدارة' : 'نُشر تعليقك' });
  }
  if (action === 'comment.edit') {
    const user = needsAccount(); const [row] = await db.select().from(s.comments).where(eq(s.comments.id, int(p, 'id', 1)));
    if (!row || row.userId !== user.id) throw new Error('تعديل تعليقاتك فقط');
    await db.update(s.comments).set({ body: str(p, 'body', 1000, true), editedAt: new Date() }).where(eq(s.comments.id, row.id));
    return NextResponse.json({ ok: true, message: 'عُدّل التعليق' });
  }
  if (action === 'comment.remove') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [row] = await db.select().from(s.comments).where(eq(s.comments.id, id));
    if (row && row.userId !== user.id && !isSuper) throw new Error('حذف تعليقاتك فقط');
    if (row) await db.delete(s.comments).where(eq(s.comments.id, id));
    return NextResponse.json({ ok: true, message: 'حُذف التعليق' });
  }

  // ─────────── Stories, notes & highlights ───────────
  if (action === 'story.create') {
    const user = needsAccount(); await actor(user.id);
    const cfg = await settings();
    const type = str(p, 'type', 12) || 'image'; if (!['image', 'video'].includes(type)) throw new Error('نوع الستوري غير صالح');
    const url = media(str(p, 'url', 900000, true), type === 'video' ? 'video' : 'image');
    const durationHours = int(p, 'durationHours', 1, 24 * 30) || 24;
    const [row] = await db.insert(s.stories).values({
      userId: user.id, type, url, caption: str(p, 'caption', 300), durationHours,
      expiresAt: new Date(Date.now() + durationHours * 3600000),
      status: cfg?.moderation?.stories ? 'pending' : 'approved',
    }).returning();
    return NextResponse.json({ ok: true, id: row.id, message: `ستوري منشور لمدة ${durationHours} ساعة` });
  }
  if (action === 'story.view') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [story] = await db.select().from(s.stories).where(eq(s.stories.id, id));
    if (!story || story.userId === user.id) return NextResponse.json({ ok: true });
    if (!story.viewers.includes(user.id)) await db.update(s.stories).set({ viewers: [...story.viewers, user.id] }).where(eq(s.stories.id, id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'story.archive') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [story] = await db.select().from(s.stories).where(eq(s.stories.id, id)); if (!story || story.userId !== user.id) throw new Error('ستورياتك فقط');
    await db.update(s.stories).set({ archived: p.archived !== false }).where(eq(s.stories.id, id));
    return NextResponse.json({ ok: true, message: p.archived === false ? 'أُعيد الستوري للنشر' : 'أُضيف للأرشيف' });
  }
  if (action === 'story.delete') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [story] = await db.select().from(s.stories).where(eq(s.stories.id, id)); if (!story) return NextResponse.json({ ok: true });
    if (story.userId !== user.id && !isSuper) throw new Error('ستورياتك فقط');
    await db.delete(s.stories).where(eq(s.stories.id, id));
    return NextResponse.json({ ok: true, message: 'حُذف الستوري' });
  }
  if (action === 'highlight.save') {
    const user = needsAccount(); const storyIds = list(p, 'storyIds'); if (!storyIds.length) throw new Error('اختر ستوري واحداً على الأقل');
    const title = str(p, 'title', 40, true); const coverUrl = media(str(p, 'coverUrl', 900000), 'image');
    if (p.id) { const [h] = await db.select().from(s.highlights).where(eq(s.highlights.id, int(p, 'id', 1))); if (!h || h.userId !== user.id) throw new Error('أبرزاتك فقط'); await db.update(s.highlights).set({ title, coverUrl, storyIds }).where(eq(s.highlights.id, h.id)); }
    else await db.insert(s.highlights).values({ userId: user.id, title, coverUrl, storyIds });
    return NextResponse.json({ ok: true, message: 'حُدّثت الأبرزات ⭐' });
  }
  if (action === 'highlight.delete') {
    const user = needsAccount(); const [h] = await db.select().from(s.highlights).where(eq(s.highlights.id, int(p, 'id', 1)));
    if (h && h.userId === user.id) await db.delete(s.highlights).where(eq(s.highlights.id, h.id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'note.save') {
    const user = needsAccount(); const text = str(p, 'text', 60, true); const durationHours = int(p, 'durationHours', 1, 24) || 1;
    await db.delete(s.notes).where(eq(s.notes.userId, user.id));
    if (text) await db.insert(s.notes).values({ userId: user.id, text, durationHours, expiresAt: new Date(Date.now() + durationHours * 3600000) });
    return NextResponse.json({ ok: true, message: text ? 'ملاحظتك ظاهرة فوق صورتك' : 'أُزيلت الملاحظة' });
  }

  // ─────────── Follow, friends & profile ───────────
  if (action === 'follow.toggle') {
    const user = needsAccount(); const userId = int(p, 'userId', 1); if (userId === user.id) throw new Error('لا تستطيع متابعة نفسك');
    const existing = await db.select().from(s.follows).where(and(eq(s.follows.followerId, user.id), eq(s.follows.followingId, userId)));
    if (existing.length) { await db.delete(s.follows).where(eq(s.follows.id, existing[0].id)); return NextResponse.json({ ok: true, following: false }); }
    await db.insert(s.follows).values({ followerId: user.id, followingId: userId });
    const [target] = await db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, userId));
    await notify(userId, 'follow', `${user.name} بدأ بمتابعتك`, `/fans/${user.id}`, user.id);
    return NextResponse.json({ ok: true, following: true, message: `تُتابع ${target?.name || 'العضو'} الآن` });
  }
  if (action === 'friend.request') {
    const user = needsAccount(); const userId = int(p, 'userId', 1); if (userId === user.id) throw new Error('لا تستطيع إضافة نفسك');
    const existing = await db.select().from(s.friendRequests).where(and(eq(s.friendRequests.fromId, user.id), eq(s.friendRequests.toId, userId)));
    if (existing.length) { if (existing[0].status === 'accepted') throw new Error('أنتما صديقان بالفعل'); return NextResponse.json({ ok: true, message: 'الطلب مُرسل مسبقاً' }); }
    const inverse = await db.select().from(s.friendRequests).where(and(eq(s.friendRequests.fromId, userId), eq(s.friendRequests.toId, user.id), eq(s.friendRequests.status, 'pending')));
    if (inverse.length) { await db.update(s.friendRequests).set({ status: 'accepted' }).where(eq(s.friendRequests.id, inverse[0].id)); await db.insert(s.follows).values({ followerId: user.id, followingId: userId }).onConflictDoNothing(); await db.insert(s.follows).values({ followerId: userId, followingId: user.id }).onConflictDoNothing(); await notify(userId, 'friend', `${user.name} قبل طلب صداقتك`, `/people`, user.id); return NextResponse.json({ ok: true, message: 'أصبحتما صديقين 🤝' }); }
    await db.insert(s.friendRequests).values({ fromId: user.id, toId: userId });
    await notify(userId, 'friend', `${user.name} أرسل لك طلب صداقة`, '/people', user.id);
    return NextResponse.json({ ok: true, message: 'أُرسل طلب الصداقة' });
  }
  if (action === 'friend.respond') {
    const user = needsAccount(); const id = int(p, 'id', 1); const accept = p.accept === true;
    const [req] = await db.select().from(s.friendRequests).where(eq(s.friendRequests.id, id));
    if (!req || req.toId !== user.id) throw new Error('طلباتك فقط');
    if (accept) { await db.update(s.friendRequests).set({ status: 'accepted' }).where(eq(s.friendRequests.id, id)); for (const [a, b] of [[req.fromId, req.toId], [req.toId, req.fromId]] as const) await db.insert(s.follows).values({ followerId: a, followingId: b }).onConflictDoNothing(); await notify(req.fromId, 'friend', `${user.name} قبل طلب صداقتك`, `/fans/${user.id}`, user.id); }
    else await db.delete(s.friendRequests).where(eq(s.friendRequests.id, id));
    return NextResponse.json({ ok: true, message: accept ? 'تمت الصداقة 🤝' : 'رُفض الطلب' });
  }
  if (action === 'profile.update') {
    const user = needsAccount(); await actor(user.id);
    const socials: Record<string, string> = {};
    for (const key of ['facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'telegram', 'website']) {
      const raw = str(p, `social_${key}`, 300); socials[key] = !raw ? '' : /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
    }
    await db.update(s.users).set({
      bio: str(p, 'bio', 600), socials, showFollowers: p.showFollowers !== false,
      ...(p.name !== undefined ? { name: str(p, 'name', 70, true) } : {}),
      ...(p.avatar !== undefined ? { avatar: media(str(p, 'avatar', 900000), 'image') } : {}),
    }).where(eq(s.users.id, user.id));
    return NextResponse.json({ ok: true, message: 'حُفظ ملفك الشخصي' });
  }
  if (action === 'account.export') {
    const user = needsAccount(); const account = await db.select().from(s.users).where(eq(s.users.id, user.id)).then(r => r[0]);
    if (!account) throw new Error('الحساب غير موجود');
    const [myPosts, myComments, myStories, myHighlights, myNotes, myMessages, myInteractions, myFollows, followsMe] = await Promise.all([
      db.select().from(s.posts).where(eq(s.posts.userId, user.id)), db.select().from(s.comments).where(eq(s.comments.userId, user.id)),
      db.select().from(s.stories).where(eq(s.stories.userId, user.id)), db.select().from(s.highlights).where(eq(s.highlights.userId, user.id)),
      db.select().from(s.notes).where(eq(s.notes.userId, user.id)), db.select().from(s.messages).where(eq(s.messages.userId, user.id)),
      db.select().from(s.interactions).where(eq(s.interactions.userId, user.id)), db.select().from(s.follows).where(eq(s.follows.followerId, user.id)),
      db.select().from(s.follows).where(eq(s.follows.followingId, user.id)),
    ]);
    return NextResponse.json({
      ok: true, data: {
        app: 'manar-user-backup', version: 1, exportedAt: new Date().toISOString(),
        account: { name: account.name, username: account.username, email: account.email, role: account.role, bio: account.bio, avatar: account.avatar, socials: account.socials, createdAt: account.createdAt },
        posts: myPosts, comments: myComments, stories: myStories, highlights: myHighlights, notes: myNotes, messages: myMessages, interactions: myInteractions, follows: myFollows, followers: followsMe.map(f => f.followerId),
      },
    });
  }
  if (action === 'account.import') {
    const user = needsAccount(); const data = p.data as { posts?: unknown[]; comments?: unknown[]; stories?: unknown[]; highlights?: unknown[]; notes?: unknown[]; account?: Record<string, string> } | undefined;
    if (!data) throw new Error('ملف النسخة الاحتياطية غير صالح');
    const mineOnly = (rows?: unknown[]) => (rows as { userId?: number }[] || []).filter(r => !r?.userId || r.userId === user.id) as Record<string, unknown>[];
    await db.transaction(async tx => {
      await tx.delete(s.posts).where(eq(s.posts.userId, user.id));
      await tx.delete(s.stories).where(eq(s.stories.userId, user.id));
      await tx.delete(s.highlights).where(eq(s.highlights.userId, user.id));
      await tx.delete(s.notes).where(eq(s.notes.userId, user.id));
      const restore = async (rows: Record<string, unknown>[], table: typeof s.posts | typeof s.stories | typeof s.highlights | typeof s.notes) => {
        if (!rows.length) return;
        await tx.insert(table).values(rows.map(r => ({ ...r, userId: user.id })) as never);
      };
      await restore((data.posts || []) as Record<string, unknown>[], s.posts);
      await restore(mineOnly(data.stories).map(r => ({ ...r, expiresAt: new Date() })), s.stories);
      await restore((data.highlights || []) as Record<string, unknown>[], s.highlights);
      await restore((data.notes || []) as Record<string, unknown>[], s.notes);
      if (data.account?.bio !== undefined || data.account?.socials !== undefined) await tx.update(s.users).set({ bio: data.account.bio || '', socials: (data.account.socials as never) || {} }).where(eq(s.users.id, user.id));
    });
    return NextResponse.json({ ok: true, message: `استُعيدت بياناتك: ${(data.posts || []).length} منشور` });
  }

  // ─────────── Messages & groups ───────────
  if (action === 'dm.open') {
    const user = needsAccount(); const other = int(p, 'userId', 1); if (other === user.id) throw new Error('اختر عضواً آخر');
    const mine = await db.select({ cid: s.conversationMembers.conversationId }).from(s.conversationMembers).where(eq(s.conversationMembers.userId, user.id));
    for (const { cid } of mine) {
      const members = await db.select({ userId: s.conversationMembers.userId }).from(s.conversationMembers).where(eq(s.conversationMembers.conversationId, cid));
      const [conv] = await db.select().from(s.conversations).where(eq(s.conversations.id, cid));
      if (conv?.kind === 'direct' && members.length === 2 && members.some(m => m.userId === other)) return NextResponse.json({ ok: true, id: cid, existed: true });
    }
    const token = randomBytes(10).toString('hex');
    const [conv] = await db.insert(s.conversations).values({ kind: 'direct', ownerId: user.id, inviteToken: token }).returning();
    await db.insert(s.conversationMembers).values([{ conversationId: conv.id, userId: user.id, role: 'owner' }, { conversationId: conv.id, userId: other, role: 'member' }]);
    return NextResponse.json({ ok: true, id: conv.id, message: 'بدأت المحادثة' });
  }
  if (action === 'group.create') {
    const user = needsAccount(); await actor(user.id);
    const title = str(p, 'title', 60, true); const memberIds = list(p, 'memberIds');
    const [conv] = await db.insert(s.conversations).values({
      kind: 'group', title, description: str(p, 'description', 400), avatarUrl: media(str(p, 'avatarUrl', 900000), 'image'),
      ownerId: user.id, inviteToken: randomBytes(12).toString('hex'),
    }).returning();
    await db.insert(s.conversationMembers).values([{ conversationId: conv.id, userId: user.id, role: 'owner' }, ...memberIds.filter(id => id !== user.id).map(id => ({ conversationId: conv.id, userId: id, role: 'member' as const }))]);
    for (const id of memberIds.filter(x => x !== user.id)) await notify(id, 'group', `${user.name} أضافك لمجموعة «${title}»`, `/social/chat/${conv.id}`, user.id);
    return NextResponse.json({ ok: true, id: conv.id, message: `أُنشئت مجموعة «${title}»` });
  }
  if (action === 'group.update') {
    const user = needsAccount(); const id = int(p, 'id', 1);
    const [meMember] = await db.select().from(s.conversationMembers).where(and(eq(s.conversationMembers.conversationId, id), eq(s.conversationMembers.userId, user.id)));
    if (!meMember || meMember.role === 'member') throw new Error('للمالك والمشرف فقط');
    await db.update(s.conversations).set({
      ...(p.title !== undefined ? { title: str(p, 'title', 60, true) } : {}),
      ...(p.description !== undefined ? { description: str(p, 'description', 400) } : {}),
      ...(p.avatarUrl !== undefined ? { avatarUrl: media(str(p, 'avatarUrl', 900000), 'image') } : {}),
      ...(p.poll !== undefined ? { poll: p.poll ? { question: str(p, 'pollQuestion', 200, true), options: str(p, 'pollOptions', 1200, true).split('\n').map(v => v.trim()).filter(Boolean).slice(0, 6).map((label, i) => ({ id: i + 1, label, votes: [] as number[] })) } : null } : {}),
    }).where(eq(s.conversations.id, id));
    if (p.rotateInvite === true) await db.update(s.conversations).set({ inviteToken: randomBytes(12).toString('hex') }).where(eq(s.conversations.id, id));
    return NextResponse.json({ ok: true, message: 'حُدّثت المجموعة' });
  }
  if (action === 'group.join') {
    const user = needsAccount(); const token = str(p, 'token', 60, true);
    const [conv] = await db.select().from(s.conversations).where(eq(s.conversations.inviteToken, token));
    if (!conv) throw new Error('رابط الدعوة غير صالح أو منتهي');
    await db.insert(s.conversationMembers).values({ conversationId: conv.id, userId: user.id, role: 'member' }).onConflictDoNothing();
    return NextResponse.json({ ok: true, id: conv.id, message: `انضممت إلى «${conv.title}»` });
  }
  if (action === 'group.members') {
    const user = needsAccount(); const id = int(p, 'conversationId', 1);
    const [meMember] = await db.select().from(s.conversationMembers).where(and(eq(s.conversationMembers.conversationId, id), eq(s.conversationMembers.userId, user.id)));
    if (!meMember) throw new Error('لست ضمن هذه المجموعة');
    if (p.action === 'add') { for (const uid of list(p, 'userIds')) await db.insert(s.conversationMembers).values({ conversationId: id, userId: uid, role: 'member' }).onConflictDoNothing(); await notify(list(p, 'userIds')[0], 'group', 'أُضفت إلى محادثة جماعية', `/social/chat/${id}`, user.id); return NextResponse.json({ ok: true, message: 'أُضيف الأعضاء' }); }
    if (p.action === 'role') { const [conv] = await db.select().from(s.conversations).where(eq(s.conversations.id, id)); if (conv?.ownerId !== user.id) throw new Error('للمالك فقط'); await db.update(s.conversationMembers).set({ role: p.role === 'admin' ? 'admin' : 'member' }).where(and(eq(s.conversationMembers.conversationId, id), eq(s.conversationMembers.userId, int(p, 'userId', 1)))); return NextResponse.json({ ok: true }); }
    if (p.action === 'leave' || p.action === 'remove') { const target = p.action === 'remove' ? int(p, 'userId', 1) : user.id; await db.delete(s.conversationMembers).where(and(eq(s.conversationMembers.conversationId, id), eq(s.conversationMembers.userId, target))); return NextResponse.json({ ok: true, message: p.action === 'leave' ? 'غادرت المجموعة' : 'أُزيل العضو' }); }
    return NextResponse.json({ ok: true });
  }
  if (action === 'group.pollVote') {
    const user = needsAccount(); const id = int(p, 'conversationId', 1); const optionId = int(p, 'optionId', 1);
    const [conv] = await db.select().from(s.conversations).where(eq(s.conversations.id, id)); if (!conv?.poll) throw new Error('لا يوجد استطلاع هنا');
    const already = conv.poll.options.some(o => o.votes.includes(user.id));
    if (already) throw new Error('صوّت مسبقاً');
    await db.update(s.conversations).set({ poll: { ...conv.poll, options: conv.poll.options.map(o => o.id === optionId ? { ...o, votes: [...o.votes, user.id] } : o) } }).where(eq(s.conversations.id, id));
    return NextResponse.json({ ok: true, message: 'شكراً لصوتك' });
  }
  if (action === 'message.send') {
    const user = needsAccount(); await actor(user.id);
    const conversationId = int(p, 'conversationId', 1);
    const membership = await db.select().from(s.conversationMembers).where(and(eq(s.conversationMembers.conversationId, conversationId), eq(s.conversationMembers.userId, user.id)));
    if (!membership.length) throw new Error('لست ضمن هذه المحادثة');
    const text = str(p, 'text', 4000); const mediaUrl = media(str(p, 'mediaUrl', 3000000), str(p, 'mediaType', 12) || 'image');
    if (!text && !mediaUrl) throw new Error('اكتب رسالة أو أرفق ملفاً');
    const [msg] = await db.insert(s.messages).values({ conversationId, userId: user.id, text, mediaType: str(p, 'mediaType', 12), mediaUrl, replyTo: p.replyTo ? int(p, 'replyTo', 1) : null }).returning();
    const others = await db.select({ userId: s.conversationMembers.userId }).from(s.conversationMembers).where(eq(s.conversationMembers.conversationId, conversationId));
    for (const o of others.filter(x => x.userId !== user.id)) await notify(o.userId, 'message', `${user.name}: ${text.slice(0, 50) || '📎 مرفق'}`, `/social/chat/${conversationId}`, user.id);
    await db.delete(s.typingSignals).where(and(eq(s.typingSignals.conversationId, conversationId), eq(s.typingSignals.userId, user.id)));
    return NextResponse.json({ ok: true, id: msg.id });
  }
  if (action === 'message.edit') {
    const user = needsAccount(); const [msg] = await db.select().from(s.messages).where(eq(s.messages.id, int(p, 'id', 1)));
    if (!msg || msg.userId !== user.id) throw new Error('تعديل رسائلك فقط');
    await db.update(s.messages).set({ text: str(p, 'text', 4000, true), editedAt: new Date() }).where(eq(s.messages.id, msg.id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'message.delete') {
    const user = needsAccount(); const [msg] = await db.select().from(s.messages).where(eq(s.messages.id, int(p, 'id', 1)));
    if (!msg) return NextResponse.json({ ok: true });
    if (msg.userId !== user.id && !isSuper) throw new Error('حذف رسائلك فقط');
    await db.delete(s.messages).where(eq(s.messages.id, msg.id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'message.pin') {
    const user = needsAccount(); const messageId = int(p, 'id', 1);
    const [msg] = await db.select().from(s.messages).where(eq(s.messages.id, messageId));
    if (!msg) throw new Error('الرسالة غير موجودة');
    const [mem] = await db.select().from(s.conversationMembers).where(and(eq(s.conversationMembers.conversationId, msg.conversationId), eq(s.conversationMembers.userId, user.id)));
    if (!mem || mem.role === 'member') throw new Error('لتثبيت الرسائل تحتاج صلاحية مشرف');
    const existing = await db.select().from(s.pinnedMessages).where(and(eq(s.pinnedMessages.conversationId, msg.conversationId), eq(s.pinnedMessages.messageId, messageId)));
    if (existing.length) await db.delete(s.pinnedMessages).where(eq(s.pinnedMessages.id, existing[0].id)); else await db.insert(s.pinnedMessages).values({ conversationId: msg.conversationId, messageId });
    return NextResponse.json({ ok: true, message: existing.length ? 'أُلغي التثبيت' : 'ثُبّتت الرسالة 📌' });
  }
  if (action === 'conversation.read') {
    const user = needsAccount(); const conversationId = int(p, 'conversationId', 1);
    await db.update(s.conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(s.conversationMembers.conversationId, conversationId), eq(s.conversationMembers.userId, user.id)));
    const unread = await db.select({ id: s.messages.id }).from(s.messages).where(sql`${s.messages.conversationId} = ${conversationId} AND ${s.messages.userId} <> ${user.id}`);
    for (const m of unread.slice(0, 200)) await db.insert(s.messageReads).values({ messageId: m.id, userId: user.id }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  }
  if (action === 'conversation.typing') {
    const user = needsAccount(); const conversationId = int(p, 'conversationId', 1);
    await db.insert(s.typingSignals).values({ conversationId, userId: user.id, at: new Date() }).onConflictDoUpdate({ target: [s.typingSignals.conversationId, s.typingSignals.userId], set: { at: new Date() } });
    return NextResponse.json({ ok: true });
  }

  // ─────────── Notifications ───────────
  if (action === 'notifications.read') {
    const user = needsAccount();
    if (p.all === true) await db.update(s.notifications).set({ read: true }).where(eq(s.notifications.userId, user.id));
    else if (p.id) await db.update(s.notifications).set({ read: true }).where(and(eq(s.notifications.id, int(p, 'id', 1)), eq(s.notifications.userId, user.id)));
    return NextResponse.json({ ok: true });
  }

  // ─────────── Developer control ───────────
  /**
   * Official verification: never a bare toggle. It requires a written reason,
   * records who verified and when, and notifies the member — an auditable act.
   */
  if (action === 'admin.verify') {
    const granted = isSuper || Boolean((me as { permissions?: Record<string, boolean> }).permissions?.canVerifyUsers);
    if (!granted) throw new Error('التوثيق متاح لمدير المنصة أو من يملك صلاحية توثيق الأعضاء');
    const userId = int(p, 'userId', 1); const verified = p.verified !== false;
    const note = str(p, 'note', 300, true);
    if (note.trim().length < 10) throw new Error('اكتب سبباً رسمياً واضحاً (10 أحرف على الأقل) — يُسجَّل في ملف العضو');
    const level = ['blue', 'gold', 'red', 'mint'].includes(String(p.level)) ? String(p.level) : 'blue';
    const [target] = await db.select({ id: s.users.id, name: s.users.name, role: s.users.role, verified: s.users.verified }).from(s.users).where(eq(s.users.id, userId)).limit(1);
    if (!target) throw new Error('العضو غير موجود');
    if (target.role === 'super' && !isSuper) throw new Error('لا يمكن تعديل توثيق حساب المالك');
    await db.update(s.users).set({ verified, verifiedAt: verified ? new Date() : null, verifiedNote: verified ? note.trim() : '', verifiedById: verified ? (me as { id: number }).id : null, ...(verified ? {} : {}) }).where(eq(s.users.id, userId));
    await notify(userId, 'verification', verified ? `تم توثيق حسابك رسمياً من إدارة المنار — ${note.trim().slice(0, 80)}` : `أُلغي توثيق حسابك: ${note.trim().slice(0, 80)}`, '/profile', (me as { id: number }).id);
    return NextResponse.json({ ok: true, level, message: verified ? 'وُثّق الحساب رسمياً وأُرسل إشعار لصاحبه' : 'أُلغي التوثيق وسُجّل السبب' });
  }
  if (action === 'admin.user') {
    if (!isSuper) throw new Error('لمدير المنصة فقط');
    const userId = int(p, 'userId', 1); const what = str(p, 'what', 16, true);
    if (userId === me!.id && ['delete', 'ban'].includes(what)) throw new Error('لا يمكنك حذف أو إيقاف حسابك نفسه');
    if (what === 'verify') await db.update(s.users).set({ verified: p.value === true }).where(eq(s.users.id, userId));
    else if (what === 'ban') await db.update(s.users).set({ banned: p.value === true }).where(eq(s.users.id, userId));
    else if (what === 'restrict') await db.update(s.users).set({ restrictedUntil: p.value === true ? new Date(Date.now() + 7 * 86400000) : null }).where(eq(s.users.id, userId));
    else if (what === 'mute') await db.update(s.users).set({ mutedUntil: p.value === true ? new Date(Date.now() + Number(p.hours || 24) * 3600000) : null }).where(eq(s.users.id, userId));
    else if (what === 'delete') { await db.delete(s.posts).where(eq(s.posts.userId, userId)); await db.delete(s.comments).where(eq(s.comments.userId, userId)); await db.delete(s.stories).where(eq(s.stories.userId, userId)); await db.delete(s.messages).where(eq(s.messages.userId, userId)); await db.delete(s.sessions).where(eq(s.sessions.userId, userId)); const [gone] = await db.select({ authId: s.users.authId }).from(s.users).where(eq(s.users.id, userId)); await db.delete(s.users).where(eq(s.users.id, userId)); if (gone?.authId) { const { supabaseAdmin } = await import('@/integrations/supabase/client.server'); await supabaseAdmin.auth.admin.deleteUser(gone.authId); } }
    else throw new Error('إجراء غير معروف');
    return NextResponse.json({ ok: true, message: 'تم تنفيذ الإجراء على العضو' });
  }
  if (action === 'admin.contact') {
    if (!isSuper) throw new Error('لمدير المنصة فقط');
    const userId = int(p, 'userId', 1); const text = str(p, 'text', 1000, true);
    const opened = await handleSocial('dm.open', { userId }, me);
    const body = (opened ? opened.body : {}) as { id?: number };
    if (body.id) { await db.insert(s.messages).values({ conversationId: body.id, userId: me!.id, text }); await notify(userId, 'admin', `رسالة من إدارة المنصة: ${text.slice(0, 40)}`, `/social/chat/${body.id}`); }
    return NextResponse.json({ ok: true, message: 'أُرسلت الرسالة للعضو' });
  }
  if (action === 'announcement.save') {
    if (!isSuper) throw new Error('لمدير المنصة فقط');
    if (p.id) { if (p.active === undefined) await db.delete(s.announcements).where(eq(s.announcements.id, int(p, 'id', 1))); else await db.update(s.announcements).set({ active: p.active === true }).where(eq(s.announcements.id, int(p, 'id', 1))); }
    else await db.insert(s.announcements).values({ text: str(p, 'text', 500, true), tone: str(p, 'tone', 12) || 'gold', active: true });
    return NextResponse.json({ ok: true, message: 'حُدّث الشريط الإعلاني' });
  }
  if (action === 'settings.save') {
    if (!isSuper) throw new Error('لمدير المنصة فقط');
    const labels: Record<string, string> = {}; for (const key of ['matches', 'teams', 'tournaments', 'standings', 'statistics', 'news', 'polls', 'archive', 'about', 'social', 'studio']) { const v = str(p, `label_${key}`, 40); if (v) labels[key] = v; }
    const moderation = { posts: p.moderatePosts === true, stories: p.moderateStories === true, comments: p.moderateComments !== false, allowPosts: p.allowPosts !== false, allowComments: p.allowComments !== false, allowSignup: p.allowSignup !== false };
    const followerLists: 'public' | 'logged' | 'self' = p.followerLists === 'public' ? 'public' : p.followerLists === 'self' ? 'self' : 'logged';
    const [row] = await db.select().from(s.siteSettings).limit(1);
    const values = { labels: Object.keys(labels).length || p.saveLabels === true ? labels : (row?.labels ?? {}), moderation, privacy: { followerLists } };
    if (row) await db.update(s.siteSettings).set(values).where(eq(s.siteSettings.id, row.id)); else await db.insert(s.siteSettings).values(values);
    return NextResponse.json({ ok: true, message: 'حُدّثت إعدادات الواجهة والصلاحيات' });
  }
  return null;
}
