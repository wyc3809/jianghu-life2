import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ONLINE_TEST } from '../../data/redesign/onlineTestParams';
import type { OnlineAccountId, OnlineSnapshot, OnlineWorld } from '../../interfaces/online';
import { settleOnlineWorld } from '../../core/online/rules';
import { createOnlineFixture } from './fixtures';
import { applyOnlineCommand, parseOnlineCommand, OnlineError } from '../../core/online/commands';

const accountSchema = z.enum(['river', 'cloud']);
type Session = { account_id: OnlineAccountId; expires_at: number; present_until: number };

export { OnlineError } from '../../core/online/commands';
/** 本機SQLite權威服務；每個指令同結算喺同一交易內，重啟保留戰報／去重收據。 */
export class OnlineService {
  readonly db: DatabaseSync;
  private now: () => number;
  private seed: () => number;
  constructor(options: { file: string; now?: () => number; seed?: () => number }) {
    this.now = options.now ?? Date.now;
    this.seed = options.seed ?? (() => randomBytes(4).readUInt32LE());
    this.db = new DatabaseSync(options.file);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS world (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL, present_until INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (account_id TEXT NOT NULL, request_id TEXT NOT NULL, input TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(account_id, request_id));`);
    this.db.prepare('INSERT OR IGNORE INTO world VALUES(1,?)').run(JSON.stringify(createOnlineFixture(this.now())));
    // 真正重啟後即結算已到期戰鬥，唔依賴任何玩家返嚟開頁。
    this.tick();
  }
  private hash(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private session(token: string): Session {
    const s = this.db.prepare('SELECT account_id,expires_at,present_until FROM sessions WHERE hash=?').get(this.hash(token)) as Session | undefined;
    if (!s || s.expires_at <= this.now()) throw new OnlineError(401, '試玩身份已失效，請重新選擇角色。');
    return s;
  }
  private transaction<T>(fn: (world: OnlineWorld, now: number) => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT payload FROM world WHERE id=1').get() as { payload: string };
      const world: OnlineWorld = JSON.parse(row.payload);
      if (world.version !== 1) throw new Error('不支援的原型資料版本');
      const now = this.now(); settleOnlineWorld(world, now);
      const result = fn(world, now); world.revision++;
      this.db.prepare('UPDATE world SET payload=? WHERE id=1').run(JSON.stringify(world));
      this.db.exec('COMMIT'); return result;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  private presence(world: OnlineWorld, id: OnlineAccountId, now: number) {
    const row = this.db.prepare('SELECT MAX(present_until) AS until FROM sessions WHERE account_id=? AND expires_at>?').get(id, now) as { until: number | null };
    world.players[id].onlineUntil = row.until ?? now;
  }
  private snapshot(world: OnlineWorld, id: OnlineAccountId, now: number): OnlineSnapshot {
    return structuredClone({ serverNow: now, revision: world.revision + 1, me: world.players[id],
      peers: Object.values(world.players).map(p => ({ id: p.id, name: p.character.name,
        rank: p.rank, online: p.onlineUntil > now, protectedUntil: p.protectedUntil, busy: p.busy })),
      battles: world.battles.filter(b => b.attacker === id || b.defender === id).slice(-10).reverse(),
      confirmedRequests: (this.db.prepare('SELECT request_id FROM receipts WHERE account_id=? ORDER BY rowid DESC LIMIT 20').all(id) as { request_id: string }[]).map(row => row.request_id),
      params: { protectionMs: ONLINE_TEST.protectionMs, onlineSilverPerMinute: ONLINE_TEST.onlineSilverPerMinute,
        offlineSilverPerMinute: ONLINE_TEST.offlineSilverPerMinute, offlineCapMs: ONLINE_TEST.offlineCapMs },
    });
  }
  /** 只供本機原型選擇兩個測試帳戶，唔係正式註冊／登入。 */
  login(input: unknown) {
    const { account } = z.object({ account: accountSchema }).strict().parse(input);
    const token = randomBytes(32).toString('hex');
    const snapshot = this.transaction((world, now) => {
      const p = world.players[account];
      if (p.onlineUntil <= now) p.offlineAccruedMs = 0;
      this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(this.hash(token), account, now + ONLINE_TEST.sessionMs, now + ONLINE_TEST.presenceLeaseMs);
      this.presence(world, account, now);
      return this.snapshot(world, account, now);
    });
    return { token, snapshot };
  }
  /** 讀取唔續在線租約，觀察離線對手唔會幫佢重設離線收益上限。 */
  world(token: string) {
    const s = this.session(token);
    return this.transaction((world, now) => this.snapshot(world, s.account_id, now));
  }
  /** 心跳只更新本session；多開頁時，一個頁離場唔會錯誤將其他頁判離線。 */
  heartbeat(token: string) {
    const s = this.session(token);
    return this.transaction((world, now) => {
      if (world.players[s.account_id].onlineUntil <= now) world.players[s.account_id].offlineAccruedMs = 0;
      this.db.prepare('UPDATE sessions SET present_until=? WHERE hash=?').run(now + ONLINE_TEST.presenceLeaseMs, this.hash(token));
      this.presence(world, s.account_id, now);
      return this.snapshot(world, s.account_id, now);
    });
  }
  /** 明確離場／正常關頁即轉離線，突斷線由租約到期判定。 */
  leave(token: string, logout = false) {
    const s = this.session(token);
    return this.transaction((world, now) => {
      if (logout) this.db.prepare('DELETE FROM sessions WHERE hash=?').run(this.hash(token));
      else this.db.prepare('UPDATE sessions SET present_until=? WHERE hash=?').run(now, this.hash(token));
      this.presence(world, s.account_id, now);
      return { ok: true };
    });
  }
  private command<T>(token: string, input: { requestId: string }, kind: string, fn: (world: OnlineWorld, now: number, id: OnlineAccountId) => T): T {
    const s = this.session(token), key = JSON.stringify({ kind, ...input });
    return this.transaction((world, now) => {
      const receipt = this.db.prepare('SELECT input,result FROM receipts WHERE account_id=? AND request_id=?').get(s.account_id, input.requestId) as { input: string; result: string } | undefined;
      if (receipt) {
        if (receipt.input !== key) throw new OnlineError(409, '同一指令編號不可變更內容。');
        return JSON.parse(receipt.result) as T;
      }
      const result = fn(world, now, s.account_id);
      this.db.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run(s.account_id, input.requestId, key, JSON.stringify(result));
      return result;
    });
  }
  /** 戰鬥一次產生並鎖雙方；無人在線亦會由tick按伺服器時間結算。 */
  challenge(token: string, raw: unknown) {
    const input = parseOnlineCommand('challenge', raw);
    return this.command(token, input, 'challenge', (world, now, id) =>
      applyOnlineCommand(world, now, id, 'challenge', input, { seed: this.seed(), battleId: randomUUID() })) as { battleId: string };
  }
  /** 同一領取請求跨重啟亦只入帳一次，舊存檔銀兩完全獨立。 */
  claim(token: string, raw: unknown) {
    const input = parseOnlineCommand('claim', raw);
    return this.command(token, input, 'claim', (world, now, id) =>
      applyOnlineCommand(world, now, id, 'claim', input, { seed: this.seed(), battleId: randomUUID() })) as { online: number; offline: number; total: number };
  }
  /** 只能裝備伺服器已知武學；五外功、一內功、一身法，戰鬥期間不可改快照。 */
  loadout(token: string, raw: unknown) {
    const input = parseOnlineCommand('loadout', raw);
    return this.command(token, input, 'loadout', (world, now, id) =>
      applyOnlineCommand(world, now, id, 'loadout', input, { seed: this.seed(), battleId: randomUUID() })) as { ok: boolean };
  }
  /** 由常駐服務呼叫，唔需要瀏覽器觸發。 */
  tick() {
    const row = this.db.prepare('SELECT payload FROM world WHERE id=1').get() as { payload: string };
    const world: OnlineWorld = JSON.parse(row.payload);
    if (world.battles.some(b => b.settledAt === null && b.endsAt <= this.now())) this.transaction(() => undefined);
  }
  close() { this.db.close(); }
}
