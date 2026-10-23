import { spawn } from 'node:child_process';

process.env.ANALYZE = 'true';

const build = spawn('npx', ['next', 'build', '--webpack'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ANALYZE: 'true' },
});

build.on('exit', (code) => {
  process.exit(code || 0);
});
