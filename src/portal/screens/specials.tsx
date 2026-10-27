import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';

import {formatPrice} from '../../lib/booking';
import type {Special} from '../../lib/types';
import {api, read} from '../api';
import {manageSpecialsQuery} from '../queries';
import {ErrorNote} from '../shared';
import {Button, Field, rules, useForm} from '../ui';

const EMPTY = {title: '', description: '', price: ''};

/** The SAME limits `src/server/routes/specials.ts` enforces. */
const RULES = {
  title: [rules.required('Name the dish.'), rules.maxLength(100)],
  description: [rules.maxLength(300)],
  price: [
    rules.required('Enter a price, like 14.50.'),
    rules.pattern(/^\d{1,4}(\.\d{1,2})?$/, 'Use pounds and pence, like 14.50 or 9.'),
    (value: string) => (Number(value) > 1000 ? 'Keep it under £1000.' : null),
  ],
};

const toPence = (price: string) => Math.round(Number(price) * 100);
const toPounds = (pence: number) => (pence % 100 === 0 ? String(pence / 100) : (pence / 100).toFixed(2));

/** Holders of `site:menu:manage`: today's specials board (home page and menu page). */
export function Specials() {
  const queryClient = useQueryClient();
  const list = useQuery(manageSpecialsQuery);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const form = useForm(EMPTY, RULES);
  const refresh = () => queryClient.invalidateQueries({queryKey: ['specials']});
  const close = () => {
    setEditing(null);
    form.reset();
  };

  const save = useMutation({
    mutationFn: (values: typeof EMPTY) => {
      const json = {title: values.title, description: values.description, priceCents: toPence(values.price)};
      return editing === 'new'
        ? read<{special: Special}>(api.specials.manage.$post({json}))
        : read<{special: Special}>(api.specials.manage[':id'].$patch({param: {id: String(editing)}, json}));
    },
    onSuccess: () => {
      close();
      return refresh();
    },
    onError: (error: Error & {fields?: Record<string, string>}) => {
      if (error.fields?.priceCents) form.setServerErrors({price: error.fields.priceCents});
    },
  });
  const toggle = useMutation({
    mutationFn: (special: Special) =>
      read(api.specials.manage[':id'].$patch({param: {id: String(special.id)}, json: {available: !special.available}})),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: number) => read(api.specials.manage[':id'].$delete({param: {id: String(id)}})),
    onSuccess: refresh,
  });
  const busyId = (toggle.isPending && toggle.variables?.id) || (remove.isPending && remove.variables) || null;
  const rows = list.data?.specials ?? [];
  const onBoard = rows.filter(row => row.available).length;

  const startNew = () => {
    form.reset();
    save.reset();
    setEditing('new');
  };

  return (
    <div className="app-page">
      <div className="app-page-head">
        <div>
          <h2>Today’s specials</h2>
          <p className="muted">
            Dishes switched on show on <a href="/">the home page</a> and <a href="/menu/#today">the menu</a> within a minute. Switch
            them off when they run out; keep them for another day.
          </p>
        </div>
        {editing === null && <Button onClick={startNew}>Add a dish</Button>}
      </div>

      {editing !== null && (
        <form className="app-card form-card" onSubmit={form.submit(values => save.mutate(values))} noValidate>
          <h3>{editing === 'new' ? 'New dish' : 'Edit dish'}</h3>
          <div className="form-grid">
            <Field id="f-title" label="Dish" error={form.error('title')}>
              <input {...form.field('title')} placeholder="Brixham crab on toast" autoComplete="off" />
            </Field>
            <Field id="f-price" label="Price (£)" hint="Pounds and pence, like 12.50." error={form.error('price')}>
              <input {...form.field('price')} inputMode="decimal" placeholder="12.50" />
            </Field>
            <div className="full">
              <Field id="f-description" label="Description" optional hint="One line: what's with it." error={form.error('description')}>
                <input {...form.field('description')} placeholder="Brown crab butter, pickled shallot, watercress" />
              </Field>
            </div>
          </div>
          {save.error && <ErrorNote error={save.error} />}
          <div className="actions">
            <Button type="submit" pending={save.isPending} pendingLabel="Saving…">
              {editing === 'new' ? 'Add to the board' : 'Save changes'}
            </Button>
            <Button variant="ghost" onClick={close} disabled={save.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <section className="app-card">
        <div className="app-card-head">
          <h3>{list.data ? `${onBoard} on the board now` : 'The board'}</h3>
        </div>
        {list.error ? (
          <ErrorNote error={list.error} />
        ) : list.isPending ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="app-empty">
            <p className="muted">No dishes yet. Add today’s first special and it goes straight on the site.</p>
            {editing === null && <Button onClick={startNew}>Add a dish</Button>}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Price</th>
                  <th>On the board</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(special => {
                  const busy = busyId === special.id;
                  return (
                    <tr key={special.id} aria-busy={busy || undefined}>
                      <td>
                        <strong>{special.title}</strong>
                        {special.description && <div className="muted small">{special.description}</div>}
                      </td>
                      <td>{formatPrice(special.priceCents)}</td>
                      <td>
                        <span className={`status-chip ${special.available ? 'status-confirmed' : 'status-cancelled'}`}>
                          {special.available ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            pending={toggle.isPending && toggle.variables?.id === special.id}
                            pendingLabel={special.available ? 'Taking off…' : 'Putting on…'}
                            disabled={busy}
                            onClick={() => toggle.mutate(special)}>
                            {special.available ? 'Take off' : 'Put on'}
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            disabled={busy || save.isPending}
                            onClick={() => {
                              form.reset({title: special.title, description: special.description, price: toPounds(special.priceCents)});
                              save.reset();
                              setEditing(special.id);
                            }}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            pending={remove.isPending && remove.variables === special.id}
                            pendingLabel="Deleting…"
                            disabled={busy}
                            onClick={() => window.confirm(`Delete “${special.title}”?`) && remove.mutate(special.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(toggle.error || remove.error) && <ErrorNote error={(toggle.error ?? remove.error)!} />}
      </section>
    </div>
  );
}
