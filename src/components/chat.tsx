'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/lib/next-shims/link';
import { Send, Paperclip, Mic, Square, Play, Pause, Flame, Users, Smile, Check, CheckCheck, Pin, Phone, MoreVertical, X, Shield, Link2, Trash2, Lock, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { useApp } from './context';
import { Modal, Spinner, EmptyState, FormField } from './ui';
import { mediaFile, copyText } from '@/lib/utils';
import { profileOf } from './social';
import { ClockText } from './times';
import type { Snapshot } from '@/lib/data';

const clock = (d: string | Date) => new Date(d).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

export function ChatList() {
  const { data, act, notify, openLogin } = useApp();
  const [tab, setTab] = useState<'all' | 'direct' | 'group' | 'requests'>('all');
  const [creating, setCreating] = useState<null | 'group' | 'join'>(null);

  const rooms = data.conversations
    .map(conv => {
      const members = data.members.filter(m => m.conversationId === conv.id);
      const msgs = data.messages.filter(m => m.conversationId === conv.id);
      const last = msgs[0];
      const other = conv.kind === 'direct' ? profileOf(data, members.find(m => m.userId !== data.me?.id)?.userId) : null;
      return { conv, members, last, other, unread: data.unreadConversations[conv.id] || 0 };
    })
    .filter(r => r.members.some(m => m.userId === data.me?.id) || data.me?.role === 'super')
    .filter(r => tab === 'all' || (tab === 'requests' ? false : r.conv.kind === tab))
    .sort((a, b) => +new Date(b.last?.createdAt || b.conv.createdAt) - +new Date(a.last?.createdAt || a.conv.createdAt));
  const requests = data.requests.filter(r => r.status === 'pending');
  if (!data.me) return <div className="panel"><EmptyState title="المراسلة للأعضاء" description="سجّل دخولك لتفتح محادثات مع جماهير وأعضاء منصة الفهود الرياضية." /></div>;
  return <>
    <div className="page-heading"><div><div className="tagline"><Send size={12} />مراسلات المدرجات</div><h1>الرسائل</h1><p>محادثة خاصة، مجموعات، streaks 🔥 وصوت — بواجهة نظيفة.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" onClick={() => setCreating('group')}><Users size={15} />مجموعة جديدة</button>
        <button className="btn btn-ghost" onClick={() => setCreating('join')}><Link2 size={15} />انضم برابط</button>
      </div></div>
    <div className="tabs mb-4">{[['all', 'الكل'], ['direct', 'خاص'], ['group', 'المجموعات']].map(([k, label]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k as 'all')}>{label}</button>)}
      {requests.length > 0 && <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>طلبات صداقة ({requests.length})</button>}</div>
    {tab === 'requests' ? <div className="panel p-3 flex flex-col">{requests.map(r => { const p = profileOf(data, r.fromId); return <div key={r.id} className="people-row"><span className="avatar">{p?.name?.[0]}</span><div className="who"><b>{p?.name}</b><span>يرغب بإضافتك صديقاً</span></div><div className="flex gap-2"><button className="btn btn-primary btn-sm" onClick={() => act('friend.respond', { id: r.id, accept: true })}>قبول</button><button className="btn btn-ghost btn-sm" onClick={() => act('friend.respond', { id: r.id, accept: false })}>رفض</button></div></div>; })}{!requests.length && <p className="text-[11px] muted p-4 text-center">لا طلبات حالياً.</p>}</div>
      : <div className="panel p-3 flex flex-col gap-2">{rooms.map(r => <Link key={r.conv.id} href={`/social/chat/${r.conv.id}`} className="chat-row">
        <span className="avatar !w-11 !h-11 overflow-hidden shrink-0">{r.conv.kind === 'group' ? (r.conv.avatarUrl ? <img src={r.conv.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={17} />) : r.other?.avatar ? <img src={r.other.avatar} alt="" className="w-full h-full object-cover" /> : r.other?.name?.[0]}</span>
        <span className="nm"><b>{r.conv.kind === 'group' ? r.conv.title : r.other?.name}</b><span>{r.last ? `${r.last.userId === data.me!.id ? 'أنت: ' : ''}${r.last.text || (r.last.mediaUrl ? '📎 مرفق' : '')}` : 'ابدأ المحادثة'}</span></span>
        {r.unread > 0 && <span className="badge badge-green num">{r.unread}</span>}
        {r.last && <span className="text-[9px] muted shrink-0"><ClockText date={r.last.createdAt} /></span>}
      </Link>)}{!rooms.length && <EmptyState title="لا محادثات بعد" description="افتح ملف أي عضو واضغط «مراسلة» لتبدأ أول محادثة، أو أنشئ مجموعة لأصدقائك." />}</div>}
    {creating === 'group' && <GroupCreator onClose={() => setCreating(null)} />}
    {creating === 'join' && <JoinByLink onClose={() => setCreating(null)} />}

  </>;
}


export function ChatRoom({ id }: { id: number }) {
  const { data, act, notify } = useApp();
  const conv = data.conversations.find(c => c.id === id);
  const members = useMemo(() => data.members.filter(m => m.conversationId === id), [data.members, id]);
  const mineId = data.me?.id;
  const isMember = members.some(m => m.userId === mineId);
  const history = useMemo(() => data.messages.filter(m => m.conversationId === id).slice().reverse(), [data.messages, id]);
  const [text, setText] = useState(''); const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null); const [editingId, setEditingId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false); const [settings, setSettings] = useState(false);
  const scroller = useRef<HTMLDivElement>(null); const stopRef = useRef<(() => void) | null>(null);
  const partner = conv?.kind === 'direct' ? profileOf(data, members.find(m => m.userId !== mineId)?.userId) : null;
  const streak = data.streaks[id] || 0;
  useEffect(() => { const node = scroller.current; if (node) node.scrollTop = node.scrollHeight; void act('conversation.read', { conversationId: id }, { silent: true, refresh: false }); }, [id, history.length]);
  useEffect(() => { const t = setInterval(() => { if (text.trim() && document.visibilityState === 'visible') void act('conversation.typing', { conversationId: id }, { silent: true, refresh: false }); }, 5000); return () => clearInterval(t); }, [text, id]);
  useEffect(() => { if (recording) void act('conversation.typing', { conversationId: id }, { silent: true, refresh: false }); }, [recording]);
  const typingNames = members.filter(m => m.userId !== mineId).map(m => profileOf(data, m.userId)?.name).filter(Boolean).length
    ? members.filter(m => m.userId !== mineId).map(m => m.userId).filter(uid => data.profiles.some(p => p.id === uid)).slice(0, 1).map(() => true).length : 0;
  async function send() {
    if (!text.trim()) return; setSending(true);
    const payload = editingId ? { id: editingId, text } : { conversationId: id, text, replyTo: replyTo ?? undefined };
    const r = await act(editingId ? 'message.edit' : 'message.send', payload as never);
    setSending(false); if (r) { setText(''); setReplyTo(null); setEditingId(null); }
  }
  async function attach(kind: 'image' | 'video' | 'file') {
    const input = document.createElement('input'); input.type = 'file'; input.accept = kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : '*/*';
    input.onchange = async () => { const f = input.files?.[0]; if (!f) return; input.value = ''; try { const url = await mediaFile(f, kind === 'file' ? 'file' : kind, kind === 'file' ? 6 : 14); await act('message.send', { conversationId: id, text: '', mediaType: kind, mediaUrl: url }); notify('أُرسل المرفق'); } catch (e) { notify((e as Error).message, true); } };
    input.click();
  }
  async function voice() {
    if (recording) { stopRef.current?.(); setRecording(false); return; }
    setRecording(true);
    try {
      const { recordVoice } = await import('@/lib/utils');
      const result = await recordVoice(60);
      stopRef.current = () => (globalThis as unknown as { __manarStopVoice?: () => void }).__manarStopVoice?.();
      await act('message.send', { conversationId: id, text: '', mediaType: 'audio', mediaUrl: result.url });
    } catch (e) { notify((e as Error).message, true); } finally { setRecording(false); }
  }
  if (!conv || !data.me) return <div className="panel"><EmptyState title="المحادثة غير متاحة" description="ربما حُذفت أو أنك لست ضمن أعضائها." /></div>;
  if (!isMember) return <div className="panel p-6 text-center"><Lock size={26} className="gold mx-auto mb-3" /><h2 className="text-sm">لست ضمن هذه المحادثة</h2><p className="text-[11px] muted mt-2">اطلب من مالك المجموعة إضافتك، أو انضم برابط الدعوة.</p></div>;
  const myRole = members.find(m => m.userId === mineId)?.role;
  const pinned = history.filter(h => data.members.some(() => true) && false);
  return <div className="chat-shell" style={{ ['--chat-h' as string]: 'clamp(400px, calc(100dvh - 200px), 760px)' }}>
    <aside className="chat-aside"><ChatMiniList activeId={id} /></aside>
    <div className="chat-room">
      <div className="chat-room-head">
        <Link href="/social/chat" className="icon-btn !w-9 !h-9 md:hidden" aria-label="رجوع"><X size={15} /></Link>
        <span className="avatar !w-10 !h-10 overflow-hidden">{conv.kind === 'group' ? (conv.avatarUrl ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={16} />) : partner?.avatar ? <img src={partner.avatar} alt="" className="w-full h-full object-cover" /> : partner?.name?.[0]}</span>
        <div className="flex-1 min-w-0"><b className="text-sm block truncate">{conv.kind === 'group' ? conv.title : partner?.name}</b>
          <span className="text-[10px] muted">{conv.kind === 'group' ? `${members.length} أعضاء · ${myRole === 'owner' ? 'مالك' : myRole === 'admin' ? 'مشرف' : 'عضو'}` : partner?.username ? `@${partner.username}` : ''}</span></div>
        {streak > 0 && <span className="streak" title="سلسلة محادثة يومية"><Flame size={13} />{streak}</span>}
        <span className="text-[9px] muted">يوم/يوم متصل</span>
        <button className="icon-btn !w-9 !h-9" aria-label="محادثة صوتية" onClick={() => notify('المكالمات الصوتية غير مدعومة بعد في هذا الإصدار')}><Phone size={15} /></button>
        <button className="icon-btn !w-9 !h-9" aria-label="إعدادات المحادثة" onClick={() => setSettings(true)}><MoreVertical size={15} /></button>
      </div>
      {pinned.length > 0 && <div className="pinned-bar"><Pin size={13} />رسالة مثبتة</div>}
      {conv.poll && <div className="pinned-bar !flex-col !items-stretch gap-2">
        <span className="text-[11px] mint flex items-center gap-2"><BarPoll />استطلاع المجموعة: {conv.poll.question}</span>
        <div className="flex flex-wrap gap-2">{conv.poll.options.map(o => <button key={o.id} className="btn btn-ghost btn-sm" onClick={() => act('group.pollVote', { conversationId: id, optionId: o.id })}>{o.label} <span className="num mint">{o.votes.length}</span></button>)}</div>
      </div>}
      <div className="chat-bubbles" ref={scroller} dir="rtl">
        <div className="w-full flex flex-col-reverse gap-3" dir="rtl">
          {history.map(m => {
            const author = profileOf(data, m.userId); const own = m.userId === mineId;
            const readBy = data.reads.filter(r => r.messageId === m.id).length;
            const replied = m.replyTo ? history.find(h => h.id === m.replyTo) : null;
            return <div key={m.id} className={`bubble ${own ? 'mine' : ''}`}>
              {!own && conv.kind === 'group' && <b className="text-[10px] mint block mb-1">{author?.name}</b>}
              {replied && <div className="text-[10px] opacity-70 border-r-2 border-mint/40 pr-2 mb-1">{replied.text || '📎 مرفق'}</div>}
              {m.text || ''}
              {m.mediaType === 'audio' && <div className="bubble-audio"><audio src={m.mediaUrl} controls /><span className="text-[9px] opacity-70">رسالة صوتية</span></div>}
              {(m.mediaType === 'image') && <img src={m.mediaUrl} alt="مرفق" loading="lazy" />}
              {(m.mediaType === 'video') && <video src={m.mediaUrl} controls playsInline />}
              {m.mediaType === 'file' && <a className="flex items-center gap-2 text-[11px] underline" href={m.mediaUrl} download>📎 ملف مرفق</a>}
              <div className="meta" dir="ltr"><ClockText date={m.createdAt} />{m.editedAt ? ' · مُعدّلة' : ''}{own && (readBy > 0 ? <CheckCheck size={13} className="text-mint" /> : <Check size={13} />)}</div>
              <div className="msg-actions">
                <button title="رد" aria-label="رد" onClick={() => { setReplyTo(m.id); setText(''); }}><Smile size={12} /></button>
                {own && <button title="تعديل" aria-label="تعديل الرسالة" onClick={() => { setEditingId(m.id); setText(m.text); }}><Pen />
                </button>}
                {(own || myRole !== 'member') && <button title="تثبيت" aria-label="تثبيت الرسالة" onClick={() => act('message.pin', { id: m.id })}><Pin size={12} /></button>}
                {(own || data.me?.role === 'super') && <button title="حذف" aria-label="حذف الرسالة" onClick={() => act('message.delete', { id: m.id })}><Trash2 size={12} /></button>}
              </div>
            </div>;
          })}
          {!history.length && <p className="text-[11px] muted text-center py-10">لا رسائل بعد — ابدأ المحادثة بكلمة طيبة 👋</p>}
        </div>
      </div>
      <TypingIndicator conversationId={id} />
      <div className="chat-composer">
        {replyTo && <button className="icon-btn !w-9 !h-9 shrink-0" title="إلغاء الرد" onClick={() => setReplyTo(null)}><X size={13} /></button>}
        <div className="flex-1 flex flex-col gap-1">
          {replyTo && <span className="text-[10px] muted">رد على رسالة محددة</span>}
          {editingId && <span className="text-[10px] gold">تعديل رسالة…</span>}
          <textarea rows={1} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="اكتب رسالة…" aria-label="نص الرسالة" maxLength={4000} />
        </div>
        <button className="icon-btn !w-9 !h-9" aria-label="إرفاق ملف" onClick={() => attach('file')}><Paperclip size={15} /></button>
        <button className="icon-btn !w-9 !h-9" aria-label="إرفاق صورة" onClick={() => attach('image')}><ImageIcon size={15} /></button>
        <button className="icon-btn !w-9 !h-9" aria-label="إرفاق فيديو" onClick={() => attach('video')}><Video size={15} /></button>
        {text.trim() || editingId ? <button className="btn btn-primary !p-2.5 !min-h-0" disabled={sending} onClick={send} aria-label={editingId ? 'حفظ التعديل' : 'إرسال'}>{sending ? <Spinner size={15} /> : <Send size={16} />}</button>
          : <button className={`btn !p-2.5 !min-h-0 ${recording ? 'btn-danger' : 'btn-secondary'}`} onClick={voice} aria-label={recording ? 'إيقاف التسجيل' : 'رسالة صوتية'}>{recording ? <Square size={15} /> : <Mic size={16} />}</button>}
      </div>
    </div>
    {settings && <RoomSettings conv={conv} members={members} role={myRole || 'member'} onClose={() => setSettings(false)} />}
  </div>;
}
function Pen() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>; }
function BarPoll() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 20V10M12 20V4M19 20v-6" /></svg>; }
/** Live "typing" bubbles come from the short-lived server signal, never invented locally. */
function TypingIndicator({ conversationId }: { conversationId: number }) {
  const { data } = useApp();
  const senders = (data.typing || []).filter(t => t.conversationId === conversationId && t.userId !== data.me?.id).map(t => t.userId);
  if (!senders.length) return null;
  const names = senders.map(uid => profileOf(data, uid)?.name?.split(' ')[0]).filter(Boolean);
  return <div className="px-4 py-2 typing" role="status" aria-live="polite"><i /><i /><i />{names.length ? `${names.join(' و ')} يكتب الآن…` : 'يكتب الآن…'}</div>;
}
function ChatMiniList({ activeId }: { activeId: number }) {
  const { data } = useApp();
  const rooms = data.conversations.map(conv => ({ conv, unread: data.unreadConversations[conv.id] || 0, other: conv.kind === 'direct' ? profileOf(data, data.members.find(m => m.conversationId === conv.id && m.userId !== data.me?.id)?.userId) : null, last: data.messages.find(m => m.conversationId === conv.id) }))
    .filter(r => data.members.some(m => m.conversationId === r.conv.id && m.userId === data.me?.id));
  return <div className="chat-list">{rooms.map(r => <Link key={r.conv.id} href={`/social/chat/${r.conv.id}`} className={`chat-row ${r.conv.id === activeId ? 'active' : ''}`}>
    <span className="avatar !w-9 !h-9 overflow-hidden shrink-0">{r.conv.kind === 'group' ? <Users size={15} /> : r.other?.avatar ? <img src={r.other.avatar} alt="" className="w-full h-full object-cover" /> : r.other?.name?.[0]}</span>
    <span className="nm"><b>{r.conv.kind === 'group' ? r.conv.title : r.other?.name}</b><span>{r.last?.text || '—'}</span></span>
    {r.unread > 0 && <span className="badge badge-green num">{r.unread}</span>}
  </Link>)}{!rooms.length && <p className="text-[11px] muted p-3">لا محادثات أخرى</p>}</div>;
}

function RoomSettings({ conv, members, role, onClose }: { conv: Snapshot['conversations'][number]; members: Snapshot['members']; role: string; onClose: () => void }) {
  const { data, act, notify } = useApp(); const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(conv.title); const [description, setDescription] = useState(conv.description); const [avatarUrl, setAvatarUrl] = useState(conv.avatarUrl);
  const [pollQ, setPollQ] = useState(conv.poll?.question || ''); const [pollOpts, setPollOpts] = useState(conv.poll?.options.map(o => o.label).join('\n') || '');
  const [addPeople, setAddPeople] = useState<number[]>([]);
  const canManage = role !== 'member';
  const invite = `${window.location.origin}/join/${conv.inviteToken}`;
  const candidates = data.profiles.filter(p => !members.some(m => m.userId === p.id));
  return <Modal title={conv.kind === 'group' ? 'إعدادات المجموعة' : 'إعدادات المحادثة'} onClose={onClose}>
    {conv.kind === 'group' && canManage && <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4"><div className="avatar !w-16 !h-16 overflow-hidden">{avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={22} />}</div>
        <label className="btn btn-secondary btn-sm cursor-pointer"><ImageIcon size={14} />صورة المجموعة<input type="file" accept="image/*" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return; try { setAvatarUrl(await mediaFile(f, 'image', 6)); } catch { /* ignore */ } }} /></label></div>
      <FormField label="اسم المجموعة"><input className="input" value={title} onChange={e => setTitle(e.target.value)} maxLength={60} /></FormField>
      <FormField label="وصف المجموعة"><textarea className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} maxLength={400} /></FormField>
      <FormField label="استطلاع داخل المجموعة · خيار كل سطر" hint="اترك السؤال فارغاً لحذف الاستطلاع"><input className="input mb-2" value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="سؤال الاستطلاع" maxLength={200} /><textarea className="input" rows={3} value={pollOpts} onChange={e => setPollOpts(e.target.value)} placeholder={'خيار أول\nخيار ثانٍ'} /></FormField>
      <div className="p-3 rounded-lg bg-[#14262a] border border-slate-600/40"><span className="text-[10px] muted block mb-2">رابط دعوة الأعضاء</span><code className="invite-url">{invite}</code><div className="flex gap-2"><button className="btn btn-secondary btn-sm flex-1" onClick={async () => { try { await copyText(invite); notify('نُسخ رابط الدعوة'); } catch { /* ignore */ } }}><Link2 size={13} />نسخ الرابط</button><button className="btn btn-ghost btn-sm" onClick={() => { setBusy(true); void act('group.update', { id: conv.id, rotateInvite: true }).then(() => setBusy(false)); }}>تجديد الرابط</button></div></div>
      {candidates.length > 0 && <FormField label="إضافة أعضاء"><div className="flex flex-wrap gap-2 p-2 border border-slate-600/40 rounded-lg max-h-32 overflow-auto">{candidates.map(p => <button key={p.id} className={`type-chip ${addPeople.includes(p.id) ? 'active' : ''}`} onClick={() => setAddPeople(a => a.includes(p.id) ? a.filter(x => x !== p.id) : [...a, p.id])}>{p.name}</button>)}</div></FormField>}
      <div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إغلاق</button>
        <button className="btn btn-primary" disabled={busy} onClick={async () => { setBusy(true); await act('group.update', { id: conv.id, title, description, avatarUrl, poll: pollQ.trim() && pollOpts.trim() ? true : false, ...(pollQ.trim() && pollOpts.trim() ? { pollQuestion: pollQ, pollOptions: pollOpts } : {}) }); if (addPeople.length) await act('group.members', { conversationId: conv.id, action: 'add', userIds: addPeople }); setBusy(false); onClose(); }}><Check size={15} />حفظ الإعدادات</button></div>
    </div>}
    <div className="mt-5 pt-4 border-t border-slate-600/30">
      <h3 className="text-xs mb-3">الأعضاء ({members.length})</h3>
      {members.map(m => { const p = profileOf(data, m.userId); return <div key={m.id} className="people-row !px-0"><span className="avatar !w-8 !h-8 overflow-hidden">{p?.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p?.name?.[0]}</span><div className="who"><b>{p?.name}</b><span>{m.role === 'owner' ? 'مالك المجموعة' : m.role === 'admin' ? 'مشرف' : 'عضو'}</span></div>
        {conv.kind === 'group' && role === 'owner' && m.userId !== data.me?.id && <button className="btn btn-ghost btn-sm" onClick={() => act('group.members', { conversationId: conv.id, action: 'role', userId: m.userId, role: m.role === 'admin' ? 'member' : 'admin' })}>{m.role === 'admin' ? 'إلغاء الإشراف' : 'تعيين مشرف'}</button>}
        {conv.kind === 'group' && (role === 'owner' || role === 'admin') && m.userId !== data.me?.id && <button className="icon-btn !w-7 !h-7" aria-label="إزالة العضو" onClick={() => act('group.members', { conversationId: conv.id, action: 'remove', userId: m.userId })}><Trash2 size={13} /></button>}
      </div>; })}
      <div className="flex gap-2 mt-4">{conv.kind === 'group' && <button className="btn btn-danger btn-sm" onClick={async () => { await act('group.members', { conversationId: conv.id, action: 'leave' }); onClose(); }}><X size={13} />مغادرة المجموعة</button>}
        {data.me?.role === 'super' && <button className="btn btn-ghost btn-sm" onClick={() => { void act('group.update', { id: conv.id, title: conv.title, active: false }); notify('يمكن للإدارة حذف المحادثة من لوحة التحكم'); }}><Shield size={13} />تدخل إداري</button>}</div>
    </div>
  </Modal>;
}

function GroupCreator({ onClose }: { onClose: () => void }) {
  const { data, act } = useApp(); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [avatarUrl, setAvatarUrl] = useState(''); const [picked, setPicked] = useState<number[]>([]);
  const others = data.profiles.filter(p => p.id !== data.me?.id);
  return <Modal title="إنشاء مجموعة" onClose={onClose}><div className="flex flex-col gap-4">
    <div className="flex items-center gap-4"><div className="avatar !w-14 !h-14 overflow-hidden">{avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={20} />}</div><label className="btn btn-secondary btn-sm cursor-pointer"><ImageIcon size={14} />صورة<input type="file" accept="image/*" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return; try { setAvatarUrl(await mediaFile(f, 'image', 6)); } catch { /* ignore */ } }} /></label></div>
    <FormField label="اسم المجموعة"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: جماهير حي المنار" maxLength={60} required /></FormField>
    <FormField label="وصف"><textarea className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} maxLength={400} /></FormField>
    <FormField label="أضف أصدقاء"><div className="flex flex-wrap gap-2 max-h-40 overflow-auto p-2 border border-slate-600/40 rounded-lg">{others.map(p => <button key={p.id} type="button" className={`type-chip ${picked.includes(p.id) ? 'active' : ''}`} onClick={() => setPick(picked, setPicked, p.id)}>{p.name}</button>)}</div></FormField>
    <div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إلغاء</button><button className="btn btn-primary" disabled={!title.trim()} onClick={async () => { const r = await act('group.create', { title, description, avatarUrl, memberIds: picked }); if (r?.id) window.location.href = `/social/chat/${r.id}`; }}><Check size={15} />أنشئ المجموعة</button></div>
  </div></Modal>;
}
function setPick(list: number[], setter: (v: number[]) => void, id: number) { setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]); }

function JoinByLink({ onClose }: { onClose: () => void }) {
  const { act } = useApp(); const [token, setToken] = useState('');
  return <Modal title="الانضمام بمجموعة برابط" onClose={onClose}><div className="flex flex-col gap-4">
    <FormField label="الصق رابط الدعوة أو الرمز"><input className="input" dir="ltr" value={token} onChange={e => setToken(e.target.value)} placeholder="https://…/join/abc123" /></FormField>
    <button className="btn btn-primary" disabled={!token.trim()} onClick={async () => { const value = token.trim().split('/').pop() || ''; const r = await act('group.join', { token: value }); if (r?.id) window.location.href = `/social/chat/${r.id}`; }}><Link2 size={15} />انضم للمجموعة</button>
  </div></Modal>;
}
export function JoinPage({ token }: { token: string }) {
  const { data, act } = useApp(); const [busy, setBusy] = useState(false);
  return <div className="panel max-w-md mx-auto my-12 p-8 text-center"><Link2 size={34} className="mint mx-auto mb-4" /><h1 className="text-xl">دعوة للانضمام إلى مجموعة</h1><p className="text-xs muted leading-7 mt-3">بمجرد الضغط سيُضاف حسابك إلى المجموعة وتفتح المحادثة مباشرة.</p>{data.me ? <button className="btn btn-primary mt-6 w-full" disabled={busy} onClick={async () => { setBusy(true); const r = await act('group.join', { token }); setBusy(false); if (r?.id) window.location.href = `/social/chat/${r.id}`; }}>{busy ? <Spinner /> : <Check size={15} />}انضم الآن</button> : <Link href="/profile" className="btn btn-primary mt-6">سجّل دخولك للانضمام</Link>}</div>;
}

