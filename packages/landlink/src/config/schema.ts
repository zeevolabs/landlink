import { z } from "zod";
import { themeTokens } from "../theme/tokens";

export const profileSchema = z.object({
  name: z.string().min(1),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  verified: z.boolean().optional(),
});

const tokenOverrideSchema = z.object(
  Object.fromEntries(Object.keys(themeTokens).map((key) => [key, z.string()])),
) as z.ZodObject<Record<keyof typeof themeTokens, z.ZodString>>;

export const themeSchema = z.union([z.string(), tokenOverrideSchema.partial()]);

export const effectsSchema = z.object({
  socialIconContainers: z.boolean().optional(),
  backgroundNoise: z.boolean().optional(),
  avatarGlow: z.boolean().optional(),
}).optional();

export const metaSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    url: z.string(),
    locale: z.string(),
    twitterHandle: z.string(),
    keywords: z.array(z.string()),
    googleVerification: z.string(),
  })
  .partial();
