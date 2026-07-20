"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { defineBlock } from "./define-block";
import type { LandlinkStrings } from "../strings";

export const countdownData = z.object({
  targetDate: z.string().min(1),
  title: z.string().optional(),
  expiredMessage: z.string().optional(),
});

export type CountdownBlock = z.infer<typeof countdownData> & { type: "countdown" };

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Countdown({ targetDate, title, expiredMessage, strings }: CountdownBlock & { strings?: LandlinkStrings }) {
  // Initialize with null to avoid SSR/client hydration mismatch (Date.now() differs).
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="ll-countdown">
        <p className="ll-countdown-expired">{expiredMessage ?? "Event has ended"}</p>
      </div>
    );
  }

  return (
    <div className="ll-countdown">
      {title && <p className="ll-countdown-title">{title}</p>}
      <div className="ll-countdown-grid">
        {(
          [
            [timeLeft.days, strings?.countdownDays ?? "days"],
            [timeLeft.hours, strings?.countdownHours ?? "hrs"],
            [timeLeft.minutes, strings?.countdownMinutes ?? "min"],
            [timeLeft.seconds, strings?.countdownSeconds ?? "sec"],
          ] as [number, string][]
        ).map(([value, label]) => (
          <div key={label} className="ll-countdown-item">
            <span className="ll-countdown-number">{pad(value)}</span>
            <span className="ll-countdown-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const countdownBlock = defineBlock({
  type: "countdown",
  data: countdownData,
  component: Countdown,
});
