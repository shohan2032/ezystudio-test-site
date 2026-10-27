import type {Context} from 'hono';

import {clientIp} from '../platform/auth/kit';
import {subjectHash} from '../platform/auth/keys';
import type {PrismaClient} from '../platform/db';

/**
 * Public forms (a booking, an events enquiry) are open to guests, so each
 * row keeps a keyed hash of the sender's IP (never the raw IP) and a sender
 * may only send a few an hour. The check reads at most `max + 1` rows through
 * the `(ip_hash, created_at)` index: bounded, whatever the table's size.
 */
export const requesterHash = (c: Context, secret: string) => subjectHash(secret, 'ip', clientIp(c));

const HOUR = 60 * 60 * 1000;

export async function tooManyRecent(
  db: PrismaClient,
  table: 'booking' | 'enquiry',
  ipHash: string,
  max: number,
  now = new Date()
): Promise<boolean> {
  const where = {ipHash, createdAt: {gte: new Date(now.getTime() - HOUR)}};
  const select = {id: true} as const;
  const rows =
    table === 'booking'
      ? await db.booking.findMany({where, select, take: max + 1})
      : await db.enquiry.findMany({where, select, take: max + 1});
  return rows.length >= max;
}
