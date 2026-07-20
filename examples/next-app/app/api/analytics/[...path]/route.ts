import { createAnalyticsHandler } from "@zeevolabs/landlink-analytics";

const handler = createAnalyticsHandler({ pageId: "main" });

export const GET = (request: Request) => handler.route(request);
export const POST = (request: Request) => handler.route(request);
