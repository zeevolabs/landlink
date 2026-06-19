import { useEffect, useRef, useState } from "react";

export interface SocialPlatform {
  id: string;
  label: string;
  baseUrl: string;
  placeholder: string;
  svg: string;
}

const PLATFORMS: SocialPlatform[] = [
  {
    id: "instagram",
    label: "Instagram",
    baseUrl: "https://instagram.com/",
    placeholder: "seu_usuario",
    svg: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    id: "tiktok",
    label: "TikTok",
    baseUrl: "https://www.tiktok.com/@",
    placeholder: "seu_usuario",
    svg: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    id: "facebook",
    label: "Facebook",
    baseUrl: "https://facebook.com/",
    placeholder: "seu_usuario",
    svg: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    baseUrl: "https://api.whatsapp.com/send?phone=",
    placeholder: "5511999999999",
    svg: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  },
];

function extractUsername(platform: SocialPlatform, url: string): string {
  if (!url) return "";
  const base = platform.baseUrl;
  if (url.startsWith(base)) return url.slice(base.length).replace(/^@/, "");
  if (url.startsWith("http")) {
    try {
      const path = new URL(url).pathname;
      return path.replace(/^\/+/, "").replace(/@/, "");
    } catch {
      return url;
    }
  }
  return url.replace(/^@/, "");
}

function buildUrl(platform: SocialPlatform, username: string): string {
  if (!username) return "";
  return `${platform.baseUrl}${username.replace(/^@/, "")}`;
}

export interface SocialItem {
  platform: string;
  url: string;
  label?: string;
}

export interface SocialEditorProps {
  items: SocialItem[];
  onChange: (items: SocialItem[]) => void;
}

export function SocialEditor({ items, onChange }: SocialEditorProps) {
  const updateItem = (index: number, updates: Partial<SocialItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    onChange(next);
  };

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

  const addItem = () => {
    const usedIds = new Set(items.map((i) => i.platform));
    const available = PLATFORMS.find((p) => !usedIds.has(p.id));
    if (!available) return;
    onChange([...items, { platform: available.id, url: "", label: available.label }]);
  };

  const [openAdd, setOpenAdd] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const usedIds = new Set(items.map((i) => i.platform));
  const availablePlatforms = PLATFORMS.filter((p) => !usedIds.has(p.id));

  useEffect(() => {
    if (openAdd && addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      const estimatedHeight = availablePlatforms.length * 48 + 8;
      const top = rect.bottom + 4 + estimatedHeight > window.innerHeight
        ? Math.max(8, rect.top - estimatedHeight - 4)
        : rect.bottom + 4;
      setMenuPos({ top, left: rect.left, width: rect.width });
    }
  }, [openAdd, availablePlatforms.length]);

  useEffect(() => {
    if (!openAdd) return;
    const handleClick = (e: MouseEvent) => {
      if (
        addMenuRef.current && !addMenuRef.current.contains(e.target as Node) &&
        addBtnRef.current && !addBtnRef.current.contains(e.target as Node)
      ) {
        setOpenAdd(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openAdd]);

  return (
    <div className="lla-social-editor">
      {items.map((item, i) => {
        const platform = PLATFORMS.find((p) => p.id === item.platform);
        if (!platform) return null;
        const username = extractUsername(platform, item.url);
        return (
          <div key={`${item.platform}-${i}`} className="lla-social-item">
            <div className="lla-social-item-header">
              <div className="lla-social-item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d={platform.svg} />
                </svg>
              </div>
              <span className="lla-social-item-name">{platform.label}</span>
              <button
                type="button"
                className="lla-social-item-remove"
                onClick={() => removeItem(i)}
                title="Remover"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="lla-social-item-field">
              <span className="lla-social-item-prefix">{platform.id === "whatsapp" ? "+" : "@"}</span>
              <input
                type="text"
                className="lla-social-item-input"
                value={username}
                onChange={(e) => {
                  const url = buildUrl(platform, e.target.value);
                  updateItem(i, { url, label: item.label || platform.label });
                }}
                placeholder={platform.placeholder}
              />
            </div>
          </div>
        );
      })}
      {availablePlatforms.length > 0 && (
        <div className="lla-social-add">
          <button
            ref={addBtnRef}
            type="button"
            className="lla-social-add-btn"
            onClick={() => setOpenAdd(!openAdd)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar rede social
          </button>
          {openAdd && (
            <div
              ref={addMenuRef}
              className="lla-social-add-menu"
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            >
              {availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="lla-social-add-option"
                  onClick={() => {
                    onChange([...items, { platform: p.id, url: "", label: p.label }]);
                    setOpenAdd(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d={p.svg} />
                  </svg>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { PLATFORMS };
