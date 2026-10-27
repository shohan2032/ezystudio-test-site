import type {QueryClient} from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  type ErrorComponentProps,
  Link,
  lazyRouteComponent,
  Outlet,
  useMatches,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import {useEffect, useRef, useState} from 'react';

import type {Abilities} from '../lib/types';
import {logout} from '../platform/browser';
import {
  auditQuery,
  dayBookingsQuery,
  enquiriesQuery,
  firstAuditQuery,
  firstJobsQuery,
  firstNewEnquiriesQuery,
  firstUsersQuery,
  firstWaitingBookingsQuery,
  healthQuery,
  manageJobsQuery,
  manageSpecialsQuery,
  meQuery,
  myBookingsQuery,
  permissionsQuery,
  rolesQuery,
  sessionsQuery,
  twoFactorQuery,
  usersQuery,
  waitingBookingsQuery,
} from './queries';
import {londonToday} from '../lib/booking';
import {Avatar, ErrorNote, useMe, useSite} from './shared';
import {Button} from './ui';

/**
 * The portal's screens: a TanStack Router app under `/portal` (basepath),
 * served by `src/pages/portal/[...path].astro` (signed-in users only), with
 * data from the Site API through TanStack Query. Links INSIDE the portal use
 * `<Link>`; links to the website (`/`, `/blog/`, `/account/…`) are plain
 * `<a href>`.
 *
 * Add a screen (all five, every time):
 *   1. its reads as `queryOptions` in `queries.ts`, used by the screen with `useQuery(x)`;
 *   2. the component in `screens/<name>.tsx` (a named export);
 *   3. a `createRoute` below: literal `path`, `staticData.title` (the top bar
 *      and the tab), a `loader` that warms its queries, and the component
 *      LAZY (`lazyRouteComponent(() => import('./screens/<name>'), 'Name')`)
 *      so its code loads on first use (or on hover), never in the first bundle;
 *   4. its route in `routeTree`;
 *   5. one item in `NAV_GROUPS` if it belongs in the sidebar.
 * Never a plain `<a href>` to a portal path: it reloads the whole app.
 */

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** The screen's name: the top bar's `<h1>` and the tab's title. */
    title?: string;
  }
}

/**
 * Warm a screen's queries before it renders (on navigation, and on hover via
 * `defaultPreload: 'intent'`). A failed read is NOT thrown: the screen shows
 * the error in place from the same query, as it always has.
 */
const warm = (...reads: Promise<unknown>[]) => Promise.all(reads.map(read => read.catch(() => undefined))).then(() => undefined);

/** While a slow screen loads (after `defaultPendingMs`). */
export function RoutePending() {
  return (
    <div className="app-page" role="status">
      <p className="muted">Loading…</p>
    </div>
  );
}

/** A screen that failed to render or to load its code (an old tab after a Publish: reload). */
export function RouteError({error}: ErrorComponentProps) {
  const router = useRouter();
  const failure = error instanceof Error ? error : new Error('Something went wrong.');
  const stale = /dynamically imported module|module script|Importing a module/i.test(failure.message);
  return (
    <div className="app-page">
      <ErrorNote error={stale ? new Error('This dashboard was updated. Reload to get the new version.') : failure} />
      <div className="actions">
        <Button variant="ghost" onClick={() => (stale ? window.location.reload() : void router.invalidate())}>
          {stale ? 'Reload' : 'Try again'}
        </Button>
      </div>
    </div>
  );
}


/**
 * The sidebar, in groups. `ability` hides an item the visitor may not use;
 * that only HIDES it, the route's guard is the enforcement.
 */
const NAV_GROUPS: {
  label: string;
  items: {to: string; label: string; exact?: boolean; ability?: keyof Abilities}[];
}[] = [
  {
    label: 'Workspace',
    items: [
      {to: '/', label: 'Overview', exact: true},
      {to: '/my-bookings', label: 'Your bookings'},
      {to: '/account', label: 'Your account'},
    ],
  },
  {
    label: 'Restaurant',
    items: [
      {to: '/bookings', label: 'Bookings', ability: 'manageBookings'},
      {to: '/enquiries', label: 'Enquiries', ability: 'manageEnquiries'},
      {to: '/specials', label: 'Today’s specials', ability: 'manageMenu'},
    ],
  },
  {
    label: 'Manage',
    items: [
      {to: '/jobs', label: 'Jobs', ability: 'manageJobs'},
      {to: '/users', label: 'Users', ability: 'manageUsers'},
      {to: '/roles', label: 'Roles', ability: 'manageRoles'},
      {to: '/activity', label: 'Activity', ability: 'readAudit'},
    ],
  },
];

/** The screen's title for the top bar and the tab: the deepest route's `staticData.title`. */
function useScreenTitle() {
  const matches = useMatches();
  return [...matches].reverse().find(match => match.staticData.title)?.staticData.title ?? 'Dashboard';
}

/**
 * After every in-app navigation (never the first load): the tab title says
 * where you are, and focus moves to the screen's `<h1>` so keyboard and
 * screen reader users start at the new screen (it is read out), as after a
 * page load.
 */
function useNavigationFocus(title: string, siteName: string | undefined) {
  const heading = useRef<HTMLHeadingElement>(null);
  const resolved = useRouterState({select: s => s.resolvedLocation?.pathname});
  const first = useRef(true);
  // "<title> · <site>", as App.astro writes it on the first load.
  const [fallbackName] = useState(() => document.title.split(' · ').slice(1).join(' · ') || 'My site');
  useEffect(() => {
    document.title = `${title} · ${siteName ?? fallbackName}`;
  }, [title, siteName, fallbackName]);
  useEffect(() => {
    if (!resolved) return;
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus({preventScroll: true});
  }, [resolved]);
  return heading;
}

/**
 * The app shell: a full-height sidebar (brand, grouped nav, way back to the
 * website) and a top bar (screen title, user, sign out), the screen in
 * between. Every screen renders inside it; nothing here reloads the page.
 */
const rootRoute = createRootRouteWithContext<{queryClient: QueryClient}>()({
  component: function Shell() {
    const me = useMe();
    const site = useSite();
    const title = useScreenTitle();
    const heading = useNavigationFocus(title, site.data?.site?.name);
    const [open, setOpen] = useState(false);
    // `logout()` reloads the page when it is done, so pending never needs resetting.
    const [signingOut, setSigningOut] = useState(false);
    const viewer = me.data?.viewer;
    const abilities = me.data?.abilities;
    // Signed out meanwhile (or never signed in, in the editor Preview, where
    // the host page cannot see the session): go and sign in, then come back.
    const signedOut = viewer !== undefined && viewer.state !== 'user';
    useEffect(() => {
      if (!signedOut) return;
      const back = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.replace(`/account/login/?next=${back}`);
    }, [signedOut]);
    if (signedOut) return null;
    return (
      <div className="app-shell" data-nav-open={open ? '' : undefined}>
        <aside className="app-sidebar">
          <a className="app-brand" href="/">
            {site.data?.site?.name ?? 'My site'}
          </a>
          <nav aria-label="Dashboard" onClick={() => setOpen(false)}>
            {NAV_GROUPS.map(group => {
              const items = group.items.filter(item => !item.ability || abilities?.[item.ability]);
              if (!items.length) return null;
              return (
                <div className="app-nav-group" key={group.label}>
                  <p className="app-nav-label">{group.label}</p>
                  {items.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="app-nav-link"
                      activeOptions={{exact: item.exact ?? false}}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
          <div className="app-sidebar-foot">
            <a className="app-nav-link" href="/">
              ← Back to the website
            </a>
          </div>
        </aside>

        <div className="app-main">
          <header className="app-topbar">
            <button
              type="button"
              className="app-menu-button"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen(value => !value)}>
              ☰
            </button>
            <h1 className="app-title" ref={heading} tabIndex={-1}>
              {title}
            </h1>
            {viewer && (
              <div className="app-viewer">
                <Avatar name={viewer.name ?? ''} />
                <span className="app-viewer-name">{viewer.name}</span>
                <Button
                  variant="link"
                  size="sm"
                  pending={signingOut}
                  pendingLabel="Signing out…"
                  onClick={() => {
                    setSigningOut(true);
                    void logout();
                  }}>
                  Sign out
                </Button>
              </div>
            )}
          </header>
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="app-empty">
      <h2>Not found</h2>
      <p className="muted">This dashboard page does not exist.</p>
      <Link className="button" to="/">
        Back to the overview
      </Link>
    </div>
  ),
});

// One `createRoute` per screen, with a LITERAL path (`<Link to>` is typed from
// them), a title, a loader over the screen's own queryOptions, a lazy screen.
const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  staticData: {title: 'Overview'},
  loader: async ({context: {queryClient}}) => {
    // The tiles the visitor may see, as the screen's `enabled` flags decide.
    const [me] = await Promise.all([queryClient.ensureQueryData(meQuery).catch(() => null), warm(queryClient.ensureQueryData(healthQuery))]);
    const can = me?.abilities;
    await warm(
      ...(can?.manageBookings ? [queryClient.ensureQueryData(firstWaitingBookingsQuery)] : []),
      ...(can?.manageEnquiries ? [queryClient.ensureQueryData(firstNewEnquiriesQuery)] : []),
      ...(can?.manageUsers ? [queryClient.ensureQueryData(firstUsersQuery)] : []),
      ...(can?.manageJobs ? [queryClient.ensureQueryData(firstJobsQuery)] : []),
      ...(can?.readAudit ? [queryClient.ensureQueryData(firstAuditQuery)] : [])
    );
  },
  component: lazyRouteComponent(() => import('./screens/overview'), 'Overview'),
});
const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  staticData: {title: 'Your account'},
  loader: ({context: {queryClient}}) =>
    warm(
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(twoFactorQuery),
      queryClient.ensureQueryData(sessionsQuery)
    ),
  component: lazyRouteComponent(() => import('./screens/account'), 'Account'),
});
const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs',
  staticData: {title: 'Jobs'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureInfiniteQueryData(manageJobsQuery)),
  component: lazyRouteComponent(() => import('./screens/jobs'), 'Jobs'),
});
const bookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookings',
  staticData: {title: 'Bookings'},
  loader: ({context: {queryClient}}) =>
    warm(
      queryClient.ensureInfiniteQueryData(waitingBookingsQuery),
      queryClient.prefetchQuery(dayBookingsQuery(londonToday(new Date())))
    ),
  component: lazyRouteComponent(() => import('./screens/bookings'), 'Bookings'),
});
const myBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-bookings',
  staticData: {title: 'Your bookings'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureInfiniteQueryData(myBookingsQuery)),
  component: lazyRouteComponent(() => import('./screens/my-bookings'), 'MyBookings'),
});
const enquiriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/enquiries',
  staticData: {title: 'Enquiries'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureInfiniteQueryData(enquiriesQuery('new'))),
  component: lazyRouteComponent(() => import('./screens/enquiries'), 'Enquiries'),
});
const specialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/specials',
  staticData: {title: 'Today’s specials'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureQueryData(manageSpecialsQuery)),
  component: lazyRouteComponent(() => import('./screens/specials'), 'Specials'),
});
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  staticData: {title: 'Users'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureInfiniteQueryData(usersQuery({email: '', status: ''}))),
  component: lazyRouteComponent(() => import('./screens/users'), 'Users'),
});
const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/roles',
  staticData: {title: 'Roles'},
  loader: ({context: {queryClient}}) =>
    warm(queryClient.ensureQueryData(rolesQuery), queryClient.ensureQueryData(permissionsQuery)),
  component: lazyRouteComponent(() => import('./screens/roles'), 'Roles'),
});
const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  staticData: {title: 'Activity'},
  loader: ({context: {queryClient}}) => warm(queryClient.ensureInfiniteQueryData(auditQuery)),
  component: lazyRouteComponent(() => import('./screens/activity'), 'Activity'),
});

export const routeTree = rootRoute.addChildren([
  overviewRoute,
  accountRoute,
  myBookingsRoute,
  bookingsRoute,
  enquiriesRoute,
  specialsRoute,
  jobsRoute,
  usersRoute,
  rolesRoute,
  activityRoute,
]);
