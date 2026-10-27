/**
 * Booking rules, ONCE, for the booking form (`/book/`), the events form
 * (`/events/`), the Site API (`src/server/routes/bookings.ts`, `enquiries.ts`)
 * and the opening hours shown on every page. Browser-safe and pure: no server
 * imports, `now` is always passed in so tests can pin the clock.
 *
 * The restaurant keeps London time. Dates travel as `YYYY-MM-DD` strings in
 * that zone, times as `HH:MM`.
 */

export const TIME_ZONE = 'Europe/London';

/** Largest party the online form takes; bigger groups go to private dining. */
export const MAX_PARTY = 8;
/** How far ahead the diary is open. */
export const BOOK_AHEAD_DAYS = 90;
/** Covers the room takes per 30-minute slot (requests + confirmed). */
export const SLOT_COVERS = 20;
/** Same-day bookings need this much notice. */
export const SAME_DAY_NOTICE_MINUTES = 60;

export interface Sitting {
  label: 'Lunch' | 'Dinner';
  /** Doors open. */
  open: string;
  /** Kitchen and doors close. */
  close: string;
  /** The last table we seat. */
  last: string;
}

/**
 * Opening hours by weekday (0 = Sunday). EDIT THESE to your real hours: the
 * booking slots, the footer, the Visit page and the site's structured data
 * all read them. An empty list is a closed day.
 */
export const OPENING_HOURS: Record<number, Sitting[]> = {
  0: [{label: 'Lunch', open: '12:00', close: '16:00', last: '15:00'}],
  1: [],
  2: [],
  3: [{label: 'Dinner', open: '17:30', close: '22:00', last: '21:00'}],
  4: [{label: 'Dinner', open: '17:30', close: '22:00', last: '21:00'}],
  5: [
    {label: 'Lunch', open: '12:00', close: '14:30', last: '13:30'},
    {label: 'Dinner', open: '17:30', close: '22:30', last: '21:30'},
  ],
  6: [
    {label: 'Lunch', open: '12:00', close: '15:00', last: '14:00'},
    {label: 'Dinner', open: '17:30', close: '22:30', last: '21:30'},
  ],
};

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const timeOf = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Today in London, `YYYY-MM-DD`. */
export function londonToday(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
}

/** Minutes since midnight in London. */
export function londonMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(now);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

/** A real calendar date in `YYYY-MM-DD` form (refuses 2026-02-31). */
export function isDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Every bookable time on that date, every 30 minutes from opening to the last table. */
export function slotsFor(date: string): string[] {
  if (!isDate(date)) return [];
  const slots: string[] = [];
  for (const sitting of OPENING_HOURS[weekdayOf(date)] ?? []) {
    for (let m = minutesOf(sitting.open); m <= minutesOf(sitting.last); m += 30) slots.push(timeOf(m));
  }
  return slots;
}

/** The slots still bookable now: same-day ones need `SAME_DAY_NOTICE_MINUTES`. */
export function openSlots(date: string, now: Date): string[] {
  const today = londonToday(now);
  if (!isDate(date) || date < today || date > addDays(today, BOOK_AHEAD_DAYS)) return [];
  const slots = slotsFor(date);
  if (date !== today) return slots;
  const earliest = londonMinutes(now) + SAME_DAY_NOTICE_MINUTES;
  return slots.filter(slot => minutesOf(slot) >= earliest);
}

/** "Wednesday 4 November" for a `YYYY-MM-DD`. */
export function formatDay(date: string): string {
  if (!isDate(date)) return date;
  return new Intl.DateTimeFormat('en-GB', {weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'}).format(
    new Date(`${date}T12:00:00Z`)
  );
}

/** "7:30pm" for `19:30`. */
export function formatTime(time: string): string {
  if (!TIME_RE.test(time)) return time;
  const m = minutesOf(time);
  const h = Math.floor(m / 60);
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m % 60 ? `:${String(m % 60).padStart(2, '0')}` : '';
  return `${hour}${min}${h < 12 ? 'am' : 'pm'}`;
}

/** Opening hours as display rows, closed days together: "Wednesday – Thursday · 5:30pm – 10pm". */
export function hoursRows(): {days: string; times: string}[] {
  const order = [3, 4, 5, 6, 0, 1, 2];
  const text = (day: number) =>
    (OPENING_HOURS[day] ?? []).map(s => `${formatTime(s.open)} – ${formatTime(s.close)}`).join(', ') || 'Closed';
  const rows: {days: number[]; times: string}[] = [];
  for (const day of order) {
    const times = text(day);
    const last = rows.at(-1);
    if (last && last.times === times) last.days.push(day);
    else rows.push({days: [day], times});
  }
  return rows.map(row => ({
    days: row.days.length > 1 ? `${WEEKDAYS[row.days[0]]} – ${WEEKDAYS[row.days.at(-1)!]}` : WEEKDAYS[row.days[0]],
    times: row.times,
  }));
}

// ------------------------------------------------------------ field limits --
// The same limits on the form (src/lib/rules.ts style) and on the server.

export const LIMITS = {name: 80, email: 254, phone: 30, notes: 500, message: 2000} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Digits, spaces, `+ ( ) -`, with at least 7 digits. */
export const isPhone = (value: string) => /^[+()\d\s-]{7,30}$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 7;
export const isEmail = (value: string) => EMAIL_RE.test(value) && value.length <= LIMITS.email;

export interface BookingInput {
  name: string;
  email: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  notes: string;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * Checks a booking request. Returns the cleaned input, or the problems by
 * field in words that say how to fix them. Capacity is checked on the
 * server, against the diary.
 */
export function checkBooking(raw: Record<string, unknown>, now: Date): {ok: true; value: BookingInput} | {ok: false; fields: Record<string, string>} {
  const fields: Record<string, string> = {};
  const name = str(raw.name);
  const email = str(raw.email).toLowerCase();
  const phone = str(raw.phone);
  const notes = str(raw.notes);
  const date = str(raw.date);
  const time = str(raw.time);
  const partySize = typeof raw.partySize === 'number' ? raw.partySize : Number(str(raw.partySize));

  if (!name) fields.name = 'Enter the name the table is under.';
  else if (name.length > LIMITS.name) fields.name = `Use at most ${LIMITS.name} characters.`;
  if (!email) fields.email = 'Enter your email address so we can confirm.';
  else if (!isEmail(email)) fields.email = 'Enter a valid email address, like name@example.com.';
  if (!phone) fields.phone = 'Enter a phone number in case we need to reach you on the day.';
  else if (!isPhone(phone)) fields.phone = 'Use digits, spaces and + only, like 07700 900123.';
  if (!Number.isInteger(partySize) || partySize < 1) fields.partySize = 'Choose how many people are coming.';
  else if (partySize > MAX_PARTY) fields.partySize = `For more than ${MAX_PARTY}, send a private dining enquiry instead.`;
  if (notes.length > LIMITS.notes) fields.notes = `Use at most ${LIMITS.notes} characters.`;

  const today = londonToday(now);
  if (!date || !isDate(date)) fields.date = 'Choose a date.';
  else if (date < today) fields.date = 'Choose today or a later date.';
  else if (date > addDays(today, BOOK_AHEAD_DAYS)) fields.date = `We take bookings up to ${BOOK_AHEAD_DAYS} days ahead.`;
  else if (slotsFor(date).length === 0) fields.date = `We are closed on ${WEEKDAYS[weekdayOf(date)]}s. Choose another day.`;
  else if (!time) fields.time = 'Choose a time.';
  else if (!openSlots(date, now).includes(time)) {
    fields.time = date === today ? 'That time is too soon or has passed. Choose a later one, or call us.' : 'Choose one of the times listed.';
  }

  if (Object.keys(fields).length) return {ok: false, fields};
  return {ok: true, value: {name, email, phone, partySize, date, time, notes}};
}

// ----------------------------------------------------------- enquiries --

export const ENQUIRY_KINDS = [
  {value: 'private-dining', label: 'Private dining (Larder Room, up to 18)'},
  {value: 'celebration', label: 'Birthday or celebration'},
  {value: 'corporate', label: 'Work dinner or team lunch'},
  {value: 'buyout', label: 'Whole restaurant (up to 60)'},
  {value: 'other', label: 'Something else'},
] as const;

export type EnquiryKind = (typeof ENQUIRY_KINDS)[number]['value'];
export const MAX_GUESTS = 120;

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  kind: EnquiryKind;
  guests: number;
  eventDate: string | null;
  message: string;
}

export function checkEnquiry(raw: Record<string, unknown>, now: Date): {ok: true; value: EnquiryInput} | {ok: false; fields: Record<string, string>} {
  const fields: Record<string, string> = {};
  const name = str(raw.name);
  const email = str(raw.email).toLowerCase();
  const phone = str(raw.phone);
  const kind = str(raw.kind);
  const message = str(raw.message);
  const eventDate = str(raw.eventDate);
  const guests = typeof raw.guests === 'number' ? raw.guests : Number(str(raw.guests));

  if (!name) fields.name = 'Enter your name.';
  else if (name.length > LIMITS.name) fields.name = `Use at most ${LIMITS.name} characters.`;
  if (!email) fields.email = 'Enter your email address so we can reply.';
  else if (!isEmail(email)) fields.email = 'Enter a valid email address, like name@example.com.';
  if (phone && !isPhone(phone)) fields.phone = 'Use digits, spaces and + only, like 07700 900123.';
  if (!ENQUIRY_KINDS.some(k => k.value === kind)) fields.kind = 'Choose what kind of event it is.';
  if (!Number.isInteger(guests) || guests < 1) fields.guests = 'Enter roughly how many guests, as a number.';
  else if (guests > MAX_GUESTS) fields.guests = `We can host up to ${MAX_GUESTS} standing. Tell us more in the message.`;
  const today = londonToday(now);
  if (eventDate) {
    if (!isDate(eventDate)) fields.eventDate = 'Choose a date, or leave it empty.';
    else if (eventDate < today) fields.eventDate = 'Choose a date from today on, or leave it empty.';
    else if (eventDate > addDays(today, 730)) fields.eventDate = 'We plan up to two years ahead.';
  }
  if (message.length < 10) fields.message = 'Tell us a little about it: at least 10 characters.';
  else if (message.length > LIMITS.message) fields.message = `Use at most ${LIMITS.message} characters.`;

  if (Object.keys(fields).length) return {ok: false, fields};
  return {ok: true, value: {name, email, phone, kind: kind as EnquiryKind, guests, eventDate: eventDate || null, message}};
}

/** £14.50 for 1450 pence. */
export const formatPrice = (pence: number) =>
  `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
