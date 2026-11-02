'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/lib/next-shims/link';
import { Image as ImageIcon, Images, Video, Clapperboard, BarChart3, Type, Heart, MessageCircle, Bookmark, Repeat2, Share2, Volume2, VolumeX, X, Clock, Eye, Trash2, Pencil, Check, Users, Lock, Globe, UserCheck, Plus, Camera, Archive, ListChecks } from 'lucide-react';
import { useApp } from './context';
import { Modal, Spinner, EmptyState, FormField } from './ui';
import { UserName } from './badge';
import { RelTime } from './times';
import { mediaFile, copyText } from '@/lib/utils';
import type { Post, Snapshot } from '@/lib/data';

type Profile = Snapshot['profiles'][number];
type Privacy = 'public' | 'friends' | 'followers' | 'specific' | 'exclude';
export const privacyLabels: Record<Privacy, { label: string; Icon: typeof Globe }> = {
  public: { label: 'للعام', Icon: Globe }, friends: { label: 'للأصدقاء فقط', Icon: UserCheck }, followers: { label: 'لمتابعيك', Icon: Users },
  specific: { label: 'أشخاص محددين', Icon: Lock }, exclude: { label: 'معروض عدا أشخاص', Icon: Lock },
};
export function profileOf(data: Snapshot, id?: number | null): Profile | undefined { return data.profiles.find(p => p.id === id); }
export function counts(data: Snapshot, targetType: 'post' | 'comment', id: number) {
  const rows = data.interactions.filter(i => i.targetType === targetType && i.targetId === id);
  return { likes: rows.filter(i => i.kind === 'like').length, loves: rows.filter(i => i.kind === 'love').length, saves: rows.filter(i => i.kind === 'save').length, reposts: rows.filter(i => i.kind === 'repost').length, mine: (kind: string) => rows.some(i => i.kind === kind && i.userId === data.me?.id) };
}
export function timeAgo(date: string | Date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'الآن'; if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`; if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
}
const Media = ({ src, kind }: { src: string; kind: string }) => {
  const isVideo = kind === 'video' || kind === 'reel' || /\.(mp4|webm|mov)(\?|$)/i.test(src) || src.startsWith('data:video');
  return isVideo ? <video src={src} controls playsInline preload="metadata" /> : <img src={src} alt="" loading="lazy" />;
};

/** Instagram-style album: swipe/arrow/drag between images, dots + 1/N counter, fullscreen viewer. */
export function Carousel({ items, type = 'image' }: { items: string[]; type?: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const startX = useRef<number | null>(null);
  const total = items.length;
  const go = (dir: number) => setIndex(i => Math.min(total - 1, Math.max(0, i + dir)));
  useEffect(() => {
    if (!full) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); if (e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowRight') go(-1); };
    document.addEventListener('keydown', key); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [full, total]);
  if (!total) return null;
  const single = total === 1 || type === 'video' || type === 'reel';
  if (single) return (
    <div className={`post-media ${type === 'reel' ? 'reel' : ''}`}>
      {type === 'video' || type === 'reel' || items[0].startsWith('data:video') || /\.(mp4|webm|mov)(\?|$)/i.test(items[0])
        ? <video src={items[0]} controls playsInline preload="metadata" />
        : <button className="w-full h-full" onClick={() => setFull(true)} aria-label="فتح الصورة بالحجم الكامل"><img src={items[0]} alt="" loading="lazy" /></button>}
      {full && <MediaLightbox items={items} index={0} onClose={() => setFull(false)} />}
    </div>
  );
  return <div className="post-media album" role="group" aria-label={`صورة ${index + 1} من ${total}`}
    onPointerDown={e => { startX.current = e.clientX; }}
    onPointerUp={e => { if (startX.current === null) return; const dx = e.clientX - startX.current; startX.current = null; if (Math.abs(dx) > 34) go(dx < 0 ? 1 : -1); }}
    onKeyDown={e => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); if (e.key === 'Enter') setFull(true); }}
    tabIndex={0}>
    <div className="album-track" dir="ltr" style={{ transform: `translateX(-${index * 100}%)` }}>
      {items.map((src, i) => <img key={i} src={src} alt={`صورة ${i + 1}`} loading={i ? 'lazy' : 'eager'} onClick={() => setFull(true)} />)}
    </div>
    <span className="album-counter num" dir="ltr">{index + 1}/{total}</span>
    {index > 0 && <button className="album-nav right" onClick={e => { e.stopPropagation(); go(-1); }} aria-label="السابق">›</button>}
    {index < total - 1 && <button className="album-nav left" onClick={e => { e.stopPropagation(); go(1); }} aria-label="التالي">‹</button>}
    <div className="album-dots">{items.map((_, i) => <i key={i} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} />)}</div>
    <span className="album-hint"><Eye size={11} /> اسحب أو استخدم الأسهم</span>
    {full && <MediaLightbox items={items} index={index} setIndex={setIndex} onClose={() => setFull(false)} />}
  </div>;
}
function MediaLightbox({ items, index, setIndex, onClose }: { items: string[]; index: number; setIndex?: (i: number) => void; onClose: () => void }) {
  const go = (d: number) => setIndex?.(Math.min(items.length - 1, Math.max(0, index + d)));
  return <div className="lightbox" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className="icon-btn absolute top-4 left-4 z-10" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
    <span className="lightbox-counter num" dir="ltr">{index + 1} / {items.length}</span>
    {items[index] && (/\.(mp4|webm|mov)(\?|$)/i.test(items[index]) || items[index].startsWith('data:video') ? <video src={items[index]} controls autoPlay className="max-h-[86vh]" /> : <img src={items[index]} alt="" className="max-h-[86vh] object-contain" />)}
    {index > 0 && <button className="lightbox-nav right" onClick={() => go(-1)} aria-label="السابق">›</button>}
    {index < items.length - 1 && <button className="lightbox-nav left" onClick={() => go(1)} aria-label="التالي">‹</button>}
  </div>;
}

/** A single feed card — reused in the feed, the comment page and profiles. */
export function PostCard({ post, showAllComments = false }: { post: Post; showAllComments?: boolean }) {
  const { data, act, notify, openLogin, remove } = useApp();
  const author = profileOf(data, post.userId);
  const original = post.repostOf ? data.posts.find(p => p.id === post.repostOf) : undefined;
  const c = counts(data, 'post', post.id);
  const comments = data.comments.filter(x => x.targetType === 'post' && x.targetId === post.id && !x.parentId);
  const [openAll, setOpenAll] = useState(showAllComments);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const mine = data.me?.id === post.userId;
  const Privacy = privacyLabels[post.privacy as Privacy]?.Icon || Globe;
  async function react(kind: 'like' | 'love' | 'save' | 'repost') {
    if (!data.me) { openLogin(); return; }
    if (kind === 'repost') { const r = await act('post.create', { type: 'repost', repostOf: post.id, body: '' }); if (r) notify('أُعيد النشر في ساحتك 🔁'); return; }
    await act('react', { targetType: 'post', targetId: post.id, kind }, { silent: true });
  }
  async function share() {
    const url = `${window.location.origin}/social/post/${post.id}`;
    const native = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try { if (native.share) await native.share({ title: 'كرة المنار', text: post.body.slice(0, 120), url }); else { await copyText(url); notify('نُسخ رابط المنشور — شاركه وين ما تحب'); } } catch { /* the share sheet was dismissed */ }
  }
  const isLiked = c.mine('like'); const isLoved = c.mine('love'); const isSaved = c.mine('save');
  const shown = openAll ? comments : comments.slice(0, 3);
  return <article className="panel post-card" id={`post-${post.id}`}>
    <div className="post-head">
      <Link href={`/fans/${author?.id}`} className="avatar overflow-hidden !w-11 !h-11" aria-label={author?.name}>{author?.avatar ? <img src={author.avatar} alt="" className="w-full h-full object-cover" /> : author?.name?.[0]}</Link>
      <div className="who">
        <UserName user={author} />
        <span><RelTime date={post.createdAt} />{post.editedAt ? ' · مُعدل' : ''} · {privacyLabels[post.privacy as Privacy]?.label || 'للعام'} · <Eye size={10} className="inline" /> {post.views}</span>
      </div>
      <span className="privacy-chip"><Privacy size={13} /></span>
      {mine && <button className="icon-btn !w-8 !h-8" aria-label="تعديل المنشور" onClick={() => setEditing(true)}><Pencil size={13} /></button>}
      {(mine || data.me?.role === 'super') && <button className="icon-btn !w-8 !h-8" aria-label="حذف المنشور" onClick={() => remove('post.delete', post.id, 'حذف المنشور وكل ما مرتبط به من تعليقات وتفاعلات؟')}><Trash2 size={13} /></button>}
    </div>
    {post.repostOf && <div className="px-4 pb-2 text-[10px] muted flex items-center gap-2"><Repeat2 size={12} />إعادة نشر من {profileOf(data, original?.userId)?.name || 'عضو'}</div>}
    {original && !post.mediaUrl && <div className="post-body">{original.body}</div>}
    {(() => { const list = post.mediaUrls?.length ? post.mediaUrls : (post.mediaUrl ? [post.mediaUrl] : original?.mediaUrl ? (original.mediaUrls?.length ? original.mediaUrls : [original.mediaUrl]) : []); return list.length ? <Carousel items={list} type={post.type === 'reel' || post.type === 'video' ? post.type : 'image'} /> : null; })()}
    {post.body && <div className="post-body">{post.body.split(/(#[\u0600-\u064Fa-z0-9_]{2,30})/gi).map((part, i) => part.startsWith('#') ? <Link key={i} className="tag" href={`/social?tag=${encodeURIComponent(part)}`}>{part}</Link> : <span key={i}>{part}</span>)}</div>}
    {post.type === 'poll' && post.pollOptions.length > 0 && <div className="post-poll">{(() => {
      const total = post.pollOptions.reduce((sum, o) => sum + o.votes, 0);
      const mineChoice = Object.entries(post.pollVoters).find(([uid]) => Number(uid) === data.me?.id)?.[1];
      return post.pollOptions.map(o => <button key={o.id} disabled={!data.me || Boolean(mineChoice)} className="poll-option" onClick={() => act('post.vote', { id: post.id, optionId: o.id })}>
        <span className="poll-option-fill" style={{ width: total ? `${Math.round(o.votes / total * 100)}%` : 0 }} />
        <span className="relative flex items-center gap-2 text-xs">{mineChoice === o.id && <Check size={13} className="mint" />}{o.label}</span>
        <span className="relative text-[11px] mint" dir="ltr">{mineChoice ? `${total ? Math.round(o.votes / total * 100) : 0}%` : 'صوّت'}</span>
      </button>);
    })()}</div>}
    <div className="post-actions">
      <button className={`act ${isLiked ? 'on' : ''}`} onClick={() => react('like')} aria-label="أعجبني"><Heart size={17} fill={isLiked ? 'currentColor' : 'none'} /><span className="num">{c.likes + c.loves || ''}</span></button>
      <button className={`act love ${isLoved ? 'on' : ''}`} onClick={() => react('love')} aria-label="أحببته"><Heart size={17} fill={isLoved ? 'currentColor' : 'none'} /><span className="num">{c.loves || ''}</span></button>
      <button className="act" onClick={() => (comments.length ? setOpenAll(v => !v) : notify('لا توجد تعليقات بعد — كن الأول'))} aria-label="التعليقات"><MessageCircle size={17} /><span className="num">{comments.length || ''}</span></button>
      <button className={`act ${isSaved ? 'saved' : ''}`} onClick={() => react('save')} aria-label="حفظ في مفضلتي"><Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} /></button>
      <button className="act" onClick={() => react('repost')} aria-label="إعادة نشر"><Repeat2 size={17} /><span className="num">{c.reposts || ''}</span></button>
      <button className="act" onClick={share} aria-label="مشاركة"><Share2 size={17} /></button>
      {!showAllComments && comments.length > 3 && <Link className="text-link !text-[10px] mr-auto" href={`/social/post/${post.id}`}>عرض كل التعليقات<ArrowLeftLike /></Link>}
    </div>
    {post.status === 'pending' && <div className="px-4 pb-3"><span className="pending-note"><Clock size={12} />منشورك في قائمة المراجعة وسيظهر بعد اعتماد الإدارة</span></div>}
    {shown.length > 0 && <div className="post-comments">{shown.map(x => <Comment key={x.id} comment={x} postId={post.id} />)}</div>}
    {data.me ? <form className="flex gap-2 px-4 pb-4" onSubmit={async e => { e.preventDefault(); if (!draft.trim()) return; const r = await act('comment.create', { targetType: 'post', targetId: post.id, body: draft }); if (r) setDraft(''); }}>
      <input className="input flex-1 !min-h-10" placeholder="اكتب تعليقك يا بطل…" value={draft} onChange={e => setDraft(e.target.value)} maxLength={1000} aria-label="تعليق جديد" />
      <button className="btn btn-primary btn-sm"><Send size={14} /></button>
    </form> : <div className="px-4 pb-4 text-[11px] muted">سجّل دخولك لتعلّق وتفاعل 📝</div>}
    {editing && <EditPostModal post={post} onClose={() => setEditing(false)} />}
  </article>;
}
function ArrowLeftLike() { return <span className="opacity-60">←</span>; }
function Send({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 3.5 6 6-11 11-6-1 1-6Z" /><path d="m9 15-2 2" /></svg>; }

function EditPostModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const { act } = useApp();
  const [body, setBody] = useState(post.body);
  const [privacy, setPrivacy] = useState<Privacy>(post.privacy as Privacy);
  const [audience, setAudience] = useState<number[]>(post.audience);
  const people = useApp().data.profiles.filter(p => p.id !== post.userId);
  return <Modal title="تعديل المنشور" onClose={onClose}>
    <div className="flex flex-col gap-4">
      <FormField label="نص المنشور"><textarea className="input" rows={4} value={body} onChange={e => setBody(e.target.value)} maxLength={4000} /></FormField>
      <FormField label="من يستطيع الرؤية"><select className="input" value={privacy} onChange={e => setPrivacy(e.target.value as Privacy)}>{Object.entries(privacyLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></FormField>
      {(privacy === 'specific' || privacy === 'exclude') && <div className="flex flex-col gap-1 max-h-52 overflow-auto">{people.map(p => <label key={p.id} className="flex items-center gap-2 text-xs p-1.5"><input type="checkbox" checked={audience.includes(p.id)} onChange={e => setAudience(a => e.target.checked ? [...a, p.id] : a.filter(x => x !== p.id))} />{p.name}</label>)}</div>}
      <div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إلغاء</button><button className="btn btn-primary" onClick={async () => { await act('post.edit', { id: post.id, body, privacy, audience }); onClose(); }}><Check size={15} />حفظ التعديل</button></div>
    </div>
  </Modal>;
}

export function Comment({ comment, postId, depth = 0 }: { comment: Snapshot['comments'][number]; postId: number; depth?: number }) {
  const { data, act, remove } = useApp();
  const author = profileOf(data, comment.userId); const c = counts(data, 'comment', comment.id);
  const replies = data.comments.filter(x => x.parentId === comment.id);
  const [replying, setReplying] = useState(false); const [text, setText] = useState(''); const [media, setMedia] = useState('');
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(comment.body);
  const mine = data.me?.id === comment.userId;
  return <div className="mini-comment" style={{ marginLeft: depth ? 22 : 0 }} id={`comment-${comment.id}`}>
    <Link href={author ? `/fans/${author.id}` : '#'} className="avatar shrink-0 overflow-hidden">{author?.avatar ? <img src={author.avatar} alt="" className="w-full h-full object-cover" /> : comment.name[0]}</Link>
    <div className="bubble">
      <UserName user={author ? { ...author, name: comment.name } : { name: comment.name, id: comment.userId ?? undefined }} size="sm" />{comment.editedAt && <span className="muted font-normal text-[9px]"> · مُعدل</span>}
      {editing
        ? <div className="flex gap-2 mt-2"><input className="input !min-h-9 !py-1 text-xs" value={draft} onChange={e => setDraft(e.target.value)} /><button className="btn btn-primary btn-sm" onClick={async () => { await act('comment.edit', { id: comment.id, body: draft }); setEditing(false); }}><Check size={13} /></button></div>
        : <p>{comment.body}</p>}
      {comment.mediaUrl && <img src={comment.mediaUrl} alt="" loading="lazy" className="reply-media" />}
      {comment.status === 'pending' && <div className="pending-note mt-2"><Clock size={11} />بانتظار اعتماد الإدارة</div>}
      <div className="tools">
        <RelTime date={comment.createdAt} className="num" />
        <button onClick={() => act('react', { targetType: 'comment', targetId: comment.id, kind: 'like' }, { silent: true })} className={c.mine('like') ? 'mint' : ''}>❤ {c.likes + c.loves || ''}</button>
        {data.me && <button onClick={() => setReplying(v => !v)}>رد</button>}
        {mine && <button onClick={() => setEditing(v => !v)}>تعديل</button>}
        {(mine || data.me?.role === 'super') && <button onClick={() => remove('comment.remove', comment.id, 'حذف التعليق وكل ردوده؟')}>حذف</button>}
      </div>
      {replying && <form className="flex gap-2 mt-2" onSubmit={async e => { e.preventDefault(); if (!text.trim() && !media) return; const r = await act('comment.create', { targetType: 'post', targetId: postId, body: text, parentId: comment.id, mediaUrl: media }); if (r) { setText(''); setMedia(''); setReplying(false); } }}>
        <input className="input !min-h-9 !py-1 text-xs flex-1" placeholder="ردّك…" value={text} onChange={e => setText(e.target.value)} aria-label="رد" />
        <label className="icon-btn !w-9 !h-9 cursor-pointer" title="إرفاق صورة"><Camera size={14} /><input type="file" accept="image/*" className="sr-only" onChange={async ev => { const f = ev.target.files?.[0]; ev.currentTarget.value = ''; if (!f) return; try { setMedia(await mediaFile(f, 'image', 6)); } catch { /* ignored */ } }} /></label>
        <button className="btn btn-primary btn-sm" disabled={!text.trim() && !media}><span className="text-[13px]">↵</span></button>
      </form>}
      {replies.length > 0 && <div className="flex flex-col gap-3 mt-3">{replies.map(r => <Comment key={r.id} comment={r} postId={postId} depth={1} />)}</div>}
    </div>
  </div>;
}

export function Composer() {
  const { data, act, notify } = useApp();
  const [type, setType] = useState<'text' | 'image' | 'video' | 'reel' | 'poll'>('text');
  const [body, setBody] = useState(''); const [mediaUrl, setMediaUrl] = useState(''); const [album, setAlbum] = useState<string[]>([]); const [poll, setPoll] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public'); const [audience, setAudience] = useState<number[]>([]);
  const [busy, setBusy] = useState(false); const [pickPeople, setPickPeople] = useState(false);
  const people = data.profiles.filter(p => p.id !== data.me?.id);
  // A text post can still carry photos — so the picker is always reachable, like Facebook/Instagram.
  const showImagePicker = type === 'image' || type === 'text';
  async function submit() {
    setBusy(true);
    const finalType = type === 'text' && album.length ? 'image' : type;
    const r = await act('post.create', { type: finalType, body, mediaUrl, mediaUrls: finalType === 'image' ? album : [], pollOptions: poll, privacy, audience });
    setBusy(false);
    if (r) { setBody(''); setMediaUrl(''); setAlbum([]); setPoll(''); setAudience([]); setType('text'); }
  }
  const types: ['text' | 'image' | 'video' | 'reel' | 'poll', string, typeof ImageIcon][] = [['text', 'نص', Type], ['image', 'صورة', ImageIcon], ['video', 'فيديو', Video], ['reel', 'ريلز', Clapperboard], ['poll', 'استطلاع', BarChart3]];
  if (!data.me) return <div className="panel p-5 mb-5 text-center"><Users size={26} className="mint mx-auto mb-3" /><h3 className="text-sm">الساحة للأعضاء</h3><p className="text-[11px] muted mt-2 leading-7">أنشئ حسابك بالبريد وكلمة المرور، ثم انشر صور وملفات وفديوهات وشغّف مع الجماهير.</p></div>;
  return <div className="panel p-4 mb-5">
    <div className="flex gap-2 items-start">
      <div className="avatar overflow-hidden shrink-0 !w-10 !h-10">{data.me.avatar ? <img src={data.me.avatar} alt="" className="w-full h-full object-cover" /> : data.me.name[0]}</div>
      <textarea className="input flex-1 resize-y !min-h-11" rows={2} placeholder="شنو تحب تشارك اليوم؟" value={body} onChange={e => setBody(e.target.value)} maxLength={4000} aria-label="نص المنشور" />
    </div>
    {showImagePicker && <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn btn-secondary btn-sm cursor-pointer" htmlFor="manar-album-input"><Images size={14} />اختيار الصور{album.length ? ` (${album.length}/10)` : ''}</label>
        {album.length > 0 && <>
          <label className="btn btn-ghost btn-sm cursor-pointer" htmlFor="manar-album-input"><Plus size={13} />إضافة صور</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAlbum([])}>مسح الكل</button>
        </>}
        <span className="text-[10px] muted">صورة واحدة أو عدة صور — حتى 10 صور تُنشر كالبوم قابل للسحب{type === 'text' && album.length ? ' (سيتحوّل تلقائياً إلى منشور صور)' : ''}.</span>
      </div>
      <input id="manar-album-input" type="file" accept="image/*" multiple className="sr-only" onChange={async e => {
        const picked = Array.from(e.target.files || []); e.currentTarget.value = ''; if (!picked.length) return;
        const room = 10 - album.length; const usable = picked.slice(0, Math.max(0, room));
        try {
          const encoded = await Promise.all(usable.map(f => mediaFile(f, 'image', 8)));
          setAlbum(a => [...a, ...encoded].slice(0, 10));
          notify(`أُضيفت ${encoded.length} صورة${picked.length > usable.length ? ' — بقية الصور تجاوزت حد 10 فتم تجاهلها' : ''}`);
        } catch (err) { notify((err as Error).message, true); }
      }} />
      {album.length > 0 && <div className="album-picker">
        {album.map((src, i) => <div key={`${i}-${src.slice(-24)}`} className="album-cell">
          <img src={src} alt={`صورة ${i + 1}`} />
          {i === 0 && <span className="album-first">الغلاف</span>}
          <button type="button" className="icon-btn !w-6 !h-6 absolute top-1 left-1" onClick={() => setAlbum(a => a.filter((_, j) => j !== i))} aria-label={`إزالة الصورة ${i + 1}`}><X size={12} /></button>
          <div className="album-order">
            <button type="button" disabled={i === 0} onClick={() => setAlbum(a => { const t = [...a]; [t[i - 1], t[i]] = [t[i], t[i - 1]]; return t; })} aria-label="نقل للخلف">‹</button>
            <button type="button" disabled={i === album.length - 1} onClick={() => setAlbum(a => { const t = [...a]; [t[i + 1], t[i]] = [t[i], t[i + 1]]; return t; })} aria-label="نقل للأمام">›</button>
          </div>
        </div>)}
      </div>}
      {album.length > 1 && <p className="text-[10px] muted">البوم بمنبّه {album.length} صور — رتّبها بأسهم الترتيب قبل النشر.</p>}
    </div>}
    {mediaUrl && type !== 'image' && <div className="post-media mt-3 !rounded-lg relative"><Media src={mediaUrl} kind="video" /><button className="icon-btn absolute top-2 left-2" onClick={() => setMediaUrl('')} aria-label="إزالة المرفق"><X size={14} /></button></div>}
    {type === 'poll' && <div className="mt-3"><FormField label="خيارات الاستطلاع · خيار كل سطر"><textarea className="input" rows={3} value={poll} onChange={e => setPoll(e.target.value)} placeholder={'المنار\nالشهيد'} /></FormField></div>}
    {(type === 'video' || type === 'reel') && <label className="btn btn-secondary btn-sm mt-3 cursor-pointer self-start"><Video size={14} />{type === 'reel' ? 'اختيار فيديو ريلز' : 'اختيار فيديو'}<input id="manar-video-input" type="file" accept="video/*" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return; try { setMediaUrl(await mediaFile(f, 'video', 14)); notify('المرفق جاهز — راجعه ثم انشر'); } catch (err) { notify((err as Error).message, true); } }} /></label>}
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-600/30">
      <div className="composer-types">{types.map(([key, label, Icon]) => <button key={key} aria-pressed={type === key} className={`type-chip ${type === key ? 'active' : ''}`} onClick={() => setType(key)}><Icon size={13} />{label}</button>)}</div>
      <div className="flex items-center gap-2 mr-auto flex-wrap">
        <select className="input !w-auto !min-h-9 !py-1 !text-[11px]" value={privacy} onChange={e => setPrivacy(e.target.value as Privacy)} aria-label="خصوصية المنشور">{Object.entries(privacyLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        {(privacy === 'specific' || privacy === 'exclude') && <button className="btn btn-ghost btn-sm" onClick={() => setPickPeople(true)}><Users size={13} />{audience.length ? `${audience.length} أشخاص` : 'اخترهم'}</button>}
        <button className="btn btn-primary btn-sm" disabled={busy || (!body.trim() && !mediaUrl && album.length === 0 && type !== 'poll')} onClick={submit}>{busy ? <Spinner /> : <Send size={14} />}نشر</button>
      </div>
    </div>
    {pickPeople && <Modal title={privacy === 'exclude' ? 'منع عن هؤلاء' : 'أشخاص محددون'} onClose={() => setPickPeople(false)}>
      <div className="flex flex-col gap-1 max-h-96 overflow-auto">{people.map(p => <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-mint/5 cursor-pointer"><input type="checkbox" checked={audience.includes(p.id)} onChange={e => setAudience(a => e.target.checked ? [...a, p.id] : a.filter(x => x !== p.id))} /><span className="avatar !w-8 !h-8">{p.name[0]}</span><span className="text-xs">{p.name}</span><span className="text-[10px] muted" dir="ltr">@{p.username}</span></label>)}</div>
      <div className="form-actions"><button className="btn btn-primary" onClick={() => setPickPeople(false)}>تم ({audience.length})</button></div>
    </Modal>}
  </div>;
}

export function StoriesRail({ onArchive = false }: { onArchive?: boolean }) {
  const { data, act, openLogin } = useApp();
  const grouped = useMemo(() => {
    const map = new Map<number, Snapshot['stories']>();
    [...data.stories].filter(s => onArchive ? s.archived : !s.archived).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).forEach(s => map.set(s.userId, [...(map.get(s.userId) || []), s]));
    return [...map.entries()];
  }, [data.stories, onArchive]);
  const [viewUser, setViewUser] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const myNote = data.notes.find(n => n.userId === data.me?.id);
  const [note, setNote] = useState(myNote?.text || ''); const [noteHours, setNoteHours] = useState(myNote?.durationHours || 4);
  return <>
    <div className="panel mb-5">
      <div className="stories-rail">
        {data.me && !onArchive && <button className="story-bubble" onClick={() => setCreating(true)}>
          <span className="story-ring add"><span className="avatar !w-full !h-full relative"><Camera size={22} /><Plus size={13} className="absolute bottom-1 right-1 mint" /></span></span>
          <span>ستوري جديد</span>
        </button>}
        {grouped.map(([userId, items]) => {
          const p = profileOf(data, userId); const seen = items.every(s => s.viewers.includes(data.me?.id ?? -1));
          const noteOf = data.notes.find(n => n.userId === userId);
          return <button key={userId} className="story-bubble" onClick={() => setViewUser(userId)}>
            <span className={`story-ring ${seen ? 'seen' : ''}`}><span className="avatar overflow-hidden">{p?.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p?.name?.[0]}</span></span>
            <span>{userId === data.me?.id ? 'قصتك' : p?.name?.split(' ')[0]}</span>
            {noteOf && <span className="story-note">{noteOf.text}</span>}
          </button>;
        })}
        {!grouped.length && <p className="text-[11px] muted self-center">{onArchive ? 'لا يوجد أرشيف بعد' : 'لا ستوريات نشطة الآن'}</p>}
      </div>
      {data.me && !onArchive && <div className="px-4 py-3 border-t border-slate-600/30 flex flex-wrap items-center gap-2">
        <input className="input flex-1 !min-h-9 !py-1 text-xs" maxLength={60} value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة قصيرة فوق صورتك (60 حرف)…" aria-label="ملاحظة" />
        <select className="input !w-auto !min-h-9 !py-1 text-xs" value={noteHours} onChange={e => setNoteHours(Number(e.target.value))} aria-label="مدة الملاحظة">{[1, 4, 12, 24].map(h => <option key={h} value={h}>{h} ساعة</option>)}</select>
        <button className="btn btn-secondary btn-sm" onClick={() => act('note.save', { text: note, durationHours: noteHours })}>{note ? 'حفظ الملاحظة' : 'إزالتها'}</button>
      </div>}
    </div>
    {viewUser !== null && <StoryViewer userId={viewUser} onClose={() => setViewUser(null)} />}
    {creating && <StoryComposer onClose={() => setCreating(false)} />}
  </>;
}

function StoryComposer({ onClose }: { onClose: () => void }) {
  const { act, notify } = useApp();
  const [type, setType] = useState<'image' | 'video'>('image'); const [url, setUrl] = useState(''); const [caption, setCaption] = useState('');
  const [hours, setHours] = useState(24); const [busy, setBusy] = useState(false);
  const presets = [6, 12, 24, 48, 72, 144];
  return <Modal title="ستوري جديد" onClose={onClose}>
    <div className="flex flex-col gap-4">
      <div className="composer-types">{(['image', 'video'] as const).map(k => <button key={k} className={`type-chip ${type === k ? 'active' : ''}`} onClick={() => { setType(k); setUrl(''); }}>{k === 'image' ? 'صورة' : 'فيديو'}</button>)}</div>
      <label className="btn btn-secondary cursor-pointer self-start"><Camera size={15} />{type === 'image' ? 'اختيار صورة' : 'اختيار فيديو'}<input type="file" accept={`${type}/*`} className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return; try { setUrl(await mediaFile(f, type === 'image' ? 'image' : 'video', type === 'image' ? 8 : 12)); } catch (err) { notify((err as Error).message, true); } }} /></label>
      {url && <div className="post-media !rounded-lg"><Media src={url} kind={type === 'video' ? 'video' : 'image'} /></div>}
      <FormField label="تعليق قصير (اختياري)"><input className="input" value={caption} onChange={e => setCaption(e.target.value)} maxLength={300} /></FormField>
      <FormField label="مدة الظهور" hint="تُحسب من لحظة النشر، وبعدها تختفي تلقائياً">
        <div className="flex flex-wrap gap-2 items-center">{presets.map(h => <button key={h} type="button" className={`type-chip ${hours === h ? 'active' : ''}`} onClick={() => setHours(h)}>{h < 24 ? `${h} ساعة` : h === 24 ? 'يوم واحد' : `${h / 24} أيام`}</button>)}
          <input className="input !w-24" type="number" min={1} max={720} value={hours} onChange={e => setHours(Math.max(1, Number(e.target.value) || 1))} aria-label="ساعات مخصصة" /><span className="text-[10px] muted">ساعة (مخصص)</span></div>
      </FormField>
      <div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إلغاء</button><button className="btn btn-primary" disabled={!url || busy} onClick={async () => { setBusy(true); const r = await act('story.create', { type, url, caption, durationHours: hours }); setBusy(false); if (r) onClose(); }}>{busy ? <Spinner /> : <Send size={15} />}انشر الستوري</button></div>
    </div>
  </Modal>;
}

function StoryViewer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, act, remove } = useApp();
  const items = useMemo(() => data.stories.filter(s => s.userId === userId).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)), [data.stories, userId]);
  const [index, setIndex] = useState(0); const [showViewers, setShowViewers] = useState(false);
  const current = items[index]; const owner = profileOf(data, userId); const mine = data.me?.id === userId;
  useEffect(() => {
    if (!current) return;
    void act('story.view', { id: current.id }, { silent: true, refresh: false });
    const timer = setTimeout(() => setIndex(i => (i < items.length - 1 ? i + 1 : i)), current.type === 'video' ? 12000 : 6000);
    return () => clearTimeout(timer);
  }, [current?.id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') setIndex(i => Math.min(items.length - 1, i + 1)); if (e.key === 'ArrowRight') setIndex(i => Math.max(0, i - 1)); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [items.length]);
  if (!current) return null;
  return <div className="story-viewer" role="dialog" aria-label={`ستوري ${owner?.name || ''}`}>
    <div className="story-frame">
      <div className="story-bars">{items.map((s, i) => <i key={s.id} style={{ opacity: i < index ? 0.35 : 1 }} />)}</div>
      <div className="story-top">
        <span className="avatar !w-9 !h-9 overflow-hidden">{owner?.avatar ? <img src={owner.avatar} alt="" className="w-full h-full object-cover" /> : owner?.name?.[0]}</span>
        <b className="text-xs">{owner?.name}</b><span className="text-[10px] opacity-70"><RelTime date={current.createdAt} /></span>
        <div className="mr-auto flex gap-1">
          {mine && <button className="icon-btn !w-8 !h-8" title="من شاهده" aria-label="قائمة المشاهدين" onClick={() => setShowViewers(v => !v)}><ListChecks size={14} /></button>}
          {mine && <button className="icon-btn !w-8 !h-8" title="أرشفة" aria-label="أرشفة الستوري" onClick={() => { act('story.archive', { id: current.id, archived: true }); onClose(); }}><Archive size={14} /></button>}
          {mine && <button className="icon-btn !w-8 !h-8" title="حذف" aria-label="حذف الستوري" onClick={() => { remove('story.delete', current.id, 'حذف هذا الستوري نهائياً؟'); onClose(); }}><Trash2 size={14} /></button>}
          <button className="icon-btn !w-8 !h-8" onClick={onClose} aria-label="إغلاق"><X size={14} /></button>
        </div>
      </div>
      <Media src={current.url} kind={current.type === 'video' ? 'video' : 'image'} />
      {current.caption && <div className="story-caption">{current.caption}</div>}
      <button className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer" aria-label="التالي" onClick={() => (index < items.length - 1 ? setIndex(index + 1) : onClose())} />
      <button className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer" aria-label="السابق" onClick={() => setIndex(Math.max(0, index - 1))} />
    </div>
    {showViewers && <div className="panel absolute bottom-6 left-1/2 -translate-x-1/2 w-72 p-4 max-h-64 overflow-auto">
      <h3 className="text-xs mb-3">شاهده {current.viewers.length} شخص</h3>
      {current.viewers.map(id => { const p = profileOf(data, id); return p ? <Link key={id} href={`/fans/${id}`} className="flex items-center gap-2 py-1.5 text-xs hover:text-mint"><span className="avatar !w-7 !h-7 !text-[10px]">{p.name[0]}</span>{p.name}</Link> : null; })}
      {!current.viewers.length && <p className="text-[11px] muted">لا مشاهدات بعد.</p>}
    </div>}
  </div>;
}

export function ReelsPlayer() {
  const { data, act, openLogin, notify } = useApp();
  const reels = data.posts.filter(p => (p.type === 'reel' || p.type === 'video') && p.mediaUrl);
  const [muted, setMuted] = useState(true); const [hearts, setHearts] = useState<Record<number, number[]>>({});
  if (!reels.length) return <div className="panel"><EmptyState title="لا ريلز بعد" description="ارفع فيديو عمودي (9:16) من الساحة وسيظهر هنا بتجربة كاملة." /></div>;
  return <div className="reels-wrap">{reels.map(post => {
    const author = profileOf(data, post.userId); const c = counts(data, 'post', post.id);
    const comments = data.comments.filter(x => x.targetType === 'post' && x.targetId === post.id);
    const like = () => { if (!data.me) { openLogin(); return; } void act('react', { targetType: 'post', targetId: post.id, kind: 'like' }, { silent: true }); setHearts(h => ({ ...h, [post.id]: [...(h[post.id] || []), Date.now()] })); };
    return <div className="reel" key={post.id}>
      <video src={post.mediaUrl} autoPlay loop muted={muted} playsInline onClick={like} />
      {(hearts[post.id] || []).slice(-8).map(id => <span key={id} className="fly-heart"><i style={{ ['--dx' as string]: `${(id % 60) - 30}px`, ['--rot' as string]: `${(id % 40) - 20}deg` }}><Heart size={40} fill="currentColor" /></i></span>)}
      <div className="reel-side">
        <button onClick={like} className={c.mine('like') ? 'text-mint' : ''} aria-label="أعجبني"><Heart size={20} fill={c.mine('like') ? 'currentColor' : 'none'} /><span className="count num">{c.likes + c.loves}</span></button>
        <Link href={`/social/post/${post.id}`} aria-label="التعليقات"><MessageCircle size={20} /><span className="count num">{comments.length}</span></Link>
        <button onClick={() => (data.me ? act('react', { targetType: 'post', targetId: post.id, kind: 'save' }, { silent: true }) : openLogin())} className={c.mine('save') ? 'text-gold' : ''} aria-label="حفظ"><Bookmark size={20} fill={c.mine('save') ? 'currentColor' : 'none'} /></button>
        <button onClick={() => (data.me ? act('react', { targetType: 'post', targetId: post.id, kind: 'repost' }, { silent: true }) : openLogin())} aria-label="إعادة نشر"><Repeat2 size={20} /><span className="count num">{c.reposts}</span></button>
        <button onClick={async () => { try { await copyText(`${window.location.origin}/social/post/${post.id}`); notify('نُسخ رابط الريلز'); } catch { /* ignore */ } }} aria-label="مشاركة"><Share2 size={20} /></button>
        <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'تشغيل الصوت' : 'كتم'}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
      </div>
      <div className="reel-info">
        <UserName user={author} />
        <p>{post.body}</p>
        <div className="reel-music"><Volume2 size={12} />صوت المدرجات · ناصرية #كرة_المنار</div>
      </div>
    </div>;
  })}</div>;
}

export function SocialHub({ initialTag }: { initialTag?: string }) {
  const { data } = useApp(); const [tab, setTab] = useState<'feed' | 'stories' | 'reels'>('feed');
  const [tag, setTag] = useState((initialTag || '').replace('#', '').toLowerCase()); const [team, setTeam] = useState('all');
  const posts = data.posts.filter(p => !tag || p.body.toLowerCase().includes(tag) || p.hashtags.some(h => h.toLowerCase().includes(tag))).filter(p => team === 'all' || p.teamId === Number(team));
  return <>
    <div className="page-heading"><div><div className="tagline"><Users size={12} />مجتمع كرة المنار</div><h1>الساحة</h1><p>منشورات، صور، ريلز، ستوري وملاحظات — بصوت جماهير الناصرية.</p></div>
      <div className="tabs">{[['feed', 'المنشورات'], ['stories', 'الستوري والملاحظات'], ['reels', 'الريلز']].map(([k, label]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k as 'feed')}>{label}</button>)}</div></div>
    {tab === 'feed' && <>
      <div className="data-toolbar">
        <div className="filter-input"><BarChart3 size={15} /><input className="input" placeholder="# ابحث بالهاشتاغ" value={tag} onChange={e => setTag(e.target.value.replace('#', '').toLowerCase())} aria-label="بحث بالهاشتاغ" /></div>
        <select className="input !w-auto" value={team} onChange={e => setTeam(e.target.value)} aria-label="فلتر الفريق"><option value="all">كل الفرق</option>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <span className="text-[11px] muted">{posts.length} منشور</span>
      </div>
      <Composer />
      <div className="flex flex-col gap-5">{posts.map(p => <PostCard key={p.id} post={p} />)}{!posts.length && <div className="panel"><EmptyState title="الساحة هادئة الآن" description="ارفع أول صورة من الملعب أو أنشئ استطلاعاً للجماهير." /></div>}</div>
    </>}
    {tab === 'stories' && <div className="flex flex-col gap-5"><StoriesRail /><div className="panel p-5"><h2 className="panel-title mb-3"><Archive size={17} className="mint" />أرشيف ستورياتي</h2><StoriesRail onArchive /></div></div>}
    {tab === 'reels' && <ReelsPlayer />}
  </>;
}
