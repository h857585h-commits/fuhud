import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

export type AuthResult = { ok?: boolean; error?: string; message?: string; needsConfirm?: boolean };

const origin = () => (typeof window === 'undefined' ? '' : window.location.origin);
const arabicError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. إن كان حسابك من المنصة السابقة فاختر «أول دخول / نسيت كلمة المرور».';
  if (/email not confirmed/i.test(message)) return 'أكّد بريدك الإلكتروني أولاً من الرسالة التي وصلتك.';
  if (/already registered|already been registered/i.test(message)) return 'هذا البريد مسجّل مسبقاً. سجّل الدخول، أو اختر «أول دخول / نسيت كلمة المرور».';
  if (/password/i.test(message) && /(weak|short|least|pwned)/i.test(message)) return 'كلمة المرور ضعيفة أو قصيرة — استخدم 8 أحرف على الأقل.';
  if (/rate limit/i.test(message)) return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
  return message || 'تعذّر تنفيذ العملية';
};

/** Sign-in / sign-up actions handled by Lovable Cloud auth instead of the app server. */
export async function runAuthAction(action: string, p: Record<string, unknown>): Promise<AuthResult | null> {
  const email = String(p.email || '').trim().toLowerCase();
  const password = String(p.password || '');
  if (action === 'login') {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(arabicError(error.message));
    return { ok: true, message: 'أهلاً بك، تم تسجيل الدخول' };
  }
  if (action === 'logout') { await supabase.auth.signOut(); return { ok: true, message: 'تم تسجيل الخروج' }; }
  if (action === 'register' || action === 'bootstrap.setup') {
    const name = String(p.name || '').trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) throw new Error('أدخل اسماً وبريداً صحيحين وكلمة مرور من 8 أحرف على الأقل');
    const next = action === 'bootstrap.setup' ? '/admin' : p.invite ? '/team-admin' : '/';
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: origin() + next, data: { name, ...(p.invite ? { invite: String(p.invite) } : {}) } } });
    if (error) throw new Error(arabicError(error.message));
    if (data.session) return { ok: true, message: 'تم إنشاء حسابك بنجاح' };
    return { ok: true, needsConfirm: true, message: 'أرسلنا رابط تأكيد إلى بريدك. افتحه لإكمال إنشاء الحساب.' };
  }
  if (action === 'password.reset') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('أدخل بريداً إلكترونياً صحيحاً');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin() + '/reset-password' });
    if (error) throw new Error(arabicError(error.message));
    return { ok: true, needsConfirm: true, message: 'أرسلنا إلى بريدك رابطاً لاختيار كلمة مرور جديدة.' };
  }
  return null;
}

/** Applies password / email changes from the profile form to the Lovable Cloud account. */
export async function syncAccountChanges(p: Record<string, unknown>, currentEmail?: string) {
  const updates: { password?: string; email?: string } = {};
  if (p.password) { if (String(p.password).length < 8) throw new Error('كلمة المرور الجديدة 8 أحرف على الأقل'); updates.password = String(p.password); }
  if (p.email && currentEmail && String(p.email).trim().toLowerCase() !== currentEmail.toLowerCase()) updates.email = String(p.email).trim().toLowerCase();
  if (!updates.password && !updates.email) return '';
  const { error } = await supabase.auth.updateUser(updates, { emailRedirectTo: origin() + '/profile' });
  if (error) throw new Error(arabicError(error.message));
  return updates.email ? ' — أرسلنا رابط تأكيد إلى بريدك الجديد' : '';
}

export async function signInWithGoogle() {
  const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: origin() });
  if (result.error) throw new Error('تعذّر الدخول عبر Google');
}

/** 'anon' until the browser session is known, then the signed-in account id. */
export function useAuthKey() {
  const [key, setKey] = useState('anon');
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setKey(data.session?.user.id ?? 'anon'));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setKey(session?.user.id ?? 'anon'));
    return () => data.subscription.unsubscribe();
  }, []);
  return key;
}
