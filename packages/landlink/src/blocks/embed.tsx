import { z } from "zod";
import { defineBlock } from "./define-block";

export const embedData = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "compact"]).optional(),
});

export type EmbedBlock = z.infer<typeof embedData> & { type: "embed" };

function getEmbedUrl(url: string): string {
  // YouTube watch and short URLs
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Spotify track, album, playlist, episode, show
  const spMatch = url.match(
    /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
  );
  if (spMatch) return `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`;

  // Vimeo
  const viMatch = url.match(/vimeo\.com\/(\d+)/);
  if (viMatch) return `https://player.vimeo.com/video/${viMatch[1]}`;

  // SoundCloud — uses their widget player
  if (url.includes("soundcloud.com")) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true`;
  }

  // Return as-is for pre-formed embed URLs
  return url;
}

const ASPECT_PADDING: Record<string, string> = {
  "16:9": "56.25%",
  "4:3": "75%",
  "1:1": "100%",
};

function Embed({ url, title, aspectRatio = "16:9" }: EmbedBlock) {
  const embedUrl = getEmbedUrl(url);
  const isCompact = aspectRatio === "compact";

  if (isCompact) {
    return (
      <div className="ll-embed ll-embed-compact">
        <iframe
          src={embedUrl}
          title={title ?? "Media embed"}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="ll-embed" style={{ paddingBottom: ASPECT_PADDING[aspectRatio] ?? "56.25%" }}>
      <iframe
        src={embedUrl}
        title={title ?? "Media embed"}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export const embedBlock = defineBlock({ type: "embed", data: embedData, component: Embed });
