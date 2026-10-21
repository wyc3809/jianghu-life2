import { createServer, type IncomingMessage } from 'node:http';
import { ZodError } from 'zod';
import { OnlineError, OnlineService } from './service';

async function body(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw) > 16_384) throw new OnlineError(413, '請求過大。');
  }
  try { return JSON.parse(raw || '{}'); } catch { throw new OnlineError(400, '請求格式不正確。'); }
}

/** 本機HTTP入口，固定loopback；前端經Vite同源proxy連線，唔開公開CORS。 */
export function createOnlineHttpServer(service: OnlineService) {
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const host = req.headers.host ?? '';
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) throw new OnlineError(403, '只限本機試玩。');
      if (req.headers.origin && new URL(req.headers.origin).host !== host) throw new OnlineError(403, '不接受跨來源請求。');
      const url = new URL(req.url ?? '/', 'http://' + host);
      if (req.method === 'GET' && url.pathname === '/api/jianghu/health') {
        res.end(JSON.stringify({ mode: 'local-prototype', ok: true })); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/jianghu/login') {
        res.end(JSON.stringify(service.login(await body(req)))); return;
      }
      const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) throw new OnlineError(401, '請先選擇試玩角色。');
      let result: unknown;
      if (req.method === 'GET' && url.pathname === '/api/jianghu/world') result = service.world(token);
      else if (req.method === 'POST') {
        switch (url.pathname) {
          case '/api/jianghu/heartbeat': result = service.heartbeat(token); break;
          case '/api/jianghu/leave': result = service.leave(token); break;
          case '/api/jianghu/logout': result = service.leave(token, true); break;
          case '/api/jianghu/challenge': result = service.challenge(token, await body(req)); break;
          case '/api/jianghu/claim': result = service.claim(token, await body(req)); break;
          case '/api/jianghu/loadout': result = service.loadout(token, await body(req)); break;
          default: throw new OnlineError(404, '搵唔到呢個操作。');
        }
      } else throw new OnlineError(404, '搵唔到呢個操作。');
      res.end(JSON.stringify(result));
    } catch (error) {
      const status = error instanceof OnlineError ? error.status : error instanceof ZodError ? 400 : 500;
      res.statusCode = status;
      res.end(JSON.stringify({ error: error instanceof OnlineError ? error.message : status === 400 ? '請求內容不正確。' : '本機服務暫時未能處理，請稍後重試。' }));
      if (status === 500) console.error('本機江湖服務失敗', error instanceof Error ? error.message : 'unknown');
    }
  });
  const timer = setInterval(() => { try { service.tick(); } catch (error) { console.error('江湖結算失敗', error instanceof Error ? error.message : 'unknown'); } }, 250);
  timer.unref(); server.on('close', () => clearInterval(timer));
  return server;
}
