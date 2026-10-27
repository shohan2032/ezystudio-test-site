import {useQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';

import {firstAuditQuery, firstJobsQuery, firstNewEnquiriesQuery, firstUsersQuery, firstWaitingBookingsQuery, healthQuery} from '../queries';
import {ErrorNote, pageCount, Stat, useMe, when} from '../shared';

/** `/portal`: stat tiles, then the most useful recent activity. */
export function Overview() {
  const me = useMe();
  const viewer = me.data?.viewer;
  const abilities = me.data?.abilities;
  const health = useQuery(healthQuery);
  // Under the screens' own query keys, so a save there refreshes these too.
  const waiting = useQuery({...firstWaitingBookingsQuery, enabled: Boolean(abilities?.manageBookings)});
  const enquiries = useQuery({...firstNewEnquiriesQuery, enabled: Boolean(abilities?.manageEnquiries)});
  const users = useQuery({...firstUsersQuery, enabled: Boolean(abilities?.manageUsers)});
  const jobs = useQuery({...firstJobsQuery, enabled: Boolean(abilities?.manageJobs)});
  const activity = useQuery({...firstAuditQuery, enabled: Boolean(abilities?.readAudit)});
  const recent = activity.data?.events.slice(0, 6) ?? [];

  return (
    <div className="app-page">
      <div className="app-page-head">
        <div>
          <h2>{viewer ? `Welcome back, ${viewer.name}` : 'Welcome back'}</h2>
          <p className="muted">Your account and what is happening on the site.</p>
        </div>
        <Link className="button" to="/account">
          Your account
        </Link>
      </div>

      {me.error && <ErrorNote error={me.error} />}
      {health.data && !health.data.ownerSetup && (
        <p className="notice">
          No owner email is set for this site, so nobody can become its owner. Publish the site again from
          the platform, or add the owner's email to ownerEmails in src/server/auth-settings.ts.
        </p>
      )}
      {viewer && !viewer.emailVerified && (
        <p className="notice">Your email address is not confirmed yet. Check your inbox for the link.</p>
      )}

      <div className="stat-grid">
        {abilities?.manageBookings && (
          <Stat
            label="Booking requests waiting"
            value={pageCount(waiting.data?.bookings, Boolean(waiting.data?.nextBefore))}
            to="/bookings"
          />
        )}
        {abilities?.manageEnquiries && (
          <Stat
            label="New enquiries"
            value={pageCount(enquiries.data?.enquiries, Boolean(enquiries.data?.nextBefore))}
            to="/enquiries"
          />
        )}
        {abilities?.manageBookings ? null : <Stat label="Your bookings" value="View" to="/my-bookings" />}
        <Stat label="Your roles" value={me.data ? me.data.roles.join(', ') || 'member' : null} to="/account" />
        {abilities?.manageUsers && (
          <Stat label="Users" value={pageCount(users.data?.users, Boolean(users.data?.nextBefore))} to="/users" />
        )}
        {abilities?.manageJobs && (
          <Stat label="Jobs" value={pageCount(jobs.data?.jobs, Boolean(jobs.data?.nextBefore))} to="/jobs" />
        )}
        <Stat
          label="Sign-in"
          value={health.data ? (health.data.auth ? 'Ready' : 'Not set up') : null}
          hint={health.data && !health.data.siteKey ? 'No Site Key: emails are not sent.' : undefined}
        />
      </div>

      {abilities?.readAudit && (
        <section className="app-card">
          <div className="app-card-head">
            <h3>Recent activity</h3>
            <Link to="/activity">View all</Link>
          </div>
          {activity.error ? (
            <ErrorNote error={activity.error} />
          ) : activity.isPending ? (
            <p className="muted">Loading…</p>
          ) : recent.length ? (
            <table className="app-table">
              <thead>
                <tr>
                  <th>What</th>
                  <th>Who</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(event => (
                  <tr key={event.id}>
                    <td>{event.action.replaceAll('_', ' ')}</td>
                    <td className="muted">{event.actor?.name ?? 'System'}</td>
                    <td className="muted">{when(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="app-empty">
              <p className="muted">Nothing yet.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
