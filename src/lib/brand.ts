/** Public identity defaults; saved dashboard values take precedence. */
export const BRAND_DEFAULTS = {
  siteName: 'منصة الفهود الرياضية',
  siteNameEn: 'الفهود الرياضية',
  tagline: 'شغف الرياضة يجمعنا',
  description: 'منصة الفهود الرياضية لمتابعة الفرق والمباريات والبطولات والأخبار ومشاركة شغف الجماهير.',
  location: 'قضاء الفهود — ذي قار — العراق',
  homeTitle: 'منصة الفهود الرياضية',
  homeEyebrow: 'من قلب الفهود، إلى كل مدرّج',
  heroSubtitle: 'تابع فريقك، عِش المواجهة، وشارك شغفك مع جماهير الفهود.',
  onboardingWelcome: 'أهلاً بك في منصة الفهود الرياضية',
  onboardingTagline: 'منصة الفرق والبطولات في قضاء الفهود',
  aboutTitle: 'حكايتنا من قلب المدرجات',
  aboutIntro: 'منصة تجمع الفرق واللاعبين والجماهير على شغف الرياضة.',
  aboutBody: 'منصة الفهود الرياضية مساحة لأخبار الفرق ومتابعة المباريات والبطولات، وتوثيق النتائج والإنجازات. نشارك حكايات اللاعبين وشغف الجماهير، ونحفظ لحظات الملاعب بروح رياضية واحترام للجميع.',
  studioName: 'استوديو الفهود',
  timeZoneLabel: 'بتوقيت العراق',
  scorersTitle: 'هدافو الفهود',
};

export function resolveBranding(saved: Record<string, string> = {}) {
  const resolved: Record<string, string> = { ...saved };
  for (const [key, fallback] of Object.entries(BRAND_DEFAULTS)) {
    resolved[key] = saved[key]?.trim() || fallback;
  }
  return resolved as Record<string, string> & typeof BRAND_DEFAULTS;
}

type Meta = { title?: string; name?: string; property?: string; content?: string };
/** Read public branding from the shared snapshot for leaf-route metadata. */
export function brandMeta(meta: Meta[], matches: readonly { loaderData?: unknown }[]) {
  let saved: Record<string, string> = {};
  for (const match of matches) {
    const value = match.loaderData;
    if (value && typeof value === 'object' && 'branding' in value && value.branding && typeof value.branding === 'object') {
      saved = value.branding as Record<string, string>;
    }
  }
  const brand = resolveBranding(saved);
  return meta.map(item => ({
    ...item,
    ...(item.title ? { title: item.title.replaceAll(BRAND_DEFAULTS.siteName, brand.siteName) } : {}),
    ...(item.content ? { content: item.content.replaceAll(BRAND_DEFAULTS.siteName, brand.siteName) } : {}),
  }));
}