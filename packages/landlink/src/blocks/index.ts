import { embedBlock } from "./embed";
import { headingBlock } from "./heading";
import { imageBlock } from "./image";
import { linkBlock } from "./link";
import { socialBlock } from "./social";

export const defaultBlocks = [linkBlock, socialBlock, headingBlock, imageBlock, embedBlock];

export { embedBlock, headingBlock, imageBlock, linkBlock, socialBlock };
export { defineBlock } from "./define-block";
export type { BlockDefinition, BlockProps } from "./define-block";
export type { EmbedBlock } from "./embed";
export type { HeadingBlock } from "./heading";
export type { ImageBlock } from "./image";
export type { LinkBlock } from "./link";
export type { SocialBlock } from "./social";
