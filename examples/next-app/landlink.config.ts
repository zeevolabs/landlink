import { createRegistry, defaultBlocks, parseConfig } from "@zeevolabs/landlink";
import { highlightBlock } from "./blocks/highlight";

export const registry = createRegistry([...defaultBlocks, highlightBlock]);

export const config = parseConfig(
  {
    profile: {
      name: "Alex Rivera",
      avatar: "/avatar.svg",
      bio: "Full-stack developer & OSS contributor",
      verified: true,
    },
    theme: "dark",
    meta: {
      title: "Alex Rivera",
      description: "Developer, writer, and open-source contributor.",
    },
    blocks: [
      { type: "highlight", emoji: "🚀", text: "Open for freelance work" },
      { type: "heading", text: "Projects" },
      {
        type: "link",
        label: "GitHub",
        url: "https://github.com/alexrivera",
        variant: "fill",
      },
      { type: "link", label: "Blog", url: "https://alexrivera.dev/blog", variant: "outline" },
      { type: "link", label: "Resume", url: "/resume.pdf", variant: "outline" },
      { type: "heading", text: "Social" },
      {
        type: "social",
        items: [
          { platform: "LinkedIn", url: "https://linkedin.com/in/alexrivera" },
          { platform: "X", url: "https://x.com/alexrivera" },
        ],
      },
    ],
  },
  registry,
);
