export interface PingEvent {
  eventId: string;
  correlationId: string;
  occurredAt: string;
  payload: { message: string };
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function isPingEvent(value: unknown): value is PingEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (
    Object.keys(event).sort().join(',') !==
    'correlationId,eventId,occurredAt,payload'
  ) {
    return false;
  }
  if (
    typeof event.eventId !== 'string' ||
    !uuidPattern.test(event.eventId) ||
    typeof event.correlationId !== 'string' ||
    event.correlationId.trim().length === 0 ||
    typeof event.occurredAt !== 'string' ||
    !dateTimePattern.test(event.occurredAt) ||
    !Number.isFinite(Date.parse(event.occurredAt))
  ) {
    return false;
  }
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }
  const body = payload as Record<string, unknown>;
  return Object.keys(body).length === 1 && typeof body.message === 'string';
}
