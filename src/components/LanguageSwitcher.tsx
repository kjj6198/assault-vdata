import { Link } from "@tanstack/react-router";
import { useI18n } from "../i18n";
import { htmlLang, localeNames, locales, toParam } from "../i18n/locales";
import { cn } from "../lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  return (
    <nav aria-label={t.language} className={cn("flex items-center gap-1 text-caption", className)}>
      {locales.map((option) => (
        <Link
          key={option}
          to="/{-$locale}"
          params={{ locale: toParam(option) }}
          search={(previous) => previous}
          lang={htmlLang[option]}
          hrefLang={htmlLang[option]}
          aria-current={option === locale ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-[4px] px-2.5 text-muted-foreground hover:text-foreground hover:no-underline aria-[current=page]:font-bold aria-[current=page]:text-foreground"
        >
          {localeNames[option]}
        </Link>
      ))}
    </nav>
  );
}
