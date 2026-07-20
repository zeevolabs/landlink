export interface LinkEntry {
  label: string;
  url: string;
  variant: "fill" | "outline";
}

export interface SocialEntry {
  platform: string;
  url: string;
}

export interface EmailCaptureEntry {
  heading: string;
  endpoint: string;
}

export interface CountdownEntry {
  title: string;
  targetDate: string;
}

export interface VcardEntry {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

export interface TestimonialEntry {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}

export interface Answers {
  name: string;
  bio: string;
  avatar: string;
  theme: string;
  links: LinkEntry[];
  socials: SocialEntry[];
  emailCapture?: EmailCaptureEntry;
  countdown?: CountdownEntry;
  vcard?: VcardEntry;
  testimonial?: TestimonialEntry;
}

function indent(lines: string[], spaces = 4): string {
  const pad = " ".repeat(spaces);
  return lines.map((l) => (l === "" ? "" : pad + l)).join("\n");
}

function blockLines(answers: Answers): string[] {
  const lines: string[] = [];

  for (const link of answers.links) {
    lines.push(`{ type: "link", label: ${JSON.stringify(link.label)}, url: ${JSON.stringify(link.url)}, variant: "${link.variant}" },`);
  }

  if (answers.socials.length > 0) {
    lines.push(`{`);
    lines.push(`  type: "social",`);
    lines.push(`  items: [`);
    for (const s of answers.socials) {
      lines.push(`    { platform: ${JSON.stringify(s.platform)}, url: ${JSON.stringify(s.url)} },`);
    }
    lines.push(`  ],`);
    lines.push(`},`);
  }

  if (answers.emailCapture) {
    const ec = answers.emailCapture;
    lines.push(`{`);
    lines.push(`  type: "email-capture",`);
    if (ec.heading) lines.push(`  heading: ${JSON.stringify(ec.heading)},`);
    lines.push(`  endpoint: ${JSON.stringify(ec.endpoint)},`);
    lines.push(`},`);
  }

  if (answers.countdown) {
    const cd = answers.countdown;
    lines.push(`{`);
    lines.push(`  type: "countdown",`);
    if (cd.title) lines.push(`  title: ${JSON.stringify(cd.title)},`);
    lines.push(`  targetDate: ${JSON.stringify(cd.targetDate)},`);
    lines.push(`},`);
  }

  if (answers.vcard) {
    const vc = answers.vcard;
    lines.push(`{`);
    lines.push(`  type: "vcard",`);
    lines.push(`  name: ${JSON.stringify(vc.name)},`);
    if (vc.title) lines.push(`  title: ${JSON.stringify(vc.title)},`);
    if (vc.email) lines.push(`  email: ${JSON.stringify(vc.email)},`);
    if (vc.phone) lines.push(`  phone: ${JSON.stringify(vc.phone)},`);
    lines.push(`},`);
  }

  if (answers.testimonial) {
    const tm = answers.testimonial;
    lines.push(`{`);
    lines.push(`  type: "testimonial",`);
    lines.push(`  quote: ${JSON.stringify(tm.quote)},`);
    lines.push(`  author: ${JSON.stringify(tm.author)},`);
    if (tm.role) lines.push(`  role: ${JSON.stringify(tm.role)},`);
    if (tm.rating) lines.push(`  rating: ${tm.rating},`);
    lines.push(`},`);
  }

  return lines;
}

export function generateConfig(answers: Answers): string {
  const blocks = blockLines(answers);
  const blocksStr = blocks.length > 0 ? indent(blocks, 4) : "";

  const avatarLine = answers.avatar ? `\n    avatar: ${JSON.stringify(answers.avatar)},` : "";
  const bioLine = answers.bio ? `\n    bio: ${JSON.stringify(answers.bio)},` : "";

  return `import { defineConfig } from "@zeevolabs/landlink";

export const config = defineConfig({
  profile: {
    name: ${JSON.stringify(answers.name)},${avatarLine}${bioLine}
  },
  theme: "${answers.theme}",
  blocks: [
${blocksStr}
  ],
});
`;
}
