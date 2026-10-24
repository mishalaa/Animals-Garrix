/**
 * One-time: mark all repo migrations as already applied on the linked remote.
 * Use when the database was set up via the Supabase SQL Editor before using the CLI.
 * so `supabase db push` only runs new migration files afterward.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listMigrationVersions } from './migration-versions.mjs';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const versions = listMigrationVersions();

if (versions.length === 0) {
  console.error('No migration files found in supabase/migrations/');
  process.exit(1);
}

console.log('Marking as applied on linked project:', versions.join(', '));

const result = spawnSync(
  'npx',
  ['supabase', 'migration', 'repair', ...versions, '--status', 'applied', '--linked', '--yes'],
  { cwd: backendRoot, stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
