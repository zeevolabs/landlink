import type { Config } from "../config/types";

export interface JsonLdOutput {
  "@context": "https://schema.org";
  "@type": "ProfilePage";
  name: string;
  description?: string;
  url?: string;
  mainEntity: {
    "@type": "Person";
    name: string;
    description?: string;
    image?: string;
    url?: string;
    sameAs?: string[];
  };
}

export function buildJsonLd(config: Config): JsonLdOutput {
  const { profile, meta, blocks } = config;

  const sameAs: string[] = [];
  for (const block of blocks) {
    if (block.type === "social" && "items" in block) {
      const items = block.items as Array<{ url?: string }>;
      for (const item of items) {
        if (item.url) sameAs.push(item.url);
      }
    }
  }

  const result: JsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: meta?.title ?? profile.name,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
    },
  };

  const description = meta?.description ?? profile.bio;
  if (description) {
    result.description = description;
    result.mainEntity.description = description;
  }

  if (meta?.url) {
    result.url = meta.url;
    result.mainEntity.url = meta.url;
  }

  const image = meta?.image ?? profile.avatar;
  if (image) {
    result.mainEntity.image = image;
  }

  if (sameAs.length > 0) {
    result.mainEntity.sameAs = sameAs;
  }

  return result;
}
