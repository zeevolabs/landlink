"use client";

import { formatDuration, formatDateDisplay } from "./format";

interface Service {
  name: string;
  durationMinutes: number;
  price?: number;
}

interface ConfirmationProps {
  service: Service;
  date: string;
  slot: { start: string; end: string };
  cancelUrl: string;
  onClose: () => void;
}

function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes("T")) {
    const d = new Date(isoOrTime);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return isoOrTime.slice(0, 5);
}

export function Confirmation({ service, date, slot, cancelUrl, onClose }: ConfirmationProps) {
  return (
    <div className="ll-booking-confirm">
      <div className="ll-booking-confirm-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 className="ll-booking-confirm-title">Agendamento confirmado!</h3>
      <div className="ll-booking-confirm-details">
        <p>
          <strong>{service.name}</strong> ({formatDuration(service.durationMinutes)})
        </p>
        <p>{formatDateDisplay(date)}</p>
        <p>
          {formatTime(slot.start)} &ndash; {formatTime(slot.end)}
        </p>
      </div>
      <p className="ll-booking-confirm-email">
        Um convite foi enviado para o seu e-mail.
      </p>
      <p className="ll-booking-confirm-cancel">
        Precisa cancelar?{" "}
        <a href={cancelUrl} target="_blank" rel="noopener noreferrer">
          Clique aqui
        </a>
      </p>
      <button type="button" className="ll-booking-btn" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
}
