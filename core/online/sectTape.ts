import type {
  SectBattleReplay,
  SectBattleFigure,
} from "@interfaces/sectBattle";
import type { SectReplayTape } from "@interfaces/sectTape";
const POSES = ["idle", "walk", "attack", "hurt", "down"] as const;
const poseByte = (u: SectBattleFigure) =>
  POSES.indexOf(u.pose) | (u.face < 0 ? 16 : 0);
const coordinate = (n: number) => Math.round(n * 64);
function checksum(bytes: Uint8Array): string {
  let h = 2166136261;
  for (const value of bytes) {
    h ^= value;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function toBase64(bytes: Uint8Array): string {
  let value = "";
  for (let i = 0; i < bytes.length; i += 24000)
    value += String.fromCharCode(...bytes.subarray(i, i + 24000));
  return btoa(value);
}
/** 每50ms只保存改變欄位；氣血／內力保留Float64原值，位置量化僅用於畫面。 */
export function packSectReplay(replay: SectBattleReplay): SectReplayTape {
  const first = replay.frames[0];
  if (!first || first.figures.length !== 20)
    throw new Error("會武時間軸人物不完整。");
  const bytes = new Uint8Array(replay.frames.length * 20 * 26),
    view = new DataView(bytes.buffer),
    arts = [
      ...new Set(replay.frames.flatMap((f) => f.figures.map((u) => u.artId))),
    ];
  let offset = 0;
  const ids = new Map(first.figures.map((u, i) => [u.id, i]));
  let previous = first.figures;
  const u16 = (n: number) => {
      view.setUint16(offset, n, true);
      offset += 2;
    },
    f64 = (n: number) => {
      view.setFloat64(offset, n, true);
      offset += 8;
    };
  for (const frame of replay.frames) {
    frame.figures.forEach((u, i) => {
      const p = previous[i];
      let mask = 0;
      if (coordinate(u.x) !== coordinate(p.x)) mask |= 1;
      if (coordinate(u.y) !== coordinate(p.y)) mask |= 2;
      if (u.hp !== p.hp) mask |= 4;
      if (u.qi !== p.qi) mask |= 8;
      if (poseByte(u) !== poseByte(p) || u.poseAt !== p.poseAt) mask |= 16;
      if (u.artId !== p.artId) mask |= 32;
      if (u.target !== p.target) mask |= 64;
      bytes[offset++] = mask;
      if (mask & 1) u16(coordinate(u.x));
      if (mask & 2) u16(coordinate(u.y));
      if (mask & 4) f64(u.hp);
      if (mask & 8) f64(u.qi);
      if (mask & 16) {
        bytes[offset++] = poseByte(u);
        u16(Math.round(u.poseAt * 100));
      }
      if (mask & 32) bytes[offset++] = arts.indexOf(u.artId);
      if (mask & 64)
        bytes[offset++] = u.target === null ? 255 : (ids.get(u.target) ?? 255);
    });
    previous = frame.figures;
  }
  const data = bytes.subarray(0, offset);
  return {
    version: 1,
    frames: replay.frames.length,
    figures: structuredClone(first.figures),
    arts,
    data: toBase64(data),
    checksum: checksum(data),
    events: replay.events,
    duration: replay.duration,
    winner: replay.winner,
    remaining: replay.remaining,
    seed: replay.seed,
  };
}
/** 只解碼已保存的伺服器幀；不使用RNG、傷害公式、目標選擇或玩家存檔。 */
export function unpackSectReplay(tape: SectReplayTape): SectBattleReplay {
  if (
    tape.version !== 1 ||
    tape.frames < 1 ||
    tape.frames > 1801 ||
    tape.figures.length !== 20 ||
    tape.arts.length > 255
  )
    throw new Error("戰報時間軸版本不符。");
  const binary = atob(tape.data),
    bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  if (checksum(bytes) !== tape.checksum)
    throw new Error("戰報資料不完整，請重新載入。");
  const view = new DataView(bytes.buffer),
    frames: SectBattleReplay["frames"] = [];
  let offset = 0,
    previous = tape.figures;
  const u16 = () => {
      const n = view.getUint16(offset, true);
      offset += 2;
      return n;
    },
    f64 = () => {
      const n = view.getFloat64(offset, true);
      offset += 8;
      return n;
    };
  for (let frame = 0; frame < tape.frames; frame++) {
    const figures = previous.map((old) => {
      const u = { ...old },
        mask = bytes[offset++];
      if (mask & 1) u.x = u16() / 64;
      if (mask & 2) u.y = u16() / 64;
      if (mask & 4) u.hp = f64();
      if (mask & 8) u.qi = f64();
      if (mask & 16) {
        const value = bytes[offset++];
        u.pose = POSES[value & 15];
        u.face = value & 16 ? -1 : 1;
        u.poseAt = u16() / 100;
      }
      if (mask & 32) u.artId = tape.arts[bytes[offset++]];
      if (mask & 64) {
        const target = bytes[offset++];
        u.target = target === 255 ? null : (tape.figures[target]?.id ?? null);
      }
      if (!u.pose || !u.artId || !Number.isFinite(u.x + u.y + u.hp + u.qi))
        throw new Error("戰報人物資料不完整。");
      return u;
    });
    frames.push({ at: Number((frame * 0.05).toFixed(3)), figures });
    previous = figures;
  }
  if (offset !== bytes.length) throw new Error("戰報長度不符。");
  return {
    seed: tape.seed,
    duration: tape.duration,
    winner: tape.winner,
    remaining: tape.remaining,
    events: tape.events,
    frames,
  };
}
