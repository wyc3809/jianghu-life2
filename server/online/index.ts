import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { OnlineService } from './service';
import { createOnlineHttpServer } from './http';

if (process.env.LOCAL_MULTIPLAYER !== '1') throw new Error('只限原型：請用 npm run dev:online 啟動。');
const file = resolve(process.env.ONLINE_DB ?? '.local-online/world.sqlite');
mkdirSync(dirname(file), { recursive: true });
const fixedSeed = process.env.ONLINE_TEST_SEED;
const service = new OnlineService({ file, ...(fixedSeed === undefined ? {} : { seed: () => Number(fixedSeed) }) });
const server = createOnlineHttpServer(service);
const port = Number(process.env.ONLINE_PORT ?? 8787);
server.listen(port, '127.0.0.1', () => console.log(`本機江湖服務：http://127.0.0.1:${port}（隔離測試角色）`));
server.on('error', error => { console.error(error.message); service.close(); process.exit(1); });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => { service.close(); process.exit(0); }));
