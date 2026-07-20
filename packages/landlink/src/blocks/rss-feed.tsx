import { z } from "zod";
import { defineBlock } from "./define-block";

export const rssFeedData = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  maxItems: z.number().min(1).max(10).optional(),
  showDate: z.boolean().optional(),
  showDescription: z.boolean().optional(),
});

export type RssFeedBlock = z.infer<typeof rssFeedData> & { type: "rss-feed" };

interface FeedItem {
  title: string;
  link: string;
  date?: string;
  description?: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (e) => HTML_ENTITIES[e] ?? e);
}

function cdata(s: string): string {
  return decodeEntities(s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim());
}

function innerText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return cdata(m[1] ?? "").replace(/<[^>]+>/g, "").trim();
}

function attrHref(xml: string): string {
  const m = xml.match(/href="([^"]+)"/i);
  return m ? (m[1] ?? "") : "";
}

function parseItems(xml: string, max: number): FeedItem[] {
  const isAtom = /<feed\b/i.test(xml);
  const itemTag = isAtom ? "entry" : "item";
  const regex = new RegExp(`<${itemTag}[\\s\\S]*?<\\/${itemTag}>`, "gi");
  const raw = xml.match(regex) ?? [];

  return raw.slice(0, max).map((block) => {
    const title = innerText(block, "title");
    const description = cdata(innerText(block, isAtom ? "summary" : "description")).slice(0, 200);

    let link = "";
    if (isAtom) {
      const linkEl = block.match(/<link[^>]+rel=["']alternate["'][^>]*>/i)
        ?? block.match(/<link[^>]+href=/i);
      link = linkEl ? attrHref(linkEl[0]) : "";
    } else {
      link = innerText(block, "link") || innerText(block, "guid");
    }

    const rawDate = innerText(block, isAtom ? "published" : "pubDate")
      || innerText(block, "updated");
    let date: string | undefined;
    if (rawDate) {
      try {
        date = new Date(rawDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      } catch { /* ignore invalid dates */ }
    }

    return { title, link, date, description: description || undefined };
  });
}

async function RssFeed({ url, title, maxItems = 3, showDate = true, showDescription = false }: RssFeedBlock) {
  let items: FeedItem[] = [];

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
    if (res.ok) {
      const xml = await res.text();
      items = parseItems(xml, maxItems);
    }
  } catch { /* fail silently */ }

  if (items.length === 0) return null;

  return (
    <div className="ll-rss">
      {title && <p className="ll-rss-title">{title}</p>}
      <ul className="ll-rss-list">
        {items.map((item, i) => (
          <li key={i} className="ll-rss-item">
            <a
              className="ll-rss-link"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ll-rss-item-title">{item.title}</span>
              {showDate && item.date && (
                <span className="ll-rss-item-date">{item.date}</span>
              )}
            </a>
            {showDescription && item.description && (
              <p className="ll-rss-item-desc">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const rssFeedBlock = defineBlock({
  type: "rss-feed",
  data: rssFeedData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: RssFeed as any,
});
