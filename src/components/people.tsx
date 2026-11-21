'use client';
import { useState } from 'react';
import Link from '@/lib/next-shims/link';
import { Users, UserPlus, UserCheck, BadgeCheck, MessageSquare, Camera, Archive, Star, Share2, Check, X, Globe, Lock, ShieldAlert } from 'lucide-react';
import { useApp } from './context';
import { Modal, Spinner, EmptyState, FormField } from './ui';
import { UserName, VerificationCard } from './badge';
import { profileOf, PostCard, counts } from './social';
import { RelTime } from './times';
import { mediaFile, copyText } from '@/lib/utils';
import type { Snapshot } from '@/lib/data';

export function followState(data: Snapshot, userId: number) {
  const me = data.me?.id;
  return { following: data.followingOf.includes(userId), isFriend: data.friendIds.includes(userId), isMe: me === userId };
}
export function PersonRow({ userId, right = true }: { userId: number; right?: boolean }) {
  const { data, act, openLogin } = useApp(); const p = profileOf(data, userId); if (!p) return null;
  const { following, isFriend, isMe } = followState(data, userId);
  const pending = data.requests.some(r => r.fromId === data.me?.id && r.toId === userId && r.status === 'pending');
  return <div className="people-row">
    <Link href={`/fans/${p.id}`} className="avatar !w-11 !h-11 overflow-hidden shrink-0">{p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.name[0]}</Link>
    <div className="who"><UserName user={p} />
      <span dir="ltr">@{p.username} · <RelTime date={p.createdAt} /> انضم للمنصة</span></div>
    {!isMe && right && <div className="flex gap-2 shrink-0">
      {isFriend ? <span className="badge badge-green"><UserCheck size={12} />صديق</span>
        : <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => (data.me ? act('friend.request', { userId }) : openLogin())}>{pending ? 'بانتظار الرد' : <><UserPlus size={13} />صداقة</>}</button>}
      <button className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={() => (data.me ? act('follow.toggle', { userId }) : openLogin())}>{following ? 'تتابعه' : 'متابعة'}</button>
      <Link href={`/fans/${p.id}`} className="icon-btn !w-8 !h-8" aria-label="الملف الشخصي"><MessageSquare size={13} /></Link>
    </div>}
  </div>;
}

export function PeopleView() {
  const { data, act } = useApp(); const me = data.me;
  const [tab, setTab] = useState<'followers' | 'following' | 'friends' | 'requests' | 'all'>('followers');
  const followers = me ? (data.followersOf[me.id] || []) : [];
  const following = data.followingOf;
  const requests = data.requests.filter(r => r.status === 'pending' && r.toId === me?.id);
  const listsHidden = data.privacy?.followerLists === 'self' && data.me?.role !== 'super';
  const rows = tab === 'followers' ? followers : tab === 'following' ? following : tab === 'friends' ? data.friendIds : [];
  const title: Record<string, string> = { followers: 'متابعيَّ', following: 'أتابعهم', friends: 'أصدقائي', requests: 'طلبات الصداقة', all: 'كل الأعضاء' };
  return <>
    <div className="page-heading"><div><div className="tagline"><Users size={12} />شبكة منصة الفهود الرياضية</div><h1>الأصدقاء والمتابعون</h1><p>قوائم كاملة بأسلوب فيسبوك وإنستغرام، تحت سيطرة إدارة المنصة.</p></div>
      <span className="badge badge-muted"><Lock size={12} />{listsHidden ? "القوائم مقفلة من الإدارة" : (data.profiles.find(x => x.id === data.me?.id)?.showFollowers === false ? "قوائمي خاصة بي" : "قوائمي ظاهرة للأعضاء")}</span></div>
    <div className="tabs mb-4">{(['followers', 'following', 'friends', 'requests', 'all'] as const).map(k => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{title[k]}{k === 'followers' && ` (${followers.length})`}{k === 'following' && ` (${following.length})`}{k === 'friends' && ` (${data.friendIds.length})`}{k === 'requests' && requests.length ? ` (${requests.length})` : ''}</button>)}</div>
    <div className="panel">
      {tab === 'requests' ? (requests.length ? requests.map(r => { const p = profileOf(data, r.fromId); return <div key={r.id} className="people-row"><span className="avatar">{p?.name?.[0]}</span><div className="who"><b>{p?.name}</b><span>أرسل لك طلب صداقة</span></div><div className="flex gap-2"><button className="btn btn-primary btn-sm" onClick={() => act('friend.respond', { id: r.id, accept: true })}>قبول</button><button className="btn btn-ghost btn-sm" onClick={() => act('friend.respond', { id: r.id, accept: false })}>رفض</button></div></div>; }) : <EmptyState title="لا طلبات لديك" />)
        : tab === 'all' ? (data.profiles.filter(p => p.id !== me?.id).map(p => <PersonRow key={p.id} userId={p.id} />))
          : listsHidden && tab !== 'friends' ? <EmptyState title="القوائم غير متاحة" description="أغلقت إدارة المنصة عرض قوائم المتابعين والأصدقاء." />
            : rows.length ? rows.map(id => <PersonRow key={id} userId={id} />) : <EmptyState title={tab === 'followers' ? 'لا متابعين بعد' : tab === 'following' ? 'لم تبدأ المتابعة بعد' : 'لا أصدقاء بعد'} description="تابع أعضاء ملاعبنا، وقوائمك ستكبر هنا." />}
    </div>
    {tab === 'followers' && data.me && <p className="text-[10px] muted mt-3 flex items-center gap-2"><Lock size={12} />يمكنك إخفاء قوائمك من ملفك الشخصي ← إعدادات الخصوصية</p>}
  </>;
}

/** Public profile card: stats, socials, highlights, follow actions and content. */
export function PublicProfile({ id }: { id: number }) {
  const { data, act, notify, openLogin } = useApp();
  const p = profileOf(data, id);
  const posts = data.posts.filter(x => x.userId === id);
  const stories = data.stories.filter(s => s.userId === id && !s.archived);
  const highlights = data.highlights.filter(h => h.userId === id);
  const followers = data.followersOf[id] || []; const followingCount = data.follows.filter(f => f.followerId === id).length;
  const { following, isFriend, isMe } = followState(data, id);
  const canSeeLists = p?.showFollowers !== false && (data.me || data.privacy?.followerLists === 'public') && data.privacy?.followerLists !== 'self';
  const [openLists, setOpenLists] = useState<'followers' | 'following' | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(data.notes.find(n => n.userId === id)?.text || '');
  if (!p) return <div className="panel p-10 text-center"><p className="text-sm muted">العضو غير موجود.</p></div>;
  const socialKeys: [string, string][] = [['facebook', 'فيسبوك'], ['instagram', 'إنستغرام'], ['tiktok', 'تيك توك'], ['youtube', 'يوتيوب'], ['whatsapp', 'واتساب'], ['telegram', 'تيليجرام'], ['website', 'موقع']];
  return <>
    <section className="panel profile-hero" style={{ borderRight: '4px solid var(--mint)' }}>
      <div className="avatar !w-24 !h-24 text-3xl overflow-hidden relative">{p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : p.name[0]}
        {stories.length > 0 && <span className="absolute -inset-1 rounded-full border-2 border-mint pointer-events-none" />}</div>
      <div className="flex-1 min-w-0"><h1 className="text-2xl"><UserName user={p} size="lg" /></h1>
        <span className="text-xs muted block mt-1" dir="ltr">@{p.username}</span>
        {p.bio && <p className="text-[13px] leading-7 mt-3 text-slate-300 max-w-2xl">{p.bio}</p>}
        {data.notes.find(n => n.userId === id) && <p className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-[#1d352c] border border-gold/25 text-[11px] gold">📝 {data.notes.find(n => n.userId === id)!.text}</p>}
        <VerificationCard user={p} />
        <div className="profile-meta mt-4">
          <span>{p.role === 'super' ? 'مدير المنصة' : p.role === 'team' ? 'إداري فريق' : p.role === 'referee' ? 'حكم رسمي' : 'من جماهير المنار'}</span>
          {p.teamId ? <Link href={`/teams/${p.teamId}`} className="hover:text-mint">فريقه: {data.teams.find(t => t.id === p.teamId)?.name}</Link> : null}
          <span>عضو منذ {new Date(p.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' })}</span>
        </div></div>
      <div className="flex flex-col gap-2 shrink-0">
        {!isMe && <div className="flex gap-2">
          <button className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={() => (data.me ? act('follow.toggle', { userId: id }) : openLogin())}>{following ? 'تتابعه ✓' : 'متابعة'}</button>
          {data.me && <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await act('dm.open', { userId: id }); if (r?.id) window.location.href = `/social/chat/${r.id}`; }}><MessageSquare size={14} />مراسلة</button>}
        </div>}
        {!isMe && !isFriend && data.me && <button className="btn btn-ghost btn-sm" onClick={() => act('friend.request', { userId: id })}><UserPlus size={14} />إضافة صديق</button>}
        {isMe && <div className="flex gap-2"><Link href="/profile" className="btn btn-secondary btn-sm">تعديل ملفي</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => setNoteOpen(true)}><Camera size={14} />ملاحظتي</button>
          <button className="icon-btn" aria-label="مشاركة رابط ملفي" onClick={async () => { try { await copyText(window.location.origin + `/fans/${id}`); notify('نُسخ رابط ملفك'); } catch { /* ignore */ } }}><Share2 size={14} /></button></div>}
      </div>
    </section>
    <div className="panel stat-strip !py-5">
      {[[posts.length, 'منشور'], [followers.length, 'متابع'], [followingCount, 'يتابع'], [isFriend ? 1 : 0, 'صديق']].map(([v, l]) => <div key={String(l)}><strong className="num">{v as number}</strong><span>{l as string}</span></div>)}
      <button type="button" onClick={() => canSeeLists && setOpenLists('followers')} className="cursor-pointer"><strong className="num">{canSeeLists ? followers.length : '—'}</strong><span>قائمة المتابعين</span></button>
    </div>
    {highlights.length > 0 && <div className="panel p-5 mb-5"><h2 className="panel-title mb-3"><Star size={16} className="gold" />الأبرزات</h2><div className="highlight-row">{highlights.map(h => <button key={h.id} className="hl-item" onClick={() => notify('افتح تبويب الستوري لمشاهدة مجموعتك')}>
      <span className="hl-cover">{h.coverUrl ? <img src={h.coverUrl} alt="" /> : <Archive size={18} />}</span><span className="text-[10px]">{h.title}</span><span className="text-[9px] muted">{h.storyIds.length} ستوري</span>
    </button>)}</div></div>}
    {socialKeys.some(([k]) => p.socials?.[k]) && <div className="panel p-5 mb-5"><h2 className="panel-title mb-3"><Globe size={16} className="mint" />حساباته</h2><div className="flex flex-wrap gap-2">{socialKeys.filter(([k]) => p.socials?.[k]).map(([k, label]) => <a key={k} className="btn btn-ghost btn-sm" href={p.socials![k]} target="_blank" rel="noopener noreferrer" dir="ltr">{label}<Share2 size={12} /></a>)}</div></div>}
    <div className="flex items-center justify-between mt-6 mb-3"><h2 className="text-lg display">منشورات {p.name.split(' ')[0]}</h2>{data.me?.role === 'super' && !isMe && <Link href="/admin" className="text-link !text-[10px]">إدارة العضو من اللوحة<ShieldAlert size={12} /></Link>}</div>
    {posts.length ? <div className="flex flex-col gap-5">{posts.map(x => <PostCard key={x.id} post={x} />)}</div> : <div className="panel"><EmptyState title="لا منشورات ظاهرة" description="النشر في الساحة يبدأ من صفحة الساحة." /></div>}
    {openLists && <Modal title={openLists === 'followers' ? 'قائمة المتابعين' : 'من يتابعهم'} onClose={() => setOpenLists(null)}>
      <div className="people-list">{(openLists === 'followers' ? followers : data.follows.filter(f => f.followerId === id).map(f => f.followingId)).map(uid => <PersonRow key={uid} userId={uid} right={false} />)}{!(openLists === 'followers' ? followers.length : followingCount) && <p className="text-xs muted p-4 text-center">القائمة فارغة.</p>}</div>
    </Modal>}
    {noteOpen && <Modal title="ملاحظتك القصيرة" onClose={() => setNoteOpen(false)}><FormField label="حتى 60 حرفاً" hint="تظهر فوق صورتك في الساحة والقوائم"><input className="input" maxLength={60} value={note} onChange={e => setNote(e.target.value)} /></FormField><div className="form-actions"><button className="btn btn-ghost" onClick={() => setNoteOpen(false)}>إلغاء</button><button className="btn btn-primary" onClick={async () => { await act('note.save', { text: note, durationHours: 12 }); setNoteOpen(false); }}><Check size={15} />حفظ</button></div></Modal>}
  </>;
}
