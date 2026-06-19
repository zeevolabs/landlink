import { z } from "zod";
import { defineBlock } from "./define-block";

export const imageData = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
  href: z.string().optional(),
});

export type ImageBlock = z.infer<typeof imageData> & { type: "image" };

function Image({ src, alt = "", href }: ImageBlock) {
  const img = <img className="ll-image" src={src} alt={alt} />;
  if (!href) return img;
  return (
    <a className="ll-image-link" href={href} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  );
}

export const imageBlock = defineBlock({ type: "image", data: imageData, component: Image });
