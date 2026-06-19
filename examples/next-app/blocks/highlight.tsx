import { defineBlock } from "@zeevolabs/landlink";
import { z } from "zod";

export const highlightBlock = defineBlock({
  type: "highlight",
  data: z.object({ emoji: z.string().optional(), text: z.string().min(1) }),
  component: ({ emoji, text }) => (
    <div className="highlight">
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
      <strong>{text}</strong>
    </div>
  ),
});
