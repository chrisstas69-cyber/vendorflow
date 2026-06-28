import { spawnSync } from 'node:child_process';

if (!process.env.DIRECT_URL?.trim()) {
  const direct =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (direct) process.env.DIRECT_URL = direct;
}

function run(cmd, args, { allowFail = false } = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', env: process.env, shell: true });
  if (!allowFail && result.status !== 0) process.exit(result.status ?? 1);
  return result.status ?? 0;
}

// Recover from failed first deploy (corrupt migration.sql header was applied as SQL)
run('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', '20250628000000_init_postgres'], {
  allowFail: true,
});

run('npx', ['prisma', 'migrate', 'deploy']);
run('npx', ['next', 'build']);
