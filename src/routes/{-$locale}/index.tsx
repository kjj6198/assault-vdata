import { createFileRoute, notFound, redirect, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDashboard, latestYear, yearSchema } from "../../lib/data.server";
import { Dashboard } from "../../components/Dashboard";
import { messages } from "../../i18n";
import { htmlLang, isUrlLocale, locales, toLocale, toParam } from "../../i18n/locales";

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
    return {
      meta: [{ title: meta.title }, { name: "description", content: meta.description }],
      links: [
        ...locales.map((alternate) => ({
          rel: "alternate",
          hrefLang: htmlLang[alternate],
          href: `/${toParam(alternate) ?? ""}${search}`,
        })),
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
