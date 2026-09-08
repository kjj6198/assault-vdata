import { createFileRoute } from "@tanstack/react-router";
import { regionsResponse } from "../lib/regions.server";
export const Route = createFileRoute("/api/v1/regions")({
  server: { handlers: { GET: ({ request }) => regionsResponse(request) } },
});
