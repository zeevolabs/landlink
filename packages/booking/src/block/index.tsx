import { z } from "zod";
import { defineBlock } from "@zeevolabs/landlink";
import { BookingWidget } from "./widget";

export const bookingData = z.object({
  title: z.string().default("Schedule"),
  description: z.string().optional(),
  buttonText: z.string().default("Book now"),
  featured: z.boolean().optional(),
  services: z
    .array(
      z.object({
        name: z.string().min(1),
        durationMinutes: z.number().min(15),
        price: z.number().optional(),
      }),
    )
    .min(1),
});

export type BookingBlock = z.infer<typeof bookingData> & { type: "booking" };

export const bookingBlock = defineBlock({
  type: "booking",
  data: bookingData,
  component: BookingWidget,
});
