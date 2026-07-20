import { Redis } from "@upstash/redis";
import type { AnalyticsOptions, BlockStats, DailyStats, PageStats } from "./types";

const TTL_SECONDS = 90 * 24 * 60 * 60;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function last7Dates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function createRedis(opts: AnalyticsOptions): Redis {
  if (opts.url && opts.token) return new Redis({ url: opts.url, token: opts.token });
  return Redis.fromEnv();
}

export async function trackView(redis: Redis, pageId: string): Promise<void> {
  const date = todayUTC();
  const pipe = redis.pipeline();
  pipe.incr(`ll:pv:${pageId}`);
  pipe.incr(`ll:pv:${pageId}:${date}`);
  pipe.expire(`ll:pv:${pageId}:${date}`, TTL_SECONDS);
  await pipe.exec();
}

export async function trackClick(redis: Redis, pageId: string, blockId: string): Promise<void> {
  const date = todayUTC();
  const safeId = blockId.replace(/:/g, "_");
  const pipe = redis.pipeline();
  pipe.incr(`ll:click:${pageId}:${safeId}`);
  pipe.incr(`ll:click:${pageId}:${safeId}:${date}`);
  pipe.expire(`ll:click:${pageId}:${safeId}:${date}`, TTL_SECONDS);
  pipe.sadd(`ll:blocks:${pageId}`, safeId);
  await pipe.exec();
}

export async function getStats(redis: Redis, pageId: string): Promise<PageStats> {
  const dates = last7Dates();

  const totalViews = (await redis.get<number>(`ll:pv:${pageId}`)) ?? 0;

  const viewPipe = redis.pipeline();
  for (const date of dates) viewPipe.get(`ll:pv:${pageId}:${date}`);
  const viewCounts = await viewPipe.exec<(number | null)[]>();
  const last7Days: DailyStats[] = dates.map((date, i) => ({
    date,
    count: (viewCounts[i] as number | null) ?? 0,
  }));

  const blockIds = await redis.smembers<string[]>(`ll:blocks:${pageId}`);

  const blocks: BlockStats[] = [];
  for (const blockId of blockIds) {
    const totalClicks = (await redis.get<number>(`ll:click:${pageId}:${blockId}`)) ?? 0;
    const clickPipe = redis.pipeline();
    for (const date of dates) clickPipe.get(`ll:click:${pageId}:${blockId}:${date}`);
    const clickCounts = await clickPipe.exec<(number | null)[]>();
    blocks.push({
      id: blockId,
      totalClicks,
      last7Days: dates.map((date, i) => ({
        date,
        count: (clickCounts[i] as number | null) ?? 0,
      })),
    });
  }

  blocks.sort((a, b) => b.totalClicks - a.totalClicks);

  return { pageId, totalViews, last7Days, blocks };
}
