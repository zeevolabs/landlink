import type { Config } from "../config/types";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly" | "daily" | "monthly";
  priority: number;
}

export function buildSitemap(config: Config): SitemapEntry[] {
  const url = config.meta?.url;
  if (!url) return [];

  return [
    {
      url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
