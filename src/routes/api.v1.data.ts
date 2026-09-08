import { createFileRoute } from "@tanstack/react-router";
import { dataResponse } from "../lib/data.server";
export const Route = createFileRoute("/api/v1/data")({
  server: { handlers: { GET: ({ request }) => dataResponse(request) } },
});
