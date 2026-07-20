"use client";

export { countdownBlock } from "./blocks/countdown";
export type { CountdownBlock } from "./blocks/countdown";
export { emailCaptureBlock } from "./blocks/email-capture";
export type { EmailCaptureBlock } from "./blocks/email-capture";
export { lockedLinkBlock } from "./blocks/locked-link";
export { vcardBlock } from "./blocks/vcard";
export type { VcardBlock } from "./blocks/vcard";

import { countdownBlock } from "./blocks/countdown";
import { emailCaptureBlock } from "./blocks/email-capture";
import { lockedLinkBlock } from "./blocks/locked-link";
import { vcardBlock } from "./blocks/vcard";
import type { BlockDefinition } from "./blocks/define-block";

export const clientBlocks: BlockDefinition[] = [countdownBlock, emailCaptureBlock, lockedLinkBlock, vcardBlock];
