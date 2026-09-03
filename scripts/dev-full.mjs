import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const children = [];

function run(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: process.env,
  });
  children.push(child);
  child.on('exit', (code) => {
    if (shuttingDown) return;
    if (code) {
      shuttingDown = true;
      stopAll();
      process.exit(code);
    }
  });
}

let shuttingDown = false;

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  shuttingDown = true;
  stopAll();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shuttingDown = true;
  stopAll();
  process.exit(0);
});

run(process.execPath, ['scripts/dev-api.mjs']);
run(process.execPath, ['node_modules/vite/bin/vite.js']);
