"use client";

import { Landlink, createRegistry, defaultBlocks, ptBR } from "@zeevolabs/landlink";
import type { Config } from "@zeevolabs/landlink";
import { clientBlocks } from "@zeevolabs/landlink/client";
import { highlightBlock } from "../blocks/highlight";

const registry = createRegistry([
  ...defaultBlocks,
  highlightBlock,
  ...clientBlocks,
]);

export function ClientLandlink({ config, analyticsPath }: { config: Config; analyticsPath?: string }) {
  return <Landlink config={config} registry={registry} analyticsPath={analyticsPath} strings={ptBR} />;
}
