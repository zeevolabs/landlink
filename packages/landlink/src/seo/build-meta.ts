import type { Config } from "../config/types";
import { resolveTheme } from "../theme/apply-theme";

export interface LandlinkMetadata {
  title: string;
  description: string;
  themeColor?: string;
  keywords?: string[];
  alternates?: { canonical?: string };
  verification?: { google?: string };
  openGraph: {
    title: string;
    description: string;
    type: "website";
    url?: string;
    locale?: string;
    images?: Array<{ url: string; alt?: string }>;
  };
  twitter: {
    card: "summary_large_image" | "summary";
    title: string;
    description: string;
    site?: string;
    creator?: string;
    images?: string[];
  };
}

export function buildMeta(config: Config): LandlinkMetadata {
  const { profile, meta } = config;

  const title = meta?.title ?? profile.name;
  const description = meta?.description ?? profile.bio ?? "";
  const image = meta?.image ?? profile.avatar;
  const url = meta?.url;
  const locale = meta?.locale;
  const twitterHandle = meta?.twitterHandle;

  const result: LandlinkMetadata = {
    title,
    description,
    themeColor: resolveTheme(config.theme).bg,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };

  if (meta?.keywords?.length) {
    result.keywords = meta.keywords;
  }

  if (url) {
    result.alternates = { canonical: url };
    result.openGraph.url = url;
  }

  if (locale) {
    result.openGraph.locale = locale;
  }

  if (image) {
    result.openGraph.images = [{ url: image, alt: profile.name }];
    result.twitter.images = [image];
  }

  if (twitterHandle) {
    const handle = twitterHandle.startsWith("@") ? twitterHandle : `@${twitterHandle}`;
    result.twitter.site = handle;
    result.twitter.creator = handle;
  }

  if (meta?.googleVerification) {
    result.verification = { google: meta.googleVerification };
  }

  return result;
}
