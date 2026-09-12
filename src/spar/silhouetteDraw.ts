/**
 * 純黑影人偶：唔靠彩色立繪濾鏡，直接用路徑砌出剪影。
 * 座標系：腳底為原點，y 向下為正；單位＝css px（呼叫端已乘好 k）。
 *
 * 設計高度約 400du（斗笠頂 → 腳底），袍身要夠闊先有水墨剪影可讀性。
 */

export type SilhouetteWeapon =
  | 'sword'
  | 'blade'
  | 'spear'
  | 'staff'
  | 'bow'
  | 'hidden'
  | 'whip'
  | 'fist';

export type SilhouetteEnemyArchetype =
  | 'shadow'
  | 'daoke'
  | 'qiangke'
  | 'toutuo'
  | 'laoweng'
  | 'nvcike'
  | 'qigai'
  | 'gouke'
  | 'suoyi'
  | 'tiemian'
  | 'chifa'
  | 'boss';

/** 剪影人偶設計高度（du）——引擎用嚟計 k，令角色佔舞台約七八成高 */
export const SILHOUETTE_DESIGN_H = 400;

const FILL = '#0b0b0d';
const STROKE = 'rgba(236, 230, 218, 0.78)';
const SASH = 'rgba(48, 110, 190, 0.95)';
const SASH_SOFT = 'rgba(48, 110, 190, 0.55)';

function strokeFill(ctx: CanvasRenderingContext2D, line = 1.35) {
  ctx.fillStyle = FILL;
  ctx.strokeStyle = STROKE;
  ctx.lineWidth = line;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fill();
  ctx.stroke();
}

/** 由敵人貼圖檔名推斷剪影原型 */
export function enemyArchetypeFromSrc(src: string): SilhouetteEnemyArchetype {
  const m = /enemy-([a-z0-9]+)/i.exec(src);
  const key = (m?.[1] ?? 'shadow').toLowerCase();
  if (key === 'shadow') return 'boss';
  if (
    key === 'daoke' ||
    key === 'qiangke' ||
    key === 'toutuo' ||
    key === 'laoweng' ||
    key === 'nvcike' ||
    key === 'qigai' ||
    key === 'gouke' ||
    key === 'suoyi' ||
    key === 'tiemian' ||
    key === 'chifa'
  ) {
    return key;
  }
  return 'shadow';
}

export function weaponFromKind(kind: string | null | undefined): SilhouetteWeapon {
  if (!kind) return 'fist';
  if (
    kind === 'sword' ||
    kind === 'blade' ||
    kind === 'spear' ||
    kind === 'staff' ||
    kind === 'bow' ||
    kind === 'hidden' ||
    kind === 'whip'
  ) {
    return kind;
  }
  return 'sword';
}

/**
 * 俠客剪影：闊斗笠＋豐滿長袍＋青帶＋持械臂。
 * 比例刻意加闊，避免線條人偶「睇唔見」。
 */
export function drawHeroSilhouette(
  ctx: CanvasRenderingContext2D,
  opts: {
    k: number;
    armRot: number;
    weaponRot: number;
    headRot: number;
    idleT: number;
    weapon: SilhouetteWeapon;
  },
) {
  const { k, armRot, weaponRot, headRot, idleT, weapon } = opts;
  const hem = Math.sin(idleT * 2.1) * 5 * k;
  const breath = Math.sin(idleT * 2.1) * 2 * k;

  // —— 袍身（闊擺）：約 140du 底寬，先有剪影量感 ——
  ctx.beginPath();
  ctx.moveTo(-48 * k, -6 * k);
  ctx.quadraticCurveTo(-78 * k - hem, -70 * k, -72 * k, -160 * k);
  ctx.quadraticCurveTo(-68 * k, -250 * k, -42 * k, -310 * k);
  ctx.quadraticCurveTo(-28 * k, -345 * k, -16 * k, -355 * k);
  ctx.lineTo(18 * k, -358 * k);
  ctx.quadraticCurveTo(36 * k, -345 * k, 48 * k, -310 * k);
  ctx.quadraticCurveTo(74 * k, -250 * k, 78 * k, -160 * k);
  ctx.quadraticCurveTo(84 * k + hem, -70 * k, 52 * k, -4 * k);
  ctx.quadraticCurveTo(8 * k, 6 * k, -48 * k, -6 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.2, 1.55 * k));

  // 內層衣紋
  ctx.beginPath();
  ctx.moveTo(-4 * k, -30 * k);
  ctx.quadraticCurveTo(10 * k, -150 * k, 2 * k, -300 * k);
  ctx.strokeStyle = 'rgba(236,230,218,0.4)';
  ctx.lineWidth = Math.max(1.0, 1.25 * k);
  ctx.stroke();

  // 左袖（靜態量感）
  ctx.beginPath();
  ctx.moveTo(-40 * k, -280 * k);
  ctx.quadraticCurveTo(-95 * k, -240 * k, -88 * k, -170 * k);
  ctx.quadraticCurveTo(-82 * k, -150 * k, -55 * k, -175 * k);
  ctx.quadraticCurveTo(-48 * k, -230 * k, -40 * k, -280 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.3 * k));

  // —— 頭／斗笠 ——
  ctx.save();
  ctx.translate(2 * k, -358 * k + breath);
  ctx.rotate((headRot * Math.PI) / 180);
  // 闊斗笠
  ctx.beginPath();
  ctx.ellipse(4 * k, -14 * k, 72 * k, 18 * k, 0, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.2, 1.45 * k));
  // 笠頂
  ctx.beginPath();
  ctx.moveTo(-16 * k, -14 * k);
  ctx.quadraticCurveTo(4 * k, -52 * k, 28 * k, -14 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.25 * k));
  // 臉／下顎
  ctx.beginPath();
  ctx.ellipse(6 * k, 10 * k, 18 * k, 20 * k, 0.08, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.0, 1.2 * k));
  ctx.restore();

  // —— 青帶（腰間垂落，剪影主色點） ——
  const sway = Math.sin(idleT * 2.5) * 10 * k + armRot * 0.06 * k;
  ctx.save();
  ctx.strokeStyle = SASH;
  ctx.lineWidth = Math.max(3.2, 4.2 * k);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8 * k, -210 * k);
  ctx.bezierCurveTo(28 * k + sway, -175 * k, 48 * k + sway * 1.2, -130 * k, 32 * k + sway * 0.4, -70 * k);
  ctx.stroke();
  ctx.strokeStyle = SASH_SOFT;
  ctx.lineWidth = Math.max(2.0, 2.6 * k);
  ctx.beginPath();
  ctx.moveTo(2 * k, -205 * k);
  ctx.bezierCurveTo(18 * k - sway * 0.3, -165 * k, 36 * k - sway, -115 * k, 20 * k - sway * 0.2, -65 * k);
  ctx.stroke();
  ctx.restore();

  // —— 劍臂＋兵器 ——
  ctx.save();
  ctx.translate(28 * k, -300 * k); // 肩
  ctx.rotate((armRot * Math.PI) / 180);
  // 上臂（加粗）
  ctx.beginPath();
  ctx.moveTo(-10 * k, -6 * k);
  ctx.quadraticCurveTo(48 * k, 8 * k, 96 * k, 22 * k);
  ctx.quadraticCurveTo(108 * k, 36 * k, 94 * k, 48 * k);
  ctx.quadraticCurveTo(42 * k, 32 * k, -8 * k, 14 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.1, 1.35 * k));
  // 掌
  ctx.beginPath();
  ctx.ellipse(108 * k, 36 * k, 18 * k, 13 * k, 0.25, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.0, 1.25 * k));

  ctx.translate(112 * k, 38 * k); // 握點
  ctx.rotate((weaponRot * Math.PI) / 180);
  drawWeaponSilhouette(ctx, weapon, k);
  ctx.restore();
}

function drawWeaponSilhouette(ctx: CanvasRenderingContext2D, weapon: SilhouetteWeapon, k: number) {
  ctx.beginPath();
  switch (weapon) {
    case 'blade':
      ctx.moveTo(0, 10 * k);
      ctx.lineTo(10 * k, 6 * k);
      ctx.lineTo(14 * k, -130 * k);
      ctx.lineTo(0, -142 * k);
      ctx.lineTo(-8 * k, -128 * k);
      ctx.lineTo(-2 * k, 8 * k);
      break;
    case 'spear':
      ctx.moveTo(-4 * k, 22 * k);
      ctx.lineTo(4 * k, 22 * k);
      ctx.lineTo(3 * k, -150 * k);
      ctx.lineTo(0, -172 * k);
      ctx.lineTo(-3 * k, -150 * k);
      break;
    case 'staff':
      ctx.moveTo(-5 * k, 26 * k);
      ctx.lineTo(5 * k, 26 * k);
      ctx.lineTo(4 * k, -145 * k);
      ctx.lineTo(-4 * k, -145 * k);
      break;
    case 'bow':
      ctx.moveTo(0, 24 * k);
      ctx.quadraticCurveTo(42 * k, -45 * k, 0, -125 * k);
      ctx.quadraticCurveTo(22 * k, -45 * k, 0, 24 * k);
      break;
    case 'whip':
      ctx.moveTo(0, 8 * k);
      ctx.quadraticCurveTo(32 * k, -25 * k, 22 * k, -80 * k);
      ctx.quadraticCurveTo(48 * k, -115 * k, 10 * k, -150 * k);
      ctx.quadraticCurveTo(28 * k, -100 * k, 8 * k, -55 * k);
      ctx.quadraticCurveTo(20 * k, -12 * k, 0, 8 * k);
      break;
    case 'hidden':
      ctx.moveTo(-3 * k, 6 * k);
      ctx.lineTo(5 * k, 2 * k);
      ctx.lineTo(3 * k, -42 * k);
      ctx.lineTo(-5 * k, -38 * k);
      break;
    case 'fist':
      ctx.ellipse(8 * k, 2 * k, 14 * k, 12 * k, 0.2, 0, Math.PI * 2);
      break;
    case 'sword':
    default:
      ctx.moveTo(-3 * k, 12 * k);
      ctx.lineTo(7 * k, 10 * k);
      ctx.lineTo(6 * k, -4 * k);
      ctx.lineTo(11 * k, -10 * k);
      ctx.lineTo(5 * k, -14 * k);
      ctx.lineTo(4 * k, -138 * k);
      ctx.lineTo(-1 * k, -148 * k);
      ctx.lineTo(-4 * k, -136 * k);
      ctx.lineTo(-3 * k, -14 * k);
      ctx.lineTo(-10 * k, -10 * k);
      ctx.lineTo(-4 * k, -4 * k);
      break;
  }
  ctx.closePath();
  strokeFill(ctx, Math.max(1.1, 1.3 * k));
}

/** 回傳鋒尖相對握點（未旋轉前），畀拖墨軌用 */
export function weaponTipLocal(weapon: SilhouetteWeapon, k: number): { x: number; y: number } {
  switch (weapon) {
    case 'spear':
      return { x: 0, y: -172 * k };
    case 'staff':
      return { x: 0, y: -145 * k };
    case 'bow':
      return { x: 20 * k, y: -80 * k };
    case 'whip':
      return { x: 10 * k, y: -150 * k };
    case 'hidden':
      return { x: 0, y: -42 * k };
    case 'fist':
      return { x: 16 * k, y: 0 };
    case 'blade':
      return { x: 4 * k, y: -142 * k };
    default:
      return { x: 0, y: -148 * k };
  }
}

/**
 * 敵影剪影。ctx 已平移到腳底。facingLeft＝true 時鏡像（由右向左）。
 */
export function drawEnemySilhouette(
  ctx: CanvasRenderingContext2D,
  opts: {
    k: number;
    archetype: SilhouetteEnemyArchetype;
    idleT: number;
    facingLeft?: boolean;
  },
) {
  const { k, archetype, idleT } = opts;
  const facingLeft = opts.facingLeft !== false;
  ctx.save();
  if (facingLeft) ctx.scale(-1, 1);

  const bulk =
    archetype === 'boss' || archetype === 'toutuo' || archetype === 'tiemian' || archetype === 'chifa'
      ? 1.22
      : archetype === 'laoweng' || archetype === 'qigai'
        ? 0.92
        : archetype === 'nvcike'
          ? 0.94
          : 1.05;
  const bk = k * bulk;
  const sway = Math.sin(idleT * 2.2) * 4 * bk;
  const breath = Math.sin(idleT * 2.0) * 1.5 * bk;

  // 闊袍身
  ctx.beginPath();
  ctx.moveTo(-55 * bk, -5 * bk);
  ctx.quadraticCurveTo(-88 * bk - sway, -80 * bk, -80 * bk, -175 * bk);
  ctx.quadraticCurveTo(-74 * bk, -270 * bk, -40 * bk, -330 * bk);
  ctx.quadraticCurveTo(-22 * bk, -360 * bk, -10 * bk, -368 * bk);
  ctx.lineTo(22 * bk, -370 * bk);
  ctx.quadraticCurveTo(40 * bk, -358 * bk, 52 * bk, -328 * bk);
  ctx.quadraticCurveTo(84 * bk, -265 * bk, 88 * bk, -170 * bk);
  ctx.quadraticCurveTo(94 * bk + sway, -80 * bk, 58 * bk, -4 * bk);
  ctx.quadraticCurveTo(4 * bk, 7 * bk, -55 * bk, -5 * bk);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.2, 1.5 * bk));

  // 頭
  ctx.beginPath();
  if (archetype === 'toutuo') {
    ctx.ellipse(6 * bk, -390 * bk + breath, 34 * bk, 36 * bk, 0, 0, Math.PI * 2);
  } else if (archetype === 'laoweng') {
    ctx.ellipse(4 * bk, -380 * bk + breath, 26 * bk, 28 * bk, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(8 * bk, -385 * bk + breath, 28 * bk, 30 * bk, 0.05, 0, Math.PI * 2);
  }
  strokeFill(ctx, Math.max(1.0, 1.25 * bk));

  // 斗笠／盔
  if (archetype !== 'toutuo' && archetype !== 'qigai') {
    ctx.beginPath();
    ctx.ellipse(8 * bk, -402 * bk + breath, 62 * bk, 16 * bk, 0, 0, Math.PI * 2);
    strokeFill(ctx, Math.max(1.1, 1.35 * bk));
    ctx.beginPath();
    ctx.moveTo(-10 * bk, -402 * bk + breath);
    ctx.quadraticCurveTo(8 * bk, -438 * bk + breath, 30 * bk, -402 * bk + breath);
    ctx.closePath();
    strokeFill(ctx, Math.max(1.0, 1.2 * bk));
  }

  // 兵器
  ctx.save();
  ctx.translate(36 * bk, -275 * bk);
  ctx.rotate(-0.5);
  ctx.beginPath();
  if (archetype === 'qiangke' || archetype === 'boss') {
    ctx.moveTo(-5 * bk, 24 * bk);
    ctx.lineTo(5 * bk, 24 * bk);
    ctx.lineTo(4 * bk, -155 * bk);
    ctx.lineTo(0, -178 * bk);
    ctx.lineTo(-4 * bk, -155 * bk);
  } else if (archetype === 'gouke' || archetype === 'chifa') {
    ctx.moveTo(0, 12 * bk);
    ctx.quadraticCurveTo(48 * bk, -45 * bk, 14 * bk, -135 * bk);
    ctx.quadraticCurveTo(36 * bk, -45 * bk, 0, 12 * bk);
  } else {
    ctx.moveTo(-4 * bk, 14 * bk);
    ctx.lineTo(10 * bk, 10 * bk);
    ctx.lineTo(8 * bk, -120 * bk);
    ctx.lineTo(0, -135 * bk);
    ctx.lineTo(-6 * bk, -118 * bk);
  }
  ctx.closePath();
  strokeFill(ctx, Math.max(1.1, 1.3 * bk));
  if (archetype === 'boss' || archetype === 'tiemian') {
    for (const [sx, sy] of [
      [12, -45],
      [16, -78],
      [10, -108],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(sx * bk, sy * bk);
      ctx.lineTo((sx + 16) * bk, (sy - 7) * bk);
      ctx.lineTo(sx * bk, (sy + 10) * bk);
      ctx.closePath();
      strokeFill(ctx, 1);
    }
  }
  ctx.restore();

  // 內輪廓
  ctx.beginPath();
  ctx.moveTo(-6 * bk, -35 * bk);
  ctx.quadraticCurveTo(12 * bk, -175 * bk, 4 * bk, -310 * bk);
  ctx.strokeStyle = 'rgba(236,230,218,0.36)';
  ctx.lineWidth = Math.max(0.9, 1.15 * bk);
  ctx.stroke();

  ctx.restore();
}
