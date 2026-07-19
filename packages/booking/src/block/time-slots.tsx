"use client";

import { useEffect, useState } from "react";

interface Slot {
  start: string;
  end: string;
}

interface TimeSlotsProps {
  date: string;
  durationMinutes: number;
  apiBasePath: string;
  onSelect: (slot: Slot) => void;
  onUnavailable?: (message: string) => void;
}

function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes("T")) {
    const date = new Date(isoOrTime);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return isoOrTime.slice(0, 5);
}

const UNAVAILABLE_MSG = "Agendamento temporariamente indisponível. Entre em contato diretamente.";

export function TimeSlots({ date, durationMinutes, apiBasePath, onSelect, onUnavailable }: TimeSlotsProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"unavailable" | "generic" | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ date, durationMinutes: String(durationMinutes) });
    fetch(`${apiBasePath}/booking/availability?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string; errorCode?: string };
          const isUnavailable = data.errorCode === "google_auth_expired" || data.errorCode === "google_disconnected";
          throw Object.assign(new Error(isUnavailable ? "unavailable" : "generic"), { apiMessage: data.error });
        }
        return res.json() as Promise<{ slots: Slot[] }>;
      })
      .then((data) => {
        setSlots(data.slots ?? []);
      })
      .catch((e: Error & { apiMessage?: string }) => {
        const kind = e.message === "unavailable" ? "unavailable" : "generic";
        setError(kind);
        if (kind === "unavailable") onUnavailable?.(e.apiMessage ?? UNAVAILABLE_MSG);
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [date, durationMinutes, apiBasePath, onUnavailable]);

  if (loading) {
    return (
      <div className="ll-booking-slots">
        <div className="ll-booking-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ll-booking-slots">
        <p className="ll-booking-empty">
          {error === "unavailable"
            ? "Agendamento temporariamente indisponível. Entre em contato diretamente."
            : "Erro ao carregar horários disponíveis. Tente novamente."}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="ll-booking-slots">
        <p className="ll-booking-empty">Nenhum horário disponível para esta data.</p>
      </div>
    );
  }

  return (
    <div className="ll-booking-slots">
      <div className="ll-booking-slots-grid">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            className="ll-booking-slot"
            onClick={() => onSelect(slot)}
          >
            {formatTime(slot.start)}
          </button>
        ))}
      </div>
    </div>
  );
}
