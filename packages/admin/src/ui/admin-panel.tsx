"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
type Tab = "content" | "bookings" | "theme" | "settings";
type SettingsSection = "seo" | "integrations";

export type UploadAvatarFn = (file: File) => Promise<string>;

export interface AdminPanelProps {
  registry: Registry;
  basePath?: string;
  onUploadAvatar?: UploadAvatarFn;
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

function PasswordGate({ basePath, onAuth }: { basePath: string; onAuth: () => void }) {
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
              placeholder="Senha"
              className="lla-form-input"
              autoFocus
            />
          </div>
          {error && <p className="lla-gate-error">Senha incorreta</p>}
          <button type="submit" className="lla-btn-primary">Entrar</button>
        </form>
        <a href="https://github.com/zeevolabs/landlink" target="_blank" rel="noopener noreferrer" className="lla-gate-footer">
          powered by <strong>landlink</strong>
        </a>
      </div>
    </div>
  );
}

// --- Field Components ---

function FormField({ label, value, onChange, multiline, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; type?: "text" | "url";
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
  const updateItem = (index: number, key: string, value: unknown) => {
    const next = items.map((item, i) => i === index ? { ...item, [key]: value } : item);
    onChange(next);
  };
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => {
    const empty: Record<string, unknown> = {};
    for (const f of fields) empty[f.name] = "";
    onChange([...items, empty]);
  };

  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      {items.map((item, i) => (
        <div key={i} className="lla-array-item">
          <button type="button" className="lla-btn-icon lla-danger lla-array-item-remove" onClick={() => removeItem(i)}>
            <IconTrash />
          </button>
          {fields.map((f) => (
            <FormField key={f.name} label={f.name} value={String(item[f.name] ?? "")} onChange={(v) => updateItem(i, f.name, v)} />
          ))}
        </div>
      ))}
      <button type="button" className="lla-btn-add" onClick={addItem}>
        <IconPlus /> Adicionar {label.toLowerCase()}
      </button>
    </div>
  );
}

// --- Block Card ---

function BlockCard({ block, schema, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  block: Block; schema: FieldDescriptor[]; onChange: (b: Block) => void;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean;
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
                  <span className="lla-form-label">{field.name}</span>
                  <IconPicker
                    value={String(block[field.name] ?? "")}
                    onChange={(v) => onChange({ ...block, [field.name]: v })}
                  />
                </div>
              );
            }
            if (field.type === "enum" && field.options) {
              return (
                <SelectField
                  key={field.name}
                  label={field.name}
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
                  label={field.name}
                  value={Boolean(block[field.name])}
                  onChange={(v) => onChange({ ...block, [field.name]: v })}
                />
              );
            }
            const isUrl = ["url", "href", "src"].includes(field.name);
            return (
              <FormField
                key={field.name}
                label={field.name}
                value={String(block[field.name] ?? "")}
                onChange={(v) => onChange({ ...block, [field.name]: v })}
                type={isUrl ? "url" : "text"}
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

const COLOR_FIELDS = [
  { key: "bg", label: "Fundo" },
  { key: "fg", label: "Texto" },
  { key: "accent", label: "Destaque" },
  { key: "accentContrast", label: "Texto destaque" },
  { key: "muted", label: "Texto secundário" },
  { key: "border", label: "Borda" },
] as const;

const SHADOW_PRESETS = [
  { label: "Nenhuma", value: "none" },
  { label: "Sutil", value: "0 1px 3px rgba(0,0,0,0.08)" },
  { label: "Média", value: "0 4px 12px rgba(0,0,0,0.1)" },
  { label: "Forte", value: "0 8px 24px rgba(0,0,0,0.15)" },
  { label: "Retro", value: "3px 4px 0 0 #000" },
] as const;

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

function SeoPreview({ title, description, url, image }: {
  title: string; description: string; url: string; image: string;
}) {
  const displayUrl = url
    ? (() => { try { return new URL(url).hostname; } catch { return url; } })()
    : "example.com";
  const truncDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

  return (
    <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span className="lla-form-label" style={{ marginBottom: 8, display: "block" }}>Google</span>
        <div className="lla-seo-google">
          <div className="lla-seo-google-url">{displayUrl}</div>
          <div className="lla-seo-google-title">{title || "Título da página"}</div>
          <div className="lla-seo-google-desc">{truncDesc || "A descrição da sua página aparecerá aqui."}</div>
        </div>
      </div>
      <div>
        <span className="lla-form-label" style={{ marginBottom: 8, display: "block" }}>Redes sociais</span>
        <div className="lla-seo-social">
          {image && (
            <div className="lla-seo-social-image">
              <img src={image} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="lla-seo-social-body">
            <div className="lla-seo-social-url">{displayUrl}</div>
            <div className="lla-seo-social-title">{title || "Título da página"}</div>
            <div className="lla-seo-social-desc">{truncDesc || "Descrição"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRESET_LABELS: Record<string, string> = {
  light: "Claro",
  dark: "Escuro",
  rose: "Rosa",
  mint: "Menta",
  ocean: "Oceano",
  sunset: "Pôr do sol",
  lavender: "Lavanda",
  sand: "Areia",
  midnight: "Noturno",
  candy: "Candy",
  sunflower: "Girassol",
};

const BG_ANIMATION_OPTIONS = [
  { label: "Nenhuma", value: "none" },
  { label: "Gradiente", value: "ll-anim-gradient" },
  { label: "Aurora", value: "ll-anim-aurora" },
  { label: "Flutuante", value: "ll-anim-float" },
] as const;

function PresetPicker({ currentTheme, onSelect }: {
  currentTheme: Record<string, string>;
  onSelect: (tokens: Record<string, string>) => void;
}) {
  const presetEntries = Object.entries(themePresets) as [PresetName, Record<string, string>][];
  const activePreset = presetEntries.find(([, tokens]) =>
    Object.entries(tokens).every(([k, v]) => currentTheme[k] === v)
  )?.[0];

  return (
    <div className="lla-preset-grid">
      {presetEntries.map(([name, tokens]) => (
        <button
          key={name}
          type="button"
          className={`lla-preset-card ${activePreset === name ? "active" : ""}`}
          onClick={() => onSelect({ ...tokens })}
          aria-label={PRESET_LABELS[name] ?? name}
        >
          <div className="lla-preset-preview" style={{ background: tokens.bg }}>
            <div className="lla-preset-avatar" style={{ background: tokens.accent, opacity: 0.8 }} />
            <div className="lla-preset-bar" style={{ background: tokens.accent }} />
            <div className="lla-preset-bar" style={{ background: tokens.border, borderColor: tokens.border }} />
          </div>
          <span className="lla-preset-label">{PRESET_LABELS[name] ?? name}</span>
        </button>
      ))}
    </div>
  );
}

function ThemeTab({ theme, onChange }: {
  theme: Record<string, string>; onChange: (t: Record<string, string>) => void;
}) {
  const set = (key: string, value: string) => onChange({ ...theme, [key]: value });
  return (
    <>
      <div className="lla-section">
        <h3 className="lla-section-title">Temas</h3>
        <PresetPicker currentTheme={theme} onSelect={onChange} />
      </div>
      <div className="lla-section">
        <h3 className="lla-section-title">Cores</h3>
        <div className="lla-card">
          <div className="lla-theme-grid">
            {COLOR_FIELDS.map(({ key, label }) => (
              <ColorField key={key} label={label} value={theme[key] ?? ""} onChange={(v) => set(key, v)} />
            ))}
          </div>
        </div>
      </div>
      <div className="lla-section">
        <h3 className="lla-section-title">Estilo</h3>
        <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RangeField label="Arredondamento" value={theme.radius ?? "8px"} onChange={(v) => set("radius", v)} min={0} max={32} step={1} unit="px" />
          <PresetField label="Sombra" value={theme.shadow ?? "none"} onChange={(v) => set("shadow", v)} presets={SHADOW_PRESETS} />
          <PresetField label="Fonte" value={theme.font ?? "'Inter', sans-serif"} onChange={(v) => set("font", v)} presets={FONT_OPTIONS} />
          <RangeField label="Largura máxima" value={theme.maxWidth ?? "480px"} onChange={(v) => set("maxWidth", v)} min={320} max={720} step={10} unit="px" />
          <PresetField label="Animação de fundo" value={theme.bgAnimation ?? "none"} onChange={(v) => set("bgAnimation", v)} presets={BG_ANIMATION_OPTIONS} />
        </div>
      </div>
    </>
  );
}

// --- Add Block Dropdown ---

function AddBlockDropdown({ types, onAdd }: { types: string[]; onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lla-add-dropdown">
      <button type="button" className="lla-btn-add" onClick={() => setOpen(!open)}>
        <IconPlus /> Adicionar bloco
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

function Sidebar({ tab, onTab, onLogout, settingsSection, onSettingsSection, bookingConnected }: {
  tab: Tab; onTab: (t: Tab) => void; onLogout: () => void;
  settingsSection: SettingsSection; onSettingsSection: (s: SettingsSection) => void;
  bookingConnected: boolean;
}) {
  const tabs: TabDef[] = [
    { id: "content", label: "Conteúdo", icon: IconContent },
    { id: "bookings", label: "Agenda", icon: IconCalendar, hidden: !bookingConnected },
    { id: "theme", label: "Aparência", icon: IconTheme },
    { id: "settings", label: "Config", icon: IconSettings },
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
          <button className="lla-sidebar-sub-btn" aria-selected={settingsSection === "seo"} onClick={() => onSettingsSection("seo")}>SEO</button>
          <button className="lla-sidebar-sub-btn" aria-selected={settingsSection === "integrations"} onClick={() => onSettingsSection("integrations")}>Integrações</button>
        </div>
      )}
      <div className="lla-sidebar-spacer" />
      <button type="button" className="lla-sidebar-btn lla-sidebar-logout" onClick={onLogout}>
        <IconLogout />Sair
      </button>
    </nav>
  );
}

function MobileTabs({ tab, onTab, bookingConnected }: { tab: Tab; onTab: (t: Tab) => void; bookingConnected: boolean }) {
  const tabs: TabDef[] = [
    { id: "content", label: "Conteúdo", icon: IconContent },
    { id: "bookings", label: "Agenda", icon: IconCalendar, hidden: !bookingConnected },
    { id: "theme", label: "Aparência", icon: IconTheme },
    { id: "settings", label: "Config", icon: IconSettings },
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

function IntegrationAccordion({ basePath, bookingAvailable, onBookingConnected }: { basePath: string; bookingAvailable: boolean; onBookingConnected: () => void }) {
  const [open, setOpen] = useState<string | null>(bookingAvailable ? "booking" : null);

  const toggle = (id: string) => setOpen((prev) => (prev === id ? null : id));

  const hasAny = bookingAvailable;

  if (!hasAny) {
    return (
      <div className="lla-empty-state">
        <IconSettings />
        <p style={{ margin: 0 }}>Nenhuma integração instalada</p>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>Instale pacotes de integração (ex: @zeevolabs/landlink-booking) para configurá-los aqui.</p>
      </div>
    );
  }

  return (
    <div className="lla-integrations">
      {bookingAvailable && (
        <div className="lla-integration-item">
          <button type="button" className="lla-integration-header" aria-expanded={open === "booking"} onClick={() => toggle("booking")}>
            <IconCalendar />
            <span>Agendamentos — Google Calendar</span>
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

function AdminShell({ registry, basePath, onLogout, onUploadAvatar }: { registry: Registry; basePath: string; onLogout: () => void; onUploadAvatar?: UploadAvatarFn }) {
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
      setStatus({ text: "Salvo com sucesso", type: "success" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Erro ao salvar", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  if (loading) {
    return (
      <div className="lla-admin-root">
        <div className="lla-gate"><p style={{ color: "var(--lla-text-secondary)" }}>Carregando...</p></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="lla-admin-root">
        <div className="lla-gate"><div className="lla-gate-card"><p>Nenhuma configuração encontrada.</p></div></div>
      </div>
    );
  }

  return (
    <div className="lla-admin-root">
      <div className="lla-layout">
        <Sidebar tab={tab} onTab={setTab} onLogout={onLogout} settingsSection={settingsSection} onSettingsSection={setSettingsSection} bookingConnected={bookingConnected} />
        <main className="lla-main">
          {tab === "content" && (
            <>
              <div className="lla-section">
                <h3 className="lla-section-title">Perfil</h3>
                <div className="lla-card">
                  <div className="lla-profile-header">
                    {config.profile.avatar ? (
                      <img src={config.profile.avatar} alt="" className="lla-profile-avatar" />
                    ) : (
                      <div className="lla-profile-avatar-placeholder"><IconUser /></div>
                    )}
                    <div>
                      <p className="lla-profile-name">{config.profile.name || "Sem nome"}</p>
                      <p className="lla-profile-subtitle">Editar perfil</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <FormField label="Nome" value={config.profile.name} onChange={(v) => updateProfile("name", v)} />
                    {onUploadAvatar ? (
                      <div className="lla-form-field">
                        <span className="lla-form-label">Foto de perfil</span>
                        <AvatarUpload
                          value={config.profile.avatar ?? ""}
                          onChange={(v) => updateProfile("avatar", v)}
                          onUpload={onUploadAvatar}
                        />
                      </div>
                    ) : (
                      <FormField label="Avatar (URL)" value={config.profile.avatar ?? ""} onChange={(v) => updateProfile("avatar", v)} placeholder="/avatar.jpg" />
                    )}
                    <FormField label="Bio" value={config.profile.bio ?? ""} onChange={(v) => updateProfile("bio", v)} multiline />
                  </div>
                </div>
              </div>

              {config.blocks.map((block, i) => {
                if (block.type !== "social") return null;
                return (
                  <div key={`socials-${i}`} className="lla-section">
                    <h3 className="lla-section-title">Redes sociais</h3>
                    <div className="lla-card">
                      <SocialEditor items={(block.items as SocialItem[]) ?? []} onChange={(items) => updateBlock(i, { ...block, items })} />
                    </div>
                  </div>
                );
              })}

              <div className="lla-section">
                <h3 className="lla-section-title">Links</h3>
                {config.blocks.map((block, i) => {
                  if (block.type === "social") return null;
                  const nonSocial = config.blocks.filter((b) => b.type !== "social");
                  const idx = nonSocial.indexOf(block);
                  return (
                    <BlockCard key={`${block.type}-${i}`} block={block} schema={schemas[block.type] ?? []}
                      onChange={(b) => updateBlock(i, b)} onRemove={() => removeBlock(i)}
                      onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)}
                      isFirst={idx === 0} isLast={idx === nonSocial.length - 1} />
                  );
                })}
                <AddBlockDropdown types={blockTypes.filter((t) => t !== "social")} onAdd={addBlock} />
              </div>
            </>
          )}

          {tab === "bookings" && (
            <BookingList bookingBasePath={`${basePath}/booking`} />
          )}

          {tab === "theme" && <ThemeTab theme={config.theme ?? {}} onChange={(t) => setConfig((c) => c ? { ...c, theme: t } : c)} />}

          {tab === "settings" && (
            <div className="lla-settings-tabs-mobile">
              <button className="lla-settings-tab" aria-selected={settingsSection === "seo"} onClick={() => setSettingsSection("seo")}>SEO</button>
              <button className="lla-settings-tab" aria-selected={settingsSection === "integrations"} onClick={() => setSettingsSection("integrations")}>Integrações</button>
            </div>
          )}

          {tab === "settings" && settingsSection === "seo" && (
            <>
              <div className="lla-section">
                <h3 className="lla-section-title">SEO / Meta</h3>
                <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <FormField label="Título da página" value={config.meta?.title ?? ""} onChange={(v) => updateMeta("title", v)} placeholder="Nome | Descrição curta" />
                  <FormField label="Descrição" value={config.meta?.description ?? ""} onChange={(v) => updateMeta("description", v)} multiline placeholder="Descrição para mecanismos de busca" />
                  <FormField label="URL canônica" value={config.meta?.url ?? ""} onChange={(v) => updateMeta("url", v)} type="url" placeholder="https://example.com" />
                  <div className="lla-form-field">
                    <span className="lla-form-label">Imagem de compartilhamento</span>
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
                  <FormField label="Twitter/X" value={config.meta?.twitterHandle ?? ""} onChange={(v) => updateMeta("twitterHandle", v)} placeholder="@handle" />
                  <FormField label="Idioma" value={config.meta?.locale ?? ""} onChange={(v) => updateMeta("locale", v)} placeholder="pt-BR" />
                  <div className="lla-form-field">
                    <span className="lla-form-label">Palavras-chave (separadas por vírgula)</span>
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
                <h3 className="lla-section-title">Preview</h3>
                <SeoPreview
                  title={config.meta?.title ?? config.profile.name}
                  description={config.meta?.description ?? config.profile.bio ?? ""}
                  url={config.meta?.url ?? ""}
                  image={config.meta?.image ?? config.profile.avatar ?? ""}
                />
              </div>
            </>
          )}

          {tab === "settings" && settingsSection === "integrations" && (
            <IntegrationAccordion basePath={basePath} bookingAvailable={bookingAvailable} onBookingConnected={() => setBookingConnected(true)} />
          )}
        </main>

        <aside className="lla-preview-panel">
          <PreviewFrame><Landlink config={config} registry={registry} /></PreviewFrame>
        </aside>

        <MobileTabs tab={tab} onTab={setTab} bookingConnected={bookingConnected} />
      </div>

      <div className="lla-save-bar">
        <div className="lla-save-bar-inner">
          <button type="button" className="lla-preview-toggle" onClick={() => setShowPreview(true)} aria-label="Visualizar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button type="button" className="lla-btn-primary" onClick={save} disabled={saving || !isDirty}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {status && <span className={`lla-save-status ${status.type}`}>{status.text}</span>}
        </div>
      </div>

      {showPreview && (
        <div className="lla-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="lla-preview-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lla-preview-overlay-close" onClick={() => setShowPreview(false)} aria-label="Fechar">
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

export function AdminPanel({ registry, basePath = "/api/admin", onUploadAvatar }: AdminPanelProps) {
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

  if (!authed) return <PasswordGate basePath={basePath} onAuth={() => setAuthed(true)} />;
  return <AdminShell registry={registry} basePath={basePath} onLogout={handleLogout} onUploadAvatar={onUploadAvatar} />;
}
