export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  calendarId: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface BookingEvent {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone: string;
  attendeeEmail?: string;
  extendedProperties?: Record<string, string>;
}

const SCOPES =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function buildOAuthUrl(creds: GoogleCredentials, state: string): string {
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(
  creds: GoogleCredentials,
  code: string,
): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange authorization code: ${text}`);
  }

  const data = await res.json();
  const accessToken = data.access_token as string;
  const refreshToken = data.refresh_token as string;
  const expiresAt = Date.now() + (data.expires_in as number) * 1000;

  const calendars = await listCalendars(accessToken);
  const primary = calendars.find((c) => c.primary);
  const calendarId = primary?.id ?? calendars[0]?.id ?? "primary";

  return { accessToken, refreshToken, expiresAt, calendarId };
}

export async function refreshAccessToken(
  creds: GoogleCredentials,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh access token: ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };
}

export async function ensureFreshToken(
  creds: GoogleCredentials,
  tokens: GoogleTokens,
): Promise<GoogleTokens> {
  if (tokens.expiresAt < Date.now() + 60_000) {
    const refreshed = await refreshAccessToken(creds, tokens.refreshToken);
    return {
      ...tokens,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    };
  }
  return tokens;
}

export async function getFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<TimeSlot[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get free/busy data: ${text}`);
  }

  const data = await res.json();
  const busy = data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((slot: { start: string; end: string }) => ({
    start: slot.start,
    end: slot.end,
  }));
}

export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: BookingEvent,
): Promise<{ eventId: string; htmlLink: string }> {
  const body: Record<string, unknown> = {
    summary: event.summary,
    start: { dateTime: event.start, timeZone: event.timezone },
    end: { dateTime: event.end, timeZone: event.timezone },
  };

  if (event.description) {
    body.description = event.description;
  }

  if (event.attendeeEmail) {
    body.attendees = [{ email: event.attendeeEmail }];
  }

  if (event.extendedProperties) {
    body.extendedProperties = { private: event.extendedProperties };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create event: ${text}`);
  }

  const data = await res.json();
  return {
    eventId: data.id as string,
    htmlLink: data.htmlLink as string,
  };
}

export async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<
  Array<{
    eventId: string;
    summary: string;
    start: string;
    end: string;
    extendedProperties?: Record<string, string>;
  }>
> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    privateExtendedProperty: "source=landlink",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list events: ${text}`);
  }

  const data = await res.json();
  const items = (data.items ?? []) as Array<Record<string, unknown>>;

  return items.map((item) => {
    const startObj = item.start as Record<string, string> | undefined;
    const endObj = item.end as Record<string, string> | undefined;
    const extProps = item.extendedProperties as
      | { private?: Record<string, string> }
      | undefined;

    return {
      eventId: item.id as string,
      summary: (item.summary as string) ?? "",
      start: startObj?.dateTime ?? startObj?.date ?? "",
      end: endObj?.dateTime ?? endObj?.date ?? "",
      ...(extProps?.private ? { extendedProperties: extProps.private } : {}),
    };
  });
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete event: ${text}`);
  }
}

export async function listCalendars(
  accessToken: string,
): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list calendars: ${text}`);
  }

  const data = await res.json();
  const items = (data.items ?? []) as Array<Record<string, unknown>>;

  return items.map((item) => ({
    id: item.id as string,
    summary: (item.summary as string) ?? "",
    ...(item.primary ? { primary: true } : {}),
  }));
}

export async function signCancellationToken(
  eventId: string,
  secret: string,
): Promise<string> {
  return hmacSha256(secret, eventId);
}

export async function verifyCancellationToken(
  eventId: string,
  sig: string,
  secret: string,
): Promise<boolean> {
  const expected = await hmacSha256(secret, eventId);
  return timingSafeEqual(expected, sig);
}
