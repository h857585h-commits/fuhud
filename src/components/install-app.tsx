'use client';
import { useEffect, useState } from 'react';
import { Smartphone, Download, Share, SquarePlus } from 'lucide-react';
import { Modal } from './ui';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Prominent "download the app" card shown at the top of the home page. */
export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as PromptEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  if (installed) return null;
  async function install() {
    if (deferred) { await deferred.prompt(); const choice = await deferred.userChoice; if (choice.outcome === 'accepted') setInstalled(true); setDeferred(null); return; }
    setHelp(true);
  }
  return <>
    <div className="banner-announce mint mb-5" role="region" aria-label="تنزيل التطبيق">
      <Smartphone size={20} className="mint shrink-0" />
      <p className="flex-1 leading-7"><b>كرة المنار على هاتفك</b><span className="block text-[11px] muted">نزّل التطبيق وادخل بلمسة وحدة من الشاشة الرئيسية.</span></p>
      <button className="btn btn-gold btn-sm shrink-0" onClick={install}><Download size={14} />تنزيل التطبيق</button>
    </div>
    {help && <Modal title="تنزيل تطبيق كرة المنار" onClose={() => setHelp(false)}>
      {ios ? <ol className="flex flex-col gap-4 text-sm leading-7">
        <li className="flex items-center gap-3"><Share size={18} className="mint shrink-0" />افتح الموقع من متصفح Safari واضغط زر المشاركة أسفل الشاشة.</li>
        <li className="flex items-center gap-3"><SquarePlus size={18} className="mint shrink-0" />اختر «إضافة إلى الشاشة الرئيسية».</li>
        <li className="flex items-center gap-3"><Download size={18} className="gold shrink-0" />اضغط «إضافة» وستجد أيقونة كرة المنار على هاتفك.</li>
      </ol> : <ol className="flex flex-col gap-4 text-sm leading-7">
        <li className="flex items-center gap-3"><Share size={18} className="mint shrink-0" />افتح الموقع من متصفح Chrome واضغط زر القائمة ⋮ أعلى الشاشة.</li>
        <li className="flex items-center gap-3"><SquarePlus size={18} className="mint shrink-0" />اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
        <li className="flex items-center gap-3"><Download size={18} className="gold shrink-0" />وافق على التثبيت وستجد أيقونة كرة المنار على هاتفك.</li>
      </ol>}
      <button className="btn btn-primary w-full mt-6" onClick={() => setHelp(false)}>تمام</button>
    </Modal>}
  </>;
}
