import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "كلمة مرور جديدة | كرة المنار" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك في كرة المنار." },
      { property: "og:title", content: "كلمة مرور جديدة | كرة المنار" },
      { property: "og:description", content: "اختر كلمة مرور جديدة لحسابك في كرة المنار." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => { if (event === "PASSWORD_RECOVERY" || session) setReady(true); });
    void supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password.length < 8) { setError("كلمة المرور 8 أحرف على الأقل"); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError("تعذّر حفظ كلمة المرور. اطلب رابطاً جديداً وحاول مجدداً."); return; }
    void navigate({ to: "/" });
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="panel max-w-md w-full p-7">
        <div className="flex items-center gap-3 mb-5"><KeyRound size={26} className="mint" /><h1 className="text-xl">اختر كلمة مرور جديدة</h1></div>
        <p className="text-xs muted leading-7 mb-5">بعد الحفظ تدخل مباشرة إلى حسابك، ويبقى ملفك وبياناتك كما هي.</p>
        {!ready ? <p className="text-sm muted">جارٍ التحقق من الرابط… إن لم يتغير شيء، افتح الرابط من رسالة البريد مجدداً.</p> :
          <form onSubmit={submit} className="flex flex-col gap-4">
            <input className="input" type="password" dir="ltr" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary w-full" disabled={busy}>حفظ كلمة المرور</button>
          </form>}
      </div>
    </main>
  );
}
