/**
 * Permission catalogue shared by the developer panel, the UI (button gating) and
 * the API (enforcement). Keeping it in one place means a switch in the panel is
 * the single source of truth — nothing is "hidden only".
 */
export type PermKey =
  | 'canPublishNews' | 'canEditMatches' | 'canApproveComments' | 'canModeratePosts' | 'canManageTeams'
  | 'canManageTournaments' | 'canManagePlayers' | 'canEditAnyLineup' | 'canPublishAnnouncements'
  | 'canBanUsers' | 'canVerifyUsers' | 'canAssignBadges' | 'canAccessAnalytics' | 'canUploadHighlights'
  | 'canCustomizeSite' | 'canBackupData' | 'canRefereeAnyMatch' | 'canAccessAdmin';

export type PermGroup = { title: string; hint: string; items: { key: PermKey; label: string; desc: string }[] };

export const PERMISSION_GROUPS: PermGroup[] = [
  {
    title: 'المحتوى والأخبار', hint: 'من يملك قلم النادي',
    items: [
      { key: 'canPublishNews', label: 'نشر وتعديل الأخبار', desc: 'يكتب أخباراً للفرق التي ينتمي لها أو عامة.' },
      { key: 'canPublishAnnouncements', label: 'نشر الإعلانات العلنية', desc: 'شريط إعلاني أعلى الصفحة الرئيسية.' },
      { key: 'canUploadHighlights', label: 'رفع الأبرزات والصور', desc: 'إضافة صور ومقاطع لمعارض الفرق وأبرزاته.' },
    ],
  },
  {
    title: 'المباريات والبطولات', hint: 'قلب المنافسة',
    items: [
      { key: 'canEditMatches', label: 'تعديل نتائج وجدولة المباريات', desc: 'أقوى صلاحية ميدانية: النتيجة والأحداث والترتيب يتغير بها.' },
      { key: 'canManageTournaments', label: 'إدارة البطولات وتوليد الجداول', desc: 'إنشاء بطولة، ربط تأهل، توليد مواجهات.' },
      { key: 'canEditAnyLineup', label: 'بناء تشكيلات أي فريق', desc: 'بدون هذه يستطيع إداري الفريق تشكيلته فقط.' },
      { key: 'canRefereeAnyMatch', label: 'تحكيم أي مباراة (تصحيح أحداث)', desc: 'لأعضاء الهيئة التحكيمية الموثوقين.' },
    ],
  },
  {
    title: 'الفرق واللاعبون', hint: 'قواعد البيانات الرياضية',
    items: [
      { key: 'canManageTeams', label: 'تسجيل واعتماد الفرق', desc: 'إضافة فريق، اعتماده، تعديل هويته.' },
      { key: 'canManagePlayers', label: 'إدارة لاعبي أي فريق', desc: 'إضافة/تعديل/حذف لاعبين خارج فريقه.' },
    ],
  },
  {
    title: 'المجتمع والإشراف', hint: 'أمان الساحة',
    items: [
      { key: 'canApproveComments', label: 'اعتماد وتعليق التعليقات', desc: 'مراجعة صوت المدرجات قبل النشر.' },
      { key: 'canModeratePosts', label: 'مراجعة منشورات وستوري الساحة', desc: 'اعتماد أو رفض محتوى الجماهير.' },
      { key: 'canVerifyUsers', label: 'توثيق الأعضاء وإسناد الشارات', desc: 'الشارة الزرقاء + شارات الفئات.' },
      { key: 'canAssignBadges', label: 'إسناد الشارات فقط', desc: 'يمنح الشارات دون توثيق.' },
      { key: 'canBanUsers', label: 'إيقاف وتقييد وحذف الأعضاء', desc: 'إجراءات ردع كاملة.' },
    ],
  },
  {
    title: 'الأدوات التقنية', hint: 'للفريق التقني',
    items: [
      { key: 'canAccessAnalytics', label: 'لوحة التحليلات والإحصاءات', desc: 'أرقام المشاهدات والتفاعل والنمو.' },
      { key: 'canBackupData', label: 'تصدير واستيراد النسخ الاحتياطية', desc: 'صلاحية حساسة جداً.' },
      { key: 'canCustomizeSite', label: 'تخصيص هوية الموقع الكاملة', desc: 'الاسم، الشعار، الألوان، النصوص.' },
      { key: 'canAccessAdmin', label: 'الدخول إلى لوحة التحكم', desc: 'بدونها تظهر رسالة «مساحة أصحاب الصلاحية».' },
    ],
  },
];

export const ALL_PERM_KEYS: PermKey[] = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));

/** Preset roles the developer can apply in one click, then fine-tune. */
export const ROLE_PRESETS: { id: string; label: string; badge: BadgeKey; perms: PermKey[] }[] = [
  { id: 'league_president', label: 'رئيس رابطة', badge: 'league_president', perms: ['canManageTeams', 'canManageTournaments', 'canEditMatches', 'canApproveComments', 'canModeratePosts', 'canVerifyUsers', 'canAssignBadges', 'canAccessAnalytics', 'canAccessAdmin', 'canPublishAnnouncements', 'canEditAnyLineup'] },
  { id: 'league_member', label: 'عضو رابطة', badge: 'league_member', perms: ['canApproveComments', 'canModeratePosts', 'canAccessAnalytics', 'canAccessAdmin'] },
  { id: 'referee', label: 'حكم معتمد', badge: 'referee', perms: ['canRefereeAnyMatch', 'canEditMatches', 'canAccessAdmin'] },
  { id: 'photographer', label: 'مصوّر', badge: 'photographer', perms: ['canPublishNews', 'canUploadHighlights', 'canModeratePosts', 'canAccessAdmin'] },
  { id: 'media', label: 'إعلامي', badge: 'media', perms: ['canPublishNews', 'canPublishAnnouncements', 'canUploadHighlights', 'canAccessAnalytics', 'canAccessAdmin'] },
  { id: 'team_admin', label: 'إداري فريق', badge: 'team_admin', perms: ['canManagePlayers', 'canPublishNews', 'canUploadHighlights'] },
  { id: 'star_fan', label: 'مشجع مميز', badge: 'star_fan', perms: ['canUploadHighlights'] },
  { id: 'season_star', label: 'نجم الموسم', badge: 'season_star', perms: [] },
  { id: 'top_scorer', label: 'هدّاف', badge: 'top_scorer', perms: [] },
  { id: 'player', label: 'لاعب فريق', badge: 'player', perms: [] },
];

export type BadgeKey = 'player' | 'referee' | 'league_member' | 'league_president' | 'photographer' | 'media' | 'star_fan' | 'season_star' | 'top_scorer' | 'team_admin' | '';

/** Verification levels — colour tells the story before the words do. */
export const VERIFY_LEVELS = {
  blue: { label: 'لاعب موثّق', ring: ['#5aa9ff', '#7de3ff', '#5aa9ff'], glow: '#5aa9ff' },
  gold: { label: 'رئيس الرابطة', ring: ['#ffd76a', '#ffe9a8', '#f0b429'], glow: '#f0b429' },
  red: { label: 'حكم معتمد', ring: ['#ff8a8a', '#ffd0c0', '#e35d5d'], glow: '#e35d5d' },
  mint: { label: 'حساب رسمي', ring: ['#78dfab', '#d5ffe9', '#3fbf85'], glow: '#3fbf85' },
} as const;
export type VerifyLevel = keyof typeof VERIFY_LEVELS;

export const BADGES: Record<Exclude<BadgeKey, ''>, { label: string; Icon: string; className: string; withTeam?: boolean }> = {
  player: { label: 'لاعب', Icon: '👕', className: 'badge-player', withTeam: true },
  referee: { label: 'حكم', Icon: '🏁', className: 'badge-referee', withTeam: false },
  league_member: { label: 'عضو الرابطة', Icon: '🛡️', className: 'badge-league' },
  league_president: { label: 'رئيس الرابطة', Icon: '👑', className: 'badge-president' },
  photographer: { label: 'مصوّر', Icon: '📸', className: 'badge-photo' },
  media: { label: 'إعلامي', Icon: '🎙️', className: 'badge-media' },
  star_fan: { label: 'مشجع مميز', Icon: '⭐', className: 'badge-starfan' },
  season_star: { label: 'نجم الموسم', Icon: '🌟', className: 'badge-seasonstar' },
  top_scorer: { label: 'الهدّاف', Icon: '⚽', className: 'badge-scorer' },
  team_admin: { label: 'إداري فريق', Icon: '🗂️', className: 'badge-teamadmin', withTeam: true },
};

/** level for the animated verification mark, derived from role + badge. */
export function verifyLevelOf(user: { role?: string; badge?: string; verified?: boolean } | null | undefined): VerifyLevel {
  if (!user?.verified) return 'mint';
  if (user.badge === 'league_president' || user.role === 'super') return 'gold';
  if (user.badge === 'referee' || user.role === 'referee') return 'red';
  return 'blue';
}

export function hasPerm(me: { role?: string; permissions?: Record<string, boolean> } | null | undefined, key: PermKey): boolean {
  if (!me) return false;
  if (me.role === 'super') return true;
  return Boolean(me.permissions?.[key]);
}
