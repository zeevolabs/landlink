import type { Config } from "../config/types";

export interface RobotsOutput {
  rules: { userAgent: string; allow: string };
  sitemap?: string;
}

export function buildRobots(config: Config): RobotsOutput {
  const result: RobotsOutput = {
    rules: { userAgent: "*", allow: "/" },
  };

  if (config.meta?.url) {
    const base = config.meta.url.replace(/\/$/, "");
    result.sitemap = `${base}/sitemap.xml`;
  }

  return result;
}
