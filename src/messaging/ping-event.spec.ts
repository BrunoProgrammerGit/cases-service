import { isPingEvent } from './ping-event';

describe('isPingEvent', () => {
  const validEvent = {
    eventId: '4c8f73e2-f4b4-4c64-8d55-19300f0a0001',
    correlationId: 'correlation-1',
    occurredAt: '2026-11-11T13:00:00Z',
    payload: { message: 'ping' },
  };

  it('accepts a ping.v1 event', () => {
    expect(isPingEvent(validEvent)).toBe(true);
  });

  it.each([
    { ...validEvent, eventId: 'not-a-uuid' },
    { ...validEvent, correlationId: '' },
    { ...validEvent, occurredAt: 'not-a-date' },
    { ...validEvent, payload: { message: 'ping', extra: true } },
    { ...validEvent, extra: true },
  ])('rejects invalid event %#', (event) => {
    expect(isPingEvent(event)).toBe(false);
  });
});
