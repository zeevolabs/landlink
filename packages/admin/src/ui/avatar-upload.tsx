"use client";

import { useRef, useState } from "react";
import type { UploadAvatarFn } from "./admin-panel";

export interface AvatarUploadProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: UploadAvatarFn;
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function AvatarUpload({ value, onChange, onUpload }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem válida");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`lla-avatar-upload${dragOver ? " dragover" : ""}${uploading ? " uploading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <img src={value} alt="Avatar" className="lla-avatar-upload-preview" />
      ) : (
        <div className="lla-avatar-upload-placeholder">
          <IconCamera />
        </div>
      )}

      {uploading && <div className="lla-avatar-upload-overlay">Enviando...</div>}

      <p className="lla-avatar-upload-hint">Clique ou arraste uma foto</p>

      {error && <p className="lla-avatar-upload-error">{error}</p>}

      {value && !uploading && (
        <button
          type="button"
          className="lla-avatar-upload-remove"
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
        >
          Remover foto
        </button>
      )}
    </div>
  );
}
