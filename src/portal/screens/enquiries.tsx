import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';

import {ENQUIRY_KINDS, formatDay} from '../../lib/booking';
import {ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus} from '../../lib/types';
import {api, read} from '../api';
import {enquiriesQuery} from '../queries';
import {ErrorNote, when} from '../shared';
import {Button} from '../ui';

const KIND_LABEL = Object.fromEntries(ENQUIRY_KINDS.map(kind => [kind.value, kind.label]));
const STATUS_LABEL: Record<string, string> = {new: 'New', replied: 'Replied', closed: 'Closed'};

const replyLink = (enquiry: Enquiry) =>
  `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent('Your enquiry at Fennel & Fig')}&body=${encodeURIComponent(
    `Hello ${enquiry.name},\n\nThank you for getting in touch about ${KIND_LABEL[enquiry.kind]?.toLowerCase() ?? 'your event'} for ${enquiry.guests}.\n\n`
  )}`;

/** Holders of `site:enquiry:manage`: private dining and events enquiries from `/events/`. */
export function Enquiries() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'' | EnquiryStatus>('new');
  const list = useInfiniteQuery(enquiriesQuery(status));
  const update = useMutation({
    mutationFn: ({id, status}: {id: number; status: EnquiryStatus}) =>
      read(api.enquiries.manage[':id'].$patch({param: {id: String(id)}, json: {status}})),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['enquiries']}),
  });
  const remove = useMutation({
    mutationFn: (id: number) => read(api.enquiries.manage[':id'].$delete({param: {id: String(id)}})),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['enquiries']}),
  });
  const busyId = (update.isPending && update.variables?.id) || (remove.isPending && remove.variables) || null;
  const rows = list.data?.pages.flatMap(page => page.enquiries) ?? [];

  return (
    <div className="app-page">
      <div className="app-page-head">
        <div>
          <h2>Enquiries</h2>
          <p className="muted">
            Private dining and events requests from <a href="/events/">the events page</a>. Reply from your own inbox, then mark them replied.
          </p>
        </div>
        <a className="button" href="/events/">
          See the events page
        </a>
      </div>

      <div className="segmented" role="group" aria-label="Show">
        {(['new', 'replied', 'closed', ''] as const).map(value => (
          <button key={value || 'all'} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>
            {value ? STATUS_LABEL[value] : 'All'}
          </button>
        ))}
      </div>

      {list.error && <ErrorNote error={list.error} />}
      {list.isPending && <p className="muted">Loading…</p>}
      {list.isSuccess && rows.length === 0 && (
        <div className="app-empty app-card">
          <p className="muted">{status === 'new' ? 'Nothing new. Enquiries from the events page arrive here.' : 'Nothing here.'}</p>
          {status !== '' && (
            <Button variant="ghost" onClick={() => setStatus('')}>
              Show all enquiries
            </Button>
          )}
        </div>
      )}

      <div className="enquiry-list">
        {rows.map(enquiry => {
          const busy = busyId === enquiry.id;
          const pending = (next: EnquiryStatus) => update.isPending && update.variables?.id === enquiry.id && update.variables.status === next;
          return (
            <article key={enquiry.id} className="app-card enquiry" aria-busy={busy || undefined}>
              <div className="app-card-head">
                <h3>
                  {enquiry.name} · {KIND_LABEL[enquiry.kind] ?? enquiry.kind}
                </h3>
                <span className={`status-chip status-${enquiry.status}`}>{STATUS_LABEL[enquiry.status] ?? enquiry.status}</span>
              </div>
              <p className="muted small">
                {enquiry.guests} guests · {enquiry.eventDate ? formatDay(enquiry.eventDate) : 'no date yet'} · sent {when(enquiry.createdAt)}
              </p>
              <p className="enquiry-message">{enquiry.message}</p>
              <p className="small">
                <a href={replyLink(enquiry)}>{enquiry.email}</a>
                {enquiry.phone && (
                  <>
                    {' · '}
                    <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`}>{enquiry.phone}</a>
                  </>
                )}
              </p>
              <div className="row-actions">
                {ENQUIRY_STATUSES.filter(next => next !== enquiry.status).map(next => (
                  <Button
                    key={next}
                    variant={next === 'replied' ? 'primary' : 'ghost'}
                    size="sm"
                    pending={pending(next)}
                    pendingLabel="Saving…"
                    disabled={busy}
                    onClick={() => update.mutate({id: enquiry.id, status: next})}>
                    {next === 'replied' ? 'Mark replied' : next === 'closed' ? 'Close' : 'Mark new'}
                  </Button>
                ))}
                <Button
                  variant="danger"
                  size="sm"
                  pending={remove.isPending && remove.variables === enquiry.id}
                  pendingLabel="Deleting…"
                  disabled={busy}
                  onClick={() => window.confirm(`Delete ${enquiry.name}'s enquiry and their contact details?`) && remove.mutate(enquiry.id)}>
                  Delete
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      {(update.error || remove.error) && <ErrorNote error={(update.error ?? remove.error)!} />}
      {list.hasNextPage && (
        <Button variant="ghost" onClick={() => list.fetchNextPage()} pending={list.isFetchingNextPage} pendingLabel="Loading…">
          Load more
        </Button>
      )}
    </div>
  );
}
