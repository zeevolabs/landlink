import { embedBlock } from "./embed";
import { headingBlock } from "./heading";
import { imageBlock } from "./image";
import { linkBlock } from "./link";
import { socialBlock } from "./social";
import { testimonialBlock } from "./testimonial";

// rssFeedBlock is server-only (async component, no client bundle)
export const defaultBlocks = [linkBlock, socialBlock, headingBlock, imageBlock, embedBlock, testimonialBlock];

export { embedBlock, headingBlock, imageBlock, linkBlock, socialBlock, testimonialBlock };
export { rssFeedBlock } from "./rss-feed";
export { defineBlock } from "./define-block";
export type { BlockDefinition, BlockProps } from "./define-block";
export type { EmbedBlock } from "./embed";
export type { HeadingBlock } from "./heading";
export type { ImageBlock } from "./image";
export type { LinkBlock } from "./link";
export type { RssFeedBlock } from "./rss-feed";
export type { SocialBlock } from "./social";
export type { TestimonialBlock } from "./testimonial";
