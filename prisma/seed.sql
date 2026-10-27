-- Fake starter data for the PREVIEW Database only: the editor runs it after
-- `npx prisma migrate reset`, or on demand with `npx prisma db seed`.
-- Live data never comes from here. No users: create them by signing up. Safe to run twice: each block only fills an
-- empty table.
INSERT INTO "jobs" ("slug", "title", "company", "location", "type", "remote", "description", "apply_url", "status", "created_by", "updated_at")
SELECT v.slug, v.title, v.company, v.location, v.type, v.remote, v.description, v.apply_url, 'open', 0, now()
FROM (VALUES
  ('chef-de-partie', 'Chef de partie', 'Fennel & Fig', 'Stokes Croft, Bristol', 'full-time', false,
   E'Run the fire section four nights a week: hake, lamb, the Sunday roasts.\n\nWe close Monday and Tuesday, every week. Staff meal at 4pm, tips shared evenly across the floor and the kitchen.',
   'mailto:jobs@example.com'),
  ('weekend-front-of-house', 'Weekend front of house', 'Fennel & Fig', 'Stokes Croft, Bristol', 'part-time', false,
   E'Friday to Sunday on the floor and behind the bar.\n\nNo experience needed if you like people and can carry three plates; we teach the wine list.',
   'mailto:jobs@example.com')
) AS v(slug, title, company, location, type, remote, description, apply_url)
WHERE NOT EXISTS (SELECT 1 FROM "jobs");

-- Today's specials board (the owner keeps it current from /portal/specials).
INSERT INTO "specials" ("title", "description", "price_cents", "available", "updated_at")
SELECT v.title, v.description, v.price_cents, true, now()
FROM (VALUES
  ('Brixham crab on toast', 'Brown crab butter, pickled shallot, watercress', 1250),
  ('Wood-roast partridge', 'Bread sauce, game chips, blackberry jus', 2600),
  ('Quince and almond tart', 'With Jersey cream', 850)
) AS v(title, description, price_cents)
WHERE NOT EXISTS (SELECT 1 FROM "specials");
