import { input, select, checkbox, confirm } from "@inquirer/prompts";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { generateConfig } from "./generate.js";
import type {
  Answers,
  LinkEntry,
  SocialEntry,
  EmailCaptureEntry,
  CountdownEntry,
  VcardEntry,
  TestimonialEntry,
} from "./generate.js";

const THEMES = [
  "light", "dark", "rose", "mint", "ocean",
  "sunset", "lavender", "sand", "midnight", "candy", "sunflower",
];

const SOCIAL_PLATFORMS = [
  { value: "instagram", name: "Instagram" },
  { value: "tiktok", name: "TikTok" },
  { value: "whatsapp", name: "WhatsApp" },
  { value: "facebook", name: "Facebook" },
  { value: "x", name: "X (Twitter)" },
  { value: "youtube", name: "YouTube" },
  { value: "linkedin", name: "LinkedIn" },
  { value: "spotify", name: "Spotify" },
];

const PLATFORM_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  facebook: "https://facebook.com/",
  x: "https://x.com/",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  spotify: "https://open.spotify.com/artist/",
};

const SPECIAL_BLOCKS = [
  { value: "email-capture", name: "Email capture (newsletter signup)" },
  { value: "countdown", name: "Countdown timer" },
  { value: "vcard", name: "vCard (save contact)" },
  { value: "testimonial", name: "Testimonial / social proof" },
];

async function promptLinks(): Promise<LinkEntry[]> {
  const links: LinkEntry[] = [];
  let addMore = true;

  while (addMore) {
    const label = await input({ message: "  Link label:", validate: (v) => v.trim() !== "" || "Required" });
    const url = await input({ message: "  URL:", validate: (v) => v.startsWith("http") || "Must start with http(s)" });
    const variant = await select({
      message: "  Style:",
      choices: [
        { value: "fill" as const, name: "Fill (solid button)" },
        { value: "outline" as const, name: "Outline (bordered button)" },
      ],
    });
    links.push({ label: label.trim(), url: url.trim(), variant });
    addMore = await confirm({ message: "  Add another link?", default: true });
    if (addMore) console.log();
  }

  return links;
}

async function promptSocials(): Promise<SocialEntry[]> {
  const selected = await checkbox({
    message: "Select social platforms:",
    choices: SOCIAL_PLATFORMS,
  });

  if (selected.length === 0) return [];

  const socials: SocialEntry[] = [];
  console.log();

  for (const platform of selected) {
    const meta = SOCIAL_PLATFORMS.find((p) => p.value === platform)!;

    if (platform === "whatsapp") {
      const number = await input({
        message: `  WhatsApp number (with country code, e.g. 5511999999999):`,
        validate: (v) => /^\d{7,15}$/.test(v.trim()) || "Digits only, with country code",
      });
      socials.push({ platform: "WhatsApp", url: `https://wa.me/${number.trim()}` });
    } else {
      const base = PLATFORM_BASE[platform] ?? "";
      const handle = await input({
        message: `  ${meta.name} handle (without @):`,
        validate: (v) => v.trim() !== "" || "Required",
      });
      socials.push({ platform: meta.name, url: `${base}${handle.trim()}` });
    }
  }

  return socials;
}

async function promptEmailCapture(): Promise<EmailCaptureEntry> {
  const heading = await input({ message: "  Form heading (optional):" });
  const endpoint = await input({
    message: "  POST endpoint URL (e.g. /api/subscribe):",
    default: "/api/subscribe",
  });
  return { heading: heading.trim(), endpoint: endpoint.trim() };
}

async function promptCountdown(): Promise<CountdownEntry> {
  const title = await input({ message: "  Countdown label (optional):" });
  const targetDate = await input({
    message: "  Target date (ISO format, e.g. 2025-12-31T00:00:00Z):",
    validate: (v) => !isNaN(Date.parse(v)) || "Invalid date format",
  });
  return { title: title.trim(), targetDate: targetDate.trim() };
}

async function promptVcard(): Promise<VcardEntry> {
  const name = await input({ message: "  Full name:", validate: (v) => v.trim() !== "" || "Required" });
  const title = await input({ message: "  Job title (optional):" });
  const email = await input({ message: "  Email (optional):" });
  const phone = await input({ message: "  Phone (optional):" });
  return {
    name: name.trim(),
    title: title.trim() || undefined,
    email: email.trim() || undefined,
    phone: phone.trim() || undefined,
  };
}

async function promptTestimonial(): Promise<TestimonialEntry> {
  const quote = await input({ message: "  Quote text:", validate: (v) => v.trim() !== "" || "Required" });
  const author = await input({ message: "  Author name:", validate: (v) => v.trim() !== "" || "Required" });
  const role = await input({ message: "  Author role/title (optional):" });
  const ratingStr = await select({
    message: "  Star rating:",
    choices: [
      { value: "0", name: "No rating" },
      { value: "3", name: "★★★ 3 stars" },
      { value: "4", name: "★★★★ 4 stars" },
      { value: "5", name: "★★★★★ 5 stars" },
    ],
  });
  return {
    quote: quote.trim(),
    author: author.trim(),
    role: role.trim() || undefined,
    rating: ratingStr !== "0" ? Number(ratingStr) : undefined,
  };
}

async function promptSpecialBlocks(
  selected: string[],
): Promise<Pick<Answers, "emailCapture" | "countdown" | "vcard" | "testimonial">> {
  const result: Pick<Answers, "emailCapture" | "countdown" | "vcard" | "testimonial"> = {};

  for (const block of selected) {
    console.log();
    if (block === "email-capture") {
      console.log("  ✉  Email capture:");
      result.emailCapture = await promptEmailCapture();
    } else if (block === "countdown") {
      console.log("  ⏱  Countdown timer:");
      result.countdown = await promptCountdown();
    } else if (block === "vcard") {
      console.log("  👤 vCard:");
      result.vcard = await promptVcard();
    } else if (block === "testimonial") {
      console.log("  💬 Testimonial:");
      result.testimonial = await promptTestimonial();
    }
  }

  return result;
}

export async function main() {
  console.log("\n  ╔══════════════════════════════╗");
  console.log("  ║    create-landlink  v0.1     ║");
  console.log("  ╚══════════════════════════════╝\n");
  console.log("  Scaffold a landlink.config.ts for your link-in-bio page.\n");

  // Profile
  const name = await input({ message: "Your name:", validate: (v) => v.trim() !== "" || "Required" });
  const bio = await input({ message: "Bio (optional):" });
  const avatar = await input({ message: "Avatar URL (optional, e.g. /avatar.jpg):" });

  // Theme
  const theme = await select({
    message: "Theme:",
    choices: THEMES.map((t) => ({ value: t, name: t.charAt(0).toUpperCase() + t.slice(1) })),
  });

  // Links
  console.log();
  const hasLinks = await confirm({ message: "Add links?", default: true });
  const links: LinkEntry[] = hasLinks ? await promptLinks() : [];

  // Socials
  console.log();
  const socials: SocialEntry[] = await promptSocials();

  // Special blocks
  console.log();
  const specialSelected = await checkbox({
    message: "Add special blocks (optional):",
    choices: SPECIAL_BLOCKS,
  });
  const specialData = specialSelected.length > 0
    ? await promptSpecialBlocks(specialSelected)
    : {};

  const answers: Answers = {
    name: name.trim(),
    bio: bio.trim(),
    avatar: avatar.trim(),
    theme,
    links,
    socials,
    ...specialData,
  };

  // Output file
  console.log();
  const outPath = resolve(process.cwd(), "landlink.config.ts");
  const exists = existsSync(outPath);

  if (exists) {
    const overwrite = await confirm({
      message: "landlink.config.ts already exists. Overwrite?",
      default: false,
    });
    if (!overwrite) {
      console.log("\n  Aborted — no files written.\n");
      process.exit(0);
    }
  }

  writeFileSync(outPath, generateConfig(answers), "utf-8");

  console.log("\n  ✔  landlink.config.ts created!\n");
  console.log("  Next steps:");
  console.log("    1. npm install @zeevolabs/landlink");
  console.log("    2. Import config and render <Landlink config={config} />");
  console.log("    3. Visit https://github.com/zeevolabs/landlink for the full guide\n");
}
