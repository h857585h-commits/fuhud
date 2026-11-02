export function todayKey() { return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10); }
export function addDays(date: string, count: number) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + count); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function compactNumber(number: number) { return number >= 1000 ? `${(number / 1000).toFixed(1)} ألف` : String(number); }
export async function imageFile(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('اختر صورة بصيغة JPG أو PNG أو WebP. تبقى الشفافية محفوظة لصور PNG وWebP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('يجب أن يكون حجم الصورة أقل من 8 ميغابايت');
  const url = URL.createObjectURL(file);
  try { const img = new Image(); img.src = url; await img.decode(); const canvas = document.createElement('canvas'); const scale = Math.min(1, 700 / Math.max(img.width, img.height)); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('تعذّرت معالجة الصورة'); const preserveAlpha = file.type !== 'image/jpeg';
    if (preserveAlpha) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return preserveAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', .85); } finally { URL.revokeObjectURL(url); }
}
export type MediaKind = 'image' | 'video' | 'audio' | 'file';
/** Uploads keep their native container: PNG/WEBP stay transparent, video/audio stay as-is. */
export async function mediaFile(file: File, kind: MediaKind, maxMb = 12): Promise<string> {
  if (file.size > maxMb * 1024 * 1024) throw new Error(`حجم الملف يجب أن يكون أقل من ${maxMb} ميغابايت`);
  if (kind === 'image') return imageFile(file);
  if (!file.type.startsWith(`${kind}/`) && kind !== 'file') throw new Error('نوع الملف غير مطابق للنوع المختار');
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Encode in chunks so large media never blows the argument limit of String.fromCharCode.
  const chunks: string[] = []; const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) chunks.push(String.fromCharCode(...bytes.subarray(i, i + step)));
  return `data:${file.type || 'application/octet-stream'};base64,${btoa(chunks.join(''))}`;
}

/** Records a voice note and returns it as a base64 webm payload. */
export function recordVoice(maxSeconds = 60): Promise<{ url: string; duration: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices?.getUserMedia) { reject(new Error('المتصفح لا يدعم تسجيل الصوت')); return; }
    void navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const rec = new MediaRecorder(stream); const parts: BlobPart[] = []; const started = Date.now();
      rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(parts, { type: rec.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => resolve({ url: String(reader.result), duration: Math.max(1, Math.round((Date.now() - started) / 1000)) });
        reader.onerror = () => reject(new Error('تعذّر حفظ التسجيل'));
        reader.readAsDataURL(blob);
      };
      rec.onerror = () => reject(new Error('فشل التسجيل'));
      rec.start();
      const stopper = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxSeconds * 1000);
      (globalThis as unknown as { __manarStopVoice?: () => void }).__manarStopVoice = () => { clearTimeout(stopper); if (rec.state !== 'inactive') rec.stop(); };
    }).catch(() => reject(new Error('امنح الإذن باستخدام الميكروفون')));
  });
}
export async function copyText(value: string) { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return; } const el = document.createElement('textarea'); el.value = value; el.style.position = 'fixed'; el.style.opacity = '0'; document.body.appendChild(el); el.select(); const ok = document.execCommand('copy'); el.remove(); if (!ok) throw new Error('انسخ الرابط الظاهر يدوياً'); }
export function hexAlpha(hex: string, alpha: string) { return /^#[0-9a-f]{6}$/i.test(hex) ? hex + alpha : hex; }

// shadcn helper kept for the template ui primitives.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
