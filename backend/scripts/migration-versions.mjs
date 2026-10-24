import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'supabase', 'migrations');

/** @returns {string[]} sorted migration version ids (timestamp prefix) */
export function listMigrationVersions() {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => name.split('_')[0])
    .sort();
}
