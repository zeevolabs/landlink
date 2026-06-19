import { z } from "zod";
import { defineBlock } from "./define-block";

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
      {icon ? (
        <span className="ll-link-icon" aria-hidden="true">
          {icon}
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
