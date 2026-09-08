import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Route } from "../src/routes/{-$locale}/index";
import { getDashboard, latestYear } from "../src/lib/data.server";
import { getRouter } from "../src/router";

const originalLoader = Route.options.loader;
afterEach(() => {
  Route.options.loader = originalLoader;
});

describe.each(["/", "/en", "/ja"])("alternate-language links for %s", (pathname) => {
  it.each([
    ["?year=2019", "?year=2019"],
    ["", ""],
  ])("preserves the validated year from '%s'", async (search, expectedSearch) => {
    // Run the data loader locally without the compiled server-function transport.
    Route.options.loader = async ({ deps }) => getDashboard(deps.year ?? latestYear);
    const router = getRouter();
    router.update({
      history: createMemoryHistory({ initialEntries: [`${pathname}${search}`] }),
    });

    await router.load();

    const match = router.state.matches.find((entry) => entry.routeId === Route.id);
    expect(match?.status).toBe("success");
    expect(match?.links?.filter((link) => link?.rel === "alternate")).toEqual([
      { rel: "alternate", hrefLang: "zh-Hant", href: `/${expectedSearch}` },
      { rel: "alternate", hrefLang: "en", href: `/en${expectedSearch}` },
      { rel: "alternate", hrefLang: "ja", href: `/ja${expectedSearch}` },
    ]);
  });
});
