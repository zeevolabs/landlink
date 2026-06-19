import { z } from "zod";
import { defineBlock } from "./define-block";

export const socialData = z.object({
  items: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().min(1),
        label: z.string().optional(),
      }),
    )
    .min(1),
});

export type SocialBlock = z.infer<typeof socialData> & { type: "social" };

function SocialBar({ items }: SocialBlock) {
  return (
    <nav className="ll-social" aria-label="Social links">
      {items.map((item) => (
        <a
          key={item.url}
          className="ll-social-item"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.label ?? item.platform}
        </a>
      ))}
    </nav>
  );
}

export const socialBlock = defineBlock({ type: "social", data: socialData, component: SocialBar });
