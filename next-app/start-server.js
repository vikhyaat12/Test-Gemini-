const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, '..', '.freebuff', 'preview-a486ffda-251e-4c9c-91b8-6dd3c5f594f6.log');
const errPath = path.resolve(__dirname, '..', '.freebuff', 'preview-a486ffda-251e-4c9c-91b8-6dd3c5f594f6.log.err');
const nextBin = path.resolve(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

fs.mkdirSync(path.dirname(logPath), { recursive: true });

const logFd = fs.openSync(logPath, 'w');
const errFd = fs.openSync(errPath, 'w');

const p = cp.spawn(process.execPath, [nextBin, 'dev', '-p', '3000'], {
  cwd: __dirname,
  detached: true,
  stdio: ['ignore', logFd, errFd]
});

p.unref();
fs.closeSync(logFd);
fs.closeSync(errFd);
console.log('pid=' + p.pid);
