import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {addDays, londonToday, slotsFor} from '../../src/lib/booking';
import {app} from '../../src/server/app';
import {Browser, configureEnv, DATABASE_URL, db, resetDatabase, signedIn, userId} from './support/harness';

/**
 * Bookings, enquiries and specials against a real Postgres: guests may book
 * and enquire, members see only their own bookings, and only holders of the
 * restaurant codenames (the seeded `admin` role) see everyone's.
 */

/** The next day with a 19:00 dinner slot, a few days out (never "too soon"). */
function nextDinner(): string {
  let day = addDays(londonToday(new Date()), 3);
  while (!slotsFor(day).includes('19:00')) day = addDays(day, 1);
  return day;
}

const booking = (over: Record<string, unknown> = {}) => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '07700 900123',
  partySize: 2,
  date: nextDinner(),
  time: '19:00',
  notes: '',
  ...over,
});

async function makeAdmin(email: string) {
  const id = await userId(email);
  const admin = await db.role.findUniqueOrThrow({where: {slug: 'admin'}, select: {id: true}});
  await db.userRole.deleteMany({where: {userId: id}});
  await db.userRole.create({data: {userId: id, roleId: admin.id}});
}

describe.skipIf(!DATABASE_URL)('restaurant (integration, real Postgres)', () => {
  beforeAll(configureEnv);
  beforeEach(resetDatabase);
  afterAll(() => db.$disconnect());

  it('takes a guest booking, refuses bad input in words, and fills a slot', async () => {
    const guest = new Browser(app);
    const ok = await guest.post('/site-api/bookings', booking({partySize: 8}));
    expect(ok.status).toBe(201);
    expect((ok.json.booking as {reference: string}).reference).toMatch(/^FF-[A-Z2-9]{6}$/);
    expect(ok.json.booking).not.toHaveProperty('email');

    const bad = await guest.post('/site-api/bookings', booking({email: 'nope', partySize: 40}));
    expect(bad.status).toBe(422);
    expect(Object.keys(bad.json.fields as object).sort()).toEqual(['email', 'partySize']);

    expect((await guest.post('/site-api/bookings', booking({partySize: 8}))).status).toBe(201);
    // 16 of 20 covers held: a third party of 8 does not fit.
    const full = await guest.post('/site-api/bookings', booking({partySize: 8}));
    expect(full.status).toBe(409);
    expect(full.json.fields).toHaveProperty('time');

    const slots = await guest.get(`/site-api/bookings/slots?date=${nextDinner()}`);
    expect((slots.json.slots as {time: string; free: number}[]).find(s => s.time === '19:00')?.free).toBe(4);
  });

  it('limits one sender to a few requests an hour', async () => {
    const guest = new Browser(app, '203.0.113.77');
    for (let i = 0; i < 5; i++) {
      expect((await guest.post('/site-api/bookings', booking({time: slotsFor(nextDinner())[i]}))).status).toBe(201);
    }
    expect((await guest.post('/site-api/bookings', booking({time: '20:30'}))).status).toBe(429);
  });

  it('shows members their own bookings only, and staff everyone’s', async () => {
    const ada = await signedIn(app, 'ada@example.com');
    const bob = await signedIn(app, 'bob@example.com', undefined, '203.0.113.20');
    expect((await ada.post('/site-api/bookings', booking())).status).toBe(201);

    const adas = await ada.get('/site-api/bookings/mine?before=');
    expect((adas.json.bookings as unknown[]).length).toBe(1);
    const bobs = await bob.get('/site-api/bookings/mine?before=');
    expect((bobs.json.bookings as unknown[]).length).toBe(0);

    // Bob cannot cancel Ada's booking, nor see the diary.
    const id = (adas.json.bookings as {id: number}[])[0]!.id;
    expect((await bob.post(`/site-api/bookings/mine/${id}/cancel`)).status).toBe(404);
    expect((await bob.get('/site-api/bookings/manage?view=waiting&date=&before=')).status).toBe(403);
    expect((await new Browser(app).get('/site-api/bookings/manage?view=waiting&date=&before=')).status).toBe(401);

    await makeAdmin('bob@example.com');
    const waiting = await bob.get('/site-api/bookings/manage?view=waiting&date=&before=');
    expect(waiting.status).toBe(200);
    expect((waiting.json.bookings as {email: string}[])[0]!.email).toBe('ada@example.com');
    const confirmed = await bob.request('PATCH', `/site-api/bookings/manage/${id}`, {status: 'confirmed'});
    expect((confirmed.json.booking as {status: string}).status).toBe('confirmed');
    expect((await bob.request('PATCH', `/site-api/bookings/manage/${id}`, {status: 'seated'})).status).toBe(422);

    expect((await ada.post(`/site-api/bookings/mine/${id}/cancel`)).status).toBe(200);
  });

  it('keeps enquiries and the specials board behind their codenames', async () => {
    const guest = new Browser(app);
    const sent = await guest.post('/site-api/enquiries', {
      name: 'Sam',
      email: 'sam@example.com',
      kind: 'celebration',
      guests: 14,
      message: 'A 40th birthday lunch, please.',
    });
    expect(sent.status).toBe(201);

    const member = await signedIn(app, 'cat@example.com');
    expect((await member.get('/site-api/enquiries/manage?status=&before=')).status).toBe(403);
    expect((await member.post('/site-api/specials/manage', {title: 'Crab', priceCents: 1250})).status).toBe(403);

    await makeAdmin('cat@example.com');
    const list = await member.get('/site-api/enquiries/manage?status=new&before=');
    expect((list.json.enquiries as unknown[]).length).toBe(1);

    const dish = await member.post('/site-api/specials/manage', {title: 'Crab on toast', description: '', priceCents: 1250});
    expect(dish.status).toBe(201);
    const off = await member.post('/site-api/specials/manage', {title: 'Partridge', description: '', priceCents: 2600});
    const offId = (off.json.special as {id: number}).id;
    await member.request('PATCH', `/site-api/specials/manage/${offId}`, {available: false});
    expect((await member.post('/site-api/specials/manage', {title: 'Bad', priceCents: 12.5})).status).toBe(422);

    const board = await guest.get('/site-api/specials');
    expect((board.json.specials as {title: string}[]).map(s => s.title)).toEqual(['Crab on toast']);
    expect(board.headers.get('cache-control')).toBe('public, max-age=60');
  });
});
