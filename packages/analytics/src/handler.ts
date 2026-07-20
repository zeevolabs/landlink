import { createRedis, getStats, trackClick, trackView } from "./store";
import type { AnalyticsOptions, PageStats } from "./types";

export interface AnalyticsHandler {
  route(request: Request): Promise<Response>;
}

export function createAnalyticsHandler(options: AnalyticsOptions): AnalyticsHandler {
  const redis = createRedis(options);
  const pageId = options.pageId ?? "main";

  return {
    async route(request) {
      const url = new URL(request.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const action = segments[segments.length - 1];

      if (request.method === "GET") {
        if (action === "click") {
          const to = url.searchParams.get("to") ?? "/";
          const id = url.searchParams.get("id") ?? "unknown";
          await trackClick(redis, pageId, id);
          return Response.redirect(to, 302);
        }

        if (action === "stats") {
          const stats: PageStats = await getStats(redis, pageId);
          return Response.json(stats);
        }
      }

      if (request.method === "POST" && action === "track") {
        const body = (await request.json()) as { type?: string; blockId?: string };
        if (body.type === "view") {
          await trackView(redis, pageId);
        } else if (body.type === "click" && body.blockId) {
          await trackClick(redis, pageId, body.blockId);
        }
        return new Response(null, { status: 204 });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    },
  };
}

export async function trackPageView(options: AnalyticsOptions): Promise<void> {
  const redis = createRedis(options);
  const pageId = options.pageId ?? "main";
  await trackView(redis, pageId);
}
