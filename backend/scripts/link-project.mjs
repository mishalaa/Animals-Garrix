import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(join(backendRoot, '.env'));

const ref = process.env.SUPABASE_PROJECT_REF;
if (!ref) {
  console.error(
    'Set SUPABASE_PROJECT_REF in backend/.env (copy from backend/.env.example).\n' +
      'Project ref is the id in your dashboard URL: .../project/<ref>',
  );
  process.exit(1);
}

console.log(`Linking Supabase project ${ref}...`);

const result = spawnSync('npx', ['supabase', 'link', '--project-ref', ref], {
  cwd: backendRoot,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
