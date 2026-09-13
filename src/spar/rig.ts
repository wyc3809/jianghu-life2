/**
 * 切磋演武 rig 數據：骨架定義 + 武器掛點 + 動作 clip（v2 雙邊圍剿版）。
 *
 * 座標系：design units（du）＝ 部件貼圖 webp 像素。y 向下為正。
 * 所有動作 clip 嘅數值都係「相對 rest pose 嘅增量」，引擎會疊加喺循環 idle 之上，
 * 所以新動作由 0 開始、喺 0 結束就會無縫銜接。
 *
 * v2 結構：俠客背影（冇樣）＋ 武器係獨立部件，掛喺劍臂嘅 grip 錨點，
 * 跟住手臂骨骼轉，再加自己嘅局部甩腕旋轉。邊款武器由裝備欄決定。
 *
 * 日後擴展：
 * - 新動作：加一個 SparClip 落 SPAR_CLIPS，喺引擎 schedule 嗰度引用個名。
 * - 新時裝：整一套新嘅 SparSkin（body/head/arm 三張圖，相同骨架座標），
 *   傳入 <InkSparStage skin={...} /> 即成，動作完全唔使郁。
 * - 新武器：整張垂直（柄上鋒下）透明圖，加一個 WeaponSpriteDef 落 WEAPON_SPRITES。
 * - 新敵人：加一個 EnemyDef（單圖 + 腳底錨點 + 眼部位置），喺 STAGE 揀用。
 */

/** 骨骼屬性：rot＝角度（度，順時針為正）、x/y＝du 位移、sy＝垂直縮放、alpha＝透明度 */
export type SparBoneProp = 'rot' | 'x' | 'y' | 'sy' | 'alpha';
export type SparEasing = 'linear' | 'in' | 'out' | 'inout' | 'expoin';

export interface SparKey {
  t: number;
  v: number;
  /** 呢個 key 到下個 key 之間嘅緩動，預設 inout */
  e?: SparEasing;
}

export interface SparTrack {
  bone: string;
  prop: SparBoneProp;
  keys: SparKey[];
}

export interface SparClipEvent {
  t: number;
  id: 'strike' | string;
}

export interface SparClip {
  name: string;
  dur: number;
  loop?: boolean;
  tracks: SparTrack[];
  events?: SparClipEvent[];
}

/** 一塊可換膚嘅部件貼圖 */
export interface SparPart {
  src: string;
  /** 貼圖尺寸（du） */
  w: number;
  h: number;
  /** 畫嘅時候左上角相對「骨骼錨點」嘅偏移（du） */
  dx: number;
  dy: number;
}

/** 俠客皮膚：三件套（之後時裝就係換呢三張） */
export interface SparSkin {
  body: SparPart;
  head: SparPart;
  arm: SparPart;
}

/**
 * v3 一圖切件皮膚：全身（連頭帽）一張完整立繪，劍臂由同一張圖切出，
 * 肩位加一塊原圖拷貝嘅墨痕遮縫。邊位由構造上同身體一致，唔會再甩。
 * - full：全身貼圖，腳底錨點（頭帽身腳一體）
 * - arm：劍臂，dx/dy 相對肩錨點（rest pose 同 full 無縫重合）
 * - shoulderPatch：肩位遮縫，dx/dy 相對肩錨點，畫喺臂之上（唔跟臂轉）
 */
export interface SparSkinV3 {
  full: SparPart;
  arm: SparPart;
  shoulderPatch: SparPart;
}

export interface WarriorRigV3 {
  v: 3;
  skin: SparSkinV3;
  /** 劍臂掛喺身嘅邊個位（相對腳底錨點，du） */
  shoulderSocket: { x: number; y: number };
  /** 武器握點相對肩錨點（du） */
  gripSocket: { x: number; y: number };
  designHeight: number;
  /** 自訂揮擊 clip（霧接臂用溫和版）；冇就用標準 attack */
  attackClip?: SparClip;
}

export type AnyWarriorRig = WarriorRig | WarriorRigV3;

export const isV3Rig = (r: AnyWarriorRig): r is WarriorRigV3 => (r as WarriorRigV3).v === 3;

export interface WarriorRig {
  skin: SparSkin;
  /** 頭掛喺身嘅邊個位（相對腳底錨點，du） */
  neckSocket: { x: number; y: number };
  /** 劍臂掛喺身嘅邊個位（相對腳底錨點，du） */
  shoulderSocket: { x: number; y: number };
  /** 武器握點相對肩錨點（du）——武器圖嘅 grip 會對正呢度 */
  gripSocket: { x: number; y: number };
  /** 俠客設計身高（du），舞台縮放基準 */
  designHeight: number;
}

export interface EnemyDef {
  part: SparPart;
  /** 眼睛相對腳底錨點（du）——紅瞳殺氣脈動用 */
  eyes: { x: number; y: number }[];
  /** 身高倍率（1＝同俠客相若；巨漢 1.2、老翁 0.92 之類） */
  scale?: number;
}

/** 一款武器嘅貼圖 + 掛點數據（全部原圖垂直、柄上鋒下） */
export interface WeaponSpriteDef {
  src: string;
  /** 貼圖尺寸（px） */
  w: number;
  h: number;
  /** 握點喺貼圖入面嘅位置（px）——會對正俠客手掌 */
  grip: { x: number; y: number };
  /** 武器鋒尖喺貼圖入面嘅位置（px）——拖墨軌用 */
  tip: { x: number; y: number };
  /** 顯示長度：俠客身高嘅幾多倍（du 空間） */
  lengthRatio: number;
  /** 攻擊距離（du，由俠客腳底計）——影響幾遠出手 */
  reach: number;
  /** 閒立時武器世界角度（度，順時針；0＝鋒垂直向下） */
  restRot: number;
}

const SPAR_BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/`;

/**
 * 默認皮膚：側身斗笠墨衣俠客（面向右，斗笠陰影遮樣、紅繩點綴，AI 水墨立繪拆件）。
 * body 腳底錨點＝全身旋轉軸；head 繞頸微擺；arm 繞肩揮動，右手前伸拎武器。
 */
export const WARRIOR: WarriorRig = {
  skin: {
    body: { src: `${SPAR_BASE}hero3-body.webp`, w: 410, h: 424, dx: -234, dy: -412 },
    head: { src: `${SPAR_BASE}hero3-head.webp`, w: 264, h: 146, dx: -153, dy: -124.5 },
    arm: { src: `${SPAR_BASE}hero3-arm.webp`, w: 170, h: 139, dx: -23.5, dy: -23 },
  },
  neckSocket: { x: 27.5, y: -395 },
  shoulderSocket: { x: 70, y: -355 },
  gripSocket: { x: 116, y: 84 },
  designHeight: 531,
};

/**
 * 門派服裝：十派各有 AI 水墨袍色（身＋斗笠繩色），骨架錨點同默認一致。
 * 每派身圖高度統一 424du，dx 按腳掌位置逐張定位。
 */
const SECT_BODY: Record<string, { w: number; dx: number; neck: { x: number; y: number }; shoulder: { x: number; y: number } }> = {
  // 每派身圖高度統一 424du，dx 按腳掌定位；頸／肩錨點逐派按領口同臂根實測
  sect_qingyun: { w: 375, dx: -252, neck: { x: 47, y: -390 }, shoulder: { x: 80, y: -352 } }, // 青雲劍派：月白青雲紋
  sect_tiandao: { w: 321, dx: -203, neck: { x: 50, y: -388 }, shoulder: { x: 85, y: -352 } }, // 天刀門：玄黑赤紅滾邊
  sect_emei: { w: 417, dx: -273, neck: { x: 60, y: -385 }, shoulder: { x: 85, y: -352 } }, // 峨嵋派：月白配玉綠
  sect_shaolin: { w: 372, dx: -234, neck: { x: 55, y: -385 }, shoulder: { x: 88, y: -352 } }, // 少林派：土黃僧袍
  sect_wudang: { w: 352, dx: -231, neck: { x: 58, y: -388 }, shoulder: { x: 85, y: -355 } }, // 武當派：灰藍道袍
  sect_tangmen: { w: 384, dx: -240, neck: { x: 52, y: -386 }, shoulder: { x: 80, y: -353 } }, // 唐門：紫黑夜行
  sect_mojiao: { w: 315, dx: -201, neck: { x: 55, y: -386 }, shoulder: { x: 85, y: -355 } }, // 魔教：血焰黑袍
  sect_huashan: { w: 364, dx: -234, neck: { x: 60, y: -386 }, shoulder: { x: 88, y: -355 } }, // 華山：松綠劍袍
  sect_taohua: { w: 410, dx: -255, neck: { x: 60, y: -385 }, shoulder: { x: 82, y: -352 } }, // 桃花島：白袍桃花
  sect_wugen: { w: 352, dx: -224, neck: { x: 55, y: -385 }, shoulder: { x: 82, y: -352 } }, // 無根門：灰紫幽衫
};

const sectKey = (sectId: string) => sectId.replace(/^sect_/, '');

export const SECT_RIGS: Record<string, WarriorRig> = Object.fromEntries(
  Object.entries(SECT_BODY).map(([sectId, b]) => [
    sectId,
    {
      skin: {
        body: { src: `${SPAR_BASE}hero-sect-${sectKey(sectId)}-body.webp`, w: b.w, h: 424, dx: b.dx, dy: -424 },
        head: { src: `${SPAR_BASE}hero-sect-${sectKey(sectId)}-head.webp`, w: 264, h: 146, dx: -153, dy: -124.5 },
        arm: { src: `${SPAR_BASE}hero-sect-${sectKey(sectId)}-arm.webp`, w: 170, h: 139, dx: -23.5, dy: -23 },
      },
      neckSocket: b.neck,
      shoulderSocket: b.shoulder,
      gripSocket: WARRIOR.gripSocket,
      designHeight: WARRIOR.designHeight,
    },
  ]),
);

/**
 * v3 溫和揮擊：同主 attack 節奏，蓄勢略收（霧接臂門派唔好大風車）。
 * 仍走純黑影骨骼，只係角度細啲。
 */
const V3_ATTACK_SOFT: SparClip = {
  name: 'attack',
  dur: 0.72,
  tracks: [
    { bone: 'arm', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -95, e: 'expoin' }, { t: 0.36, v: 30, e: 'linear' }, { t: 0.48, v: 26, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'weapon', prop: 'rot', keys: [ { t: 0, v: 0, e: 'inout' }, { t: 0.2, v: 14, e: 'in' }, { t: 0.3, v: 8, e: 'expoin' }, { t: 0.38, v: 36, e: 'out' }, { t: 0.52, v: 22, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -6, e: 'expoin' }, { t: 0.36, v: 8, e: 'linear' }, { t: 0.5, v: 6, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'x', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -14, e: 'expoin' }, { t: 0.36, v: 72, e: 'linear' }, { t: 0.52, v: 68, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'y', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: 10, e: 'expoin' }, { t: 0.36, v: -6, e: 'linear' }, { t: 0.72, v: 0 } ] },
    { bone: 'head', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -4, e: 'expoin' }, { t: 0.36, v: 6, e: 'inout' }, { t: 0.72, v: 0 } ] },
  ],
  events: [{ t: 0.36, id: 'strike' }],
};

/**
 * v3 門派時裝（一圖切件）：full＝完整全身立繪（958×1341px，0.38031 du/px，腳底錨點 x≈284.5px），
 * arm／shoulderPatch 由 full 原圖切出，rest pose 無縫重合；揮臂時肩位墨痕遮住關節縫。
 */
export const SECT_RIGS_V3: Record<string, WarriorRigV3> = {
  sect_emei: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-emei-full.webp`, w: 364.3, h: 510, dx: -108.2, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-emei-arm.webp`, w: 189.4, h: 109.5, dx: -23.6, dy: -25.9 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-emei-patch.webp`, w: 70.7, h: 63.9, dx: -34.6, dy: -31.9 },
    },
    shoulderSocket: { x: -1.7, y: -384.5 },
    gripSocket: { x: 117.9, y: 64.7 },
    designHeight: WARRIOR.designHeight,
  },
  sect_qingyun: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-qingyun-full.webp`, w: 373.9, h: 510, dx: -161.8, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-qingyun-arm.webp`, w: 119.9, h: 112.4, dx: -24.1, dy: -21.0 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-qingyun-patch.webp`, w: 72.0, h: 66.5, dx: -36.0, dy: -32.8 },
    },
    shoulderSocket: { x: 14.2, y: -375.5 },
    gripSocket: { x: 67.3, y: 67.3 },
    designHeight: WARRIOR.designHeight, // 青雲劍派

  },
  sect_tiandao: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-tiandao-full.webp`, w: 381.1, h: 510, dx: -236.5, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-tiandao-arm.webp`, w: 135.0, h: 61.0, dx: -13.1, dy: -16.2 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-tiandao-patch.webp`, w: 71.8, h: 65.2, dx: -35.1, dy: -32.4 },
    },
    shoulderSocket: { x: 6.6, y: -394.3 },
    gripSocket: { x: 96.4, y: 30.9 },
    designHeight: WARRIOR.designHeight, // 天刀門

  },
  sect_shaolin: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-shaolin-full.webp`, w: 357.0, h: 510, dx: -211.5, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-shaolin-arm.webp`, w: 130.5, h: 88.5, dx: -15.6, dy: -16.4 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-shaolin-patch.webp`, w: 70.6, h: 64.5, dx: -34.7, dy: -32.0 },
    },
    shoulderSocket: { x: 0.2, y: -384.1 },
    gripSocket: { x: 89.6, y: 53.4 },
    designHeight: WARRIOR.designHeight, // 少林派

  },
  sect_wudang: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-wudang-full.webp`, w: 342.9, h: 510, dx: -120.5, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-wudang-arm.webp`, w: 115.1, h: 103.3, dx: -9.0, dy: -10.4 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-wudang-patch.webp`, w: 63.8, h: 58.6, dx: -31.5, dy: -29.1 },
    },
    shoulderSocket: { x: 25.1, y: -378.3 },
    gripSocket: { x: 86.7, y: 72.8 },
    designHeight: WARRIOR.designHeight, // 武當派（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_tangmen: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-tangmen-full.webp`, w: 354.1, h: 510, dx: -120.7, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-tangmen-arm.webp`, w: 94.4, h: 111.9, dx: -39.5, dy: -29.1 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-tangmen-patch.webp`, w: 69.0, h: 63.1, dx: -34.0, dy: -31.3 },
    },
    shoulderSocket: { x: 52.8, y: -373.8 },
    gripSocket: { x: 29.8, y: 67.2 },
    designHeight: WARRIOR.designHeight, // 唐門（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_mojiao: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-mojiao-full.webp`, w: 361.1, h: 510, dx: -212.7, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-mojiao-arm.webp`, w: 117.1, h: 72.8, dx: -23.8, dy: -21.6 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-mojiao-patch.webp`, w: 67.7, h: 59.6, dx: -33.3, dy: -28.5 },
    },
    shoulderSocket: { x: 50.7, y: -367.3 },
    gripSocket: { x: 73.2, y: 27.4 },
    designHeight: WARRIOR.designHeight, // 魔教（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_huashan: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-huashan-full.webp`, w: 336.9, h: 510, dx: -118.8, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-huashan-arm.webp`, w: 132.1, h: 64.2, dx: -10.4, dy: -11.9 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-huashan-patch.webp`, w: 69.4, h: 63.1, dx: -34.0, dy: -31.3 },
    },
    shoulderSocket: { x: 34.1, y: -401.8 },
    gripSocket: { x: 93.3, y: 42.9 },
    designHeight: WARRIOR.designHeight, // 華山（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_taohua: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-taohua-full.webp`, w: 312.7, h: 510, dx: -109.9, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-taohua-arm.webp`, w: 87.5, h: 126.4, dx: -8.3, dy: -10.3 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-taohua-patch.webp`, w: 61.3, h: 58.2, dx: -31.3, dy: -28.9 },
    },
    shoulderSocket: { x: 3.8, y: -365.4 },
    gripSocket: { x: 63.7, y: 96.4 },
    designHeight: WARRIOR.designHeight, // 桃花島

  },
  sect_wugen: {
    v: 3,
    skin: {
      full: { src: `${SPAR_BASE}hero-v3-wugen-full.webp`, w: 358.8, h: 510, dx: -152.3, dy: -510 },
      arm: { src: `${SPAR_BASE}hero-v3-wugen-arm.webp`, w: 129.2, h: 45.1, dx: -9.2, dy: -12.1 },
      shoulderPatch: { src: `${SPAR_BASE}hero-v3-wugen-patch.webp`, w: 68.2, h: 62.0, dx: -33.4, dy: -30.8 },
    },
    shoulderSocket: { x: 23.8, y: -363.2 },
    gripSocket: { x: 97.2, y: 25.7 },
    designHeight: WARRIOR.designHeight, // 無根門（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
};

/** 按門派揀俠客骨架皮膚；v3 時裝優先，冇就用舊三件套，再冇就用默認浪人裝 */
export function rigForSect(sectId: string | null | undefined): AnyWarriorRig {
  if (sectId && SECT_RIGS_V3[sectId]) return SECT_RIGS_V3[sectId];
  return (sectId && SECT_RIGS[sectId]) || WARRIOR;
}

/** 敵影：單圖，腳底錨點，雙眼位置（紅眼脈動） */
export const ENEMY_SHADOW: EnemyDef = {
  part: { src: `${SPAR_BASE}sil/enemy-shadow.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  eyes: [
    { x: -18, y: -520 },
    { x: 22, y: -520 },
  ],
};

/** 敵人圖鑑組裝：腳底錨點＝圖中底部中央，eye 係紅瞳殺氣位置（相對錨點） */
const SPAR_E = (n: string, w: number, h: number, eye: { x: number; y: number }, scale = 1): EnemyDef => ({
  part: { src: `${SPAR_BASE}sil/enemy-${n}.webp`, w, h, dx: -w / 2, dy: -h },
  eyes: [eye],
  scale,
});

/** 十款江湖敵手（AI 水墨立繪，側身面左行向俠客）＋墨影，組成出敵池 */
export const ENEMY_POOL: EnemyDef[] = [
  ENEMY_SHADOW,
  SPAR_E('daoke', 616, 788, { x: -20, y: -520 }), // 黑衣刀客（AI 剪影）
  SPAR_E('laoweng', 616, 788, { x: -18, y: -500 }, 0.94), // 白髮老翁
  SPAR_E('nvcike', 616, 788, { x: -16, y: -530 }, 0.96), // 女刺客
  SPAR_E('toutuo', 616, 788, { x: -10, y: -510 }, 1.08), // 胖頭陀
  SPAR_E('qiangke', 611, 788, { x: -8, y: -540 }, 1.05), // 槍客
  SPAR_E('tiemian', 615, 788, { x: -12, y: -520 }, 1.1), // 鐵面／影魁
  SPAR_E('gouke', 616, 788, { x: -20, y: -520 }), // 雙鉤客（刀客剪影）
  SPAR_E('qigai', 616, 788, { x: -18, y: -500 }, 0.97), // 丐幫（老翁剪影）
  SPAR_E('suoyi', 611, 788, { x: -8, y: -540 }, 0.98), // 蓑衣（槍客剪影）
  SPAR_E('chifa', 616, 788, { x: -10, y: -510 }, 1.15), // 赤髮（頭陀剪影）
];

export const FX_SPLASH_SRC = `${SPAR_BASE}fx-splash.webp`;

/**
 * 場景背景註冊表：通用水墨底圖，畫喺打鬥後面。
 * 日後換場景（市集／山門／雪原）就係加一條 key，再喺組件按 location 揀用，
 * 引擎 setBackground 會自動淡入淡出過場。
 */
export const SPAR_BACKGROUNDS: Record<string, { src: string; opacity?: number }> = {
  /** 通用：霧嶺空谷（淡墨遠山，下半留白做戰鬥地面） */
  valley: { src: `${SPAR_BASE}bg-valley.webp` },
  /** 鎮居：千燈鎮水鄉長卷（即主畫面地圖 banner 同一幅，舞台 cover 貼底，水面留白做地面；調淡令角色突出） */
  town: {
    src: `${import.meta.env.BASE_URL || '/'}ink/ai/backdrops/backdrop-town-scroll.webp`,
    opacity: 0.52,
  },
};

export const SPAR_DEFAULT_BACKGROUND = 'valley';

/**
 * 七款武器貼圖（原圖全部 768px 高、垂直、柄上鋒下、透明底）。
 * key 對應 data/equipment/catalog.ts 嘅 WeaponKind；冇裝備武器就空手唔畫。
 */
export const WEAPON_SPRITES: Record<string, WeaponSpriteDef> = {
  sword: {
    src: `${SPAR_BASE}weapon-sword.webp`, w: 131, h: 768,
    grip: { x: 66, y: 70 }, tip: { x: 66, y: 750 },
    lengthRatio: 0.55, reach: 265, restRot: 10,
  },
  blade: {
    src: `${SPAR_BASE}weapon-blade.webp`, w: 117, h: 768,
    grip: { x: 58, y: 75 }, tip: { x: 58, y: 735 },
    lengthRatio: 0.58, reach: 275, restRot: 10,
  },
  spear: {
    src: `${SPAR_BASE}weapon-spear.webp`, w: 107, h: 768,
    grip: { x: 53, y: 290 }, tip: { x: 53, y: 752 },
    lengthRatio: 0.88, reach: 365, restRot: 6,
  },
  staff: {
    src: `${SPAR_BASE}weapon-staff.webp`, w: 31, h: 768,
    grip: { x: 15, y: 346 }, tip: { x: 15, y: 752 },
    lengthRatio: 0.88, reach: 345, restRot: 6,
  },
  whip: {
    src: `${SPAR_BASE}weapon-whip.webp`, w: 66, h: 768,
    grip: { x: 33, y: 50 }, tip: { x: 33, y: 748 },
    lengthRatio: 0.66, reach: 385, restRot: 14,
  },
  bow: {
    src: `${SPAR_BASE}weapon-bow.webp`, w: 105, h: 768,
    grip: { x: 52, y: 350 }, tip: { x: 52, y: 745 },
    lengthRatio: 0.66, reach: 300, restRot: 8,
  },
  hidden: {
    src: `${SPAR_BASE}weapon-hidden.webp`, w: 524, h: 768,
    grip: { x: 262, y: 60 }, tip: { x: 262, y: 730 },
    lengthRatio: 0.34, reach: 245, restRot: 12,
  },
};

/* ================= 動作 clip（純黑影專用：誇張剪影可讀性） ================= */

/**
 * 閒立：明顯呼吸起伏＋持械臂／兵器相位錯開，斗笠微擺。
 * 剪影場要「郁得到」，唔好似紙板企定。
 */
const IDLE: SparClip = {
  name: 'idle',
  dur: 2.8,
  loop: true,
  tracks: [
    { bone: 'body', prop: 'sy', keys: [ { t: 0, v: 1 }, { t: 1.4, v: 1.028 }, { t: 2.8, v: 1 } ] },
    { bone: 'body', prop: 'y', keys: [ { t: 0, v: 0 }, { t: 1.4, v: -7 }, { t: 2.8, v: 0 } ] },
    { bone: 'body', prop: 'rot', keys: [ { t: 0, v: 0 }, { t: 0.9, v: -1.6 }, { t: 2.0, v: 1.4 }, { t: 2.8, v: 0 } ] },
    { bone: 'head', prop: 'rot', keys: [ { t: 0, v: 0 }, { t: 0.8, v: 3.2 }, { t: 1.8, v: -2.6 }, { t: 2.8, v: 0 } ] },
    { bone: 'arm', prop: 'rot', keys: [ { t: 0, v: -8 }, { t: 1.4, v: 6 }, { t: 2.8, v: -8 } ] },
    { bone: 'weapon', prop: 'rot', keys: [ { t: 0, v: 4 }, { t: 1.4, v: -8 }, { t: 2.8, v: 4 } ] },
  ],
};

/**
 * 揮擊（剪影可讀版，0.72s）：
 * 蓄勢大後引（臂 -130°）→ 爆發踏步前撲 → 定格 → 收招。
 * 武器 follow-through 刻意滯後，令斬弧喺剪影入面清楚。
 */
const ATTACK: SparClip = {
  name: 'attack',
  dur: 0.72,
  tracks: [
    {
      bone: 'arm', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -130, e: 'expoin' },
        { t: 0.36, v: 38, e: 'linear' },
        { t: 0.48, v: 32, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'weapon', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'inout' },
        { t: 0.2, v: 22, e: 'in' },
        { t: 0.3, v: 10, e: 'expoin' },
        { t: 0.38, v: 48, e: 'out' },
        { t: 0.52, v: 28, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -8, e: 'expoin' },
        { t: 0.36, v: 10, e: 'linear' },
        { t: 0.5, v: 8, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'x',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -18, e: 'expoin' },
        { t: 0.36, v: 92, e: 'linear' },
        { t: 0.52, v: 86, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'y',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: 12, e: 'expoin' },
        { t: 0.36, v: -8, e: 'linear' },
        { t: 0.5, v: -2, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'sy',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -0.04, e: 'expoin' },
        { t: 0.36, v: 0.05, e: 'linear' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'head', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -6, e: 'expoin' },
        { t: 0.36, v: 8, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
  ],
  events: [{ t: 0.36, id: 'strike' }],
};

/** 敵影潰散：飛退＋翻仰＋壓扁，剪影碎散感 */
const ENEMY_DEATH: SparClip = {
  name: 'enemy-death',
  dur: 0.62,
  tracks: [
    { bone: 'enemy', prop: 'alpha', keys: [ { t: 0, v: 1, e: 'linear' }, { t: 0.12, v: 1, e: 'in' }, { t: 0.62, v: 0 } ] },
    { bone: 'enemy', prop: 'x', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.62, v: 36 } ] },
    { bone: 'enemy', prop: 'y', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.18, v: -28, e: 'in' }, { t: 0.62, v: 58 } ] },
    { bone: 'enemy', prop: 'rot', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.62, v: 28 } ] },
    { bone: 'enemy', prop: 'sy', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.2, v: 0.08, e: 'in' }, { t: 0.62, v: -0.35 } ] },
  ],
};

/** 新敵影由地影抽高凝聚 */
const ENEMY_SPAWN: SparClip = {
  name: 'enemy-spawn',
  dur: 0.5,
  tracks: [
    { bone: 'enemy', prop: 'alpha', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.5, v: 1 } ] },
    { bone: 'enemy', prop: 'sy', keys: [ { t: 0, v: -0.55, e: 'out' }, { t: 0.5, v: 0 } ] },
    { bone: 'enemy', prop: 'y', keys: [ { t: 0, v: 36, e: 'out' }, { t: 0.5, v: 0 } ] },
  ],
};

export const SPAR_CLIPS: Record<string, SparClip> = {
  idle: IDLE,
  attack: ATTACK,
  'enemy-death': ENEMY_DEATH,
  'enemy-spawn': ENEMY_SPAWN,
};
