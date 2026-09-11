/**
 * 純黑影人偶：唔靠彩色立繪濾鏡，直接用路徑砌出剪影。
 * 座標系：腳底為原點，y 向下為正；單位＝css px（呼叫端已乘好 k）。
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

const FILL = '#0b0b0d';
const STROKE = 'rgba(236, 230, 218, 0.72)';
const SASH = 'rgba(48, 110, 190, 0.95)';
const SASH_SOFT = 'rgba(48, 110, 190, 0.5)';

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
 * 俠客剪影：斗笠＋長袍＋持械臂。呼叫時 ctx 應已平移到腳底、套上 body 旋轉／縮放。
 * armRot／weaponRot 係度數（同骨骼一致）。
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
  const hem = Math.sin(idleT * 2.1) * 3 * k;

  // —— 袍身 ——
  ctx.beginPath();
  ctx.moveTo(-18 * k, -8 * k);
  ctx.quadraticCurveTo(-42 * k - hem, -90 * k, -36 * k, -210 * k);
  ctx.quadraticCurveTo(-28 * k, -300 * k, -10 * k, -360 * k);
  ctx.lineTo(8 * k, -368 * k);
  ctx.quadraticCurveTo(34 * k, -300 * k, 30 * k, -210 * k);
  ctx.quadraticCurveTo(48 * k + hem, -100 * k, 22 * k, -6 * k);
  ctx.quadraticCurveTo(4 * k, 4 * k, -18 * k, -8 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.1, 1.4 * k));

  // 內層衣紋（白線）
  ctx.beginPath();
  ctx.moveTo(-2 * k, -40 * k);
  ctx.quadraticCurveTo(6 * k, -160 * k, 0 * k, -300 * k);
  ctx.strokeStyle = 'rgba(236,230,218,0.35)';
  ctx.lineWidth = Math.max(0.8, 1.05 * k);
  ctx.stroke();

  // —— 頭／斗笠 ——
  ctx.save();
  ctx.translate(2 * k, -372 * k);
  ctx.rotate((headRot * Math.PI) / 180);
  // 笠
  ctx.beginPath();
  ctx.ellipse(4 * k, -18 * k, 54 * k, 16 * k, 0, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.1, 1.35 * k));
  // 笠頂
  ctx.beginPath();
  ctx.moveTo(-10 * k, -18 * k);
  ctx.quadraticCurveTo(4 * k, -48 * k, 22 * k, -18 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.2 * k));
  // 下顎剪影
  ctx.beginPath();
  ctx.ellipse(6 * k, 6 * k, 14 * k, 16 * k, 0.1, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.0, 1.15 * k));
  ctx.restore();

  // —— 青帶 ——
  const sway = Math.sin(idleT * 2.5) * 7 * k + armRot * 0.05 * k;
  ctx.save();
  ctx.strokeStyle = SASH;
  ctx.lineWidth = Math.max(2.2, 3.1 * k);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(6 * k, -205 * k);
  ctx.bezierCurveTo(22 * k + sway, -175 * k, 40 * k + sway * 1.3, -145 * k, 26 * k + sway * 0.5, -105 * k);
  ctx.stroke();
  ctx.strokeStyle = SASH_SOFT;
  ctx.lineWidth = Math.max(1.4, 2 * k);
  ctx.beginPath();
  ctx.moveTo(2 * k, -200 * k);
  ctx.bezierCurveTo(14 * k - sway * 0.4, -168 * k, 30 * k - sway, -130 * k, 16 * k - sway * 0.2, -98 * k);
  ctx.stroke();
  ctx.restore();

  // —— 劍臂＋兵器 ——
  ctx.save();
  ctx.translate(18 * k, -330 * k); // 肩
  ctx.rotate((armRot * Math.PI) / 180);
  // 上臂
  ctx.beginPath();
  ctx.moveTo(-6 * k, -4 * k);
  ctx.quadraticCurveTo(40 * k, 10 * k, 88 * k, 28 * k);
  ctx.quadraticCurveTo(96 * k, 40 * k, 84 * k, 46 * k);
  ctx.quadraticCurveTo(36 * k, 28 * k, -4 * k, 12 * k);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.25 * k));
  // 前臂／掌
  ctx.beginPath();
  ctx.ellipse(100 * k, 38 * k, 16 * k, 11 * k, 0.3, 0, Math.PI * 2);
  strokeFill(ctx, Math.max(1.0, 1.2 * k));

  ctx.translate(104 * k, 40 * k); // 握點
  ctx.rotate((weaponRot * Math.PI) / 180);
  drawWeaponSilhouette(ctx, weapon, k);
  ctx.restore();
}

function drawWeaponSilhouette(ctx: CanvasRenderingContext2D, weapon: SilhouetteWeapon, k: number) {
  ctx.beginPath();
  switch (weapon) {
    case 'blade':
      ctx.moveTo(0, 8 * k);
      ctx.lineTo(8 * k, 4 * k);
      ctx.lineTo(12 * k, -110 * k);
      ctx.lineTo(0, -118 * k);
      ctx.lineTo(-6 * k, -108 * k);
      ctx.lineTo(-2 * k, 6 * k);
      break;
    case 'spear':
      ctx.moveTo(-3 * k, 18 * k);
      ctx.lineTo(3 * k, 18 * k);
      ctx.lineTo(2 * k, -130 * k);
      ctx.lineTo(0, -148 * k);
      ctx.lineTo(-2 * k, -130 * k);
      break;
    case 'staff':
      ctx.moveTo(-4 * k, 22 * k);
      ctx.lineTo(4 * k, 22 * k);
      ctx.lineTo(3 * k, -125 * k);
      ctx.lineTo(-3 * k, -125 * k);
      break;
    case 'bow':
      ctx.moveTo(0, 20 * k);
      ctx.quadraticCurveTo(36 * k, -40 * k, 0, -110 * k);
      ctx.quadraticCurveTo(18 * k, -40 * k, 0, 20 * k);
      break;
    case 'whip':
      ctx.moveTo(0, 6 * k);
      ctx.quadraticCurveTo(28 * k, -20 * k, 18 * k, -70 * k);
      ctx.quadraticCurveTo(40 * k, -100 * k, 8 * k, -130 * k);
      ctx.quadraticCurveTo(22 * k, -90 * k, 6 * k, -50 * k);
      ctx.quadraticCurveTo(16 * k, -10 * k, 0, 6 * k);
      break;
    case 'hidden':
      ctx.moveTo(-2 * k, 4 * k);
      ctx.lineTo(4 * k, 0);
      ctx.lineTo(2 * k, -36 * k);
      ctx.lineTo(-4 * k, -32 * k);
      break;
    case 'fist':
      ctx.ellipse(6 * k, 2 * k, 12 * k, 10 * k, 0.2, 0, Math.PI * 2);
      break;
    case 'sword':
    default:
      ctx.moveTo(-2 * k, 10 * k);
      ctx.lineTo(6 * k, 8 * k);
      ctx.lineTo(5 * k, -4 * k);
      ctx.lineTo(9 * k, -8 * k);
      ctx.lineTo(4 * k, -12 * k);
      ctx.lineTo(3 * k, -120 * k);
      ctx.lineTo(-1 * k, -128 * k);
      ctx.lineTo(-3 * k, -118 * k);
      ctx.lineTo(-2 * k, -12 * k);
      ctx.lineTo(-8 * k, -8 * k);
      ctx.lineTo(-3 * k, -4 * k);
      break;
  }
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.2 * k));
}

/** 回傳鋒尖相對握點（未旋轉前），畀拖墨軌用 */
export function weaponTipLocal(weapon: SilhouetteWeapon, k: number): { x: number; y: number } {
  switch (weapon) {
    case 'spear':
      return { x: 0, y: -148 * k };
    case 'staff':
      return { x: 0, y: -125 * k };
    case 'bow':
      return { x: 18 * k, y: -70 * k };
    case 'whip':
      return { x: 8 * k, y: -130 * k };
    case 'hidden':
      return { x: 0, y: -36 * k };
    case 'fist':
      return { x: 14 * k, y: 0 };
    case 'blade':
      return { x: 4 * k, y: -118 * k };
    default:
      return { x: 0, y: -128 * k };
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
    archetype === 'boss' || archetype === 'toutuo' || archetype === 'tiemian'
      ? 1.18
      : archetype === 'laoweng' || archetype === 'qigai'
        ? 0.9
        : archetype === 'nvcike'
          ? 0.92
          : 1;
  const bk = k * bulk;
  const sway = Math.sin(idleT * 2.2) * 2.5 * bk;

  // 身
  ctx.beginPath();
  ctx.moveTo(-22 * bk, -6 * bk);
  ctx.quadraticCurveTo(-48 * bk - sway, -100 * bk, -40 * bk, -220 * bk);
  ctx.quadraticCurveTo(-30 * bk, -320 * bk, -8 * bk, -380 * bk);
  ctx.lineTo(14 * bk, -385 * bk);
  ctx.quadraticCurveTo(42 * bk, -310 * bk, 38 * bk, -210 * bk);
  ctx.quadraticCurveTo(55 * bk + sway, -110 * bk, 26 * bk, -4 * bk);
  ctx.quadraticCurveTo(2 * bk, 6 * bk, -22 * bk, -6 * bk);
  ctx.closePath();
  strokeFill(ctx, Math.max(1.1, 1.35 * bk));

  // 頭
  ctx.beginPath();
  if (archetype === 'toutuo') {
    ctx.ellipse(4 * bk, -410 * bk, 28 * bk, 30 * bk, 0, 0, Math.PI * 2);
  } else if (archetype === 'laoweng') {
    ctx.ellipse(2 * bk, -400 * bk, 22 * bk, 24 * bk, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(6 * bk, -405 * bk, 24 * bk, 26 * bk, 0.05, 0, Math.PI * 2);
  }
  strokeFill(ctx, Math.max(1.0, 1.2 * bk));

  // 斗笠／盔
  if (archetype !== 'toutuo' && archetype !== 'qigai') {
    ctx.beginPath();
    ctx.ellipse(6 * bk, -422 * bk, 46 * bk, 14 * bk, 0, 0, Math.PI * 2);
    strokeFill(ctx, Math.max(1.0, 1.25 * bk));
  }

  // 兵器剪影（肩扛／手持）
  ctx.save();
  ctx.translate(28 * bk, -300 * bk);
  ctx.rotate(-0.55);
  ctx.beginPath();
  if (archetype === 'qiangke' || archetype === 'boss') {
    ctx.moveTo(-4 * bk, 20 * bk);
    ctx.lineTo(4 * bk, 20 * bk);
    ctx.lineTo(3 * bk, -140 * bk);
    ctx.lineTo(0, -160 * bk);
    ctx.lineTo(-3 * bk, -140 * bk);
  } else if (archetype === 'gouke' || archetype === 'chifa') {
    ctx.moveTo(0, 10 * bk);
    ctx.quadraticCurveTo(40 * bk, -40 * bk, 10 * bk, -120 * bk);
    ctx.quadraticCurveTo(30 * bk, -40 * bk, 0, 10 * bk);
  } else {
    ctx.moveTo(-3 * bk, 12 * bk);
    ctx.lineTo(8 * bk, 8 * bk);
    ctx.lineTo(6 * bk, -100 * bk);
    ctx.lineTo(0, -112 * bk);
    ctx.lineTo(-4 * bk, -98 * bk);
  }
  ctx.closePath();
  strokeFill(ctx, Math.max(1.0, 1.2 * bk));
  // 狼牙棒刺（boss）
  if (archetype === 'boss' || archetype === 'tiemian') {
    for (const [sx, sy] of [
      [10, -40],
      [14, -70],
      [8, -95],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(sx * bk, sy * bk);
      ctx.lineTo((sx + 14) * bk, (sy - 6) * bk);
      ctx.lineTo(sx * bk, (sy + 8) * bk);
      ctx.closePath();
      strokeFill(ctx, 1);
    }
  }
  ctx.restore();

  // 內輪廓線
  ctx.beginPath();
  ctx.moveTo(-4 * bk, -40 * bk);
  ctx.quadraticCurveTo(8 * bk, -180 * bk, 2 * bk, -320 * bk);
  ctx.strokeStyle = 'rgba(236,230,218,0.32)';
  ctx.lineWidth = Math.max(0.8, 1.05 * bk);
  ctx.stroke();

  ctx.restore();
}
