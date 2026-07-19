"use client";

import { useCallback, useEffect, useState } from "react";

export interface BookingSettingsProps {
  bookingBasePath?: string;
  onConnected?: () => void;
}

interface WorkingDay {
  enabled: boolean;
  start: string;
  end: string;
}

interface BookingConfig {
  connected: boolean;
  connectionStatus?: "connected" | "expired" | "disconnected";
  calendarId?: string;
  workingHours: WorkingDay[];
  bufferMinutes: number;
  timezone: string;
  confirmationWindowDays: number;
  confirmationTemplate?: string;
}

const DAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Recife",
  "America/Fortaleza",
  "America/Belem",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Rio_Branco",
];

const DEFAULT_WORKING_HOURS: WorkingDay[] = DAY_LABELS.map((_, i) => ({
  enabled: i < 5,
  start: "09:00",
  end: "18:00",
}));

function getPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("ll-admin-pw") ?? "";
}

export function BookingSettings({ bookingBasePath = "/api/admin/booking", onConnected }: BookingSettingsProps) {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "expired" | "disconnected">("disconnected");
  const [calendarId, setCalendarId] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingDay[]>(DEFAULT_WORKING_HOURS);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [confirmationWindowDays, setConfirmationWindowDays] = useState(3);
  const [confirmationTemplate, setConfirmationTemplate] = useState(
    "Olá {{nome}}! Confirmando seu agendamento de {{servico}} para {{data}} às {{hora}}.\n\nPara confirmação do horário, é necessário o pagamento de 50% do valor ({{preco}}) antecipadamente.\n\nPodemos confirmar?"
  );
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    "x-admin-password": getPassword(),
    "Content-Type": "application/json",
  }), []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${bookingBasePath}/config`, {
        headers: { "x-admin-password": getPassword() },
      });
      if (!res.ok) return;
      const data = (await res.json()) as BookingConfig;
      setConnected(data.connected);
      setConnectionStatus(data.connectionStatus ?? (data.connected ? "connected" : "disconnected"));
      setCalendarId(data.calendarId ?? "");
      if (data.workingHours && typeof data.workingHours === "object" && !Array.isArray(data.workingHours)) {
        const hoursObj = data.workingHours as unknown as Record<string, WorkingDay>;
        setWorkingHours(DAY_KEYS.map((key) => hoursObj[key] ?? { enabled: false, start: "09:00", end: "18:00" }));
      } else if (Array.isArray(data.workingHours)) {
        setWorkingHours(data.workingHours);
      }
      if (typeof data.bufferMinutes === "number") setBufferMinutes(data.bufferMinutes);
      if (data.timezone) setTimezone(data.timezone);
      if (typeof data.confirmationWindowDays === "number") setConfirmationWindowDays(data.confirmationWindowDays);
      if (typeof data.confirmationTemplate === "string") setConfirmationTemplate(data.confirmationTemplate);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [bookingBasePath]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`${bookingBasePath}/connect`, {
        headers: { "x-admin-password": getPassword() },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { url: string };
      const popup = window.open(data.url, "gcal-connect", "width=600,height=700");
      const interval = setInterval(async () => {
        try {
          const check = await fetch(`${bookingBasePath}/config`, {
            headers: { "x-admin-password": getPassword() },
          });
          if (!check.ok) return;
          const cfg = (await check.json()) as BookingConfig;
          if (cfg.connected) {
            clearInterval(interval);
            setConnected(true);
            setConnectionStatus("connected");
            setCalendarId(cfg.calendarId ?? "");
            onConnected?.();
            if (popup && !popup.closed) popup.close();
          }
        } catch {
          /* ignore */
        }
      }, 2000);
      setTimeout(() => clearInterval(interval), 120000);
    } catch {
      /* ignore */
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Desconectar Google Calendar?")) return;
    try {
      await fetch(`${bookingBasePath}/disconnect`, {
        method: "POST",
        headers: { "x-admin-password": getPassword() },
      });
      setConnected(false);
      setCalendarId("");
    } catch {
      /* ignore */
    }
  };

  const updateDay = (index: number, patch: Partial<WorkingDay>) => {
    setWorkingHours((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${bookingBasePath}/config`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          workingHours: Object.fromEntries(DAY_KEYS.map((key, i) => [key, workingHours[i]])),
          bufferMinutes,
          timezone,
          confirmationWindowDays,
          confirmationTemplate,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Erro ao salvar");
      }
      setStatus({ text: "Salvo com sucesso", type: "success" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Erro ao salvar", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="lla-form-label">Carregando...</p>;
  }

  return (
    <div className="lla-booking-card" style={{ gap: 20 }}>
      {connectionStatus === "expired" && (
        <div className="lla-alert lla-alert-warning">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Conexão com Google Calendar expirada. Clique em <strong>Reconectar</strong> para restaurar os agendamentos.</span>
        </div>
      )}
      <div className="lla-card lla-booking-card">
        <span className="lla-form-label">Google Calendar</span>
        <div className="lla-connection-status">
          {connected ? (
            <span className="lla-connection-badge connected">Conectado</span>
          ) : (
            <span className="lla-connection-badge disconnected">Desconectado</span>
          )}
        </div>
        {connected && calendarId && (
          <p className="lla-form-label" style={{ margin: 0, fontWeight: 400 }}>{calendarId}</p>
        )}
        {connected ? (
          <button type="button" className="lla-btn-secondary" onClick={handleDisconnect}>
            Desconectar
          </button>
        ) : (
          <button type="button" className="lla-btn-primary" onClick={handleConnect}>
            {connectionStatus === "expired" ? "Reconectar" : "Conectar"}
          </button>
        )}
      </div>

      <div className="lla-card lla-booking-card">
        <span className="lla-form-label">Horários de atendimento</span>
        <div className="lla-working-hours">
          {workingHours.map((day, i) => (
            <div key={i} className={`lla-working-hours-day ${day.enabled ? "" : "disabled"}`}>
              <button
                type="button"
                role="switch"
                aria-checked={day.enabled}
                className={`lla-toggle ${day.enabled ? "active" : ""}`}
                onClick={() => updateDay(i, { enabled: !day.enabled })}
              >
                <span className="lla-toggle-thumb" />
              </button>
              <span className="lla-day-label">{DAY_LABELS[i]}</span>
              <input
                type="time"
                className="lla-time-input"
                value={day.start}
                disabled={!day.enabled}
                onChange={(e) => updateDay(i, { start: e.target.value })}
              />
              <input
                type="time"
                className="lla-time-input"
                value={day.end}
                disabled={!day.enabled}
                onChange={(e) => updateDay(i, { end: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="lla-card lla-booking-card">
        <div className="lla-form-field">
          <span className="lla-form-label">Buffer entre agendamentos (minutos)</span>
          <input
            type="number"
            className="lla-form-input"
            min={0}
            max={120}
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      <div className="lla-card lla-booking-card">
        <div className="lla-form-field">
          <span className="lla-form-label">Janela de confirmação (dias)</span>
          <input
            type="number"
            className="lla-form-input"
            min={0}
            value={confirmationWindowDays}
            onChange={(e) => setConfirmationWindowDays(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="lla-card lla-booking-card">
        <div className="lla-form-field">
          <span className="lla-form-label">Mensagem de confirmação (WhatsApp)</span>
          <textarea
            className="lla-form-input"
            rows={6}
            value={confirmationTemplate}
            onChange={(e) => setConfirmationTemplate(e.target.value)}
          />
          <span className="lla-form-hint">
            {"Variáveis: {{nome}}, {{servico}}, {{data}}, {{hora}}, {{preco}}, {{telefone}}"}
          </span>
        </div>
      </div>

      <div className="lla-card lla-booking-card">
        <div className="lla-form-field">
          <span className="lla-form-label">Fuso horário</span>
          <select
            className="lla-form-input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="lla-booking-actions">
        <button type="button" className="lla-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {status && <span className={`lla-save-status ${status.type}`}>{status.text}</span>}
      </div>
    </div>
  );
}
