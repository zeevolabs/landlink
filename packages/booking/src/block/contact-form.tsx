"use client";

import { useState } from "react";

interface ContactData {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface ContactFormProps {
  onSubmit: (data: ContactData) => void;
  loading: boolean;
}

export function ContactForm({ onSubmit, loading }: ContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!phone.trim()) newErrors.phone = "WhatsApp é obrigatório";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() });
  }

  return (
    <form className="ll-booking-form" onSubmit={handleSubmit}>
      <div className="ll-booking-field">
        <label htmlFor="ll-booking-name">Nome *</label>
        <input
          id="ll-booking-name"
          type="text"
          className="ll-booking-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        {errors.name && <span className="ll-booking-error">{errors.name}</span>}
      </div>
      <div className="ll-booking-field">
        <label htmlFor="ll-booking-phone">WhatsApp *</label>
        <input
          id="ll-booking-phone"
          type="tel"
          className="ll-booking-input"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
        {errors.phone && <span className="ll-booking-error">{errors.phone}</span>}
      </div>
      <div className="ll-booking-field">
        <label htmlFor="ll-booking-email">E-mail</label>
        <input
          id="ll-booking-email"
          type="email"
          className="ll-booking-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="ll-booking-field">
        <label htmlFor="ll-booking-notes">Observações</label>
        <textarea
          id="ll-booking-notes"
          className="ll-booking-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <button type="submit" className="ll-booking-btn" disabled={loading}>
        {loading ? "Agendando..." : "Confirmar agendamento"}
      </button>
    </form>
  );
}
