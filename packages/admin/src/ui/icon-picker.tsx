import { useEffect, useRef, useState } from "react";

export interface IconOption {
  name: string;
  label: string;
  svg: string;
}

const ICONS: IconOption[] = [
  { name: "link", label: "Link", svg: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" },
  { name: "globe", label: "Website", svg: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" },
  { name: "shopping-bag", label: "Loja", svg: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" },
  { name: "calendar", label: "Agenda", svg: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" },
  { name: "mail", label: "E-mail", svg: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { name: "phone", label: "Telefone", svg: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" },
  { name: "map-pin", label: "Localização", svg: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z" },
  { name: "play", label: "Vídeo", svg: "M5 3l14 9-14 9V3z" },
  { name: "music", label: "Música", svg: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" },
  { name: "file-text", label: "Documento", svg: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { name: "heart", label: "Favorito", svg: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  { name: "star", label: "Destaque", svg: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
];

export interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="lla-icon-picker">
      <button
        ref={triggerRef}
        type="button"
        className="lla-icon-picker-trigger"
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <>
            <IconPreview name={value} />
            <span className="lla-icon-picker-label">{ICONS.find((i) => i.name === value)?.label ?? value}</span>
          </>
        ) : (
          <span className="lla-icon-picker-empty">Selecionar ícone</span>
        )}
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="lla-icon-picker-dropdown"
          style={{ position: "fixed", top: pos.top, left: pos.left }}
        >
          <button
            type="button"
            className={`lla-icon-picker-option ${!value ? "active" : ""}`}
            onClick={() => { onChange(""); setOpen(false); }}
            title="Nenhum"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {ICONS.map((icon) => (
            <button
              key={icon.name}
              type="button"
              className={`lla-icon-picker-option ${value === icon.name ? "active" : ""}`}
              onClick={() => { onChange(icon.name); setOpen(false); }}
              title={icon.label}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon.svg} />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconPreview({ name }: { name: string }) {
  const icon = ICONS.find((i) => i.name === name);
  if (!icon) return <span className="lla-icon-picker-empty">{name}</span>;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icon.svg} />
    </svg>
  );
}
