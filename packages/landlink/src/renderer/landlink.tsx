import { defaultBlocks } from "../blocks";
import type { Config } from "../config/types";
import { type Registry, createRegistry } from "../registry/registry";
import { applyTheme, resolveTheme } from "../theme/apply-theme";
import { en, type LandlinkStrings } from "../strings";
import { Profile } from "./profile";

const defaultRegistry = createRegistry(defaultBlocks);

export interface LandlinkProps {
  config: Config;
  registry?: Registry;
  className?: string;
  /** Path to the admin panel. Renders a subtle gear icon in the footer. */
  adminPath?: string;
  /** Base path for API endpoints used by interactive blocks. Default: "/api" */
  apiBasePath?: string;
  /** Base path for the analytics API. When set, link clicks are tracked via redirect. */
  analyticsPath?: string;
  /** UI strings for i18n. Defaults to English. Import `ptBR` from "@zeevolabs/landlink" for Portuguese. */
  strings?: Partial<LandlinkStrings>;
}

export function Landlink({ config, registry = defaultRegistry, className, adminPath, apiBasePath = "/api", analyticsPath, strings }: LandlinkProps) {
  const s: LandlinkStrings = { ...en, ...strings };
  const resolved = resolveTheme(config.theme);
  const animClass = resolved.bgAnimation !== "none" ? resolved.bgAnimation : "";
  const rootClass = ["ll-root", animClass, className].filter(Boolean).join(" ");

  return (
      <div data-landlink className={rootClass} style={applyTheme(config.theme)}>
        <main className="ll-container">
          <Profile {...config.profile} strings={s} />
          <div className="ll-blocks">
            {config.blocks.map((block, index) => {
              const definition = registry.resolve(block.type);
              if (!definition) return null;
              const Block = definition.component;
              return <Block key={index} {...block} apiBasePath={apiBasePath} analyticsPath={analyticsPath} strings={s} />;
            })}
          </div>
          {adminPath && (
            <footer className="ll-footer">
              <a href={adminPath} className="ll-admin-link" aria-label={s.manageLabel}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </a>
            </footer>
          )}
        </main>
      </div>
  );
}
