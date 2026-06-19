import { z } from "zod";
import { defineBlock } from "./define-block";

export const headingData = z.object({ text: z.string().min(1) });

export type HeadingBlock = z.infer<typeof headingData> & { type: "heading" };

function Heading({ text }: HeadingBlock) {
  return <h2 className="ll-heading">{text}</h2>;
}

export const headingBlock = defineBlock({ type: "heading", data: headingData, component: Heading });
