import { Landlink } from "@zeevolabs/landlink";
import type { Metadata } from "next";
import { config, registry } from "../landlink.config";

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

export default function Page() {
  return <Landlink config={config} registry={registry} />;
}
