"use client";

import { useEffect, useState } from "react";

interface CancelPageProps {
  apiBasePath: string;
}

interface BookingInfo {
  eventId: string;
  service: string;
  date: string;
  time: string;
  clientName: string;
}

type Status = "loading" | "confirm" | "cancelling" | "success" | "error";

export function CancelPage({ apiBasePath }: CancelPageProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [error, setError] = useState("");

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const eventId = params?.get("eventId") ?? "";
  const sig = params?.get("sig") ?? "";

  useEffect(() => {
    if (!eventId || !sig) {
      setStatus("error");
      setError("Link de cancelamento inválido.");
      return;
    }

    fetch(`${apiBasePath}/booking/info?eventId=${encodeURIComponent(eventId)}&sig=${sig}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: BookingInfo) => {
        setInfo(data);
        setStatus("confirm");
      })
      .catch(() => {
        setStatus("error");
        setError("Agendamento não encontrado ou link expirado.");
      });
  }, [apiBasePath, eventId, sig]);

  function handleCancel() {
    setStatus("cancelling");
    const cancelParams = new URLSearchParams({ eventId, sig });
    fetch(`${apiBasePath}/booking/cancel?${cancelParams.toString()}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("Não foi possível cancelar. Tente novamente.");
      });
  }

  return (
    <div className="ll-booking-cancel-page">
      {status === "loading" && <div className="ll-booking-spinner" />}

      {status === "confirm" && info && (
        <div className="ll-booking-cancel-result">
          <div className="ll-booking-confirm-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>Cancelar agendamento?</h3>
          <div className="ll-booking-confirm-details">
            <p><strong>{info.service}</strong></p>
            <p>{info.date} às {info.time}</p>
            <p>{info.clientName}</p>
          </div>
          <button type="button" className="ll-booking-btn ll-booking-btn-danger" onClick={handleCancel}>
            Confirmar cancelamento
          </button>
          <a href="/" className="ll-booking-cancel-keep">Manter agendamento</a>
        </div>
      )}

      {status === "cancelling" && <div className="ll-booking-spinner" />}

      {status === "success" && (
        <div className="ll-booking-cancel-result">
          <div className="ll-booking-confirm-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Agendamento cancelado com sucesso.</h3>
        </div>
      )}

      {status === "error" && (
        <div className="ll-booking-cancel-result ll-booking-cancel-error">
          <div className="ll-booking-confirm-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3>{error}</h3>
        </div>
      )}

      {(status === "success" || status === "error") && (
        <a href="/" className="ll-booking-btn ll-booking-cancel-back">Voltar</a>
      )}
    </div>
  );
}
