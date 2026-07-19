import type { GoogleCredentials, GoogleTokens } from "./google-calendar";
import {
  buildOAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getFreeBusy,
  createEvent,
  listEvents,
  deleteEvent,
  signCancellationToken,
  verifyCancellationToken,
} from "./google-calendar";

export interface BookingStore {
  get(): Promise<Record<string, unknown> | null>;
  put(data: Record<string, unknown>): Promise<void>;
}

export interface BookingHandlerOptions {
  store: BookingStore;
  google: GoogleCredentials;
  checkAuth?: (request: Request) => { ok: boolean };
}

interface WorkingDay {
  start: string;
  end: string;
  enabled: boolean;
}

interface BookingConfig {
  google?: GoogleTokens;
  workingHours: Record<string, WorkingDay>;
  bufferMinutes: number;
  timezone: string;
  confirmationWindowDays: number;
  confirmationTemplate: string;
  _oauthState?: string;
  tokenExpired?: boolean;
}

const DEFAULT_WORKING_HOURS: Record<string, WorkingDay> = {
  monday: { start: "09:00", end: "18:00", enabled: true },
  tuesday: { start: "09:00", end: "18:00", enabled: true },
  wednesday: { start: "09:00", end: "18:00", enabled: true },
  thursday: { start: "09:00", end: "18:00", enabled: true },
  friday: { start: "09:00", end: "18:00", enabled: true },
  saturday: { start: "09:00", end: "13:00", enabled: false },
  sunday: { start: "09:00", end: "13:00", enabled: false },
};

const DEFAULT_CONFIRMATION_TEMPLATE = `Olá {{nome}}! Confirmando seu agendamento de {{servico}} para {{data}} às {{hora}}.

Para confirmação do horário, é necessário o pagamento de 50% do valor ({{preco}}) antecipadamente.

Podemos confirmar?`;

function getBookingData(raw: Record<string, unknown> | null): BookingConfig {
  if (!raw) {
    return {
      workingHours: { ...DEFAULT_WORKING_HOURS },
      bufferMinutes: 15,
      timezone: "America/Sao_Paulo",
      confirmationWindowDays: 3,
      confirmationTemplate: DEFAULT_CONFIRMATION_TEMPLATE,
    };
  }

  const google = raw.google as GoogleTokens | undefined;
  const workingHours = (raw.workingHours as Record<string, WorkingDay>) ?? {
    ...DEFAULT_WORKING_HOURS,
  };
  const bufferMinutes =
    typeof raw.bufferMinutes === "number" ? raw.bufferMinutes : 0;
  const timezone =
    typeof raw.timezone === "string" ? raw.timezone : "America/Sao_Paulo";
  const confirmationWindowDays =
    typeof raw.confirmationWindowDays === "number"
      ? raw.confirmationWindowDays
      : 3;
  const confirmationTemplate =
    typeof raw.confirmationTemplate === "string"
      ? raw.confirmationTemplate
      : DEFAULT_CONFIRMATION_TEMPLATE;
  const _oauthState =
    typeof raw._oauthState === "string" ? raw._oauthState : undefined;

  const tokenExpired = raw.tokenExpired === true;

  return {
    google,
    workingHours,
    bufferMinutes,
    timezone,
    confirmationWindowDays,
    confirmationTemplate,
    _oauthState,
    tokenExpired,
  };
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getDayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()] as string;
}

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd).getTime();
  return a0 < b1 && b0 < a1;
}

function toISOWithTimezone(
  dateStr: string,
  time: string,
  timezone: string,
): string {
  return new Date(
    new Date(`${dateStr}T${time}:00`).toLocaleString("en-US", {
      timeZone: timezone,
    }),
  ).toISOString();
}


class GoogleAuthExpiredError extends Error {
  constructor() {
    super("google_auth_expired");
    this.name = "GoogleAuthExpiredError";
  }
}

function authExpiredResponse(): Response {
  return Response.json(
    {
      error: "Conexão com Google Calendar expirada. Reconecte no painel admin.",
      errorCode: "google_auth_expired",
    },
    { status: 503 },
  );
}

function disconnectedResponse(): Response {
  return Response.json(
    {
      error: "Google Calendar não está conectado.",
      errorCode: "google_disconnected",
    },
    { status: 503 },
  );
}

async function ensureFreshToken(
  config: BookingConfig,
  credentials: GoogleCredentials,
  store: BookingStore,
  raw: Record<string, unknown>,
): Promise<string> {
  if (!config.google) throw new Error("Google not connected");

  const now = Date.now();
  if (config.google.expiresAt && config.google.expiresAt > now + 60_000) {
    return config.google.accessToken;
  }

  try {
    const refreshed = await refreshAccessToken(
      credentials,
      config.google.refreshToken,
    );
    const updatedTokens: GoogleTokens = {
      ...config.google,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    };
    delete raw.tokenExpired;
    await store.put({ ...raw, google: updatedTokens });
    config.google = updatedTokens;
    config.tokenExpired = false;
    return refreshed.accessToken;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("invalid_grant")) {
      raw.tokenExpired = true;
      await store.put(raw);
      throw new GoogleAuthExpiredError();
    }
    throw e;
  }
}

export function createBookingHandler(options: BookingHandlerOptions) {
  const { store, google: credentials, checkAuth } = options;

  function requireAuth(request: Request): { ok: boolean } {
    if (!checkAuth) return { ok: false };
    return checkAuth(request);
  }

  async function connectGoogle(request: Request): Promise<Response> {
    const auth = requireAuth(request);
    if (!auth.ok)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const state = crypto.randomUUID();
    const raw = (await store.get()) ?? {};
    raw._oauthState = state;
    await store.put(raw);

    const url = buildOAuthUrl(credentials, state);
    return Response.json({ url });
  }

  async function googleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return Response.json(
        { error: "Missing code or state" },
        { status: 400 },
      );
    }

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);

    if (!config._oauthState || config._oauthState !== state) {
      return Response.json({ error: "Invalid state" }, { status: 400 });
    }

    const tokens = await exchangeCode(credentials, code);
    raw.google = tokens;
    delete raw._oauthState;
    delete (raw as Record<string, unknown>).tokenExpired;
    await store.put(raw);

    return new Response(
      "<html><body><script>window.close()</script><p>Connected! You can close this window.</p></body></html>",
      { headers: { "Content-Type": "text/html" } },
    );
  }

  async function disconnectGoogle(request: Request): Promise<Response> {
    const auth = requireAuth(request);
    if (!auth.ok)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const raw = (await store.get()) ?? {};
    delete raw.google;
    delete (raw as Record<string, unknown>).tokenExpired;
    await store.put(raw);

    return Response.json({ ok: true });
  }

  async function getBookingConfig(request: Request): Promise<Response> {
    const auth = requireAuth(request);
    if (!auth.ok)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await store.get();
    const config = getBookingData(raw);

    const connectionStatus = !config.google
      ? "disconnected"
      : config.tokenExpired
        ? "expired"
        : "connected";

    return Response.json({
      connected: connectionStatus === "connected",
      connectionStatus,
      calendarId: config.google?.calendarId,
      workingHours: config.workingHours,
      bufferMinutes: config.bufferMinutes,
      timezone: config.timezone,
      confirmationWindowDays: config.confirmationWindowDays,
      confirmationTemplate: config.confirmationTemplate,
    });
  }

  async function putBookingConfig(request: Request): Promise<Response> {
    const auth = requireAuth(request);
    if (!auth.ok)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { workingHours, bufferMinutes, timezone, confirmationWindowDays, confirmationTemplate } =
      body;

    if (workingHours !== undefined && typeof workingHours !== "object") {
      return Response.json(
        { error: "workingHours must be an object" },
        { status: 400 },
      );
    }
    if (bufferMinutes !== undefined && typeof bufferMinutes !== "number") {
      return Response.json(
        { error: "bufferMinutes must be a number" },
        { status: 400 },
      );
    }
    if (timezone !== undefined && typeof timezone !== "string") {
      return Response.json(
        { error: "timezone must be a string" },
        { status: 400 },
      );
    }
    if (
      confirmationWindowDays !== undefined &&
      typeof confirmationWindowDays !== "number"
    ) {
      return Response.json(
        { error: "confirmationWindowDays must be a number" },
        { status: 400 },
      );
    }

    const raw = (await store.get()) ?? {};

    if (workingHours !== undefined) raw.workingHours = workingHours;
    if (bufferMinutes !== undefined) raw.bufferMinutes = bufferMinutes;
    if (timezone !== undefined) raw.timezone = timezone;
    if (confirmationWindowDays !== undefined)
      raw.confirmationWindowDays = confirmationWindowDays;
    if (confirmationTemplate !== undefined && typeof confirmationTemplate === "string")
      raw.confirmationTemplate = confirmationTemplate;

    await store.put(raw);
    return Response.json({ ok: true });
  }

  async function getSchedule(_request: Request): Promise<Response> {
    const raw = await store.get();
    const config = getBookingData(raw);

    const daysEnabled: Record<string, boolean> = {};
    for (const [day, hours] of Object.entries(config.workingHours)) {
      daysEnabled[day] = hours.enabled;
    }

    return Response.json({ daysEnabled, timezone: config.timezone });
  }

  async function getAvailability(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const durationParam = url.searchParams.get("durationMinutes");

    if (!date || !durationParam) {
      return Response.json(
        { error: "Missing date or durationMinutes" },
        { status: 400 },
      );
    }

    const durationMinutes = Number(durationParam);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return Response.json(
        { error: "Invalid durationMinutes" },
        { status: 400 },
      );
    }

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);

    if (!config.google) {
      return disconnectedResponse();
    }

    let accessToken: string;
    try {
      accessToken = await ensureFreshToken(config, credentials, store, raw);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) return authExpiredResponse();
      throw e;
    }

    const dayOfWeek = getDayOfWeek(date);
    const hours = config.workingHours[dayOfWeek];

    if (!hours?.enabled) {
      return Response.json({ slots: [] });
    }

    const slots: Array<{ start: string; end: string }> = [];
    let cursor = parseTime(hours.start);
    const endMinutes = parseTime(hours.end);

    while (cursor + durationMinutes <= endMinutes) {
      slots.push({
        start: minutesToHHMM(cursor),
        end: minutesToHHMM(cursor + durationMinutes),
      });
      cursor += durationMinutes + config.bufferMinutes;
    }

    const dayStartISO = toISOWithTimezone(date, hours.start, config.timezone);
    const dayEndISO = toISOWithTimezone(date, hours.end, config.timezone);

    const busyIntervals = await getFreeBusy(
      accessToken,
      config.google.calendarId ?? "primary",
      dayStartISO,
      dayEndISO,
    );

    let availableSlots = slots.filter((slot) => {
      const slotStartISO = toISOWithTimezone(
        date,
        slot.start,
        config.timezone,
      );
      const slotEndISO = toISOWithTimezone(date, slot.end, config.timezone);
      return !busyIntervals.some((busy: { start: string; end: string }) =>
        overlaps(slotStartISO, slotEndISO, busy.start, busy.end),
      );
    });

    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", {
      timeZone: config.timezone,
    });
    if (date === todayStr) {
      const nowISO = now.toISOString();
      availableSlots = availableSlots.filter((slot) => {
        const slotStartISO = toISOWithTimezone(
          date,
          slot.start,
          config.timezone,
        );
        return slotStartISO > nowISO;
      });
    }

    return Response.json({ slots: availableSlots });
  }

  async function createBooking(request: Request): Promise<Response> {
    const body = await request.json();
    const { serviceName, durationMinutes, date, startTime, name, phone } = body;
    const email = body.email as string | undefined;
    const notes = body.notes as string | undefined;
    const price = body.price as number | undefined;

    if (
      !serviceName ||
      !durationMinutes ||
      !date ||
      !startTime ||
      !name ||
      !phone
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);

    if (!config.google) {
      return disconnectedResponse();
    }

    let accessToken: string;
    try {
      accessToken = await ensureFreshToken(config, credentials, store, raw);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) return authExpiredResponse();
      throw e;
    }
    const calendarId = config.google.calendarId ?? "primary";

    const startISO = toISOWithTimezone(date, startTime, config.timezone);
    const endTime = minutesToHHMM(
      parseTime(startTime) + Number(durationMinutes),
    );
    const endISO = toISOWithTimezone(date, endTime, config.timezone);

    const busyIntervals = await getFreeBusy(
      accessToken,
      calendarId,
      startISO,
      endISO,
    );

    if (busyIntervals.length > 0) {
      return Response.json(
        { error: "Time slot is no longer available" },
        { status: 409 },
      );
    }

    const descriptionParts = [`Phone: ${phone}`];
    if (email) descriptionParts.push(`Email: ${email}`);
    if (notes) descriptionParts.push(`Notes: ${notes}`);

    const event = await createEvent(accessToken, calendarId, {
      summary: `${serviceName} - ${name}`,
      description: descriptionParts.join("\n"),
      start: startISO,
      end: endISO,
      attendeeEmail: email,
      timezone: config.timezone,
      extendedProperties: {
        source: "landlink",
        service: serviceName,
        clientName: name,
        clientPhone: phone,
        ...(price != null ? { price: String(price) } : {}),
      },
    });

    const eventId = event.eventId;
    const sig = await signCancellationToken(eventId, credentials.clientSecret);
    const cancelUrl = `/cancel?eventId=${encodeURIComponent(eventId)}&sig=${sig}`;

    return Response.json({ ok: true, eventId, cancelUrl });
  }

  async function listBookings(request: Request): Promise<Response> {
    const auth = requireAuth(request);
    if (!auth.ok)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);

    if (!config.google) {
      return disconnectedResponse();
    }

    let accessToken: string;
    try {
      accessToken = await ensureFreshToken(config, credentials, store, raw);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) return authExpiredResponse();
      throw e;
    }
    const calendarId = config.google.calendarId ?? "primary";

    const now = new Date();
    const timeMin = now.toISOString();
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const timeMax = future.toISOString();

    const events = await listEvents(accessToken, calendarId, timeMin, timeMax);

    const bookings = events
      .map((e) => ({
        eventId: e.eventId,
        summary: e.summary,
        start: e.start,
        end: e.end,
        service: e.extendedProperties?.service,
        clientName: e.extendedProperties?.clientName,
        clientPhone: e.extendedProperties?.clientPhone,
        price: e.extendedProperties?.price,
      }))
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

    return Response.json({ bookings });
  }

  async function getBookingInfo(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const sig = url.searchParams.get("sig");

    if (!eventId || !sig) {
      return Response.json({ error: "Missing eventId or sig" }, { status: 400 });
    }

    const valid = await verifyCancellationToken(eventId, sig, credentials.clientSecret);
    if (!valid) {
      return Response.json({ error: "Invalid link" }, { status: 401 });
    }

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);
    if (!config.google) {
      return disconnectedResponse();
    }

    let accessToken: string;
    try {
      accessToken = await ensureFreshToken(config, credentials, store, raw);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) return authExpiredResponse();
      throw e;
    }
    const calendarId = config.google.calendarId ?? "primary";

    try {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const events = await listEvents(accessToken, calendarId, now, future);
      const event = events.find((e) => e.eventId === eventId);

      if (!event) {
        return Response.json({ error: "Booking not found" }, { status: 404 });
      }

      const d = new Date(event.start);
      return Response.json({
        eventId: event.eventId,
        service: event.extendedProperties?.service ?? event.summary,
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
        clientName: event.extendedProperties?.clientName,
      });
    } catch {
      return Response.json({ error: "Failed to fetch booking details" }, { status: 500 });
    }
  }

  async function cancelBooking(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const sig = url.searchParams.get("sig");

    let authorized = false;

    const auth = requireAuth(request);
    if (auth.ok) {
      authorized = true;
    }

    if (!authorized && eventId && sig) {
      const valid = await verifyCancellationToken(eventId, sig, credentials.clientSecret);
      if (valid) authorized = true;
    }

    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: "Missing eventId" }, { status: 400 });
    }

    const raw = (await store.get()) ?? {};
    const config = getBookingData(raw);

    if (!config.google) {
      return disconnectedResponse();
    }

    let accessToken: string;
    try {
      accessToken = await ensureFreshToken(config, credentials, store, raw);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) return authExpiredResponse();
      throw e;
    }
    const calendarId = config.google.calendarId ?? "primary";

    await deleteEvent(accessToken, calendarId, eventId);

    return Response.json({ ok: true });
  }

  function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const action = segments[segments.length - 1];

    if (request.method === "GET") {
      switch (action) {
        case "connect": return connectGoogle(request);
        case "callback": return googleCallback(request);
        case "config": return getBookingConfig(request);
        case "schedule": return getSchedule(request);
        case "availability": return getAvailability(request);
        case "list": return listBookings(request);
        case "cancel": return cancelBooking(request);
        case "info": return getBookingInfo(request);
      }
    }
    if (request.method === "PUT" && action === "config") return putBookingConfig(request);
    if (request.method === "POST") {
      switch (action) {
        case "book": return createBooking(request);
        case "disconnect": return disconnectGoogle(request);
      }
    }
    if (request.method === "DELETE" && action === "cancel") return cancelBooking(request);

    return Promise.resolve(Response.json({ error: "Not found" }, { status: 404 }));
  }

  return {
    connectGoogle,
    googleCallback,
    disconnectGoogle,
    getBookingConfig,
    putBookingConfig,
    getSchedule,
    getAvailability,
    createBooking,
    listBookings,
    cancelBooking,
    route,
  };
}

export interface BookingIntegration {
  route: (request: Request) => Promise<Response>;
}

export function bookingIntegration(options: BookingHandlerOptions): BookingIntegration {
  const handler = createBookingHandler(options);
  return { route: (request) => handler.route(request) };
}
