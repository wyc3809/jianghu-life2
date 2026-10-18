/**
 * 外功招式編排表（第 25 項，第一批 8 套樣板）。
 * 每套按功夫名設計自己嘅動作（唔係換色）：主角／敵人位移、命中節奏、特效同鏡頭都唔同。
 * 同一套外功七卷共用一套（玩家 2026-10-14）。
 * 冇編排嘅外功照用演武台原本揮擊。
 */
import type { ArtChoreo, ChoreoEvent, FxSpawn } from './choreo';
import { canonicalSkillId } from '@data/skills/catalog';

const fx = (t: number, spawn: FxSpawn): ChoreoEvent => ({ t, kind: 'fx', fx: spawn });
const hit = (t: number, share: number, heavy = false): ChoreoEvent => ({ t, kind: 'hit', share, heavy });
const screen = (t: number, effect: 'shake' | 'flash' | 'darken' | 'hitstop' | 'slow', amount: number, dur?: number): ChoreoEvent => ({
  t,
  kind: 'screen',
  effect,
  amount,
  dur,
});
const after = (t: number, on: boolean): ChoreoEvent => ({ t, kind: 'afterimage', on });

/** 長河拳：一浪接一浪嘅三下崩拳，最後一拳巨浪拍岸 */
const RIVER_FIST: ArtChoreo = {
  artId: 'art_river_fist',
  motif: '三下崩拳一浪推一浪，敵人被逐步推後，最後巨浪拍岸、水花四濺',
  motion: 'surge-triple',
  dur: 1.15,
  hero: [
    { t: 0.12, x: -0.08, sy: 0.93, pose: 'windup', ease: 'out' },
    { t: 0.22, x: 0, g: 0.8, sy: 1, sx: 1.06, pose: 'strike', ease: 'in' },
    { t: 0.32, g: 0.55, sx: 1, pose: 'windup', ease: 'out' },
    { t: 0.42, g: 0.9, sx: 1.06, pose: 'strike', ease: 'in' },
    { t: 0.52, g: 0.6, sx: 1, pose: 'windup', ease: 'out' },
    { t: 0.66, g: 1.05, sx: 1.12, sy: 0.96, pose: 'strike', ease: 'in' },
    { t: 0.9, g: 0.9, sx: 1, sy: 1, ease: 'out' },
    { t: 1.15, g: 0, pose: 'idle', ease: 'inOut' },
  ],
  foe: [
    { t: 0.24, x: 0 },
    { t: 0.3, x: 0.12, rot: 6, ease: 'out' },
    { t: 0.44, x: 0.12 },
    { t: 0.5, x: 0.25, rot: 8, ease: 'out' },
    { t: 0.68, x: 0.25 },
    { t: 0.76, x: 0.5, rot: 14, sy: 0.94, ease: 'out' },
    { t: 1.08, x: 0, rot: 0, sy: 1, ease: 'inOut' },
  ],
  events: [
    fx(0.2, { sprite: 'wave', at: 'heroHand', to: 'foe', life: 0.22, size: 0.42, sizeEnd: 0.7, blend: 'multiply', alpha: 0.85 }),
    hit(0.24, 0.25),
    screen(0.24, 'shake', 3),
    fx(0.4, { sprite: 'wave', at: 'heroHand', to: 'foe', life: 0.22, size: 0.5, sizeEnd: 0.8, blend: 'multiply', alpha: 0.9 }),
    hit(0.44, 0.25),
    screen(0.44, 'shake', 4),
    fx(0.64, { sprite: 'wave-big', at: 'foe', dx: -0.15, life: 0.5, size: 0.7, sizeEnd: 1.4, blend: 'multiply' }),
    hit(0.68, 0.5, true),
    screen(0.68, 'shake', 8),
    screen(0.68, 'hitstop', 0.07),
    fx(0.68, { sprite: 'droplet', at: 'foe', count: 16, spread: 0.25, vx: 2.4, vy: 2.2, vSpread: 2, gravity: 9, life: 0.65, size: 0.07, blend: 'multiply' }),
  ],
};

/** 裂石殘掌：蹲身躍起一掌拍地，地裂一路伸去敵人腳下，碎石爆起將敵人拋起 */
const STONE_PALM: ArtChoreo = {
  artId: 'art_stone_palm',
  motif: '躍起一掌拍落地面，地裂伸到敵人腳下，碎石沖天將敵人拋起再跌落',
  motion: 'leap-ground-slam',
  dur: 1.25,
  hero: [
    { t: 0.18, x: -0.05, sy: 0.82, pose: 'windup', ease: 'out' },
    { t: 0.36, y: 0.55, g: 0.35, sy: 1.05, rot: -8, ease: 'out' },
    { t: 0.5, y: 0, g: 0.45, sy: 0.86, rot: 10, pose: 'strike', ease: 'in' },
    { t: 0.62, sy: 0.92 },
    { t: 0.95, sy: 1, rot: 0, ease: 'out' },
    { t: 1.25, x: 0, g: 0, pose: 'idle', ease: 'inOut' },
  ],
  foe: [
    { t: 0.6, y: 0 },
    { t: 0.78, y: 0.45, x: 0.1, rot: -18, ease: 'out' },
    { t: 0.95, y: 0, rot: -6, ease: 'in' },
    { t: 1.0, sy: 0.9 },
    { t: 1.2, sy: 1, rot: 0, x: 0, ease: 'out' },
  ],
  events: [
    screen(0.5, 'shake', 11),
    screen(0.5, 'hitstop', 0.06),
    fx(0.5, { sprite: 'crack', at: 'heroGround', dx: 0.25, originX: 0, size: 1.7, stretch: 0.05, stretchEnd: 1, life: 0.75, layer: 'back', blend: 'multiply', fadeIn: 0.02 }),
    fx(0.5, { sprite: 'dust', at: 'heroGround', dx: 0.3, count: 2, spread: 0.2, vy: 0.3, life: 0.5, size: 0.45, sizeEnd: 0.8, alpha: 0.55, blend: 'multiply' }),
    fx(0.58, { sprite: 'rock', at: 'foeGround', count: 9, spread: 0.25, vx: 0.3, vy: 3.3, vSpread: 1.2, gravity: 10, life: 0.85, size: 0.13, rotSpread: 180, spin: 420 }),
    fx(0.58, { sprite: 'dust', at: 'foeGround', count: 3, spread: 0.3, vy: 0.4, life: 0.65, size: 0.5, sizeEnd: 0.95, alpha: 0.6, blend: 'multiply' }),
    hit(0.6, 1, true),
    screen(0.6, 'shake', 9),
  ],
};

/** 聽雨劍意：靜立聽雨，雨絲落下；忽然閃現三刺，每刺挑破一滴雨 */
const RAIN_SWORD: ArtChoreo = {
  artId: 'art_rain_sword',
  motif: '先靜立聽雨、天色轉暗，雨絲落下；閃現敵前連刺三劍，每劍刺破一滴雨珠，再閃返原位',
  motion: 'still-blink-thrusts',
  dur: 1.35,
  hero: [
    { t: 0.05, pose: 'idle' },
    { t: 0.42, sy: 0.98 },
    { t: 0.46, alpha: 0, ease: 'in' },
    { t: 0.48, g: 0.95, alpha: 0, ease: 'step' },
    { t: 0.52, alpha: 1, sy: 1, pose: 'strike', ease: 'out' },
    { t: 0.6, g: 1.02 },
    { t: 0.64, g: 0.92 },
    { t: 0.72, g: 1.03 },
    { t: 0.76, g: 0.93 },
    { t: 0.84, g: 1.04 },
    { t: 1.0, g: 0.95 },
    { t: 1.06, alpha: 0 },
    { t: 1.1, g: 0, alpha: 0, pose: 'idle', ease: 'step' },
    { t: 1.25, alpha: 1 },
  ],
  foe: [
    { t: 0.56, x: 0 },
    { t: 0.6, x: 0.06, ease: 'out' },
    { t: 0.68, x: 0.02 },
    { t: 0.72, x: 0.09, ease: 'out' },
    { t: 0.8, x: 0.04 },
    { t: 0.85, x: 0.15, rot: 6, ease: 'out' },
    { t: 1.2, x: 0, rot: 0, ease: 'inOut' },
  ],
  events: [
    screen(0.02, 'darken', 0.3, 0.9),
    fx(0.04, { sprite: 'rain', at: 'sky', count: 26, spread: 1.5, stagger: 0.016, vy: -7, life: 0.5, size: 0.05, rot: 10, blend: 'multiply', alpha: 0.75 }),
    fx(0.28, { sprite: 'drop', at: 'foe', dy: 0.2, count: 3, spread: 0.3, life: 0.55, size: 0.08, alpha: 0.9 }),
    after(0.48, true),
    fx(0.56, { sprite: 'thrust', at: 'foe', dx: -0.25, size: 0.95, life: 0.12, blend: 'screen' }),
    fx(0.58, { sprite: 'droplet', at: 'foe', count: 6, spread: 0.1, vx: 1.6, vy: 1, vSpread: 1.4, gravity: 6, life: 0.35, size: 0.05, blend: 'multiply' }),
    hit(0.58, 0.33),
    screen(0.58, 'flash', 0.4),
    fx(0.68, { sprite: 'thrust', at: 'foe', dx: -0.25, dy: 0.12, size: 0.95, rot: -6, life: 0.12, blend: 'screen' }),
    fx(0.7, { sprite: 'droplet', at: 'foe', dy: 0.12, count: 6, spread: 0.1, vx: 1.6, vy: 1, vSpread: 1.4, gravity: 6, life: 0.35, size: 0.05, blend: 'multiply' }),
    hit(0.7, 0.33),
    fx(0.8, { sprite: 'thrust', at: 'foe', dx: -0.25, dy: -0.1, size: 1.05, rot: 5, life: 0.14, blend: 'screen' }),
    fx(0.82, { sprite: 'droplet', at: 'foe', dy: -0.1, count: 9, spread: 0.1, vx: 1.8, vy: 1.2, vSpread: 1.6, gravity: 6, life: 0.4, size: 0.055, blend: 'multiply' }),
    hit(0.82, 0.34),
    after(1.0, false),
  ],
};

/** 驚雷刀：躍上半空、烏雲壓頂，一道驚雷劈落嗰刻借雷勢俯衝直劈 */
const THUNDER_BLADE: ArtChoreo = {
  artId: 'art_thunder_blade',
  motif: '躍上半空、烏雲壓頂天色轉暗，驚雷劈落嗰刻俯衝直劈，白光一閃，地面留焦痕',
  motion: 'sky-dive-lightning',
  dur: 1.4,
  hero: [
    { t: 0.15, sy: 0.84, pose: 'windup', ease: 'out' },
    { t: 0.38, y: 1.5, g: 0.45, sy: 1.05, rot: -10, ease: 'out' },
    { t: 0.58, y: 1.6, g: 0.55, rot: -18 },
    { t: 0.66, y: 0, g: 0.9, rot: 12, sy: 0.9, pose: 'strike', ease: 'in' },
    { t: 0.8, sy: 1, rot: 4 },
    { t: 1.1, rot: 0, ease: 'out' },
    { t: 1.4, y: 0, g: 0, pose: 'idle', ease: 'inOut' },
  ],
  foe: [
    { t: 0.66, sy: 1 },
    { t: 0.71, sy: 0.8, x: 0.08, ease: 'out' },
    { t: 0.84, sy: 1.04 },
    { t: 1.0, sy: 1, x: 0 },
  ],
  events: [
    screen(0.25, 'darken', 0.55, 0.55),
    fx(0.28, { sprite: 'storm', at: 'sky', dx: 0.1, size: 2, life: 0.95, alpha: 0.85, blend: 'multiply', fadeIn: 0.3 }),
    after(0.6, true),
    fx(0.65, { sprite: 'lightning', at: 'foe', dy: 1.05, size: 0.75, life: 0.22, blend: 'screen', fadeIn: 0.01 }),
    screen(0.66, 'flash', 1),
    screen(0.66, 'shake', 13),
    screen(0.66, 'hitstop', 0.1),
    hit(0.68, 1, true),
    fx(0.68, { sprite: 'spark', at: 'foe', count: 12, spread: 0.1, vy: 1, vSpread: 3, gravity: 3, life: 0.38, size: 0.08, blend: 'screen' }),
    fx(0.68, { sprite: 'scorch', at: 'foeGround', size: 1, life: 1.0, layer: 'back', blend: 'multiply', alpha: 0.7, fadeIn: 0.02 }),
    after(0.72, false),
  ],
};

/** 穿雲槍：後撤蓄勢，一槍連人貫穿衝到敵後，沿路雲霧爆開 */
const SPEAR_CLOUD: ArtChoreo = {
  artId: 'art_spear_cloud',
  motif: '後撤聚氣，一槍貫穿敵人、整個人衝到敵後，槍芒拖長，沿路雲團爆開、敵身現雲洞，慢鏡',
  motion: 'pierce-through-dash',
  dur: 1.4,
  hero: [
    { t: 0.12, x: -0.35, rot: -8, sy: 0.96, pose: 'windup', ease: 'out' },
    { t: 0.42, x: -0.42, rot: -10 },
    { t: 0.52, x: 0.9, g: 1, rot: 6, sx: 1.15, sy: 1, pose: 'strike', ease: 'in' },
    { t: 0.62, sx: 1, rot: 0, ease: 'out' },
    { t: 0.95, x: 0.9, g: 1 },
    { t: 1.1, y: 0.3, ease: 'out' },
    { t: 1.3, x: 0, g: 0, y: 0, pose: 'idle', ease: 'inOut' },
  ],
  foe: [
    { t: 0.48, rot: 0 },
    { t: 0.53, rot: 12, x: 0.12, ease: 'out' },
    { t: 0.75, rot: 4 },
    { t: 1.15, rot: 0, x: 0, ease: 'inOut' },
  ],
  events: [
    fx(0.1, { sprite: 'qi', at: 'heroHand', size: 0.55, sizeEnd: 0.1, life: 0.3, blend: 'multiply', alpha: 0.7 }),
    fx(0.22, { sprite: 'qi', at: 'heroHand', size: 0.55, sizeEnd: 0.1, life: 0.3, blend: 'multiply', alpha: 0.8 }),
    fx(0.34, { sprite: 'qi', at: 'heroHand', size: 0.6, sizeEnd: 0.1, life: 0.3, blend: 'multiply', alpha: 0.9 }),
    after(0.44, true),
    screen(0.47, 'slow', 0.35, 0.2),
    fx(0.47, { sprite: 'streak', at: 'heroHand', dx: -0.2, originX: 0, size: 3.1, stretch: 0.1, stretchEnd: 1, life: 0.38, blend: 'multiply' }),
    fx(0.5, { sprite: 'cloud', at: 'between', count: 5, spread: 0.9, stagger: 0.03, vy: 0.2, life: 0.65, size: 0.42, sizeEnd: 0.9, alpha: 0.75 }),
    fx(0.5, { sprite: 'cloud-ring', at: 'foe', size: 0.4, sizeEnd: 1.3, life: 0.5, alpha: 0.85 }),
    hit(0.5, 1, true),
    screen(0.5, 'shake', 6),
    after(0.62, false),
  ],
};

/** 唐門飛針：後跳一個轉身，三輪扇形飛針劃弧落喺敵人身上，針尾閃光、毒霧散開 */
const FLYING_NEEDLE: ArtChoreo = {
  artId: 'tm_flying_needle',
  motif: '後跳拉開距離、原地轉身，三輪扇形飛針劃弧射落敵人，針插入閃光，最後毒霧散開',
  motion: 'hop-back-spin-throw',
  dur: 1.35,
  hero: [
    { t: 0.14, x: -0.3, y: 0.3, pose: 'windup', ease: 'out' },
    { t: 0.26, x: -0.55, y: 0, ease: 'in' },
    { t: 0.3, sy: 0.9 },
    { t: 0.5, rot: 360, sy: 1, pose: 'strike', ease: 'inOut' },
    { t: 0.51, rot: 0, ease: 'step' },
    { t: 0.9, pose: 'idle' },
    { t: 1.2, x: 0, y: 0, ease: 'inOut' },
  ],
  foe: [
    { t: 0.62, x: 0 },
    { t: 0.64, x: 0.04 },
    { t: 0.67, x: 0 },
    { t: 0.71, x: 0.05 },
    { t: 0.74, x: 0 },
    { t: 0.79, x: 0.08, rot: 4 },
    { t: 1.1, x: 0, rot: 0 },
  ],
  events: [
    after(0.3, true),
    fx(0.42, { sprite: 'needle', at: 'heroHand', to: 'foe', arc: 0.35, count: 5, spread: 0.18, stagger: 0.012, life: 0.2, size: 0.22, faceVel: true }),
    fx(0.5, { sprite: 'needle', at: 'heroHand', to: 'foe', arc: 0.5, count: 5, spread: 0.22, stagger: 0.012, life: 0.2, size: 0.22, faceVel: true }),
    after(0.5, false),
    fx(0.58, { sprite: 'needle', at: 'heroHand', to: 'foe', arc: 0.25, count: 6, spread: 0.26, stagger: 0.012, life: 0.2, size: 0.22, faceVel: true }),
    hit(0.62, 0.33),
    fx(0.62, { sprite: 'glint', at: 'foe', count: 3, spread: 0.3, life: 0.3, size: 0.16, sizeEnd: 0.05, blend: 'screen' }),
    hit(0.7, 0.33),
    fx(0.7, { sprite: 'glint', at: 'foe', count: 3, spread: 0.3, life: 0.3, size: 0.16, sizeEnd: 0.05, blend: 'screen' }),
    hit(0.78, 0.34),
    fx(0.78, { sprite: 'glint', at: 'foe', count: 4, spread: 0.35, life: 0.32, size: 0.18, sizeEnd: 0.05, blend: 'screen' }),
    fx(0.8, { sprite: 'poison', at: 'foe', size: 0.6, sizeEnd: 1.15, life: 0.8, alpha: 0.5, blend: 'multiply' }),
  ],
};

/** 追風腿：帶風衝前，挑腿踢起敵人，半空迴旋一踢，再一腳下劈砸返落地 */
const WIND_CHASE: ArtChoreo = {
  artId: 'art_wind_chase',
  motif: '帶住風痕衝前，挑腿將敵人踢上半空，追上去迴旋一踢，最後一腳下劈將敵人砸返落地',
  motion: 'aerial-juggle-kicks',
  dur: 1.45,
  hero: [
    { t: 0.08, pose: 'walk' },
    { t: 0.26, g: 0.9, sx: 1.08, pose: 'walk', ease: 'in' },
    { t: 0.36, y: 0.35, rot: -22, sx: 1, pose: 'strike', ease: 'out' },
    { t: 0.62, y: 1.1, rot: -382, ease: 'inOut' },
    { t: 0.63, rot: -22, ease: 'step' },
    { t: 0.78, y: 0.2, g: 1, rot: 18, pose: 'strike', ease: 'in' },
    { t: 0.95, y: 0, rot: 0, ease: 'out' },
    { t: 1.45, g: 0, pose: 'idle', ease: 'inOut' },
  ],
  foe: [
    { t: 0.36, y: 0 },
    { t: 0.55, y: 0.95, x: 0.1, rot: -25, ease: 'out' },
    { t: 0.66, y: 1.15, rot: -60 },
    { t: 0.8, y: 0, rot: -10, sy: 0.85, ease: 'in' },
    { t: 0.95, sy: 1 },
    { t: 1.3, rot: 0, x: 0, ease: 'out' },
  ],
  events: [
    after(0.1, true),
    fx(0.1, { sprite: 'wind', at: 'hero', dx: -0.2, count: 3, stagger: 0.05, vx: -1, life: 0.32, size: 0.55, alpha: 0.6, blend: 'multiply' }),
    after(0.3, false),
    hit(0.37, 0.3),
    fx(0.37, { sprite: 'wind', at: 'foe', dy: -0.2, size: 0.65, rot: -60, life: 0.26, blend: 'multiply' }),
    after(0.5, true),
    fx(0.55, { sprite: 'wind-ring', at: 'foeTop', size: 0.45, sizeEnd: 1.1, life: 0.3, blend: 'multiply', alpha: 0.8 }),
    hit(0.6, 0.3),
    after(0.65, false),
    hit(0.79, 0.4, true),
    screen(0.8, 'shake', 10),
    screen(0.79, 'hitstop', 0.07),
    fx(0.8, { sprite: 'dust', at: 'foeGround', count: 4, spread: 0.4, vy: 0.5, life: 0.6, size: 0.5, sizeEnd: 1, alpha: 0.6, blend: 'multiply' }),
  ],
};

/** 珍瓏棋局：原地抬手佈局，敵人腳下現出棋盤，黑白子逐粒落盤，棋局一成發光困住敵人 */
const WEIQI_TRAP: ArtChoreo = {
  artId: 'art_weiqi_trap',
  motif: '退半步抬手佈局，敵人腳下浮現棋盤，黑白子一粒粒落盤圍住敵人，棋局一成金光一閃將敵人鎮住',
  motion: 'stationary-cast-trap',
  dur: 1.55,
  hero: [
    { t: 0.15, x: -0.2, pose: 'idle', ease: 'out' },
    { t: 0.3, sy: 1.04, pose: 'windup', ease: 'out' },
    { t: 0.85, sy: 1.04 },
    { t: 0.95, sy: 1, pose: 'strike', ease: 'out' },
    { t: 1.3, pose: 'idle' },
    { t: 1.55, x: 0, ease: 'inOut' },
  ],
  foe: [
    { t: 0.9, sy: 1 },
    { t: 0.96, sy: 0.88, ease: 'out' },
    { t: 1.3, sy: 0.9 },
    { t: 1.45, sy: 1, ease: 'out' },
  ],
  events: [
    screen(0.28, 'darken', 0.22, 0.9),
    fx(0.25, { sprite: 'board', at: 'foeGround', size: 2, life: 1.25, alpha: 0.85, layer: 'back', fadeIn: 0.25, blend: 'multiply' }),
    ...[
      [0.4, 'stone-black', -0.6, 0.06],
      [0.48, 'stone-white', 0.55, -0.04],
      [0.56, 'stone-black', -0.25, -0.08],
      [0.64, 'stone-white', 0.3, 0.08],
      [0.72, 'stone-black', -0.75, -0.02],
      [0.8, 'stone-white', 0.72, 0.04],
    ].map(([t, sprite, dx, dy]) =>
      fx(t as number, {
        sprite: sprite as 'stone-black' | 'stone-white',
        at: 'foeGround',
        dx: dx as number,
        dy: (dy as number) + 0.9,
        floorDy: dy as number,
        vy: -9,
        life: 1.35 - (t as number),
        size: 0.17,
        layer: 'back',
        fadeIn: 0.05,
      } as FxSpawn),
    ),
    fx(0.88, { sprite: 'board-glow', at: 'foeGround', size: 2, life: 0.45, blend: 'screen', fadeIn: 0.05, layer: 'back' }),
    screen(0.9, 'flash', 0.5),
    hit(0.92, 1, true),
  ],
};

export const ART_CHOREOS: readonly ArtChoreo[] = [
  RIVER_FIST,
  STONE_PALM,
  RAIN_SWORD,
  THUNDER_BLADE,
  SPEAR_CLOUD,
  FLYING_NEEDLE,
  WIND_CHASE,
  WEIQI_TRAP,
];

const BY_ART = new Map(ART_CHOREOS.map((c) => [c.artId, c]));

/** 外功 id → 招式編排；未有就 null（照用原本揮擊） */
export function choreoForArt(artId: string | null | undefined): ArtChoreo | null {
  return artId ? (BY_ART.get(canonicalSkillId(artId)) ?? null) : null;
}
