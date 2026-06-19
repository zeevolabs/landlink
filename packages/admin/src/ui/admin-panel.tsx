"use client";

import { useCallback, useEffect, useState } from "react";
import { Landlink } from "@zeevolabs/landlink";
import type { Registry } from "@zeevolabs/landlink";
import type { FieldDescriptor } from "../zod-to-fields";
import { IconPicker } from "./icon-picker";
import { PreviewFrame } from "./preview-frame";
import { SocialEditor } from "./social-editor";
import type { SocialItem } from "./social-editor";

interface Block {
  type: string;
  [key: string]: unknown;
}

interface Config {
  profile: { name: string; avatar?: string; bio?: string };
  theme?: Record<string, string>;
  meta?: { title?: string; description?: string };
  blocks: Block[];
}

type SchemaMap = Record<string, FieldDescriptor[]>;
type Tab = "content" | "theme" | "settings";

export interface AdminPanelProps {
  registry: Registry;
  basePath?: string;
}

function getPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("ll-admin-pw") ?? "";
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
          <h1 className="lla-gate-title">Landlink Admin</h1>
          <div className="lla-form-field">
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              placeholder="Senha de acesso"
              className="lla-form-input"
              autoFocus
            />
          </div>
          {error && <p className="lla-gate-error">Senha incorreta</p>}
          <button type="submit" className="lla-btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  );
}

// --- Field Components ---

function FormField({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return (
    <div className="lla-form-field">
      <span className="lla-form-label">{label}</span>
      {multiline ? (
        <textarea className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type="text" className="lla-form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
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
  const title = String(block.label ?? block.text ?? block.src ?? "");

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
            return (
              <FormField
                key={field.name}
                label={field.name}
                value={String(block[field.name] ?? "")}
                onChange={(v) => onChange({ ...block, [field.name]: v })}
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

const THEME_FIELDS = [
  { key: "bg", label: "Fundo", color: true },
  { key: "fg", label: "Texto", color: true },
  { key: "accent", label: "Destaque", color: true },
  { key: "accentContrast", label: "Texto destaque", color: true },
  { key: "muted", label: "Texto secundário", color: true },
  { key: "border", label: "Borda", color: false },
  { key: "radius", label: "Arredondamento", color: false },
  { key: "shadow", label: "Sombra", color: false },
  { key: "font", label: "Fonte", color: false },
  { key: "maxWidth", label: "Largura máxima", color: false },
] as const;

function ThemeTab({ theme, onChange }: {
  theme: Record<string, string>; onChange: (t: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="lla-section">
        <h3 className="lla-section-title">Cores</h3>
        <div className="lla-card">
          <div className="lla-theme-grid">
            {THEME_FIELDS.filter((f) => f.color).map(({ key, label }) => (
              <div key={key} className="lla-form-field">
                <span className="lla-form-label">{label}</span>
                <div className="lla-color-field">
                  <div className="lla-color-swatch">
                    <input type="color" value={theme[key] ?? "#000000"} onChange={(e) => onChange({ ...theme, [key]: e.target.value })} />
                  </div>
                  <input type="text" className="lla-form-input" value={theme[key] ?? ""} onChange={(e) => onChange({ ...theme, [key]: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lla-section">
        <h3 className="lla-section-title">Estilo</h3>
        <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {THEME_FIELDS.filter((f) => !f.color).map(({ key, label }) => (
            <FormField key={key} label={label} value={theme[key] ?? ""} onChange={(v) => onChange({ ...theme, [key]: v })} />
          ))}
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

const TABS: { id: Tab; label: string; icon: () => React.ReactNode }[] = [
  { id: "content", label: "Conteúdo", icon: IconContent },
  { id: "theme", label: "Aparência", icon: IconTheme },
  { id: "settings", label: "Config", icon: IconSettings },
];

function Sidebar({ tab, onTab, onLogout }: { tab: Tab; onTab: (t: Tab) => void; onLogout: () => void }) {
  return (
    <nav className="lla-sidebar">
      <p className="lla-sidebar-title">Admin</p>
      {TABS.map((t) => (
        <button key={t.id} className="lla-sidebar-btn" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
          <t.icon />{t.label}
        </button>
      ))}
      <div className="lla-sidebar-spacer" />
      <button type="button" className="lla-sidebar-btn lla-sidebar-logout" onClick={onLogout}>
        <IconLogout />Sair
      </button>
    </nav>
  );
}

function MobileTabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="lla-tabs-mobile">
      {TABS.map((t) => (
        <button key={t.id} className="lla-tab-btn" aria-selected={tab === t.id} onClick={() => onTab(t.id)}>
          <t.icon />{t.label}
        </button>
      ))}
    </nav>
  );
}

// --- Main Admin Shell ---

function AdminShell({ registry, basePath, onLogout }: { registry: Registry; basePath: string; onLogout: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [savedConfig, setSavedConfig] = useState<Config | null>(null);
  const [schemas, setSchemas] = useState<SchemaMap>({});
  const [blockTypes, setBlockTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("content");

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
  }, [basePath]);

  const updateProfile = useCallback((key: string, value: string) => {
    setConfig((c) => c ? { ...c, profile: { ...c.profile, [key]: value } } : c);
  }, []);

  const updateMeta = useCallback((key: string, value: string) => {
    setConfig((c) => c ? { ...c, meta: { ...c.meta, [key]: value } } : c);
  }, []);

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
      if (schema) { for (const f of schema) { block[f.name] = f.type === "array" ? [] : ""; } }
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
        <Sidebar tab={tab} onTab={setTab} onLogout={onLogout} />
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
                    <FormField label="Avatar (URL)" value={config.profile.avatar ?? ""} onChange={(v) => updateProfile("avatar", v)} placeholder="/avatar.jpg" />
                    <FormField label="Bio" value={config.profile.bio ?? ""} onChange={(v) => updateProfile("bio", v)} multiline />
                  </div>
                </div>
              </div>

              {config.blocks.map((block, i) => {
                if (block.type !== "socials") return null;
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
                  if (block.type === "socials") return null;
                  const nonSocial = config.blocks.filter((b) => b.type !== "socials");
                  const idx = nonSocial.indexOf(block);
                  return (
                    <BlockCard key={`${block.type}-${i}`} block={block} schema={schemas[block.type] ?? []}
                      onChange={(b) => updateBlock(i, b)} onRemove={() => removeBlock(i)}
                      onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)}
                      isFirst={idx === 0} isLast={idx === nonSocial.length - 1} />
                  );
                })}
                <AddBlockDropdown types={blockTypes.filter((t) => t !== "socials")} onAdd={addBlock} />
              </div>
            </>
          )}

          {tab === "theme" && <ThemeTab theme={config.theme ?? {}} onChange={(t) => setConfig((c) => c ? { ...c, theme: t } : c)} />}

          {tab === "settings" && (
            <div className="lla-section">
              <h3 className="lla-section-title">SEO / Meta</h3>
              <div className="lla-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FormField label="Título da página" value={config.meta?.title ?? ""} onChange={(v) => updateMeta("title", v)} placeholder="Nome | Descrição curta" />
                <FormField label="Descrição" value={config.meta?.description ?? ""} onChange={(v) => updateMeta("description", v)} multiline placeholder="Descrição para mecanismos de busca" />
              </div>
            </div>
          )}
        </main>

        <aside className="lla-preview-panel">
          <PreviewFrame><Landlink config={config} registry={registry} /></PreviewFrame>
        </aside>

        <MobileTabs tab={tab} onTab={setTab} />
      </div>

      <div className="lla-save-bar">
        <div className="lla-save-bar-inner">
          <button type="button" className="lla-btn-primary" onClick={save} disabled={saving || !isDirty}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {status && <span className={`lla-save-status ${status.type}`}>{status.text}</span>}
        </div>
      </div>
    </div>
  );
}

// --- Exported Component ---

export function AdminPanel({ registry, basePath = "/api/admin" }: AdminPanelProps) {
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
  return <AdminShell registry={registry} basePath={basePath} onLogout={handleLogout} />;
}
