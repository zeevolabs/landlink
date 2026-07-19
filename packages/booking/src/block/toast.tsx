"use client";

import { useEffect, useState } from "react";

interface BookingToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function BookingToast({ message, duration = 5000, onDismiss }: BookingToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 300);
    const dismissTimer = setTimeout(onDismiss, duration);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  return (
    <div
      className={`ll-booking-toast${leaving ? " ll-booking-toast-leave" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ll-booking-toast-icon">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="ll-booking-toast-message">{message}</span>
      <button
        type="button"
        className="ll-booking-toast-close"
        onClick={onDismiss}
        aria-label="Fechar aviso"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
