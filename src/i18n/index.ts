import { useParams } from "@tanstack/react-router";
import { zh, type LabelKind, type Messages } from "./zh";
import { en } from "./en";
import { ja } from "./ja";
import { intlTag, toLocale, type Locale } from "./locales";

export const messages: Record<Locale, Messages> = { zh, en, ja };

export function useI18n() {
  const { locale: param } = useParams({ strict: false });
  const locale = toLocale(param);
  const t = messages[locale];
  return {
    locale,
    t,
    intl: intlTag[locale],
    name: (kind: LabelKind, raw: string) => t.labels[kind][raw] ?? raw,
  };
}
