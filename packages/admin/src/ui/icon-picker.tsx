import { useEffect, useRef, useState } from "react";
import { iconPaths } from "@zeevolabs/landlink";
import type { AdminStrings } from "../strings";

export interface IconOption {
  name: string;
  label: string;
}

const ICON_NAME_TO_STRING_KEY: Record<string, keyof AdminStrings> = {
  link: "iconLink",
  globe: "iconWebsite",
  "shopping-bag": "iconStore",
  calendar: "iconCalendar",
  mail: "iconEmail",
  phone: "iconPhone",
  "map-pin": "iconLocation",
  play: "iconVideo",
  music: "iconMusic",
  "file-text": "iconDocument",
  heart: "iconFavorite",
  star: "iconHighlight",
};

export interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  strings: AdminStrings;
}

export function IconPicker({ value, onChange, strings }: IconPickerProps) {
  const ICONS: IconOption[] = Object.keys(iconPaths).map((name) => ({
    name,
    label: strings[ICON_NAME_TO_STRING_KEY[name] ?? "iconLink"] ?? name,
  }));

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 202;
      const left = Math.min(rect.left, window.innerWidth - dropdownWidth - 8);
      setPos({ top: rect.bottom + 4, left: Math.max(8, left) });
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
          <span className="lla-icon-picker-empty">{strings.iconPickerSelect}</span>
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
            title={strings.iconPickerNone}
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
                <path d={iconPaths[icon.name]} />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconPreview({ name }: { name: string }) {
  const path = iconPaths[name];
  if (!path) return <span className="lla-icon-picker-empty">{name}</span>;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
