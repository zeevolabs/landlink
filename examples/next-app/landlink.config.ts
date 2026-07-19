import { defineConfig } from "@zeevolabs/landlink";

export const config = defineConfig({
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
    { type: "heading", text: "Latest Talk" },
    {
      type: "embed",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Conference talk",
      aspectRatio: "16:9",
    },
    {
      type: "countdown",
      targetDate: "2027-01-01T00:00:00Z",
      title: "Next release in",
    },
    {
      type: "email-capture",
      heading: "Stay in the loop",
      placeholder: "your@email.com",
      buttonText: "Subscribe",
      endpoint: "/api/subscribe",
    },
  ],
});
