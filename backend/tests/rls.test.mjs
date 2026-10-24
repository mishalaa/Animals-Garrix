// Row Level Security tests: run the real migrations in an in-memory Postgres (PGlite)
// with small stand-ins for Supabase's auth and storage schemas, then act as different users.
// Run with: npm test
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';

const db = new PGlite();
// Apply every migration in order, exactly as Supabase would.
const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(new URL(f, migrationsDir), 'utf8'));

// Minimal stand-ins for the Supabase auth and storage schemas.
await db.exec(`
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id serial primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
create role authenticated;
`);
for (const sql of migrations) await db.exec(sql);
await db.exec(`
grant usage on schema public, storage, auth to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema storage to authenticated;
grant usage, select on all sequences in schema storage to authenticated;
grant select on auth.users to authenticated;
`);

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
  ('${A}', 'alice@example.com', '{"full_name":"Alice"}'), ('${B}', 'bob@example.com', '{}');`);

let ok = 0,
  fail = 0;
const as = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('test.uid', '${uid}', false); set role authenticated;`);
  return db.query(sql, params);
};
const expect = (name, cond) => {
  cond ? ok++ : fail++;
  console.log(cond ? 'PASS' : 'FAIL', name);
};
const throws = async (name, fn) => {
  try {
    await fn();
    expect(name + ' (should be refused)', false);
  } catch {
    expect(name, true);
  }
};

const profiles = await db.query('select full_name from profiles order by full_name');
expect('profiles auto-created', profiles.rows.length === 2 && profiles.rows[0].full_name === 'Alice');

const pet = (await as(A, `insert into pets (name, species) values ('Mishti', 'cat') returning id`)).rows[0]
  .id;
expect(
  'owner membership auto-created',
  (await as(A, 'select role from pet_members where pet_id = $1', [pet])).rows[0]?.role === 'owner',
);
expect('owner sees pet', (await as(A, 'select * from pets')).rows.length === 1);
expect('stranger cannot see pet', (await as(B, 'select * from pets')).rows.length === 0);
await throws('stranger cannot add condition', () =>
  as(B, `insert into conditions (pet_id, name) values ($1, 'x')`, [pet]),
);
await as(A, `insert into conditions (pet_id, name) values ($1, 'Eye infection')`, [pet]);
await as(
  A,
  `insert into origins (pet_id, source, found_location) values ($1, 'street_rescue', 'GEC Circle')`,
  [pet],
);
expect('stranger cannot read conditions', (await as(B, 'select * from conditions')).rows.length === 0);

await throws('stranger cannot share', () =>
  as(B, `select share_pet($1, 'bob@example.com', 'editor')`, [pet]),
);
await as(A, `select share_pet($1, 'bob@example.com', 'viewer')`, [pet]);
expect(
  'viewer sees pet and records',
  (await as(B, 'select * from conditions')).rows.length === 1 &&
    (await as(B, 'select * from origins')).rows.length === 1,
);
await throws('viewer cannot add records', () =>
  as(B, `insert into visits (pet_id, reason) values ($1, 'x')`, [pet]),
);
const upd = await as(B, `update pets set name = 'Hacked' where id = $1`, [pet]);
expect('viewer cannot rename pet', upd.affectedRows === 0);

await as(A, `select share_pet($1, 'bob@example.com', 'editor')`, [pet]);
await as(
  B,
  `insert into medicines (pet_id, name, frequency, times) values ($1, 'Fish oil', 'daily', array['09:00'])`,
  [pet],
);
const med = (await as(B, 'select id from medicines')).rows[0].id;
await as(
  B,
  `insert into dose_logs (pet_id, medicine_id, scheduled_for, status) values ($1, $2, now(), 'done')`,
  [pet, med],
);
expect('editor can add medicine and log dose', (await as(A, 'select * from dose_logs')).rows.length === 1);
const del = await as(B, 'delete from pets where id = $1', [pet]);
expect('editor cannot delete pet', del.affectedRows === 0);

const members = await as(B, 'select * from pet_members_detail($1)', [pet]);
expect(
  'members list with names and emails',
  members.rows.length === 2 &&
    members.rows[0].role === 'owner' &&
    members.rows[0].email === 'alice@example.com',
);

await as(A, `insert into storage.objects (bucket_id, name) values ('pet-files', $1)`, [`${pet}/report.pdf`]);
const C = '33333333-3333-3333-3333-333333333333';
await db.exec(`reset role; insert into auth.users (id, email) values ('${C}', 'carol@example.com');`);
expect('member reads pet files', (await as(B, 'select * from storage.objects')).rows.length === 1);
expect('stranger cannot read pet files', (await as(C, 'select * from storage.objects')).rows.length === 0);
await throws('stranger cannot upload to pet folder', () =>
  as(C, `insert into storage.objects (bucket_id, name) values ('pet-files', $1)`, [`${pet}/x.pdf`]),
);

const before = (await as(A, 'select updated_at from pets where id = $1', [pet])).rows[0].updated_at;
await new Promise((r) => setTimeout(r, 20));
await as(A, `update pets set weight_kg = 3.4 where id = $1`, [pet]);
const after = (await as(A, 'select updated_at from pets where id = $1', [pet])).rows[0].updated_at;
expect('updated_at trigger', after > before);

console.log(`\n${ok} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
