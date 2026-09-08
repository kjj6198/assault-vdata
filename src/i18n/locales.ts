export const locales = ["zh", "en", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh";
/** Locales that appear as a URL prefix. The default locale has no prefix. */
export const urlLocales = ["en", "ja"] as const;
export type UrlLocale = (typeof urlLocales)[number];
export const isUrlLocale = (value: string): value is UrlLocale =>
  (urlLocales as readonly string[]).includes(value);
export const toLocale = (param: string | undefined): Locale =>
  param !== undefined && isUrlLocale(param) ? param : defaultLocale;
export const toParam = (locale: Locale): UrlLocale | undefined =>
  locale === defaultLocale ? undefined : locale;
export const htmlLang: Record<Locale, string> = { zh: "zh-Hant", en: "en", ja: "ja" };
export const intlTag: Record<Locale, string> = { zh: "zh-TW", en: "en", ja: "ja-JP" };
export const localeNames: Record<Locale, string> = { zh: "繁體中文", en: "English", ja: "日本語" };
