import Link from '@/lib/next-shims/link';
import { MapPin, ArrowLeft } from 'lucide-react';
export function NotFoundView() { return <div className="panel p-12 text-center max-w-xl mx-auto my-12"><MapPin size={45} className="mint mx-auto mb-5" /><span className="text-6xl font-black mint">404</span><h1 className="text-2xl mt-5">يبدو أن الكرة خارج الملعب</h1><p className="muted text-sm mt-4 leading-8">الصفحة التي تبحث عنها غير موجودة. لنعُد إلى أجواء الملاعب.</p><Link href="/" className="btn btn-primary mt-6">العودة إلى الرئيسية<ArrowLeft size={16} /></Link></div>; }
