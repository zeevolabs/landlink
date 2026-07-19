"use client";

import { formatDuration, formatPrice } from "./format";

interface Service {
  name: string;
  durationMinutes: number;
  price?: number;
}

interface ServicePickerProps {
  services: Service[];
  onSelect: (index: number) => void;
}

export function ServicePicker({ services, onSelect }: ServicePickerProps) {
  return (
    <div className="ll-booking-services">
      {services.map((service, i) => (
        <button
          key={i}
          type="button"
          className="ll-booking-service-card"
          onClick={() => onSelect(i)}
        >
          <span className="ll-booking-service-name">{service.name}</span>
          <span className="ll-booking-service-meta">
            <span className="ll-booking-service-duration">
              {formatDuration(service.durationMinutes)}
            </span>
            {service.price != null && (
              <span className="ll-booking-service-price">
                {formatPrice(service.price)}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
