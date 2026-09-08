import { MotionConfig } from "motion/react";
import { HeadContent, Scripts, Outlet, createRootRoute } from "@tanstack/react-router";
import stylesheet from "../styles.css?url";
import { useI18n } from "../i18n";
import { htmlLang } from "../i18n/locales";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/LINESeedTW-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap",
      },
      { rel: "stylesheet", href: stylesheet },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: Document,
  notFoundComponent: NotFound,
  errorComponent: LoadError,
});
function Document() {
  const { locale } = useI18n();
  return (
    <html lang={htmlLang[locale]}>
      <head>
        <HeadContent />
      </head>
      <body>
        <MotionConfig reducedMotion="user">
          <Outlet />
        </MotionConfig>
        <Scripts />
      </body>
    </html>
  );
}
function NotFound() {
  const { t } = useI18n();
  return (
    <main className="mx-auto my-[15vh] max-w-150 p-7.5">
      <h1 className="text-4xl font-bold">{t.notFound.title}</h1>
      <a href="/">{t.notFound.home}</a>
    </main>
  );
}
function LoadError({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto my-[15vh] max-w-150 p-7.5">
      <h1 className="text-4xl font-bold">{t.error.title}</h1>
      <p>{t.error.body}</p>
      <button className="mt-3.75 min-h-11 cursor-pointer bg-secondary p-2.5" onClick={reset}>
        {t.error.retry}
      </button>
    </main>
  );
}
