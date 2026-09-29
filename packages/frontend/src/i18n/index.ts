export type Locale = "en" | "fr" | "ar";
export type TextDirection = "ltr" | "rtl";

export interface LocaleRoot {
  lang: string;
  dir: string;
}

export const translations = {
  en: {
    school: "KRISTOU SCHOOL",
    schoolType: "École Primaire Privée",
    notifications: "Notifications",
    account: "Account",
    appearance: "Appearance",
    language: "Language",
    light: "Light",
    dark: "Pitch Black",
    close: "Close",
    noNotifications: "No new notifications",
    appearanceHint: "Light is the default.",
    shellHint: "Your school spaces will appear here after sign-in and authorization.",
  },
  fr: {
    school: "KRISTOU SCHOOL",
    schoolType: "École Primaire Privée",
    notifications: "Notifications",
    account: "Compte",
    appearance: "Apparence",
    language: "Langue",
    light: "Clair",
    dark: "Noir profond",
    close: "Fermer",
    noNotifications: "Aucune nouvelle notification",
    appearanceHint: "Le mode clair est le mode par défaut.",
    shellHint: "Vos espaces scolaires apparaîtront ici après connexion et autorisation.",
  },
  ar: {
    school: "كريستو سكول",
    schoolType: "مدرسة ابتدائية خاصة",
    notifications: "الإشعارات",
    account: "الحساب",
    appearance: "المظهر",
    language: "اللغة",
    light: "فاتح",
    dark: "أسود داكن",
    close: "إغلاق",
    noNotifications: "لا توجد إشعارات جديدة",
    appearanceHint: "الوضع الفاتح هو الوضع الافتراضي.",
    shellHint: "ستظهر مساحاتك المدرسية هنا بعد تسجيل الدخول والتحقق من الصلاحيات.",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function directionFor(locale: Locale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function applyLocale(root: LocaleRoot, locale: Locale): void {
  root.lang = locale;
  root.dir = directionFor(locale);
}
