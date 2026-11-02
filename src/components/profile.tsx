'use client';
import { useState } from 'react';
import Link from '@/lib/next-shims/link';
import { useRouter } from '@/lib/next-shims/navigation';
import { UserRound, Save, Share2, Trash2, LockKeyhole, BadgeCheck, Camera, Check, Plus, Archive, Star, Users, Download, Upload, Globe, Eye, EyeOff, MessageSquare, Clapperboard } from 'lucide-react';
import { useApp } from './context';
import { PageHeading, Spinner, FormField, Modal } from './ui';
import { mediaFile, copyText } from '@/lib/utils';

const socialFields = [
  { key: 'facebook', label: 'فيسبوك', placeholder: 'facebook.com/manar' },
  { key: 'instagram', label: 'إنستغرام', placeholder: 'instagram.com/manar' },
  { key: 'tiktok', label: 'تيك توك', placeholder: 'tiktok.com/@manar' },
  { key: 'youtube', label: 'يوتيوب', placeholder: 'youtube.com/@manar' },
  { key: 'whatsapp', label: 'واتساب', placeholder: 'wa.me/964700...' },
  { key: 'telegram', label: 'تيليجرام', placeholder: 't.me/manar' },
  { key: 'website', label: 'موقع / مدونة', placeholder: 'manar.iq' },
] as const;

export function ProfileView() {
  const { data, act, notify, openLogin } = useApp(); const me = data.me; const router = useRouter();
  const [busy, setBusy] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatar, setAvatar] = useState(me?.avatar || '');
  const profile = data.profiles.find(p => p.id === me?.id);
  const [socials, setSocials] = useState<Record<string, string>>(() => ({ ...profile?.socials }));
  const [bio, setBio] = useState(profile?.bio || '');
  const [showFollowers, setShowFollowers] = useState(profile?.showFollowers !== false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const myStories = data.stories.filter(s => s.userId === me?.id);
  const myHighlights = data.highlights.filter(h => h.userId === me?.id);
  if (!me) return <div className="panel max-w-lg mx-auto my-12 p-10 text-center"><div className="w-20 h-20 mx-auto bg-mint/10 rounded-full flex items-center justify-center mint mb-6"><UserRound size={36} strokeWidth={1.3} /></div><h1 className="text-2xl">ملفك في مدرجات المنار</h1><p className="muted text-sm leading-8 mt-4">سجّل دخولك لتحديث صورتك وسيرتك وحساباتك، وتغيير بريدك وكلمة مرورك — كل ذلك من مكان واحد.</p><button className="btn btn-primary mt-7" onClick={openLogin}><LockKeyhole size={16} />تسجيل الدخول أو إنشاء حساب</button></div>;
  const followers = data.followersOf[me.id] || []; const following = data.followingOf;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { name: form.get('name'), username: form.get('username'), email: form.get('email'), avatar, bio, showFollowers };
    for (const f of socialFields) payload[`social_${f.key}`] = socials[f.key] || '';
    if (form.get('password')) payload.password = form.get('password');
    const result = await act('user.update', payload);
    setBusy(false); if (result) { const r = await act('profile.update', payload, { silent: true }); if (r) notify('حُفظ ملفك وإعدادات خصوصيتك'); }
  }
  async function exportAccount() {
    const result = await act('account.export', {}, { silent: true, refresh: false });
    const payload = (result as { data?: unknown } | null)?.data; if (!payload) return;
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `manar-account-${me?.username || me?.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 15000);
    notify('نُسخةك الاحتياطية الشخصية جاهزة — احفظها عندك.');
  }
  async function importAccount(file: File) {
    try { const parsed = JSON.parse(await file.text()) as Record<string, unknown>; if (parsed.app !== 'manar-user-backup') throw new Error('الملف ليس نسخة شخصية من كرة المنار'); setBusy(true); await act('account.import', { data: parsed }, { silent: true }); setBusy(false); notify('استُعيدت بياناتك الشخصية'); router.refresh(); }
    catch (e) { setBusy(false); notify((e as Error).message, true); }
  }
  return <>
    <PageHeading eyebrow="عضويتك في عائلة المنار" title="ملفي الشخصي" description="صورتك، سيرتك، حساباتك، خصوصيتك — بيدك أنت.">
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-secondary" onClick={exportAccount}><Download size={15} />نسخة احتياطية لبياناتي</button>
        <label className="btn btn-ghost cursor-pointer"><Upload size={15} />استعادة نسخة<input type="file" accept="application/json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void importAccount(f); }} /></label>
        <button className="btn btn-ghost" onClick={async () => { try { await copyText(`${window.location.origin}/fans/${me.id}`); notify('نُسخ رابط ملفك للمشاركة'); } catch { notify('انسخ الرابط من شريط العنوان', true); } }}><Share2 size={15} />مشاركة ملفي</button>
      </div>
    </PageHeading>
    <div className="detail-grid">
      <form className="panel p-6 sm:p-7" onSubmit={submit}>
        <h2 className="panel-title mb-6"><BadgeCheck size={19} className="mint" />معلومات حسابي</h2>
        <div className="flex items-center gap-5 mb-6">
          <div className="avatar !w-20 !h-20 relative overflow-hidden !border-2" style={{ borderColor: '#78dfab55' }}>{avatar ? <img src={avatar} alt={me.name} className="w-full h-full object-cover" /> : <span className="text-3xl font-bold">{me.name[0]}</span>}
            <label className="absolute inset-0 flex items-end justify-center bg-black/40 opacity-0 hover:opacity-100 cursor-pointer transition-opacity"><Camera size={20} /><input type="file" accept="image/*" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return; try { setAvatar(await mediaFile(f, 'image', 8)); notify('أُضيفت صورتك — اضغط حفظ لاعتمادها'); } catch (err) { notify((err as Error).message, true); } }} /></label></div>
          <div className="flex-1"><div className="text-sm font-bold flex items-center gap-2">{me.name}{profile?.verified && <Check size={15} className="check-badge" />}</div>
            <div className="text-[11px] muted mt-1">{me.role === 'super' ? 'مدير المنصة · كل الصلاحيات' : me.role === 'team' ? 'إداري فريق' : me.role === 'referee' ? 'حكم رسمي معتمد' : 'من مشجّعي المنار'}</div>
            {avatar && <button type="button" className="text-[10px] text-red-300 mt-2 block" onClick={() => setAvatar('')}>إزالة الصورة</button>}</div>
        </div>
        <div className="form-grid">
          <FormField label="الاسم الظاهر"><input name="name" className="input" defaultValue={me.name} required minLength={2} maxLength={70} /></FormField>
          <FormField label="اسم المستخدم" hint="أحرف إنجليزية صغيرة وأرقام، يظهر في رابط ملفك"><input name="username" className="input" defaultValue={me.username} dir="ltr" minLength={3} maxLength={30} /></FormField>
          <FormField label="البريد الإلكتروني" hint="يُستخدم لتسجيل الدخول"><input name="email" type="email" className="input" defaultValue={me.email} dir="ltr" required autoComplete="email" /></FormField>
          <FormField label="كلمة مرور جديدة" hint="اتركها فارغة للإبقاء على الحالية · 8 أحرف على الأقل"><input name="password" type="password" className="input" dir="ltr" minLength={8} autoComplete="new-password" placeholder="••••••••" /></FormField>
          <FormField label="نبذة عنك" full><textarea name="bio" className="input" rows={3} maxLength={600} value={bio} onChange={e => setBio(e.target.value)} placeholder="من أي حي؟ ومن تشجع؟" /></FormField>
        </div>
        <h3 className="text-sm mt-7 mb-3 flex items-center gap-2"><Globe size={15} className="gold" />حساباتي على منصات التواصل</h3>
        <div className="form-grid">{socialFields.map(f => <FormField key={f.key} label={f.label}><input className="input" dir="ltr" placeholder={f.placeholder} value={socials[f.key] || ''} onChange={e => setSocials(v => ({ ...v, [f.key]: e.target.value }))} /></FormField>)}</div>
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-slate-600/30">
          <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={showFollowers} onChange={e => setShowFollowers(e.target.checked)} />{showFollowers ? <><Eye size={14} className="mint" />قوائم متابعيَّ ظاهرة للأعضاء</> : <><EyeOff size={14} />قوائمي مخفية (أنا فقط من يراها)</>}
          </label>
          <span className="text-[10px] muted">الإدارة تتحكم أيضاً بإتاحة القوائم للجميع من لوحة التحكم.</span>
          <div className="form-actions !mt-0 !pt-0 !border-0 ml-auto"><button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : <Save size={16} />}حفظ كل التغييرات</button></div>
        </div>
      </form>
      <div className="flex flex-col gap-5">
        <div className="panel p-6"><h2 className="panel-title mb-4"><Users size={18} className="mint" />دائرتي الاجتماعية</h2>
          <div className="grid grid-cols-3 text-center gap-2">{[[followers.length, 'متابع', '/people'], [following.length, 'أتابع', '/people'], [data.friendIds.length, 'أصدقاء', '/people']].map(([v, l, href]) => <Link key={String(l)} href={String(href)} className="p-3 rounded-lg bg-[#14262a] border border-slate-600/40 hover:border-mint/40"><strong className="block text-xl num">{v as number}</strong><span className="text-[10px] muted">{l as string}</span></Link>)}</div>
          <Link href="/social/chat" className="btn btn-secondary btn-sm w-full mt-4"><MessageSquare size={14} />صندوق الرسائل</Link>
          <Link href="/notifications" className="btn btn-ghost btn-sm w-full mt-2"><BellDot count={data.notifications.filter(n => !n.read).length} /></Link>
        </div>
        <div className="panel p-6"><div className="flex items-center justify-between mb-4"><h2 className="panel-title"><Star size={18} className="gold" />الأبرزات (Highlights)</h2><button className="btn btn-secondary btn-sm" onClick={() => setHighlightOpen(true)}><Plus size={13} />جديد</button></div>
          {myHighlights.length ? <div className="flex flex-col gap-2">{myHighlights.map(h => <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#14262a]"><span className="hl-cover !w-11 !h-11">{h.coverUrl ? <img src={h.coverUrl} alt="" /> : <Archive size={15} />}</span><div className="flex-1 min-w-0"><b className="text-xs block">{h.title}</b><span className="text-[10px] muted">{h.storyIds.length} ستوري محفوظ</span></div><button className="icon-btn !w-7 !h-7" aria-label="حذف البارز" onClick={() => act('highlight.delete', { id: h.id })}><Trash2 size={13} /></button></div>)}</div>
            : <p className="text-[11px] muted leading-7">اجمع أفضل ستورياتك في مجموعة ثابتة فوق ملفك — أنشئها من زر «جديد».</p>}
          <p className="text-[10px] muted mt-4 flex items-center gap-2"><Clapperboard size={12} />الستوري النشط لديك: {myStories.filter(s => !s.archived).length}</p>
        </div>
        <div className="panel p-6 border-red-400/20"><h2 className="panel-title !text-red-200 mb-3"><Trash2 size={17} />إغلاق الحساب</h2>
          <p className="text-[11px] muted leading-7">تقدر تسجّل الخروج في أي وقت، أو تحذف حسابك نهائياً فتُحذف منشوراتك وتعليقاتك ورسائلك من المنصة.</p>
          <button className="btn btn-danger btn-sm mt-4" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />حذف حسابي نهائياً</button></div>
      </div>
    </div>
    {highlightOpen && <HighlightCreator stories={myStories} onClose={() => setHighlightOpen(false)} />}
    {confirmDelete && <Modal title="وداعاً مؤقتاً… أم نهائياً؟" onClose={() => setConfirmDelete(false)}><p className="text-sm leading-8 text-slate-300">حذف الحساب لا رجعة عنه: تُحذف منشوراتك وتعليقاتك ورسائلك وستورياتك، وتبقى مشاركات الآخرين كما هي.</p><div className="form-actions"><button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>تراجعت، ابقني</button><button className="btn btn-danger" disabled={busy} onClick={async () => { setBusy(true); await act('user.delete', {}); setBusy(false); }}>{busy ? <Spinner /> : <Trash2 size={15} />}تأكيد الحذف</button></div></Modal>}
  </>;
}
function BellDot({ count }: { count: number }) { return <span className="flex items-center gap-2">الإشعارات {count > 0 && <span className="badge badge-green num">{count}</span>}<span className="opacity-50">←</span></span>; }
function HighlightCreator({ stories, onClose }: { stories: { id: number; url: string; caption: string }[]; onClose: () => void }) {
  const { act } = useApp(); const [title, setTitle] = useState(''); const [coverUrl, setCoverUrl] = useState(''); const [picked, setPicked] = useState<number[]>([]);
  return <Modal title="أبرزة جديدة" onClose={onClose}><div className="flex flex-col gap-4">
    <FormField label="اسم الأبرزة"><input className="input" value={title} onChange={e => setTitle(e.target.value)} maxLength={40} placeholder="مثال: ديربي الأسبوع" /></FormField>
    <FormField label="اختر الستوريات" hint="تُحفظ للأبد داخل ملفك"><div className="grid grid-cols-4 gap-2">{stories.map(s => <button key={s.id} type="button" className={`gallery-item ${picked.includes(s.id) ? 'ring-2 ring-mint' : ''}`} onClick={() => setPicked(v => v.includes(s.id) ? v.filter(x => x !== s.id) : [...v, s.id])}><img src={s.url} alt={s.caption} /></button>)}{!stories.length && <p className="text-[11px] muted col-span-4">لا ستوريات محفوظة بعد — انشر ستوري أولاً من الساحة.</p>}</div></FormField>
    <div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إلغاء</button><button className="btn btn-primary" disabled={!title.trim() || !picked.length} onClick={async () => { await act('highlight.save', { title, coverUrl: coverUrl || stories.find(s => s.id === picked[0])?.url || '', storyIds: picked }); onClose(); }}><Check size={15} />حفظ الأبرزات</button></div>
  </div></Modal>;
}
