import { MotionConfig } from "motion/react";
import { HeadContent, Scripts, Outlet, createRootRoute } from "@tanstack/react-router";
import stylesheet from "../styles.css?url";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "看見數字背後｜台灣性侵害統計" },
      {
        name: "description",
        content: "從2008至2025年官方資料，認識台灣性侵害通報、被害人年齡、兩造關係與縣市分布。",
      },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/LINESeedTW-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/SpaceGrotesk-Latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: stylesheet },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: () => (
    <html lang="zh-Hant">
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
  ),
  notFoundComponent: () => (
    <main className="mx-auto my-[15vh] max-w-[600px] p-7.5">
      <h1 className="text-4xl font-bold">找不到這個頁面</h1>
      <a href="/">回到統計專題</a>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main className="mx-auto my-[15vh] max-w-[600px] p-7.5">
      <h1 className="text-4xl font-bold">資料暫時無法載入</h1>
      <p>請稍後再試。</p>
      <button className="mt-3.75 min-h-11 cursor-pointer bg-secondary p-2.5" onClick={reset}>
        重新載入
      </button>
    </main>
  ),
});
