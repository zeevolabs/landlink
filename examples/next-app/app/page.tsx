import type { Metadata } from "next";
import { trackPageView } from "@zeevolabs/landlink-analytics";
import { config } from "../landlink.config";
import { ClientLandlink } from "./client-landlink";

export function generateMetadata(): Metadata {
  const { profile, meta } = config;
  const title = meta?.title ?? profile.name;
  const description = meta?.description ?? profile.bio;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: meta?.image ? [meta.image] : undefined,
    },
  };
}

export default async function Page() {
  await trackPageView({ pageId: "main" }).catch(() => {});
  return <ClientLandlink config={config} analyticsPath="/api/analytics" />;
}
