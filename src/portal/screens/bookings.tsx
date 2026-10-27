import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';

import {addDays, formatDay, formatTime, londonToday} from '../../lib/booking';
import type {Booking, BookingStatus} from '../../lib/types';
import {api, read} from '../api';
import {dayBookingsQuery, waitingBookingsQuery} from '../queries';
import {ErrorNote, when} from '../shared';
import {Button} from '../ui';

const STATUS_LABEL: Record<string, string> = {
  requested: 'Waiting',
  confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const people = (n: number) => (n === 1 ? '1 person' : `${n} people`);

/** A ready-to-send email to the guest; the platform sends account emails only, so staff reply from their own inbox. */
function mailto(booking: Booking, kind: 'confirm' | 'decline') {
  const when = `${formatDay(booking.date)} at ${formatTime(booking.time)}`;
  const subject = `Your table at Fennel & Fig — ${booking.reference}`;
  const body =
    kind === 'confirm'
      ? `Hello ${booking.name},\n\nThat's confirmed: a table for ${people(booking.partySize)} on ${when}. Your reference is ${booking.reference}.\n\nSee you soon,\nFennel & Fig`
      : `Hello ${booking.name},\n\nThank you for asking. We're sorry, we can't fit ${people(booking.partySize)} in on ${when}. Could another time work? Just reply to this email.\n\nFennel & Fig`;
  return `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Holders of `site:booking:manage`: answer requests, and see a day's diary. */
export function Bookings() {
  const [view, setView] = useState<'waiting' | 'day'>('waiting');
  const [date, setDate] = useState(() => londonToday(new Date()));

  return (
    <div className="app-page">
      <div className="app-page-head">
        <div>
          <h2>Bookings</h2>
          <p className="muted">
            Requests from <a href="/book/">the booking page</a>. Confirm or decline each one, then let the guest know —
            the Email links open a ready-written message.
          </p>
        </div>
        <Button onClick={() => setView(view === 'waiting' ? 'day' : 'waiting')}>
          {view === 'waiting' ? 'Open the diary' : 'Requests waiting'}
        </Button>
      </div>

      <div className="segmented" role="group" aria-label="Show">
        <button type="button" aria-pressed={view === 'waiting'} onClick={() => setView('waiting')}>
          Waiting for an answer
        </button>
        <button type="button" aria-pressed={view === 'day'} onClick={() => setView('day')}>
          Diary by day
        </button>
      </div>

      {view === 'waiting' ? <Waiting /> : <Diary date={date} setDate={setDate} />}
    </div>
  );
}

function useSetStatus(onDone?: (booking: Booking) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, status}: {id: number; status: BookingStatus}) =>
      read<{booking: Booking}>(api.bookings.manage[':id'].$patch({param: {id: String(id)}, json: {status}})),
    onSuccess: ({booking}) => {
      onDone?.(booking);
      return queryClient.invalidateQueries({queryKey: ['bookings']});
    },
  });
}

function Waiting() {
  const list = useInfiniteQuery(waitingBookingsQuery);
  // Answered here leave the list: keep the last few in view, with their email link.
  const [answered, setAnswered] = useState<Booking[]>([]);
  const setStatus = useSetStatus(booking => setAnswered(current => [booking, ...current.filter(b => b.id !== booking.id)].slice(0, 5)));
  const rows = list.data?.pages.flatMap(page => page.bookings) ?? [];
  const busyId = setStatus.isPending ? setStatus.variables?.id : null;

  return (
    <section className="app-card" aria-labelledby="waiting-title">
      <div className="app-card-head">
        <h3 id="waiting-title">Waiting for an answer</h3>
      </div>
      {answered.length > 0 && (
        <ul className="answered" aria-label="Just answered">
          {answered.map(booking => (
            <li key={booking.id} className="notice notice-ok" role="status">
              {STATUS_LABEL[booking.status]}: {booking.name}, {people(booking.partySize)}, {formatDay(booking.date)} at{' '}
              {formatTime(booking.time)}.{' '}
              {(booking.status === 'confirmed' || booking.status === 'declined') && (
                <a href={mailto(booking, booking.status === 'confirmed' ? 'confirm' : 'decline')}>Email {booking.name}</a>
              )}
            </li>
          ))}
        </ul>
      )}
      {list.error ? (
        <ErrorNote error={list.error} />
      ) : list.isPending ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="app-empty">
          <p className="muted">No requests waiting. New ones from the booking page land here.</p>
          <a className="button ghost" href="/book/">
            See the booking page
          </a>
        </div>
      ) : (
        <BookingTable rows={rows} busyId={busyId ?? null} setStatus={setStatus} showDay />
      )}
      {setStatus.error && <ErrorNote error={setStatus.error} />}
      {list.hasNextPage && (
        <Button variant="ghost" onClick={() => list.fetchNextPage()} pending={list.isFetchingNextPage} pendingLabel="Loading…">
          Load more
        </Button>
      )}
    </section>
  );
}

function Diary({date, setDate}: {date: string; setDate: (date: string) => void}) {
  const day = useQuery(dayBookingsQuery(date));
  const setStatus = useSetStatus();
  const rows = day.data?.bookings ?? [];
  const busyId = setStatus.isPending ? setStatus.variables?.id : null;
  const held = rows.filter(row => row.status === 'confirmed' || row.status === 'requested');
  const covers = held.reduce((sum, row) => sum + row.partySize, 0);

  return (
    <section className="app-card" aria-labelledby="diary-title">
      <div className="app-card-head diary-head">
        <h3 id="diary-title">{formatDay(date)}</h3>
        <div className="day-picker">
          <Button variant="ghost" size="sm" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
            ←
          </Button>
          <label className="sr-only" htmlFor="diary-date">
            Day
          </label>
          <input id="diary-date" type="date" value={date} onChange={event => event.target.value && setDate(event.target.value)} />
          <Button variant="ghost" size="sm" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
            →
          </Button>
          <Button variant="link" size="sm" onClick={() => setDate(londonToday(new Date()))}>
            Today
          </Button>
        </div>
      </div>
      {day.data && (
        <p className="muted">
          {held.length} {held.length === 1 ? 'table' : 'tables'} · {covers} covers (waiting and confirmed)
        </p>
      )}
      {day.error ? (
        <ErrorNote error={day.error} />
      ) : day.isPending ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="app-empty">
          <p className="muted">No bookings on this day yet.</p>
          <Button variant="ghost" onClick={() => setDate(addDays(date, 1))}>
            Next day
          </Button>
        </div>
      ) : (
        <BookingTable rows={rows} busyId={busyId ?? null} setStatus={setStatus} />
      )}
      {setStatus.error && <ErrorNote error={setStatus.error} />}
    </section>
  );
}

function BookingTable({
  rows,
  busyId,
  setStatus,
  showDay = false,
}: {
  rows: Booking[];
  busyId: number | null;
  setStatus: ReturnType<typeof useSetStatus>;
  showDay?: boolean;
}) {
  const pendingFor = (id: number, status: BookingStatus) =>
    setStatus.isPending && setStatus.variables?.id === id && setStatus.variables?.status === status;
  return (
    <div className="table-scroll">
      <table className="app-table">
        <thead>
          <tr>
            <th>{showDay ? 'When' : 'Time'}</th>
            <th>Party</th>
            <th>Guest</th>
            <th>Notes</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(booking => {
            const busy = busyId === booking.id;
            return (
              <tr key={booking.id} aria-busy={busy || undefined}>
                <td>
                  <strong>{formatTime(booking.time)}</strong>
                  {showDay && <div className="muted small">{formatDay(booking.date)}</div>}
                  <div className="muted small">{booking.reference}</div>
                </td>
                <td>{people(booking.partySize)}</td>
                <td>
                  {booking.name}
                  <div className="small">
                    <a href={`tel:${booking.phone.replace(/[^\d+]/g, '')}`}>{booking.phone}</a>
                  </div>
                  <div className="small muted">{booking.email}</div>
                </td>
                <td className="notes-cell">{booking.notes || <span className="muted">—</span>}</td>
                <td>
                  <span className={`status-chip status-${booking.status}`}>{STATUS_LABEL[booking.status] ?? booking.status}</span>
                  {showDay && <div className="muted small">Asked {when(booking.createdAt)}</div>}
                </td>
                <td>
                  <div className="row-actions">
                    {booking.status === 'requested' && (
                      <>
                        <Button
                          size="sm"
                          pending={pendingFor(booking.id, 'confirmed')}
                          pendingLabel="Confirming…"
                          disabled={busy}
                          onClick={() => setStatus.mutate({id: booking.id, status: 'confirmed'})}>
                          Confirm
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          pending={pendingFor(booking.id, 'declined')}
                          pendingLabel="Declining…"
                          disabled={busy}
                          onClick={() =>
                            window.confirm(`Decline ${booking.name}'s request for ${people(booking.partySize)}?`) &&
                            setStatus.mutate({id: booking.id, status: 'declined'})
                          }>
                          Decline
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        pending={pendingFor(booking.id, 'cancelled')}
                        pendingLabel="Cancelling…"
                        disabled={busy}
                        onClick={() =>
                          window.confirm(`Cancel ${booking.name}'s confirmed table? Let them know too.`) &&
                          setStatus.mutate({id: booking.id, status: 'cancelled'})
                        }>
                        Cancel
                      </Button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'declined') && (
                      <a className="button link small-button" href={mailto(booking, booking.status === 'confirmed' ? 'confirm' : 'decline')}>
                        Email guest
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
