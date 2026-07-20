"use client";

import { useState } from "react";
import { z } from "zod";
import { defineBlock } from "./define-block";
import type { LandlinkStrings } from "../strings";

export const emailCaptureData = z.object({
  heading: z.string().optional(),
  placeholder: z.string().optional(),
  buttonText: z.string().optional(),
  successMessage: z.string().optional(),
  endpoint: z.string().min(1),
});

export type EmailCaptureBlock = z.infer<typeof emailCaptureData> & { type: "email-capture" };

function EmailCapture({
  heading,
  placeholder = "your@email.com",
  buttonText = "Subscribe",
  successMessage = "Thank you!",
  endpoint,
  strings,
}: EmailCaptureBlock & { strings?: LandlinkStrings }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="ll-email-capture">
        <p className="ll-email-success">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="ll-email-capture">
      {heading && <p className="ll-email-heading">{heading}</p>}
      <form className="ll-email-form" onSubmit={submit}>
        <input
          id="ll-email"
          name="email"
          type="email"
          className="ll-email-input"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <button type="submit" className="ll-email-btn" disabled={status === "loading"}>
          {status === "loading" ? "..." : buttonText}
        </button>
      </form>
      {status === "error" && (
        <p className="ll-email-error">{strings?.emailCaptureError ?? "Something went wrong. Please try again."}</p>
      )}
    </div>
  );
}

export const emailCaptureBlock = defineBlock({
  type: "email-capture",
  data: emailCaptureData,
  component: EmailCapture,
});
