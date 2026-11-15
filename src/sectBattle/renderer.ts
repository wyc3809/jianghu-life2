import type {
  SectBattleFigure,
  SectBattleReplay,
} from "@interfaces/sectBattle";
import type { WarAssets, WarPose } from "./assets";
import { drawWarSilhouette } from "./character";
import { getSkillDef } from "@data/skills/catalog";
export interface WarHitbox {
  id: string;
  x: number;
  y: number;
  radius: number;
}
const COLOURS = ["#3e6660", "#a23d31"];
function lowerBound(events: { at: number }[], at: number): number {
  let lo = 0,
    hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].at < at) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
/** 直版水彩單線會武：原斗笠黑影完整位圖、固定比例、局部墨擊及可選人物；不讀寫戰果。 */
export class WarRenderer {
  private width = 390;
  private height = 480;
  private dpr = 1;
  private last = -1;
  private figures: SectBattleFigure[] = [];
  hitboxes: WarHitbox[] = [];
  constructor(
    private canvas: HTMLCanvasElement,
    private assets: WarAssets,
  ) {}
  resize(): void {
    const b = this.canvas.getBoundingClientRect();
    this.width = b.width;
    this.height = b.height;
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(b.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(b.height * this.dpr));
  }
  private point(u: SectBattleFigure) {
    const size=this.figureSize(),top=size+Math.min(42,this.height*.08)+8,bottom=this.height-22;
    return {x:26+(u.x/1000)*(this.width-52),y:top+((u.rank-1)%5)*(bottom-top)/4};
  }
  private figureSize(){return Math.min(76,Math.max(45,this.width*.16),(this.height-28)/6.2);}
  private pose(
    u: SectBattleFigure,
    seconds: number,
    reduced: boolean,
    flight = 0,
  ): { frame: WarPose; lift: number } {
    const elapsed = Math.max(0, seconds - u.poseAt),
      phase = elapsed % 0.57;
    if (u.pose === "down") return { frame: "down", lift: 0 };
    if (!reduced && flight > 0)
      return {
        frame: "jump",
        lift:
          flight *
          Math.min(42,this.height*.08),
      };
    if (u.pose === "hurt") return { frame: "hurt", lift: 0 };
    if (u.pose === "attack") {
      const frame: WarPose = reduced
        ? "strikeA"
        : phase < 0.13
          ? "windup"
          : phase < 0.34
            ? u.rank % 2
              ? "strikeA"
              : "strikeB"
            : phase < 0.46
              ? u.rank % 2
                ? "followA"
                : "followB"
              : "idle";
      return { frame, lift: 0 };
    }
    if (u.pose === "walk" && !reduced)
      return {
        frame: Math.floor(seconds * 8 + u.rank) % 2 ? "walkA" : "walkB",
        lift: 0,
      };
    return { frame: u.rank % 3 === 2 ? "guard" : "idle", lift: 0 };
  }
  draw(
    replay: SectBattleReplay | null,
    formation: SectBattleFigure[],
    seconds: number,
    selected: string | null,
    reduced = false,
  ): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (replay) {
      const index = Math.min(
          replay.frames.length - 1,
          Math.max(0, Math.floor(seconds / 0.05)),
        ),
        f = replay.frames[index],
        n = replay.frames[Math.min(replay.frames.length - 1, index + 1)],
        mix = reduced ? 0 : Math.max(0, Math.min(1, (seconds - f.at) / 0.05));
      // 五列舞台投影保留同列先後及部分真位移；不改模擬座標、命中或戰報。
      const spread=(list:SectBattleFigure[])=>{
        const result=new Map<string,number>();
        for(let lane=0;lane<5;lane++){
          const row=list.filter(u=>(u.rank-1)%5===lane).sort((a,b)=>a.x-b.x||a.id.localeCompare(b.id));
          row.forEach((u,i)=>{const slot=row.length===1?500:48+i/(row.length-1)*904;result.set(u.id,u.x*.4+slot*.6);});
        }
        return result;
      };
      const a = spread(f.figures),
        b = spread(n.figures);
      this.figures = f.figures.map((u, i) => {
        const first = a.get(u.id) ?? u.x,
          last = b.get(u.id) ?? first;
        return {
          ...u,
          x: first + (last - first) * mix,
          face: n.figures[i].face,
        };
      });
    } else this.figures = formation;
    const flight = new Map<string, number>();
    if (replay && !reduced) {
      for (const e of replay.events.slice(
        lowerBound(replay.events, seconds - 0.58),
        lowerBound(replay.events, seconds + 0.42),
      )) {
        const u = this.figures.find((v) => v.id === e.actor);
        if (u && u.rank % 2 === 0 && e.vol === 7 && !e.splash) {
          const t = (seconds - e.at + 0.42) / 1.0;
          if (t >= 0 && t <= 1)
            flight.set(
              u.id,
              Math.max(flight.get(u.id) ?? 0, Math.sin(t * Math.PI)),
            );
        }
      }
    }
    const size = this.figureSize(),
      poses = new Map(
        this.figures.map((u) => [
          u.id,
          this.pose(u, seconds, reduced, flight.get(u.id) ?? 0),
        ]),
      );
    this.hitboxes = [];
    const order = [...this.figures].sort(
      (a, b) =>
        Number(a.id === selected) - Number(b.id === selected) ||
        poses.get(b.id)!.lift - poses.get(a.id)!.lift ||
        this.point(a).y-this.point(b).y || b.rank - a.rank,
    );
    for (const u of order) {
      const p = this.point(u),
        pose = poses.get(u.id)!,
        alive = u.hp > 0,
        weaponKind = getSkillDef(u.artId)?.weaponKind,
        family = weaponKind === "hidden" ? "needle" : (weaponKind ?? "fist");
      const shadow = this.assets.common.images.shadow;
      if (shadow) {
        ctx.globalAlpha = alive ? 0.23 : 0.1;
        ctx.drawImage(shadow, p.x - size * 0.24, p.y - 3, size * 0.48, 8);
        ctx.globalAlpha = 1;
      }
      if (u.id === selected && alive) {
        const ring = this.assets.common.images.ring;
        if (ring) {
          ctx.globalAlpha = 0.8;
          ctx.drawImage(ring, p.x - size * 0.24, p.y - 5, size * 0.48, 11);
          ctx.globalAlpha = 1;
        }
      }
      ctx.save();
      if (!alive) ctx.globalAlpha = 0.28;
      drawWarSilhouette(
        ctx,
        this.assets,
        pose.frame,
        p.x,
        p.y - pose.lift,
        size,
        u.face,
        family,
      );
      ctx.restore();
      ctx.save();ctx.fillStyle=COLOURS[u.side];ctx.font="10px 'Noto Serif TC',serif";ctx.textAlign='center';ctx.globalAlpha=alive?1:.45;
      const short=Array.from(u.name).slice(0,4).join('')+(Array.from(u.name).length>4?'…':'');ctx.fillText(`${u.rank}·${short}`,p.x,p.y+13,Math.min(78,this.width*.22));ctx.restore();
      if (alive)
        this.hitboxes.push({
          id: u.id,
          x: p.x,
          y: p.y - pose.lift - size * 0.65,
          radius: Math.max(23, size * 0.3),
        });
    }
    if (replay && !reduced) {
      const events = replay.events,
        start = lowerBound(events, seconds - 0.48),
        end = lowerBound(events, seconds + 0.0001),
        recent = events.slice(start, end).filter((e) => e.damage > 0);
      for (const e of recent.slice(-7)) {
        const u = this.figures.find((v) => v.id === e.target);
        if (!u) continue;
        const p = this.point(u),
          pose = poses.get(u.id)!,
          age = seconds - e.at,
          hitY = p.y - pose.lift - size * 0.63;
        if (age < 0.2) {
          const sprite = this.assets.images.impact;
          if (sprite) {
            ctx.save();
            ctx.globalAlpha = (1 - age / 0.2) * 0.44;
            ctx.translate(p.x, hitY);
            ctx.rotate(((u.rank % 3) - 1) * 0.45);
            ctx.drawImage(
              sprite,
              -size * 0.14,
              -size * 0.14,
              size * 0.28,
              size * 0.28,
            );
            ctx.restore();
          }
        }
      }
      const focused = recent
        .filter((e) => e.actor === selected || e.target === selected)
        .slice(-2);
      focused.forEach((e, i) => {
        const u = this.figures.find((v) => v.id === e.target);
        if (!u) return;
        const p = this.point(u),
          pose = poses.get(u.id)!,
          age = seconds - e.at,
          text = String(Math.round(e.damage)),
          x = Math.min(this.width - 20, Math.max(20, p.x + (i ? 14 : -10))),
          y = p.y - pose.lift - size * 0.88 - age * 25 - i * 13;
        ctx.save();
        ctx.globalAlpha = 1 - age / 0.48;
        ctx.font = "bold 15px serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f8f0df";
        ctx.strokeText(text, x, y);
        ctx.fillStyle = COLOURS[1 - u.side];
        ctx.fillText(text, x, y);
        ctx.restore();
      });
    }
    this.last = seconds;
  }
  /** 用於播放暫停與背景驗收，不影響時間軸。 */
  get renderedSeconds(): number {
    return this.last;
  }
}
