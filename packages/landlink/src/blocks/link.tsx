import { z } from "zod";
import { defineBlock } from "./define-block";
import { iconPaths } from "../icons";

export const linkData = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  description: z.string().optional(),
  variant: z.enum(["fill", "outline"]).optional(),
  icon: z.string().optional(),
  locked: z.boolean().optional(),
  pin: z.string().optional(),
});

export type LinkBlock = z.infer<typeof linkData> & { type: "link" };

function LinkButton({ label, url, description, variant = "fill", icon, locked, analyticsPath }: LinkBlock & { analyticsPath?: string }) {
  if (locked) {
    return (
      <div className="ll-link ll-link-locked" data-variant={variant}>
        <span className="ll-link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
        <span className="ll-link-text">
          <span className="ll-link-label">{label}</span>
          {description ? <span className="ll-link-description">{description}</span> : null}
        </span>
      </div>
    );
  }

  const href = analyticsPath
    ? `${analyticsPath}/click?to=${encodeURIComponent(url)}&id=${encodeURIComponent(label)}`
    : url;
  return (
    <a
      className="ll-link"
      data-variant={variant}
      href={href}
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
