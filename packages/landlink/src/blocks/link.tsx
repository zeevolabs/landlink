import { z } from "zod";
import { defineBlock } from "./define-block";
import { iconPaths } from "../icons";

export const linkData = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  description: z.string().optional(),
  variant: z.enum(["fill", "outline"]).optional(),
  icon: z.string().optional(),
});

export type LinkBlock = z.infer<typeof linkData> & { type: "link" };

function LinkButton({ label, url, description, variant = "fill", icon }: LinkBlock) {
  return (
    <a
      className="ll-link"
      data-variant={variant}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon && iconPaths[icon] ? (
        <span className="ll-link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPaths[icon]} />
          </svg>
        </span>
      ) : null}
      <span className="ll-link-text">
        <span className="ll-link-label">{label}</span>
        {description ? <span className="ll-link-description">{description}</span> : null}
      </span>
    </a>
  );
}

export const linkBlock = defineBlock({ type: "link", data: linkData, component: LinkButton });
