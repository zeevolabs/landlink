"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Landlink, themePresets } from "@zeevolabs/landlink";
import type { Registry, PresetName } from "@zeevolabs/landlink";
import type { FieldDescriptor } from "../zod-to-fields";
import { AvatarUpload } from "./avatar-upload";
import { IconPicker } from "./icon-picker";
import { PreviewFrame } from "./preview-frame";
import { SocialEditor } from "./social-editor";
import type { SocialItem } from "./social-editor";
import { BookingList } from "./booking-list";
import { BookingSettings } from "./booking-settings";
import type { AdminStrings } from "../strings";
import { en as enStrings } from "../strings";

interface Block {
  type: string;
  [key: string]: unknown;
}

interface Config {
  profile: { name: string; avatar?: string; bio?: string };
  theme?: Record<string, string>;
  meta?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    locale?: string;
    twitterHandle?: string;
    keywords?: string[];
  };
  blocks: Block[];
}

type SchemaMap = Record<string, FieldDescriptor[]>;
type Tab = "content" | "bookings" | "analytics" | "theme" | "settings";
type SettingsSection = "seo" | "integrations";

export type UploadAvatarFn = (file: File) => Promise<string>;

export interface AdminPanelProps {
  registry: Registry;
  basePath?: string;
  onUploadAvatar?: UploadAvatarFn;
  /** Base path for the analytics API (e.g. "/api/analytics"). Enables the Analytics tab. */
  analyticsPath?: string;
  strings?: Partial<AdminStrings>;
  /** Site name shown at the top of the login screen. */
  gateTitle?: string;
}

interface AnalyticsStats {
  pageId: string;
  totalViews: number;
  last7Days: { date: string; count: number }[];
  blocks: { id: string; totalClicks: number; last7Days: { date: string; count: number }[] }[];
}

function getPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("ll-admin-pw") ?? "";
}

export function createAdminUploader(basePath = "/api/admin"): UploadAvatarFn {
  return async (file: File) => {
    const password = getPassword();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${basePath}/upload`, {
      method: "POST",
      headers: { "x-admin-password": password },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro ao enviar imagem");
    }
    const data = await res.json();
    return (data as { url: string }).url;
  };
}

async function api<T>(basePath: string, path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${basePath}${path}`, {
    method,
    headers: {
      "x-admin-password": getPassword(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

// --- Icons ---

function IconContent() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconTheme() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconGrip() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" /><circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" /><circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

// --- Analytics Tab ---

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="lla-bar-chart">
      {data.map((d) => (
        <div key={d.label} className="lla-bar-col">
          <div className="lla-bar-track">
            <div className="lla-bar-fill" style={{ height: `${Math.round((d.value / max) * 100)}%` }} />
          </div>
          <span className="lla-bar-label">{d.label.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ analyticsPath, strings }: { analyticsPath: string; strings: AdminStrings }) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${analyticsPath}/stats`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json() as Promise<AnalyticsStats>;
      })
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [analyticsPath]);

  if (loading) {
    return <div className="lla-section"><div className="lla-card"><p style={{ color: "var(--lla-text-secondary)" }}>{strings.analyticsLoading}</p></div></div>;
  }

  if (error || !stats) {
    return <div className="lla-section"><div className="lla-card"><p style={{ color: "var(--lla-text-secondary)" }}>{strings.analyticsError}</p></div></div>;
  }

  return (
    <>
      <div className="lla-section">
        <h3 className="lla-section-title">{strings.analyticsViews}</h3>
        <div className="lla-card">
          <p className="lla-analytics-total">{stats.totalViews.toLocaleString()}</p>
          <p className="lla-analytics-subtitle">{strings.analyticsTotalViews}</p>
          <BarChart data={stats.last7Days.map((d) => ({ label: d.date, value: d.count }))} />
        </div>
      </div>

      <div className="lla-section">
        <h3 className="lla-section-title">{strings.analyticsClicksTitle}</h3>
        <div className="lla-card">
          {stats.blocks.length === 0 ? (
            <p className="lla-analytics-empty">{strings.analyticsNoClicks}</p>
          ) : (
            <div className="lla-analytics-table">
              {stats.blocks.map((block) => (
                <div key={block.id} className="lla-analytics-row">
                  <span className="lla-analytics-block-id">{block.id}</span>
                  <span className="lla-analytics-block-count">{block.totalClicks.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// --- Password Gate ---

function PasswordGate({ basePath, onAuth, strings, gateTitle }: { basePath: string; onAuth: () => void; strings: AdminStrings; gateTitle?: string }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("ll-admin-pw", pw);
    try {
      await api(basePath, "/config");
      onAuth();
    } catch {
      setError(true);
      sessionStorage.removeItem("ll-admin-pw");
    }
  };

  return (
    <div className="lla-admin-root">
      <div className="lla-gate">
        <form onSubmit={handleSubmit} className="lla-gate-card">
          {gateTitle && <p className="lla-gate-title">{gateTitle}</p>}
          <div className="lla-gate-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden aria-hidden="true" />
          <div className="lla-form-field">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              placeholder={strings.passwordPlaceholder}
              className="lla-form-input"
              autoFocus
            />
          </div>
          {error && <p className="lla-gate-error">{strings.passwordIncorrect}</p>}
          <button type="submit" className="lla-btn-primary">{strings.passwordSubmit}</button>
        </form>
        <a href="https://github.com/zeevolabs/landlink" target="_blank" rel="noopener noreferrer" className="lla-gate-footer">
          {strings.poweredBy} <strong>landlink</strong>
        </a>
      </div>
    </div>
  );
}

// --- Field Components ---

function formatFieldLabel(name: string): string {
  const map: Record<string, string> = {
    name: "Nome",
    durationMinutes: "Duração (min)",
    price: "Preço (R$)",
    description: "Descrição",
    buttonText: "Texto do botão",
    title: "Título",
    label: "Rótulo",
    url: "URL",
    platform: "Plataforma",
    services: "Serviços",
    items: "Itens",
    icon: "Ícone",
    targetDate: "Data alvo",
    src: "Fonte",
    text: "Texto",
    endpoint: "Endpoint",
  };
  return map[name] ?? name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function FormField({ label, value, onChange, multiline, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; type?: "text" | "url" | "datetime-local" | "number";
}) {
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      {multiline ? (
        <textarea className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      <select className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`lla-toggle ${value ? "active" : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className="lla-toggle-thumb" />
      </button>
    </div>
  );
}

function ArrayField({ label, fields, items, onChange }: {
  label: string; fields: FieldDescriptor[]; items: Record<string, unknown>[]; onChange: (items: Record<string, unknown>[]) => void;
}) {
  const updateItem = (index: number, key: string, value: unknown, asNumber = false) => {
    const v = asNumber ? (parseFloat(String(value)) || 0) : value;
    const next = items.map((item, i) => i === index ? { ...item, [key]: v } : item);
    onChange(next);
  };
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => {
    const empty: Record<string, unknown> = {};
    for (const f of fields) empty[f.name] = f.type === "number" ? 0 : "";
    onChange([...items, empty]);
  };

  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{formatFieldLabel(label)}</span>
      {items.map((item, i) => (
        <div key={i} className="lla-array-item">
          <div className="lla-array-item-header">
            <button type="button" className="lla-btn-icon lla-danger" onClick={() => removeItem(i)}>
              <IconTrash />
            </button>
          </div>
          {fields.map((f) => (
            <FormField
              key={f.name}
              label={formatFieldLabel(f.name)}
              value={String(item[f.name] ?? (f.type === "number" ? "0" : ""))}
              onChange={(v) => updateItem(i, f.name, v, f.type === "number")}
              type={f.type === "number" ? "number" : "text"}
            />
          ))}
        </div>
      ))}
      <button type="button" className="lla-btn-add" onClick={addItem}>
        <IconPlus /> Adicionar {formatFieldLabel(label).toLowerCase()}
      </button>
    </div>
  );
}

// --- Block Card ---

function BlockCard({ block, schema, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, strings }: {
  block: Block; schema: FieldDescriptor[]; onChange: (b: Block) => void;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean; strings: AdminStrings;
}) {
  const [open, setOpen] = useState(false);
  const title = String(block.title ?? block.label ?? block.text ?? block.src ?? "");

  return (
    <div className="lla-block-card">
      <div className="lla-block-header" onClick={() => setOpen(!open)}>
        <span className="lla-block-grip"><IconGrip /></span>
        <span className="lla-block-badge">{block.type}</span>
        <span className="lla-block-title">{title || "Sem título"}</span>
        <span className={`lla-block-chevron ${open ? "open" : ""}`}><IconChevron /></span>
      </div>
      {open && (
        <div className="lla-block-body">
          {schema.map((field) => {
            if (field.type === "array" && field.children) {
              return (
                <ArrayField
                  key={field.name}
                  label={field.name}
                  fields={field.children}
                  items={(block[field.name] as Record<string, unknown>[]) ?? []}
                  onChange={(items) => onChange({ ...block, [field.name]: items })}
                />
              );
            }
            if (field.name === "icon") {
              return (
                <div key={field.name} className="lla-form-field">
                  <span className="lla-form-label">{formatFieldLabel(field.name)}</span>
                  <IconPicker
                    value={String(block[field.name] ?? "")}
                    onChange={(v) => onChange({ ...block, [field.name]: v })}
                    strings={strings}
                  />
                </div>
              );
            }
            if (field.type === "enum" && field.options) {
              return (
                <SelectField
                  key={field.name}
                  label={formatFieldLabel(field.name)}
                  value={String(block[field.name] ?? field.options[0])}
                  onChange={(v) => onChange({ ...block, [field.name]: v })}
                  options={field.options}
                />
              );
            }
            if (field.type === "boolean") {
              return (
                <ToggleField
                  key={field.name}
                  label={formatFieldLabel(field.name)}
                  value={Boolean(block[field.name])}
                  onChange={(v) => onChange({ ...block, [field.name]: v })}
                />
              );
            }
            const isUrl = ["url", "href", "src", "endpoint"].includes(field.name);
            const isDatetime = ["targetDate"].includes(field.name);
            return (
              <FormField
                key={field.name}
                label={formatFieldLabel(field.name)}
                value={String(block[field.name] ?? "")}
                onChange={(v) => onChange({ ...block, [field.name]: v })}
                type={isDatetime ? "datetime-local" : isUrl ? "url" : "text"}
              />
            );
          })}
          <div className="lla-block-actions">
            <button type="button" className="lla-btn-icon" onClick={onMoveUp} disabled={isFirst} title="Mover para cima"><IconArrowUp /></button>
            <button type="button" className="lla-btn-icon" onClick={onMoveDown} disabled={isLast} title="Mover para baixo"><IconArrowDown /></button>
            <button type="button" className="lla-btn-icon lla-danger" onClick={onRemove} title="Remover bloco"><IconTrash /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Theme Editor ---

const COLOR_FIELD_KEYS: { key: string; strKey: keyof AdminStrings }[] = [
  { key: "bg", strKey: "themeColorBg" },
  { key: "fg", strKey: "themeColorText" },
  { key: "accent", strKey: "themeColorAccent" },
  { key: "accentContrast", strKey: "themeColorAccentContrast" },
  { key: "muted", strKey: "themeColorMuted" },
  { key: "border", strKey: "themeColorBorder" },
];

const SHADOW_VALUES = [
  { strKey: "themeShadowNone" as keyof AdminStrings, value: "none" },
  { strKey: "themeShadowSubtle" as keyof AdminStrings, value: "0 1px 3px rgba(0,0,0,0.08)" },
  { strKey: "themeShadowMedium" as keyof AdminStrings, value: "0 4px 12px rgba(0,0,0,0.1)" },
  { strKey: "themeShadowStrong" as keyof AdminStrings, value: "0 8px 24px rgba(0,0,0,0.15)" },
  { strKey: "themeShadowRetro" as keyof AdminStrings, value: "3px 4px 0 0 #000" },
];

const FONT_OPTIONS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "System", value: "system-ui, sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Monospace", value: "monospace" },
] as const;

function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const validHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      <div className="lla-color-field">
        <div className="lla-color-swatch">
          <input type="color" aria-label={label} value={validHex} onChange={(e) => onChange(e.target.value)} />
        </div>
        <input type="text" className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function RangeField({ label, value, onChange, min, max, step, unit }: {
  label: string; value: string; onChange: (v: string) => void;
  min: number; max: number; step: number; unit: string;
}) {
  const num = Math.min(Math.max(parseInt(value) || min, min), max);
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      <div className="lla-range-field">
        <input
          type="range"
          className="lla-range-input"
          min={min}
          max={max}
          step={step}
          value={num}
          aria-label={label}
          onChange={(e) => onChange(`${e.target.value}${unit}`)}
        />
        <span className="lla-range-value">{num}{unit}</span>
      </div>
    </div>
  );
}

function PresetField({ label, value, onChange, presets }: {
  label: string; value: string; onChange: (v: string) => void;
  presets: readonly { label: string; value: string }[];
}) {
  const isCustom = !presets.some((p) => p.value === value);
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      <select
        className="lla-form-input"
        aria-label={label}
        value={isCustom ? "__custom__" : value}
        onChange={(e) => { if (e.target.value !== "__custom__") onChange(e.target.value); }}
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
        {isCustom && <option value="__custom__">Personalizado</option>}
      </select>
    </div>
  );
}

function OgImageUpload({ value, fallback, onChange, onUpload }: {
  value: string; fallback: string; onChange: (url: string) => void; onUpload: UploadAvatarFn;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const display = value || fallback;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div
      className={`lla-og-upload ${dragover ? "dragover" : ""} ${uploading ? "uploading" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      {display ? (
        <img className="lla-og-upload-preview" src={display} alt="" />
      ) : (
        <div className="lla-og-upload-placeholder">
          <span>Clique ou arraste uma imagem</span>
        </div>
      )}
      {uploading && <div className="lla-avatar-upload-overlay">Enviando...</div>}
      {!value && fallback && <p className="lla-og-upload-hint">Usando foto de perfil</p>}
      {value && (
        <button type="button" className="lla-avatar-upload-remove" onClick={(e) => { e.stopPropagation(); onChange(""); }}>
          Remover imagem
        </button>
      )}
    </div>
  );
}

function SeoPreview({ title, description, url, image, strings }: {
  title: string; description: string; url: string; image: string; strings: AdminStrings;
}) {
  const displayUrl = url
    ? (() => { try { return new URL(url).hostname; } catch { return url; } })()
    : "example.com";
  const truncDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

  return (
    <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span className="lla-form-label" style={{ marginBottom: 8, display: "block" }}>{strings.seoPreviewGoogle}</span>
        <div className="lla-seo-google">
          <div className="lla-seo-google-url">{displayUrl}</div>
          <div className="lla-seo-google-title">{title || strings.seoPreviewDefaultTitle}</div>
          <div className="lla-seo-google-desc">{truncDesc || strings.seoPreviewDefaultDesc}</div>
        </div>
      </div>
      <div>
        <span className="lla-form-label" style={{ marginBottom: 8, display: "block" }}>{strings.seoPreviewSocial}</span>
        <div className="lla-seo-social">
          {image && (
            <div className="lla-seo-social-image">
              <img src={image} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="lla-seo-social-body">
            <div className="lla-seo-social-url">{displayUrl}</div>
            <div className="lla-seo-social-title">{title || strings.seoPreviewDefaultTitle}</div>
            <div className="lla-seo-social-desc">{truncDesc || strings.seoPreviewDefaultSocialDesc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrCodePanel({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 176, margin: 2 });
  }, [url]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!url) return null;

  return (
    <div className="lla-qr-section">
      <canvas ref={canvasRef} className="lla-qr-canvas" />
      <button type="button" className="lla-qr-download" onClick={download}>
        Download QR Code
      </button>
    </div>
  );
}

const PRESET_STRING_KEYS: Record<string, keyof AdminStrings> = {
  light: "themePresetLight",
  dark: "themePresetDark",
  rose: "themePresetRose",
  mint: "themePresetMint",
  ocean: "themePresetOcean",
  sunset: "themePresetSunset",
  lavender: "themePresetLavender",
  sand: "themePresetSand",
  midnight: "themePresetMidnight",
  candy: "themePresetCandy",
  sunflower: "themePresetSunflower",
};

const BG_ANIMATION_VALUES = [
  { strKey: "themeAnimNone" as keyof AdminStrings, value: "none" },
  { strKey: "themeAnimGradient" as keyof AdminStrings, value: "ll-anim-gradient" },
  { strKey: "themeAnimAurora" as keyof AdminStrings, value: "ll-anim-aurora" },
  { strKey: "themeAnimFloat" as keyof AdminStrings, value: "ll-anim-float" },
];

function PresetPicker({ currentTheme, onSelect, strings }: {
  currentTheme: Record<string, string>;
  onSelect: (tokens: Record<string, string>) => void;
  strings: AdminStrings;
}) {
  const presetEntries = Object.entries(themePresets) as [PresetName, Record<string, string>][];
  const activePreset = presetEntries.find(([, tokens]) =>
    Object.entries(tokens).every(([k, v]) => currentTheme[k] === v)
  )?.[0];

  return (
    <div className="lla-preset-grid">
      {presetEntries.map(([name, tokens]) => {
        const label = strings[PRESET_STRING_KEYS[name] ?? "themePresetLight"] ?? name;
        return (
          <button
            key={name}
            type="button"
            className={`lla-preset-card ${activePreset === name ? "active" : ""}`}
            onClick={() => onSelect({ ...tokens })}
            aria-label={label}
          >
            <div className="lla-preset-preview" style={{ background: tokens.bg }}>
              <div className="lla-preset-avatar" style={{ background: tokens.accent, opacity: 0.8 }} />
              <div className="lla-preset-bar" style={{ background: tokens.accent }} />
              <div className="lla-preset-bar" style={{ background: tokens.border, borderColor: tokens.border }} />
            </div>
            <span className="lla-preset-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ThemeTab({ theme, onChange, strings }: {
  theme: Record<string, string>; onChange: (t: Record<string, string>) => void; strings: AdminStrings;
}) {
  const set = (key: string, value: string) => onChange({ ...theme, [key]: value });
  const shadowPresets = SHADOW_VALUES.map(({ strKey, value }) => ({ label: strings[strKey], value }));
  const animPresets = BG_ANIMATION_VALUES.map(({ strKey, value }) => ({ label: strings[strKey], value }));
  return (
    <>
      <div className="lla-section">
        <h3 className="lla-section-title">{strings.themeSectionPresets}</h3>
        <PresetPicker currentTheme={theme} onSelect={onChange} strings={strings} />
      </div>
      <div className="lla-section">
        <h3 className="lla-section-title">{strings.themeSectionColors}</h3>
        <div className="lla-card">
          <div className="lla-theme-grid">
            {COLOR_FIELD_KEYS.map(({ key, strKey }) => (
              <ColorField key={key} label={strings[strKey]} value={theme[key] ?? ""} onChange={(v) => set(key, v)} />
            ))}
          </div>
        </div>
      </div>
      <div className="lla-section">
        <h3 className="lla-section-title">{strings.themeSectionStyle}</h3>
        <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RangeField label={strings.themeRoundness} value={theme.radius ?? "8px"} onChange={(v) => set("radius", v)} min={0} max={32} step={1} unit="px" />
          <PresetField label={strings.themeShadow} value={theme.shadow ?? "none"} onChange={(v) => set("shadow", v)} presets={shadowPresets} />
          <PresetField label={strings.themeFont} value={theme.font ?? "'Inter', sans-serif"} onChange={(v) => set("font", v)} presets={FONT_OPTIONS} />
          <RangeField label={strings.themeMaxWidth} value={theme.maxWidth ?? "480px"} onChange={(v) => set("maxWidth", v)} min={320} max={720} step={10} unit="px" />
          <PresetField label={strings.themeBgAnimation} value={theme.bgAnimation ?? "none"} onChange={(v) => set("bgAnimation", v)} presets={animPresets} />
        </div>
      </div>
    </>
  );
}

// --- Add Block Dropdown ---

function AddBlockDropdown({ types, onAdd, strings }: { types: string[]; onAdd: (type: string) => void; strings: AdminStrings }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lla-add-dropdown">
      <button type="button" className="lla-btn-add" onClick={() => setOpen(!open)}>
        <IconPlus /> {strings.linksAddBlock}
      </button>
      {open && (
        <div className="lla-add-menu">
          {types.map((type) => (
            <button key={type} className="lla-add-menu-item" onClick={() => { onAdd(type); setOpen(false); }}>{type}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Navigation ---

interface TabDef { id: Tab; label: string; icon: () => React.ReactNode; hidden?: boolean }

function Sidebar({ tab, onTab, onLogout, settingsSection, onSettingsSection, bookingConnected, analyticsPath, strings }: {
  tab: Tab; onTab: (t: Tab) => void; onLogout: () => void;
  settingsSection: SettingsSection; onSettingsSection: (s: SettingsSection) => void;
  bookingConnected: boolean;
  analyticsPath?: string;
  strings: AdminStrings;
}) {
  const tabs: TabDef[] = [
    { id: "content", label: strings.tabContent, icon: IconContent },
    { id: "bookings", label: strings.tabBookings, icon: IconCalendar, hidden: !bookingConnected },
    { id: "analytics", label: strings.tabAnalytics, icon: IconBarChart, hidden: !analyticsPath },
    { id: "theme", label: strings.tabTheme, icon: IconTheme },
    { id: "settings", label: strings.tabSettings, icon: IconSettings },
  ];

  return (
    <nav className="lla-sidebar">
      <p className="lla-sidebar-title">Admin</p>
      {tabs.filter((t) => !t.hidden).map((t) => (
        <button key={t.id} className="lla-sidebar-btn" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
          <t.icon />{t.label}
        </button>
      ))}
      {tab === "settings" && (
        <div className="lla-sidebar-sub">
          <button className="lla-sidebar-sub-btn" aria-selected={settingsSection === "seo"} onClick={() => onSettingsSection("seo")}>{strings.settingsSeo}</button>
          <button className="lla-sidebar-sub-btn" aria-selected={settingsSection === "integrations"} onClick={() => onSettingsSection("integrations")}>{strings.settingsIntegrations}</button>
        </div>
      )}
      <div className="lla-sidebar-spacer" />
      <button type="button" className="lla-sidebar-btn lla-sidebar-logout" onClick={onLogout}>
        <IconLogout />{strings.buttonLogout}
      </button>
    </nav>
  );
}

function MobileTabs({ tab, onTab, bookingConnected, analyticsPath, strings }: { tab: Tab; onTab: (t: Tab) => void; bookingConnected: boolean; analyticsPath?: string; strings: AdminStrings }) {
  const tabs: TabDef[] = [
    { id: "content", label: strings.tabContent, icon: IconContent },
    { id: "bookings", label: strings.tabBookings, icon: IconCalendar, hidden: !bookingConnected },
    { id: "analytics", label: strings.tabAnalytics, icon: IconBarChart, hidden: !analyticsPath },
    { id: "theme", label: strings.tabTheme, icon: IconTheme },
    { id: "settings", label: strings.tabSettings, icon: IconSettings },
  ];

  return (
    <nav className="lla-tabs-mobile">
      {tabs.filter((t) => !t.hidden).map((t) => (
        <button key={t.id} className="lla-tab-btn" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
          <t.icon />{t.label}
        </button>
      ))}
    </nav>
  );
}

// --- Integration Accordion ---

function IntegrationAccordion({ basePath, bookingAvailable, onBookingConnected, strings }: { basePath: string; bookingAvailable: boolean; onBookingConnected: () => void; strings: AdminStrings }) {
  const [open, setOpen] = useState<string | null>(bookingAvailable ? "booking" : null);

  const toggle = (id: string) => setOpen((prev) => (prev === id ? null : id));

  const hasAny = bookingAvailable;

  if (!hasAny) {
    return (
      <div className="lla-empty-state">
        <IconSettings />
        <p style={{ margin: 0 }}>{strings.integrationsNone}</p>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>{strings.integrationsNoneHint}</p>
      </div>
    );
  }

  return (
    <div className="lla-integrations">
      {bookingAvailable && (
        <div className="lla-integration-item">
          <button type="button" className="lla-integration-header" aria-expanded={open === "booking"} onClick={() => toggle("booking")}>
            <IconCalendar />
            <span>{strings.integrationsBookingTitle}</span>
            <span className={`lla-integration-chevron ${open === "booking" ? "open" : ""}`}><IconChevron /></span>
          </button>
          {open === "booking" && (
            <div className="lla-integration-body">
              <BookingSettings bookingBasePath={`${basePath}/booking`} onConnected={onBookingConnected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Admin Shell ---

function AdminShell({ registry, basePath, onLogout, onUploadAvatar, analyticsPath, strings }: { registry: Registry; basePath: string; onLogout: () => void; onUploadAvatar?: UploadAvatarFn; analyticsPath?: string; strings: AdminStrings }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [savedConfig, setSavedConfig] = useState<Config | null>(null);
  const [schemas, setSchemas] = useState<SchemaMap>({});
  const [blockTypes, setBlockTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("content");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("seo");
  const [bookingAvailable, setBookingAvailable] = useState(false);
  const [bookingConnected, setBookingConnected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Config | null>(basePath, "/config"),
      api<{ types: string[]; schemas: SchemaMap }>(basePath, "/schema"),
    ]).then(async ([cfg, sch]) => {
      if (!cfg) cfg = await api<Config>(basePath, "/seed");
      setConfig(cfg);
      setSavedConfig(cfg);
      setSchemas(sch.schemas);
      setBlockTypes(sch.types);
      setLoading(false);
    }).catch(() => setLoading(false));

    fetch(`${basePath}/booking/config`, { headers: { "x-admin-password": getPassword() } })
      .then((r) => {
        if (r.status === 404) return null;
        setBookingAvailable(true);
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data?.connected) setBookingConnected(true); })
      .catch(() => {});
  }, [basePath]);

  const updateProfile = useCallback((key: string, value: string) => {
    setConfig((c) => c ? { ...c, profile: { ...c.profile, [key]: value } } : c);
  }, []);

  const [keywordsText, setKeywordsText] = useState("");

  useEffect(() => {
    if (config?.meta?.keywords) setKeywordsText(config.meta.keywords.join(", "));
  }, [config?.meta?.keywords === undefined]);

  const updateMeta = useCallback((key: string, value: string) => {
    setConfig((c) => c ? { ...c, meta: { ...c.meta, [key]: value } } : c);
  }, []);

  const commitKeywords = useCallback(() => {
    const keywords = keywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    setConfig((c) => c ? { ...c, meta: { ...c.meta, keywords } } : c);
  }, [keywordsText]);

  const updateBlock = useCallback((index: number, block: Block) => {
    setConfig((c) => { if (!c) return c; const blocks = [...c.blocks]; blocks[index] = block; return { ...c, blocks }; });
  }, []);

  const removeBlock = useCallback((index: number) => {
    setConfig((c) => c ? { ...c, blocks: c.blocks.filter((_, i) => i !== index) } : c);
  }, []);

  const moveBlock = useCallback((index: number, dir: -1 | 1) => {
    setConfig((c) => {
      if (!c) return c;
      const blocks = [...c.blocks];
      const target = index + dir;
      if (target < 0 || target >= blocks.length) return c;
      [blocks[index], blocks[target]] = [blocks[target]!, blocks[index]!];
      return { ...c, blocks };
    });
  }, []);

  const addBlock = useCallback((type: string) => {
    setConfig((c) => {
      if (!c) return c;
      const block: Block = { type };
      const schema = schemas[type];
      if (schema) {
        for (const f of schema) {
          if (f.type === "array") block[f.name] = [];
          else if (f.type === "boolean") block[f.name] = false;
          else if (f.type === "enum" && f.options?.length) block[f.name] = f.options[0];
          else block[f.name] = "";
        }
      }
      return { ...c, blocks: [...c.blocks, block] };
    });
  }, [schemas]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setStatus(null);
    try {
      await api(basePath, "/config", "PUT", config);
      setSavedConfig(config);
      setStatus({ text: strings.statusSaved, type: "success" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : strings.statusSaveError, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  if (loading) {
    return (
      <div className="lla-admin-root">
        <div className="lla-gate"><p style={{ color: "var(--lla-text-secondary)" }}>{strings.statusLoading}</p></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="lla-admin-root">
        <div className="lla-gate"><div className="lla-gate-card"><p>{strings.statusNoConfig}</p></div></div>
      </div>
    );
  }

  return (
    <div className="lla-admin-root">
      <div className="lla-layout">
        <Sidebar tab={tab} onTab={setTab} onLogout={onLogout} settingsSection={settingsSection} onSettingsSection={setSettingsSection} bookingConnected={bookingConnected} analyticsPath={analyticsPath} strings={strings} />
        <main className="lla-main">
          {tab === "content" && (
            <>
              <div className="lla-section">
                <h3 className="lla-section-title">{strings.profileSection}</h3>
                <div className="lla-card">
                  <div className="lla-profile-header">
                    {config.profile.avatar ? (
                      <img src={config.profile.avatar} alt="" className="lla-profile-avatar" />
                    ) : (
                      <div className="lla-profile-avatar-placeholder"><IconUser /></div>
                    )}
                    <div>
                      <p className="lla-profile-name">{config.profile.name || strings.profileNoName}</p>
                      <p className="lla-profile-subtitle">{strings.profileEditHint}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <FormField label={strings.profileNameLabel} value={config.profile.name} onChange={(v) => updateProfile("name", v)} />
                    {onUploadAvatar ? (
                      <div className="lla-form-field">
                        <span className="lla-form-label">{strings.profileAvatarLabel}</span>
                        <AvatarUpload
                          value={config.profile.avatar ?? ""}
                          onChange={(v) => updateProfile("avatar", v)}
                          onUpload={onUploadAvatar}
                          strings={strings}
                        />
                      </div>
                    ) : (
                      <FormField label={strings.profileAvatarUrlLabel} value={config.profile.avatar ?? ""} onChange={(v) => updateProfile("avatar", v)} placeholder="/avatar.jpg" />
                    )}
                    <FormField label={strings.profileBioLabel} value={config.profile.bio ?? ""} onChange={(v) => updateProfile("bio", v)} multiline />
                  </div>
                </div>
              </div>

              {config.blocks.map((block, i) => {
                if (block.type !== "social") return null;
                return (
                  <div key={`socials-${i}`} className="lla-section">
                    <h3 className="lla-section-title">{strings.socialSection}</h3>
                    <div className="lla-card">
                      <SocialEditor items={(block.items as SocialItem[]) ?? []} onChange={(items) => updateBlock(i, { ...block, items })} strings={strings} />
                    </div>
                  </div>
                );
              })}

              <div className="lla-section">
                <h3 className="lla-section-title">{strings.linksSection}</h3>
                {config.blocks.map((block, i) => {
                  if (block.type === "social") return null;
                  const nonSocial = config.blocks.filter((b) => b.type !== "social");
                  const idx = nonSocial.indexOf(block);
                  return (
                    <BlockCard key={`${block.type}-${i}`} block={block} schema={schemas[block.type] ?? []}
                      onChange={(b) => updateBlock(i, b)} onRemove={() => removeBlock(i)}
                      onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)}
                      isFirst={idx === 0} isLast={idx === nonSocial.length - 1} strings={strings} />
                  );
                })}
                <AddBlockDropdown types={blockTypes.filter((t) => t !== "social")} onAdd={addBlock} strings={strings} />
              </div>
            </>
          )}

          {tab === "bookings" && (
            <BookingList bookingBasePath={`${basePath}/booking`} />
          )}

          {tab === "analytics" && analyticsPath && (
            <AnalyticsTab analyticsPath={analyticsPath} strings={strings} />
          )}

          {tab === "theme" && <ThemeTab theme={config.theme ?? {}} onChange={(t) => setConfig((c) => c ? { ...c, theme: t } : c)} strings={strings} />}

          {tab === "settings" && (
            <div className="lla-settings-tabs-mobile">
              <button className="lla-settings-tab" aria-selected={settingsSection === "seo"} onClick={() => setSettingsSection("seo")}>{strings.settingsSeo}</button>
              <button className="lla-settings-tab" aria-selected={settingsSection === "integrations"} onClick={() => setSettingsSection("integrations")}>{strings.settingsIntegrations}</button>
            </div>
          )}

          {tab === "settings" && settingsSection === "seo" && (
            <>
              <div className="lla-section">
                <h3 className="lla-section-title">{strings.seoSection}</h3>
                <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <FormField label={strings.seoTitleLabel} value={config.meta?.title ?? ""} onChange={(v) => updateMeta("title", v)} placeholder="Nome | Descrição curta" />
                  <FormField label={strings.seoDescriptionLabel} value={config.meta?.description ?? ""} onChange={(v) => updateMeta("description", v)} multiline placeholder="Descrição para mecanismos de busca" />
                  <FormField label={strings.seoCanonicalLabel} value={config.meta?.url ?? ""} onChange={(v) => updateMeta("url", v)} type="url" placeholder="https://example.com" />
                  <div className="lla-form-field">
                    <span className="lla-form-label">{strings.seoImageLabel}</span>
                    {onUploadAvatar ? (
                      <OgImageUpload
                        value={config.meta?.image ?? ""}
                        fallback={config.profile.avatar ?? ""}
                        onChange={(v) => updateMeta("image", v)}
                        onUpload={onUploadAvatar}
                      />
                    ) : (
                      <FormField label="" value={config.meta?.image ?? ""} onChange={(v) => updateMeta("image", v)} type="url" placeholder="https://example.com/og-image.jpg" />
                    )}
                  </div>
                  <FormField label={strings.seoTwitterLabel} value={config.meta?.twitterHandle ?? ""} onChange={(v) => updateMeta("twitterHandle", v)} placeholder="@handle" />
                  <FormField label={strings.seoLocaleLabel} value={config.meta?.locale ?? ""} onChange={(v) => updateMeta("locale", v)} placeholder="pt-BR" />
                  <div className="lla-form-field">
                    <span className="lla-form-label">{strings.seoKeywordsLabel}</span>
                    <input
                      type="text"
                      className="lla-form-input"
                      value={keywordsText}
                      onChange={(e) => setKeywordsText(e.target.value)}
                      onBlur={commitKeywords}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </div>
              <div className="lla-section">
                <h3 className="lla-section-title">{strings.seoPreviewSection}</h3>
                <SeoPreview
                  title={config.meta?.title ?? config.profile.name}
                  description={config.meta?.description ?? config.profile.bio ?? ""}
                  url={config.meta?.url ?? ""}
                  image={config.meta?.image ?? config.profile.avatar ?? ""}
                  strings={strings}
                />
              </div>
              {config.meta?.url && (
                <div className="lla-section">
                  <h3 className="lla-section-title">{strings.seoQrSection}</h3>
                  <div className="lla-card">
                    <QrCodePanel url={config.meta.url} />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "settings" && settingsSection === "integrations" && (
            <IntegrationAccordion basePath={basePath} bookingAvailable={bookingAvailable} onBookingConnected={() => setBookingConnected(true)} strings={strings} />
          )}
        </main>

        <aside className="lla-preview-panel">
          <PreviewFrame><Landlink config={config} registry={registry} /></PreviewFrame>
        </aside>

        <MobileTabs tab={tab} onTab={setTab} bookingConnected={bookingConnected} analyticsPath={analyticsPath} strings={strings} />
      </div>

      <div className="lla-save-bar">
        <div className="lla-save-bar-inner">
          <button type="button" className="lla-preview-toggle" onClick={() => setShowPreview(true)} aria-label={strings.buttonPreview}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button type="button" className="lla-btn-primary" onClick={save} disabled={saving || !isDirty}>
            {saving ? strings.buttonSaving : strings.buttonSave}
          </button>
          {status && <span className={`lla-save-status ${status.type}`}>{status.text}</span>}
        </div>
      </div>

      {showPreview && (
        <div className="lla-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="lla-preview-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lla-preview-overlay-close" onClick={() => setShowPreview(false)} aria-label={strings.mobileCloseLabel}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <PreviewFrame><Landlink config={config} registry={registry} /></PreviewFrame>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Exported Component ---

export function AdminPanel({ registry, basePath = "/api/admin", onUploadAvatar, analyticsPath, strings, gateTitle }: AdminPanelProps) {
  const s: AdminStrings = { ...enStrings, ...strings };
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("ll-admin-pw")) {
      api(basePath, "/config").then(() => setAuthed(true)).catch(() => {});
    }
  }, [basePath]);

  const handleLogout = () => {
    sessionStorage.removeItem("ll-admin-pw");
    setAuthed(false);
  };

  if (!authed) return <PasswordGate basePath={basePath} onAuth={() => setAuthed(true)} strings={s} gateTitle={gateTitle} />;
  return <AdminShell registry={registry} basePath={basePath} onLogout={handleLogout} onUploadAvatar={onUploadAvatar} analyticsPath={analyticsPath} strings={s} />;
}
