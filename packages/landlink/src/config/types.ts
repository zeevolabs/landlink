import type { HeadingBlock, ImageBlock, LinkBlock, SocialBlock } from "../blocks";
import type { Theme } from "../theme/apply-theme";

export interface Profile {
  name: string;
  avatar?: string;
  bio?: string;
  verified?: boolean;
}

export interface Meta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  locale?: string;
  twitterHandle?: string;
  keywords?: string[];
}

export type CustomBlock = { type: string } & Record<string, unknown>;

export type Block = LinkBlock | SocialBlock | HeadingBlock | ImageBlock | CustomBlock;

export interface Config {
  profile: Profile;
  theme?: Theme;
  meta?: Meta;
  blocks: Block[];
}
