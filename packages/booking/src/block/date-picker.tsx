"use client";

import { useEffect, useState } from "react";

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

interface DatePickerProps {
  enabledDays: Record<string, boolean>;
  onSelect: (date: string) => void;
  apiBasePath: string;
}

interface ScheduleResponse {
  daysEnabled: Record<string, boolean>;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWeekdayMondayBased(year: number, month: number, day: number): number {
  const d = new Date(year, month, day).getDay();
  return d === 0 ? 6 : d - 1;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getTodayStr(): string {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

export function DatePicker({ onSelect, apiBasePath }: DatePickerProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [schedule, setSchedule] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBasePath}/booking/schedule`)
      .then((res) => res.json())
      .then((data: ScheduleResponse) => {
        setSchedule(data.daysEnabled ?? {});
      })
      .catch(() => {
        setSchedule({});
      })
      .finally(() => setLoading(false));
  }, [apiBasePath]);

  const todayStr = getTodayStr();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getWeekdayMondayBased(year, month, 1);

  const monthLabel = new Date(year, month).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  const weekdayKeys = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  function isDayEnabled(day: number): boolean {
    const dateStr = toDateStr(year, month, day);
    if (dateStr < todayStr) return false;
    const weekday = getWeekdayMondayBased(year, month, day);
    const key = weekdayKeys[weekday];
    return schedule[key] === true;
  }

  if (loading) {
    return (
      <div className="ll-booking-calendar">
        <div className="ll-booking-spinner" />
      </div>
    );
  }

  return (
    <div className="ll-booking-calendar">
      <div className="ll-booking-calendar-nav">
        <button type="button" onClick={prevMonth} aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="ll-booking-calendar-month">{monthLabel}</span>
        <button type="button" onClick={nextMonth} aria-label="Next month">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="ll-booking-calendar-grid">
        {WEEKDAY_HEADERS.map((h) => (
          <span key={h} className="ll-booking-calendar-header">
            {h}
          </span>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <span key={`empty-${i}`} className="ll-booking-calendar-day" data-disabled />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(year, month, day);
          const enabled = isDayEnabled(day);
          const isToday = dateStr === todayStr;
          return (
            <button
              key={day}
              type="button"
              className="ll-booking-calendar-day"
              data-disabled={!enabled || undefined}
              data-today={isToday || undefined}
              disabled={!enabled}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
