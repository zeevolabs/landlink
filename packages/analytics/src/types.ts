export interface DailyStats {
  date: string;
  count: number;
}

export interface BlockStats {
  id: string;
  totalClicks: number;
  last7Days: DailyStats[];
}

export interface PageStats {
  pageId: string;
  totalViews: number;
  last7Days: DailyStats[];
  blocks: BlockStats[];
}

export interface AnalyticsOptions {
  /** Upstash Redis REST URL. Falls back to UPSTASH_REDIS_REST_URL env var. */
  url?: string;
  /** Upstash Redis REST token. Falls back to UPSTASH_REDIS_REST_TOKEN env var. */
  token?: string;
  /** Logical page identifier used as a key prefix. Default: "main". */
  pageId?: string;
}
