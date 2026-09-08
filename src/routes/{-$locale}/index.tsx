import { createFileRoute, notFound, redirect, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDashboard, latestYear, yearSchema } from "../../lib/data.server";
import { Dashboard } from "../../components/Dashboard";
import { messages } from "../../i18n";
import { htmlLang, isUrlLocale, locales, toLocale, toParam } from "../../i18n/locales";

const openGraphLocale = { zh: "zh_TW", en: "en_US", ja: "ja_JP" } as const;
const socialImage = "/og.png";

const loadDashboard = createServerFn({ method: "GET" })
  .validator(z.object({ year: z.number().optional(), locale: z.string().optional() }))
  .handler(({ data }) => {
    if (data.year !== undefined && !yearSchema.safeParse(data.year).success)
      throw redirect({
        to: "/{-$locale}",
        params: { locale: data.locale },
        search: { year: latestYear },
      });
    return getDashboard(data.year ?? latestYear);
  });
export const Route = createFileRoute("/{-$locale}/")({
  beforeLoad: ({ params }) => {
    if (params.locale !== undefined && !isUrlLocale(params.locale)) throw notFound();
  },
  validateSearch: z.object({ year: z.coerce.number().int().optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: ({ deps, params }) => loadDashboard({ data: { ...deps, locale: params.locale } }),
  head: ({ params, match }) => {
    const locale = toLocale(params.locale);
    const { meta } = messages[locale];
    const { year } = match.loaderDeps;
    const search = year === undefined ? "" : `?year=${year}`;
    const canonicalPath = `${toParam(locale) === undefined ? "/" : `/${toParam(locale)}`}${search}`;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { name: "robots", content: "index, follow" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
        { property: "og:site_name", content: meta.siteName },
        { property: "og:locale", content: openGraphLocale[locale] },
        ...locales
          .filter((alternate) => alternate !== locale)
          .map((alternate) => ({
            property: "og:locale:alternate",
            content: openGraphLocale[alternate],
          })),
        { property: "og:image", content: socialImage },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: meta.imageAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: meta.title },
        { name: "twitter:description", content: meta.description },
        { name: "twitter:image", content: socialImage },
        { name: "twitter:image:alt", content: meta.imageAlt },
      ],
      links: [
        { rel: "canonical", href: canonicalPath },
        ...locales.map((alternate) => ({
          rel: "alternate",
          hrefLang: htmlLang[alternate],
          href: `/${toParam(alternate) ?? ""}${search}`,
        })),
        { rel: "alternate", hrefLang: "x-default", href: `/${search}` },
        ...(locale === "ja"
          ? [
              {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400..700&display=swap",
              },
            ]
          : []),
      ],
    };
  },
  component: Home,
});
function Home() {
  const data = Route.useLoaderData();
  const pending = useRouterState({ select: (state) => state.isLoading });
  const navigate = Route.useNavigate();
  return (
    <Dashboard
      data={data}
      pending={pending}
      onYearChange={(year) => void navigate({ search: { year }, resetScroll: false })}
    />
  );
}
