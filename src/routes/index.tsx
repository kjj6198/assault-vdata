import { createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDashboard, latestYear, yearSchema } from "../lib/data.server";
import { Dashboard } from "../components/Dashboard";

const loadDashboard = createServerFn({ method: "GET" })
  .validator(z.object({ year: z.number().optional() }))
  .handler(({ data }) => {
    if (data.year !== undefined && !yearSchema.safeParse(data.year).success)
      throw redirect({ to: "/", search: { year: latestYear } });
    return getDashboard(data.year ?? latestYear);
  });
export const Route = createFileRoute("/")({
  validateSearch: z.object({ year: z.coerce.number().int().optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: ({ deps }) => loadDashboard({ data: deps }),
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
