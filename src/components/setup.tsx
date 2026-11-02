'use client';
import { useState } from 'react';
import { useRouter } from '@/lib/next-shims/navigation';
import { Crown, ShieldCheck, Database, Sparkles, ArrowLeft } from 'lucide-react';
import { useApp } from './context';
import { Spinner, FormField } from './ui';

/** One-time owner creation for a fresh deployment. Self-closes once an account exists. */
export function SetupForm({ seedEnabled = false }: { seedEnabled?: boolean }) {
  const { act } = useApp(); const router = useRouter();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setBusy(true);
    const result = await act('bootstrap.setup', { name: name.trim(), email: email.trim(), password }, { silent: true });
    setBusy(false);
    if (result && !result.needsConfirm) router.push('/admin'); else setError('تعذّر إنشاء الحساب — ربما اكتمل الإعداد مسبقاً في هذه القاعدة. جرّب تسجيل الدخول.');
  }
  return <div className="max-w-xl mx-auto py-6">
    <div className="text-center mb-7">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-mint/10 border border-mint/25 flex items-center justify-center mb-4"><Crown size={30} className="mint" /></div>
      <h1 className="text-2xl sm:text-3xl">إطلاق <span className="mint">كرة المنار</span></h1>
      <p className="text-xs muted leading-7 mt-3">{seedEnabled ? 'قاعدة البيانات تجريبية ومهيئة مسبقاً. لتجربة سريعة ادخل من «تسجيل الدخول» بالحسابات التجريبية، أو تابع لإنشاء مالك جديد.' : 'لا يوجد أي حساب بعد. أنشئ حساب مدير المنصة (حسن) — وهذا آخر خطوة قبل فتح الملعب.'}</p>
    </div>
    <div className="panel p-6 sm:p-7">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label="اسم المدير" hint="الاسم الذي يظهر في الترحيب وقائمة الحساب."><input className="input" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={70} placeholder="حسن" /></FormField>
        <FormField label="البريد الإلكتروني" hint="سيكون اسم الدخول في كل مرة."><input className="input" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} required placeholder="owner@manar.iq" autoComplete="email" /></FormField>
        <FormField label="كلمة المرور" hint="8 أحرف على الأقل. غير قابلة للاسترجاع — احفظها في مكان آمن."><input className="input" type="password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" autoComplete="new-password" /></FormField>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary w-full mt-1" disabled={busy}>{busy ? <Spinner /> : <ShieldCheck size={16} />}إنشاء حساب المدير وبدء المنصة</button>
      </form>
      <div className="mt-6 pt-5 border-t border-slate-600/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] muted leading-6">
        <span className="flex gap-2"><Database size={14} className="mint shrink-0 mt-0.5" />الحساب يُنشَّر مرة واحدة فقط، ثم يُغلق هذا المعالج تلقائياً.</span>
        <span className="flex gap-2"><Sparkles size={14} className="gold shrink-0 mt-0.5" />من لوحة التحكم تضيف الفرق، تدعو إدارييها، وتصدّر نسخة احتياطية كاملة.</span>
      </div>
    </div>
    <p className="text-center mt-5 text-[11px] muted">بعد الأمان: غيّر كلمة المرور متى شئت من «ملفي الشخصي».<ArrowLeft size={12} className="inline mr-1" />رجوع</p>
  </div>;
}
