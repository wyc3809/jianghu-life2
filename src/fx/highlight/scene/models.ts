/**
 * 三個主體嘅真 3D 模型（全部幾何拼出，唔貼線條）：
 * - 寶箱：木板（板與板之間有真縫）、金屬包邊、鉚釘、鎖扣＋寶石、鉸鏈；箱蓋繞後鉸鏈翻開
 * - 令牌：倒角外框、玉面、浮雕劍紋、切面寶石、頂環、流蘇；繞豎軸旋轉
 * - 丹爐：分瓣爐身（瓣間有縫透光）、腰箍、乳釘、三足、雙耳、爐蓋（後鉸鏈掀開）
 * 每個主體入面有「發光核心」，蓄力時經縫隙透光。
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { GradeStyle } from '../grades';
import type { HighlightSubject } from '../types';
import { toon } from './toon';

export interface SubjectModel {
  root: THREE.Group;
  /** 換品階：金屬件換主色、寶石換光色 */
  setGrade(g: GradeStyle): void;
  /** 0–1：縫隙透光強度 */
  setGlow(k: number): void;
  /** 活動部件：由 0（合）到 1（開） */
  setOpen(k: number): void;
  /** 爆點（主體本地座標） */
  burstPoint: THREE.Vector3;
  /** 主體大約高度（投影、鏡頭用） */
  height: number;
}

const DARK_CORE = new THREE.Color('#2A1630');

/** 發光核心：MeshBasic，唔受燈光；顏色由深色插值到光色 */
class GlowCore {
  readonly mat = new THREE.MeshBasicMaterial({ color: DARK_CORE.clone() });
  private target = new THREE.Color('#ffffff');
  private k = 0;
  setColor(c: string) {
    this.target.set(c);
    this.apply();
  }
  set(k: number) {
    this.k = k;
    this.apply();
  }
  private apply() {
    this.mat.color.copy(DARK_CORE).lerp(this.target, Math.min(1, this.k));
  }
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function rbox(w: number, h: number, d: number, r = 0.025): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** 切面寶石：扁八面體，每面獨立法線（每個切面一個色階） */
function gem(size: number, mat: THREE.MeshToonMaterial): THREE.Mesh {
  const g = new THREE.OctahedronGeometry(size, 0);
  g.scale(1, 1.25, 0.55);
  // 非索引幾何＋重算法線＝每個切面一個法線（切面感）
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  return m;
}

// ---------------------------------------------------------------- 寶箱 ---

function buildChest(): SubjectModel {
  const root = new THREE.Group();
  const W = 2.2;
  const D = 1.45;
  const H = 1.05;
  const T = 0.12; // 板厚
  const GAP = 0.038; // 板縫
  const woods = [toon('#B8743A'), toon('#A8652E'), toon('#C4824A')];
  const metal = toon('#C9CCD6');
  const rivetMat = toon('#E9ECF4');
  const gemMat = toon('#FFFFFF');
  const dark = toon('#1A1033');
  const core = new GlowCore();

  const body = new THREE.Group();
  root.add(body);
  // 底板
  body.add(mesh(rbox(W, T, D), woods[1]!, 0, T / 2, 0));
  // 前後：三條橫板，板間留縫
  const plankH = (H - T - GAP * 3) / 3;
  for (let i = 0; i < 3; i++) {
    const y = T + GAP + i * (plankH + GAP) + plankH / 2;
    for (const z of [D / 2 - T / 2, -D / 2 + T / 2]) {
      body.add(mesh(rbox(W, plankH, T), woods[(i + (z > 0 ? 0 : 1)) % 3]!, 0, y, z));
    }
    // 左右側板（夾喺前後板中間）
    for (const x of [W / 2 - T / 2, -W / 2 + T / 2]) {
      body.add(mesh(rbox(T, plankH, D - T * 2), woods[(i + 2) % 3]!, x, y, 0));
    }
  }
  // 內膽發光核心（由板縫透出）
  body.add(
    mesh(new THREE.BoxGeometry(W - T * 2 - 0.02, H - T - 0.06, D - T * 2 - 0.02), core.mat, 0, T + (H - T) / 2, 0),
  );

  // 金屬直箍（前後各兩條）＋鉚釘
  const strapX = [-W * 0.29, W * 0.29];
  for (const x of strapX) {
    for (const zs of [1, -1]) {
      body.add(mesh(rbox(0.17, H + 0.02, 0.04, 0.012), metal, x, H / 2, zs * (D / 2 + 0.02)));
      for (let k = 0; k < 3; k++) {
        const r = mesh(new THREE.SphereGeometry(0.035, 12, 8), rivetMat, x, 0.2 + k * 0.32, zs * (D / 2 + 0.045));
        body.add(r);
      }
    }
  }
  // 四角包邊（L 形兩片）＋角釘
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      body.add(mesh(rbox(0.2, H + 0.03, 0.035, 0.01), metal, sx * (W / 2 - 0.1 + 0.012), H / 2, sz * (D / 2 + 0.017)));
      body.add(mesh(rbox(0.035, H + 0.03, 0.2, 0.01), metal, sx * (W / 2 + 0.017), H / 2, sz * (D / 2 - 0.1 + 0.012)));
      for (const y of [0.14, H - 0.12]) {
        body.add(mesh(new THREE.SphereGeometry(0.03, 10, 8), rivetMat, sx * (W / 2 - 0.06), y, sz * (D / 2 + 0.04)));
      }
    }
  }
  // 頂緣箍
  body.add(mesh(rbox(W + 0.05, 0.07, 0.05, 0.015), metal, 0, H - 0.035, D / 2 + 0.02));
  body.add(mesh(rbox(W + 0.05, 0.07, 0.05, 0.015), metal, 0, H - 0.035, -D / 2 - 0.02));
  // 鎖板＋鎖孔＋寶石
  body.add(mesh(rbox(0.4, 0.44, 0.07, 0.03), metal, 0, H - 0.3, D / 2 + 0.05));
  const keyhole = new THREE.Group();
  keyhole.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), dark, 0, 0.03, 0));
  keyhole.add(mesh(new THREE.BoxGeometry(0.04, 0.02, 0.1), dark, 0, 0.03, -0.05));
  keyhole.rotation.x = Math.PI / 2;
  keyhole.position.set(0, H - 0.34, D / 2 + 0.06);
  body.add(keyhole);
  const lockGem = gem(0.06, gemMat);
  lockGem.position.set(0, H - 0.18, D / 2 + 0.1);
  body.add(lockGem);

  // 箱蓋：鉸鏈喺後頂緣，半圓柱由五條弧板砌成
  const lid = new THREE.Group();
  lid.position.set(0, H, -D / 2);
  root.add(lid);
  const R = D / 2;
  const n = 5;
  const arcGap = GAP / R;
  const seg = (Math.PI - arcGap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const th = i * (seg + arcGap) + seg / 2;
    const chord = 2 * (R - T / 2) * Math.sin(seg / 2);
    const plank = mesh(rbox(W - 0.02, T, chord + 0.005), woods[i % 3]!);
    plank.position.set(0, Math.sin(th) * (R - T / 2), R + Math.cos(th) * (R - T / 2));
    plank.rotation.x = Math.PI / 2 - th;
    lid.add(plank);
  }
  // 蓋兩端半圓板
  const half = new THREE.Shape();
  half.absarc(0, 0, R, 0, Math.PI, false);
  half.lineTo(R, 0);
  const capGeo = new THREE.ExtrudeGeometry(half, {
    depth: T,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
    curveSegments: 24,
  });
  for (const sx of [1, -1]) {
    const cap = mesh(capGeo, woods[2]!);
    cap.rotation.y = -Math.PI / 2;
    cap.position.set(sx > 0 ? W / 2 : -W / 2 + T, 0, R);
    lid.add(cap);
  }
  // 蓋內發光核心（半圓柱）
  const lidCore = mesh(
    new THREE.CylinderGeometry(R - T - 0.01, R - T - 0.01, W - T * 2, 20, 1, false, 0, Math.PI),
    core.mat,
  );
  lidCore.rotation.z = Math.PI / 2; // 軸轉去 x；θ∈[0,π] 落喺 y≥0 半邊
  lidCore.position.set(0, 0, R);
  lid.add(lidCore);
  // 蓋上弧箍＋釘
  for (const x of strapX) {
    const band = mesh(new THREE.TorusGeometry(R + 0.012, 0.04, 8, 28, Math.PI), metal);
    band.rotation.y = Math.PI / 2;
    band.position.set(x, 0, R);
    lid.add(band);
    for (const th of [0.5, 1.57, 2.64]) {
      lid.add(
        mesh(
          new THREE.SphereGeometry(0.035, 12, 8),
          rivetMat,
          x,
          Math.sin(th) * (R + 0.05),
          R + Math.cos(th) * (R + 0.05),
        ),
      );
    }
  }
  // 扣舌（蓋前垂落，蓋住鎖板上半）
  lid.add(mesh(rbox(0.22, 0.26, 0.05, 0.02), metal, 0, -0.06, R * 2 + 0.06));
  // 鉸鏈
  for (const x of strapX) {
    const hinge = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 16), metal, x, 0, -0.04);
    hinge.rotation.z = Math.PI / 2;
    lid.add(hinge);
  }

  root.position.y = 0;
  return {
    root,
    burstPoint: new THREE.Vector3(0, H + 0.2, 0.1),
    height: H + R,
    setGrade(g) {
      metal.color.set(g.main);
      rivetMat.color.set(g.main).lerp(new THREE.Color('#ffffff'), 0.45);
      gemMat.color.set(g.glow);
      core.setColor(g.glow);
    },
    setGlow(k) {
      core.set(k);
    },
    setOpen(k) {
      lid.rotation.x = -1.95 * k;
    },
  };
}

// ---------------------------------------------------------------- 令牌 ---

function swordShape(): THREE.Shape {
  // 浮雕劍紋：劍尖向上（令牌正面）
  const s = new THREE.Shape();
  s.moveTo(0, 0.62);
  s.lineTo(0.07, 0.48);
  s.lineTo(0.07, -0.18);
  s.lineTo(0.24, -0.2);
  s.lineTo(0.24, -0.27);
  s.lineTo(0.05, -0.27);
  s.lineTo(0.05, -0.5);
  s.lineTo(0.09, -0.56);
  s.lineTo(0, -0.64);
  s.lineTo(-0.09, -0.56);
  s.lineTo(-0.05, -0.5);
  s.lineTo(-0.05, -0.27);
  s.lineTo(-0.24, -0.27);
  s.lineTo(-0.24, -0.2);
  s.lineTo(-0.07, -0.18);
  s.lineTo(-0.07, 0.48);
  s.lineTo(0, 0.62);
  return s;
}

function buildToken(): SubjectModel {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  const metal = toon('#C9CCD6');
  const jade = toon('#E6F2DD');
  const relief = toon('#7A8B99');
  const gemMat = toon('#FFFFFF');
  const cord = toon('#C8323C');
  const core = new GlowCore();
  const CY = 1.15; // 牌心高度
  const FW = 1.5;
  const FH = 2.05;
  const DEPTH = 0.26;

  // 外框（有洞嘅倒角擠出）
  const frame = roundedRectShape(FW, FH, 0.3);
  frame.holes.push(roundedRectShape(FW - 0.34, FH - 0.34, 0.16) as unknown as THREE.Path);
  const frameGeo = new THREE.ExtrudeGeometry(frame, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 3,
    curveSegments: 16,
  });
  frameGeo.translate(0, 0, -DEPTH / 2);
  spin.add(mesh(frameGeo, metal, 0, CY, 0));

  // 發光核心：夾喺前後玉面之間，經玉面四周嘅縫透光
  spin.add(mesh(new THREE.BoxGeometry(FW - 0.36, FH - 0.36, DEPTH * 0.5), core.mat, 0, CY, 0));

  // 前後玉面（比洞細一圈 → 留縫）
  const plateGeo = new THREE.ExtrudeGeometry(roundedRectShape(FW - 0.44, FH - 0.44, 0.12), {
    depth: 0.05,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 2,
  });
  for (const sz of [1, -1]) {
    const p = mesh(plateGeo, jade, 0, CY, sz * (DEPTH / 2 - 0.02));
    if (sz < 0) p.rotation.y = Math.PI;
    spin.add(p);
  }
  // 正面浮雕劍、背面浮雕圓紋
  const sword = mesh(
    new THREE.ExtrudeGeometry(swordShape(), {
      depth: 0.05,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 1,
    }),
    relief,
    0,
    CY,
    DEPTH / 2 + 0.03,
  );
  spin.add(sword);
  const ringGeo = new THREE.TorusGeometry(0.34, 0.05, 10, 32);
  const backRing = mesh(ringGeo, relief, 0, CY, -DEPTH / 2 - 0.05);
  spin.add(backRing);
  spin.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 20), relief, 0, CY, -DEPTH / 2 - 0.05).rotateX(Math.PI / 2));

  // 四角切面寶石（前後各四）
  const gx = FW / 2 - 0.17;
  const gy = FH / 2 - 0.17;
  for (const sz of [1, -1]) {
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        const g = gem(0.075, gemMat);
        g.position.set(sx * gx, CY + sy * gy, sz * (DEPTH / 2 + 0.07));
        g.rotation.z = Math.PI / 4;
        spin.add(g);
      }
    }
  }
  // 頂環
  spin.add(mesh(new THREE.TorusGeometry(0.17, 0.055, 10, 24), metal, 0, CY + FH / 2 + 0.18, 0));
  // 流蘇（底部）：繩＋結＋穗
  spin.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8), cord, 0, CY - FH / 2 - 0.14, 0));
  spin.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), cord, 0, CY - FH / 2 - 0.3, 0));
  spin.add(mesh(new THREE.ConeGeometry(0.11, 0.34, 12), cord, 0, CY - FH / 2 - 0.5, 0).rotateX(Math.PI));

  return {
    root,
    burstPoint: new THREE.Vector3(0, CY, 0.2),
    height: CY + FH / 2 + 0.3,
    setGrade(g) {
      metal.color.set(g.main);
      relief.color.set(g.main).lerp(new THREE.Color('#1A1033'), 0.35);
      gemMat.color.set(g.glow);
      core.setColor(g.glow);
    },
    setGlow(k) {
      core.set(k);
    },
    setOpen(k) {
      // 揭曉：繞豎軸轉兩圈半（背面轉返正面）
      spin.rotation.y = k * Math.PI * 4;
    },
  };
}

// ---------------------------------------------------------------- 丹爐 ---

function buildCauldron(): SubjectModel {
  const root = new THREE.Group();
  const bronze = toon('#C9CCD6');
  const bandMat = toon('#9AA0B4');
  const studMat = toon('#EEF0F6');
  const gemMat = toon('#FFFFFF');
  const core = new GlowCore();
  const LEG = 0.42;

  // 爐身剖面（封閉：外壁 → 口沿 → 內壁），車床成殼，有厚度
  const outer: [number, number][] = [
    [0.35, 0],
    [0.72, 0.08],
    [0.98, 0.3],
    [1.08, 0.58],
    [1.04, 0.86],
    [0.9, 1.06],
    [0.86, 1.12],
    [0.94, 1.18],
  ];
  const inner: [number, number][] = [
    [0.86, 1.18],
    [0.8, 1.1],
    [0.94, 0.86],
    [0.98, 0.58],
    [0.88, 0.32],
    [0.64, 0.14],
    [0.3, 0.08],
  ];
  const profile = [...outer, ...inner].map(([r, y]) => new THREE.Vector2(r, y));
  const SEGS = 6;
  const gapA = 0.045;
  const segLen = (Math.PI * 2) / SEGS - gapA;
  const body = new THREE.Group();
  body.position.y = LEG;
  root.add(body);
  for (let i = 0; i < SEGS; i++) {
    const g = new THREE.LatheGeometry(profile, 10, i * (segLen + gapA), segLen);
    const m = mesh(g, bronze);
    (m.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
    body.add(m);
  }
  // 核心（爐內丹火）
  body.add(mesh(new THREE.SphereGeometry(0.86, 24, 16), core.mat, 0, 0.62, 0));
  // 腰箍＋口沿箍（把分瓣束住）
  body.add(mesh(new THREE.TorusGeometry(1.085, 0.055, 10, 48), bandMat, 0, 0.6, 0).rotateX(Math.PI / 2));
  body.add(mesh(new THREE.TorusGeometry(0.94, 0.06, 10, 48), bandMat, 0, 1.18, 0).rotateX(Math.PI / 2));
  body.add(mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 40), bandMat, 0, 0.1, 0).rotateX(Math.PI / 2));
  // 乳釘（腰箍上）
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    body.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), studMat, Math.cos(a) * 1.12, 0.6, Math.sin(a) * 1.12));
  }
  // 腹前寶石
  const bellyGem = gem(0.1, gemMat);
  bellyGem.position.set(0, 0.84, 1.07);
  body.add(bellyGem);
  // 雙耳（直立半環）
  for (const sx of [1, -1]) {
    const ear = mesh(new THREE.TorusGeometry(0.22, 0.06, 10, 20, Math.PI), bandMat, sx * 0.78, 1.18, 0);
    ear.rotation.y = Math.PI / 2;
    body.add(ear);
  }
  // 三足：外撇圓柱＋獸爪球
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const leg = new THREE.Group();
    leg.position.set(Math.cos(a) * 0.55, LEG, Math.sin(a) * 0.55);
    leg.rotation.set(Math.sin(a) * -0.25, 0, Math.cos(a) * 0.25);
    leg.add(mesh(new THREE.CylinderGeometry(0.11, 0.07, LEG + 0.1, 12), bronze, 0, -LEG / 2, 0));
    leg.add(mesh(new THREE.SphereGeometry(0.11, 12, 10), studMat, 0, -LEG, 0));
    root.add(leg);
  }
  // 爐蓋：鉸鏈喺後沿
  const lid = new THREE.Group();
  lid.position.set(0, LEG + 1.2, -0.9);
  root.add(lid);
  const domePts = [
    [0.001, 0.56],
    [0.2, 0.52],
    [0.52, 0.36],
    [0.82, 0.12],
    [0.96, 0.02],
    [0.96, 0],
    [0.84, 0],
    [0.7, 0.1],
    [0.44, 0.28],
    [0.18, 0.4],
    [0.001, 0.42],
  ].map(([r, y]) => new THREE.Vector2(r!, y!));
  const dome = mesh(new THREE.LatheGeometry(domePts, 40), bronze, 0, 0, 0.9);
  lid.add(dome);
  lid.add(mesh(new THREE.TorusGeometry(0.95, 0.045, 8, 48), bandMat, 0, 0.02, 0.9).rotateX(Math.PI / 2));
  lid.add(mesh(new THREE.SphereGeometry(0.13, 16, 12), studMat, 0, 0.68, 0.9));
  lid.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.14, 12), bandMat, 0, 0.58, 0.9));
  const hinge = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 14), bandMat, 0, 0.02, -0.02);
  hinge.rotation.z = Math.PI / 2;
  lid.add(hinge);

  return {
    root,
    burstPoint: new THREE.Vector3(0, LEG + 1.3, 0.1),
    height: LEG + 1.9,
    setGrade(g) {
      bronze.color.set(g.main).lerp(new THREE.Color('#8A5A2B'), 0.25);
      bandMat.color.set(g.main).lerp(new THREE.Color('#1A1033'), 0.2);
      studMat.color.set(g.main).lerp(new THREE.Color('#ffffff'), 0.5);
      gemMat.color.set(g.glow);
      core.setColor(g.glow);
    },
    setGlow(k) {
      core.set(k);
    },
    setOpen(k) {
      lid.rotation.x = -1.2 * k; // 斜斜掀開（企直會頂到標題）
    },
  };
}

/** 台座（揭曉舞台時會隱藏） */
export function buildPedestal(): THREE.Group {
  const g = new THREE.Group();
  const stone = toon('#3E3558');
  const rim = toon('#6B5E8F');
  g.add(mesh(new THREE.CylinderGeometry(1.75, 1.9, 0.28, 48), stone, 0, -0.14, 0));
  g.add(mesh(new THREE.TorusGeometry(1.76, 0.06, 8, 48), rim, 0, 0.0, 0).rotateX(Math.PI / 2));
  g.position.y = -0.62;
  return g;
}

export function buildSubject(kind: HighlightSubject): SubjectModel {
  if (kind === 'chest') return buildChest();
  if (kind === 'token') return buildToken();
  return buildCauldron();
}
