"use client";

import { useCallback, useEffect, useState } from "react";

export interface BookingListProps {
  bookingBasePath?: string;
}

interface Booking {
  eventId: string;
  summary?: string;
  start: string;
  end: string;
  date?: string;
  time?: string;
  service?: string;
  clientName?: string;
  clientPhone?: string;
  price?: string;
}

type Filter = "7" | "30" | "all";

function getPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("ll-admin-pw") ?? "";
}

function formatBookingDate(isoStart: string): { date: string; time: string; messageDate: string; messageTime: string } {
  try {
    const d = new Date(isoStart);
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      messageDate: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      messageTime: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  } catch {
    return { date: isoStart, time: "", messageDate: isoStart, messageTime: "" };
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    const num = digits.slice(2);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return raw;
}

function daysUntilStart(isoStart: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(isoStart);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function filterBookings(bookings: Booking[], filter: Filter): Booking[] {
  if (filter === "all") return bookings;
  const days = Number(filter);
  return bookings.filter((b) => {
    const d = daysUntilStart(b.start);
    return d >= 0 && d <= days;
  });
}

function IconCalendarEmpty() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function BookingList({ bookingBasePath = "/api/admin/booking" }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("7");
  const [confirmationWindowDays, setConfirmationWindowDays] = useState(3);
  const [confirmationTemplate, setConfirmationTemplate] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${bookingBasePath}/list`, {
        headers: { "x-admin-password": getPassword() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [bookingBasePath]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${bookingBasePath}/config`, {
        headers: { "x-admin-password": getPassword() },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { confirmationWindowDays?: number; confirmationTemplate?: string };
      if (typeof data.confirmationWindowDays === "number") {
        setConfirmationWindowDays(data.confirmationWindowDays);
      }
      if (typeof data.confirmationTemplate === "string") {
        setConfirmationTemplate(data.confirmationTemplate);
      }
    } catch {
      /* ignore */
    }
  }, [bookingBasePath]);

  useEffect(() => {
    fetchBookings();
    fetchConfig();
  }, [fetchBookings, fetchConfig]);

  const handleCancel = async (eventId: string) => {
    if (!window.confirm("Cancelar este agendamento?")) return;
    try {
      const res = await fetch(`${bookingBasePath}/cancel?eventId=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
        headers: { "x-admin-password": getPassword() },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.eventId !== eventId));
      }
    } catch {
      /* ignore */
    }
  };

  const filtered = filterBookings(bookings, filter);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--lla-text-secondary)" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      <div className="lla-filter-bar">
        {([["7", "Próximos 7 dias"], ["30", "Próximos 30 dias"], ["all", "Todos"]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="lla-filter-btn"
            aria-selected={filter === value}
            onClick={() => setFilter(value as Filter)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="lla-empty-state">
          <IconCalendarEmpty />
          <p style={{ margin: 0 }}>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="lla-booking-list">
          {filtered.map((booking) => {
            const days = daysUntilStart(booking.start);
            const canConfirm = days <= confirmationWindowDays;
            const phone = (booking.clientPhone ?? "").replace(/\D/g, "");
            const name = booking.clientName ?? "";
            const service = booking.service ?? booking.summary ?? "";
            const { date: bookingDate, time: bookingTime, messageDate, messageTime } = formatBookingDate(booking.start);
            const price = booking.price != null ? Number(booking.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
            const confirmMsg = (confirmationTemplate || `Olá {{nome}}! Confirmando seu agendamento de {{servico}} para {{data}} às {{hora}}. Podemos confirmar?`)
              .replace(/\{\{nome\}\}/g, name)
              .replace(/\{\{servico\}\}/g, service)
              .replace(/\{\{data\}\}/g, messageDate)
              .replace(/\{\{hora\}\}/g, messageTime)
              .replace(/\{\{preco\}\}/g, price)
              .replace(/\{\{telefone\}\}/g, formatPhone(booking.clientPhone ?? ""));
            const confirmUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(confirmMsg)}` : "";
            const whatsappUrl = phone ? `https://wa.me/${phone}` : "";
            const enableDate = new Date();
            enableDate.setDate(enableDate.getDate() + (days - confirmationWindowDays));

            return (
              <div key={booking.eventId} className="lla-booking-item">
                <div className="lla-booking-item-header">
                  <div className="lla-booking-item-info">
                    <span className="lla-booking-item-date">
                      <span className="lla-booking-item-date-value">{bookingDate}</span>
                      <span className="lla-booking-item-date-sep"> · </span>
                      <span className="lla-booking-item-time-value">{bookingTime}</span>
                    </span>
                    <span className="lla-booking-item-service">{service}</span>
                    {name && (
                    <span className="lla-booking-item-client">
                      {name}{phone ? <>{" "}&middot;{" "}<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#25d366", textDecoration: "none" }}>{formatPhone(booking.clientPhone ?? "")}</a></> : null}
                    </span>
                    )}
                  </div>
                  <div className="lla-booking-item-actions">
                    {canConfirm ? (
                      <a href={confirmUrl} target="_blank" rel="noopener noreferrer" className="lla-btn-whatsapp">
                        Confirmar
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="lla-btn-whatsapp"
                        disabled
                        title={`Disponível a partir de ${enableDate.toLocaleDateString("pt-BR")}`}
                      >
                        Confirmar
                      </button>
                    )}
                    <button type="button" className="lla-btn-cancel" onClick={() => handleCancel(booking.eventId)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
