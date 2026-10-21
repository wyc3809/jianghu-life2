import { spawn } from 'node:child_process';

// 單一命令開啟兩個真正程序；資料只寫忽略提交嘅本機SQLite。
const env = { ...process.env, LOCAL_MULTIPLAYER: '1', VITE_ONLINE_PROTOTYPE: '1', VITE_ONLINE_PUBLIC: '0' };
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const args of [
  ['node_modules/vite-node/vite-node.mjs', 'server/online/index.ts'],
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', process.env.ONLINE_WEB_PORT ?? '5176', '--strictPort'],
]) {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
