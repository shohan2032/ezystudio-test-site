import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {formatDay, formatTime, londonToday} from '../../lib/booking';
import {api, read} from '../api';
import {myBookingsQuery} from '../queries';
import {ErrorNote} from '../shared';
import {Button} from '../ui';

const STATUS_LABEL: Record<string, string> = {
  requested: 'Waiting for us to confirm',
  confirmed: 'Confirmed',
  declined: 'We could not fit you in',
  cancelled: 'Cancelled',
};

/** Every signed-in guest: the tables they booked while signed in. */
export function MyBookings() {
  const queryClient = useQueryClient();
  const list = useInfiniteQuery(myBookingsQuery);
  const cancel = useMutation({
    mutationFn: (id: number) => read(api.bookings.mine[':id'].cancel.$post({param: {id: String(id)}})),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['bookings']}),
  });
  const rows = list.data?.pages.flatMap(page => page.bookings) ?? [];
  const today = londonToday(new Date());

  return (
    <div className="app-page">
      <div className="app-page-head">
        <div>
          <h2>Your bookings</h2>
          <p className="muted">Tables you booked while signed in. To change one, call us and quote the reference.</p>
        </div>
        <a className="button" href="/book/">
          Book a table
        </a>
      </div>

      <section className="app-card">
        {list.error ? (
          <ErrorNote error={list.error} />
        ) : list.isPending ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="app-empty">
            <p className="muted">No bookings yet. Book while signed in and it will appear here.</p>
            <a className="button" href="/book/">
              Book a table
            </a>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Party</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(booking => {
                  const busy = cancel.isPending && cancel.variables === booking.id;
                  const canCancel = (booking.status === 'requested' || booking.status === 'confirmed') && booking.date >= today;
                  return (
                    <tr key={booking.id} aria-busy={busy || undefined}>
                      <td>
                        {formatDay(booking.date)}, {formatTime(booking.time)}
                      </td>
                      <td>{booking.partySize}</td>
                      <td>{booking.reference}</td>
                      <td>
                        <span className={`status-chip status-${booking.status}`}>{STATUS_LABEL[booking.status] ?? booking.status}</span>
                      </td>
                      <td>
                        {canCancel && (
                          <Button
                            variant="danger"
                            size="sm"
                            pending={busy}
                            pendingLabel="Cancelling…"
                            disabled={cancel.isPending}
                            onClick={() => window.confirm('Cancel this booking?') && cancel.mutate(booking.id)}>
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {cancel.error && <ErrorNote error={cancel.error} />}
        {list.hasNextPage && (
          <Button variant="ghost" onClick={() => list.fetchNextPage()} pending={list.isFetchingNextPage} pendingLabel="Loading…">
            Load more
          </Button>
        )}
      </section>
    </div>
  );
}
