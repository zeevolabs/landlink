"use client";

import { useState } from "react";
import { linkData } from "./link";
import { defineBlock } from "./define-block";
import { iconPaths } from "../icons";

type Props = {
  label: string;
  url: string;
  description?: string;
  variant?: "fill" | "outline";
  icon?: string;
  locked?: boolean;
  pin?: string;
  analyticsPath?: string;
};

function LockedLinkButton({ label, url, description, variant = "fill", icon, locked, pin, analyticsPath }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (!locked) {
    const href = analyticsPath
      ? `${analyticsPath}/click?to=${encodeURIComponent(url)}&id=${encodeURIComponent(label)}`
      : url;
    return (
      <a className="ll-link" data-variant={variant} href={href} target="_blank" rel="noopener noreferrer">
        {icon && iconPaths[icon] ? (
          <span className="ll-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPaths[icon]} />
            </svg>
          </span>
        ) : null}
        <span className="ll-link-text">
          <span className="ll-link-label">{label}</span>
          {description ? <span className="ll-link-description">{description}</span> : null}
        </span>
      </a>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === (pin ?? "")) {
      setOpen(false);
      setInput("");
      setError(false);
      const href = analyticsPath
        ? `${analyticsPath}/click?to=${encodeURIComponent(url)}&id=${encodeURIComponent(label)}`
        : url;
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <>
      <button
        type="button"
        className="ll-link"
        data-variant={variant}
        onClick={() => { setOpen(true); setError(false); setInput(""); }}
      >
        <span className="ll-link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
        <span className="ll-link-text">
          <span className="ll-link-label">{label}</span>
          {description ? <span className="ll-link-description">{description}</span> : null}
        </span>
      </button>

      {open && (
        <div className="ll-pin-overlay" role="dialog" aria-modal="true" aria-label="Acesso protegido" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="ll-pin-modal">
            <div className="ll-pin-lock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p className="ll-pin-title">Conteúdo protegido</p>
            <p className="ll-pin-subtitle">Digite o código para acessar</p>
            <form onSubmit={handleSubmit} className="ll-pin-form">
              <input
                id="ll-pin-input"
                name="pin"
                type="password"
                className={`ll-pin-input ${error ? "error" : ""}`}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                placeholder="Código"
                autoFocus
                autoComplete="off"
              />
              {error && <p className="ll-pin-error">Código incorreto</p>}
              <button type="submit" className="ll-pin-submit">Acessar</button>
            </form>
            <button type="button" className="ll-pin-cancel" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}

export const lockedLinkBlock = defineBlock({
  type: "link",
  data: linkData,
  component: LockedLinkButton,
});
