import {describe, expect, it} from 'vitest';

import {
  addDays,
  checkBooking,
  checkEnquiry,
  formatPrice,
  formatTime,
  hoursRows,
  isDate,
  londonToday,
  MAX_PARTY,
  openSlots,
  slotsFor,
} from '../src/lib/booking';

// Wednesday 28 October 2026, 15:00 in London (GMT after the clocks went back).
const NOW = new Date('2026-10-28T15:00:00Z');
const valid = {name: 'Ada Lovelace', email: 'Ada@Example.com ', phone: '07700 900123', partySize: '2', date: '2026-10-30', time: '19:30', notes: ''};

describe('opening hours and slots', () => {
  it('knows real dates only', () => {
    expect(isDate('2026-02-28')).toBe(true);
    expect(isDate('2026-02-31')).toBe(false);
    expect(isDate('28/02/2026')).toBe(false);
  });

  it('gives each open day its sittings, every 30 minutes up to the last table', () => {
    expect(slotsFor('2026-11-02')).toEqual([]); // Monday: closed
    expect(slotsFor('2026-10-28')).toEqual(['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']);
    expect(slotsFor('2026-10-30')).toContain('12:00'); // Friday lunch
    expect(slotsFor('2026-10-30')).toContain('21:30');
    expect(slotsFor('2026-11-01')).toEqual(['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00']); // Sunday
  });

  it('needs an hour of notice today, and stops 90 days out', () => {
    expect(londonToday(NOW)).toBe('2026-10-28');
    // 15:00 now: 17:30 is fine today.
    expect(openSlots('2026-10-28', NOW)[0]).toBe('17:30');
    // 20:15: the last table (21:00) is under an hour away.
    expect(openSlots('2026-10-28', new Date('2026-10-28T20:15:00Z'))).toEqual([]);
    expect(openSlots('2026-10-28', new Date('2026-10-28T19:45:00Z'))).toEqual(['21:00']);
    expect(openSlots('2026-10-27', NOW)).toEqual([]); // yesterday
    expect(openSlots(addDays('2026-10-28', 91), NOW)).toEqual([]);
  });

  it('follows London time across the clock change', () => {
    // 23:30 UTC on 31 March 2026 is already 1 April in London (BST).
    expect(londonToday(new Date('2026-03-31T23:30:00Z'))).toBe('2026-04-01');
  });

  it('formats for people', () => {
    expect(formatTime('19:30')).toBe('7:30pm');
    expect(formatTime('12:00')).toBe('12pm');
    expect(formatPrice(1450)).toBe('£14.50');
    expect(formatPrice(800)).toBe('£8');
    expect(hoursRows()[0]).toEqual({days: 'Wednesday – Thursday', times: '5:30pm – 10pm'});
    expect(hoursRows().at(-1)).toEqual({days: 'Monday – Tuesday', times: 'Closed'});
  });
});

describe('checkBooking (the form and the server share it)', () => {
  it('cleans a good request', () => {
    const result = checkBooking(valid, NOW);
    expect(result).toEqual({ok: true, value: {...valid, email: 'ada@example.com', partySize: 2}});
  });

  it('says what to fix, per field', () => {
    const result = checkBooking({...valid, name: '', email: 'nope', phone: 'call me', partySize: String(MAX_PARTY + 1)}, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fields).sort()).toEqual(['email', 'name', 'partySize', 'phone']);
    expect(result.fields.partySize).toMatch(/private dining/);
  });

  it('refuses closed days, past days and times outside the sittings', () => {
    const closed = checkBooking({...valid, date: '2026-11-02'}, NOW);
    expect(!closed.ok && closed.fields.date).toMatch(/closed on Mondays/);
    const past = checkBooking({...valid, date: '2026-10-27'}, NOW);
    expect(!past.ok && past.fields.date).toMatch(/today or a later/);
    const odd = checkBooking({...valid, time: '16:00'}, NOW);
    expect(!odd.ok && odd.fields.time).toBeTruthy();
    const soon = checkBooking({...valid, date: '2026-10-28', time: '17:30'}, new Date('2026-10-28T17:00:00Z'));
    expect(!soon.ok && soon.fields.time).toMatch(/too soon/);
  });

  it('never trusts the shape it is given', () => {
    const result = checkBooking({name: 42, email: null, partySize: '2.5', date: [], time: {}}, NOW);
    expect(result.ok).toBe(false);
  });
});

describe('checkEnquiry', () => {
  const enquiry = {name: 'Sam', email: 'sam@example.com', kind: 'celebration', guests: '14', eventDate: '', message: 'A 40th birthday lunch.'};

  it('takes a good enquiry, date optional', () => {
    const result = checkEnquiry(enquiry, NOW);
    expect(result.ok && result.value).toMatchObject({guests: 14, eventDate: null, kind: 'celebration'});
  });

  it('refuses unknown kinds, silly numbers and short messages', () => {
    const result = checkEnquiry({...enquiry, kind: 'rave', guests: '0', message: 'hi'}, NOW);
    expect(!result.ok && Object.keys(result.fields).sort()).toEqual(['guests', 'kind', 'message']);
  });
});
