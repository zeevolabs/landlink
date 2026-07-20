"use client";

import { useState } from "react";
import { z } from "zod";
import { defineBlock } from "./define-block";
import type { LandlinkStrings } from "../strings";

export const vcardData = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

export type VcardBlock = z.infer<typeof vcardData> & { type: "vcard" };

function buildVcf(data: VcardBlock): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.name}`,
    `N:${data.name.split(" ").reverse().join(";")};;;`,
  ];
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.website) lines.push(`URL:${data.website}`);
  if (data.address) lines.push(`ADR:;;${data.address};;;;`);
  if (data.note) lines.push(`NOTE:${data.note}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function VcardButton({ name, title, email, phone, website, company, address, note, type, strings }: VcardBlock & { strings?: LandlinkStrings }) {
  const [downloaded, setDownloaded] = useState(false);

  const download = () => {
    const vcf = buildVcf({ name, title, email, phone, website, company, address, note, type });
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const saveLabel = strings?.vcardSave ?? "Save contact";
  const savedLabel = strings?.vcardSaved ?? "Contact saved!";

  return (
    <button type="button" className="ll-vcard" onClick={download}>
      <span className="ll-vcard-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M9 10a3 3 0 106 0 3 3 0 00-6 0" /><path d="M5 20c.5-2 2.5-3 4-3h6c1.5 0 3.5 1 4 3" />
        </svg>
      </span>
      <span className="ll-vcard-text">
        <span className="ll-vcard-label">{downloaded ? savedLabel : saveLabel}</span>
        {name && !downloaded && <span className="ll-vcard-name">{name}{title ? ` · ${title}` : ""}</span>}
      </span>
    </button>
  );
}

export const vcardBlock = defineBlock({
  type: "vcard",
  data: vcardData,
  component: VcardButton,
});
