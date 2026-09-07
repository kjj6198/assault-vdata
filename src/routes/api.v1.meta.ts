import { createFileRoute } from "@tanstack/react-router";
import { database } from "../lib/data.server";
export const Route = createFileRoute("/api/v1/meta")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          schemaVersion: database.schemaVersion,
          years: database.years,
          sources: database.sources,
          qualityNotes: database.qualityNotes,
          definitions: {
            reports: "通報件數（件）",
            victims: "受暴人數（人）",
            demographics: "受暴人數，依年齡及性別",
            relationships: "受暴人數，依年齡及兩造關係",
            share: "該類別人數或件數／全國同年度總數；不是人口發生率。",
          },
        }),
    },
  },
});
