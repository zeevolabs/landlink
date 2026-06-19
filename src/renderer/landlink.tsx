import { defaultBlocks } from "../blocks";
import type { Config } from "../config/types";
import { type Registry, createRegistry } from "../registry/registry";
import { applyTheme } from "../theme/apply-theme";
import { Profile } from "./profile";

const defaultRegistry = createRegistry(defaultBlocks);

export interface LandlinkProps {
  config: Config;
  registry?: Registry;
  className?: string;
}

export function Landlink({ config, registry = defaultRegistry, className }: LandlinkProps) {
  const rootClass = ["ll-root", className].filter(Boolean).join(" ");

  return (
    <div data-landlink className={rootClass} style={applyTheme(config.theme)}>
      <main className="ll-container">
        <Profile {...config.profile} />
        <div className="ll-blocks">
          {config.blocks.map((block, index) => {
            const definition = registry.resolve(block.type);
            if (!definition) return null;
            const Block = definition.component;
            return <Block key={index} {...block} />;
          })}
        </div>
      </main>
    </div>
  );
}
