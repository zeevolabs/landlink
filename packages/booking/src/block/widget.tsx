"use client";

import { useCallback, useState } from "react";
import type { BookingBlock } from "./index";
import { ServicePicker } from "./service-picker";
import { DatePicker } from "./date-picker";
import { TimeSlots } from "./time-slots";
import { ContactForm } from "./contact-form";
import { Confirmation } from "./confirmation";
import { BookingToast } from "./toast";

type Step = "closed" | "service" | "date" | "time" | "contact" | "confirmed";

interface BookingState {
  serviceIndex: number;
  date: string;
  slot: { start: string; end: string } | null;
  contact: { name: string; phone: string; email: string; notes: string };
  result: { eventId: string; cancelUrl: string } | null;
}

const STEP_TITLES: Record<Exclude<Step, "closed">, string> = {
  service: "Escolha o serviço",
  date: "Escolha a data",
  time: "Escolha o horário",
  contact: "Seus dados",
  confirmed: "Confirmado",
};

const STEP_ORDER: Step[] = ["closed", "service", "date", "time", "contact", "confirmed"];

function getPrevStep(current: Step, hasMultipleServices: boolean): Step {
  const idx = STEP_ORDER.indexOf(current);
  if (idx <= 1) return "closed";
  const prev = STEP_ORDER[idx - 1];
  if (prev === "service" && !hasMultipleServices) return "closed";
  return prev;
}

const initialState: BookingState = {
  serviceIndex: 0,
  date: "",
  slot: null,
  contact: { name: "", phone: "", email: "", notes: "" },
  result: null,
};

export function BookingWidget({ title, description, buttonText, services, apiBasePath = "/api" }: BookingBlock & { apiBasePath?: string }) {
  const [step, setStep] = useState<Step>("closed");
  const [state, setState] = useState<BookingState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const hasMultipleServices = services.length > 1;
  const selectedService = services[state.serviceIndex];

  function open() {
    setState(initialState);
    setToast(null);
    setStep(hasMultipleServices ? "service" : "date");
  }

  function close() {
    setStep("closed");
    setState(initialState);
    setSubmitting(false);
    setToast(null);
  }

  function goBack() {
    const prev = getPrevStep(step, hasMultipleServices);
    setStep(prev);
    if (prev === "closed") {
      setState(initialState);
    }
  }

  function handleServiceSelect(index: number) {
    setState((s) => ({ ...s, serviceIndex: index }));
    setStep("date");
  }

  function handleDateSelect(date: string) {
    setState((s) => ({ ...s, date }));
    setStep("time");
  }

  function handleSlotSelect(slot: { start: string; end: string }) {
    setState((s) => ({ ...s, slot }));
    setStep("contact");
  }

  async function handleContactSubmit(contact: { name: string; phone: string; email: string; notes: string }) {
    setState((s) => ({ ...s, contact }));
    setSubmitting(true);

    try {
      const res = await fetch(`${apiBasePath}/booking/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: selectedService!.name,
          durationMinutes: selectedService!.durationMinutes,
          price: selectedService!.price,
          date: state.date,
          startTime: state.slot!.start,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          notes: contact.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; errorCode?: string };
        const isUnavailable = data.errorCode === "google_auth_expired" || data.errorCode === "google_disconnected";
        showToast(data.error ?? (isUnavailable
          ? "Agendamento temporariamente indisponível. Tente novamente mais tarde."
          : "Erro ao confirmar agendamento. Tente novamente."));
        setSubmitting(false);
        return;
      }

      const data = await res.json() as { eventId: string; cancelUrl: string };
      setState((s) => ({
        ...s,
        result: { eventId: data.eventId, cancelUrl: data.cancelUrl },
      }));
      setStep("confirmed");
    } catch {
      showToast("Erro ao confirmar agendamento. Tente novamente.");
      setSubmitting(false);
    }
  }

  const isOpen = step !== "closed";

  return (
    <div className="ll-booking">
      {description && !isOpen && <p className="ll-booking-description">{description}</p>}
      <button
        type="button"
        className="ll-booking-trigger"
        data-active={isOpen || undefined}
        onClick={open}
        disabled={isOpen}
      >
        {buttonText}
      </button>
      {isOpen && (
      <div className="ll-booking-panel" data-step={step}>
        <div className="ll-booking-panel-header">
          {step !== "confirmed" ? (
            <button type="button" className="ll-booking-back" onClick={goBack} aria-label="Voltar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <span />
          )}
          <span className="ll-booking-panel-title">{STEP_TITLES[step]}</span>
          <button type="button" className="ll-booking-close" onClick={close} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {toast && (
          <BookingToast message={toast} onDismiss={() => setToast(null)} />
        )}
        <div className="ll-booking-panel-body">
          {step === "service" && (
            <ServicePicker services={services} onSelect={handleServiceSelect} />
          )}
          {step === "date" && (
            <DatePicker
              enabledDays={{}}
              onSelect={handleDateSelect}
              apiBasePath={apiBasePath}
            />
          )}
          {step === "time" && selectedService && (
            <TimeSlots
              date={state.date}
              durationMinutes={selectedService.durationMinutes}
              apiBasePath={apiBasePath}
              onSelect={handleSlotSelect}
              onUnavailable={showToast}
            />
          )}
          {step === "contact" && (
            <ContactForm onSubmit={handleContactSubmit} loading={submitting} />
          )}
          {step === "confirmed" && selectedService && state.slot && state.result && (
            <Confirmation
              service={selectedService}
              date={state.date}
              slot={state.slot}
              cancelUrl={state.result.cancelUrl}
              onClose={close}
            />
          )}
        </div>
      </div>
      )}
    </div>
  );
}
