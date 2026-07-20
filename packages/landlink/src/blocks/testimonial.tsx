import { z } from "zod";
import { defineBlock } from "./define-block";

export const testimonialData = z.object({
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export type TestimonialBlock = z.infer<typeof testimonialData> & { type: "testimonial" };

function Stars({ rating, suffix }: { rating: number; suffix: string }) {
  return (
    <div className="ll-testimonial-stars" aria-label={`${rating} ${suffix}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`ll-star ${i < rating ? "ll-star-filled" : "ll-star-empty"}`}>★</span>
      ))}
    </div>
  );
}

function Testimonial({ quote, author, role, avatar, rating, strings }: TestimonialBlock & { strings?: { testimonialRatingSuffix: string } }) {
  return (
    <div className="ll-testimonial">
      {rating !== undefined && <Stars rating={rating} suffix={strings?.testimonialRatingSuffix ?? "out of 5 stars"} />}
      <blockquote className="ll-testimonial-quote">"{quote}"</blockquote>
      <div className="ll-testimonial-author">
        {avatar && <img src={avatar} alt={author} className="ll-testimonial-avatar" />}
        <div>
          <p className="ll-testimonial-name">{author}</p>
          {role && <p className="ll-testimonial-role">{role}</p>}
        </div>
      </div>
    </div>
  );
}

export const testimonialBlock = defineBlock({
  type: "testimonial",
  data: testimonialData,
  component: Testimonial,
});
