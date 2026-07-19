"use client";

import { Landlink, createRegistry, defaultBlocks } from "@zeevolabs/landlink";
import type { Config } from "@zeevolabs/landlink";
import { countdownBlock, emailCaptureBlock } from "@zeevolabs/landlink/client";
import { highlightBlock } from "../blocks/highlight";

const registry = createRegistry([
  ...defaultBlocks,
  highlightBlock,
  countdownBlock,
  emailCaptureBlock,
]);

export function ClientLandlink({ config }: { config: Config }) {
  return <Landlink config={config} registry={registry} />;
}
