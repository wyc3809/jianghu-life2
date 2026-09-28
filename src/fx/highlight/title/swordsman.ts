/**
 * 主頁主角：斗笠劍客（真 3D，全部幾何拼出，唔貼線條、冇臉）。
 *
 * 結構：斗笠（厚錐＋竹篾骨＋包邊＋頂鈕）、垂紗（直褶）、交領上衣、腰帶（結＋兩條垂帶）、
 * 玉佩（繩＋玉環＋流蘇）、開衩長袍（包邊）、褲、靴、闊袖（袖口包邊）、手、
 * 披風（逐格頂點受風）、劍鞘（鞘口／鞘尾泥金）、劍（纏繩劍柄、護手、劍首、劍穗）。
 *
 * 角色面向 +z（鏡頭）；角色右手喺世界 −x（畫面左）。
 * 動作部件：頭／斗笠擺、垂紗擺、披風受風、腰帶垂帶、劍穗、左右臂；拔劍時劍由劍鞘轉去右手。
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon } from '../scene/toon';

/** 設色（低飽和礦物顏料；toon 暗部會自動收淡） */
export const HERO_COLORS = {
  robe: '#E4DDCD',
  inner: '#77736B',
  trim: '#4F5A5E',
  cape: '#4B4741',
  hat: '#C9B387',
  hatRib: '#9C845B',
  veil: '#F2EDE2',
  belt: '#A33A32',
  jade: '#8DB09B',
  skin: '#E3D3B9',
  face: '#8C857A',
  boot: '#3A342C',
  scabbard: '#5B4232',
  gold: '#B08A3E',
  blade: '#DDE0DC',
  grip: '#3A342C',
  tassel: '#A33A32',
} as const;

export interface HeroPose {
  /** 呼吸 0–1 */
  breath: number;
  /** 風力 0–1（披風、垂紗、垂帶、劍穗幅度） */
  wind: number;
  /** 右臂：前擺（x）、外展（z） */
  rArmX: number;
  rArmZ: number;
  /** 左臂 */
  lArmX: number;
  lArmZ: number;
  /** 蹲低（0–1） */
  crouch: number;
  /** 上身扭（弧度） */
  twist: number;
}

export interface HeroModel {
  root: THREE.Group;
  /** 每幀：時間（秒）＋姿勢 */
  update(t: number, pose: HeroPose): void;
  /** 拔劍：劍由鞘轉去右手（即時切，喺快速動作入面換，睇唔到） */
  drawSword(): void;
  /** 收劍（重置） */
  sheathSword(): void;
  /** 劍尖（世界座標；流光軌跡用） */
  swordTip(out: THREE.Vector3): THREE.Vector3;
  height: number;
}

export function defaultPose(): HeroPose {
  return { breath: 0, wind: 0.35, rArmX: 0.08, rArmZ: -0.14, lArmX: -0.5, lArmZ: 0.12, crouch: 0, twist: 0 };
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function rbox(w: number, h: number, d: number, r = 0.02): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
}

function lathe(pts: [number, number][], segs = 40, phiStart = 0, phiLength = Math.PI * 2): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    segs,
    phiStart,
    phiLength,
  );
}

/** 雙面材質（開口薄片：垂紗、披風、袍） */
function toon2(color: string) {
  const m = toon(color);
  m.side = THREE.DoubleSide;
  return m;
}

// ---------------------------------------------------------------- 部件 ---

/** 斗笠：厚錐（上下兩面＋圓邊）、16 條竹篾、包邊、頂鈕 */
function buildHat(): THREE.Group {
  const g = new THREE.Group();
  const hat = toon(HERO_COLORS.hat);
  const rib = toon(HERO_COLORS.hatRib);
  // 閉合輪廓：頂 → 外沿 → 底面 → 返中心（有厚度）
  g.add(
    mesh(
      lathe(
        [
          [0, 0.36],
          [0.07, 0.345],
          [0.42, 0.14],
          [0.8, -0.005],
          [0.815, -0.03],
          [0.78, -0.045],
          [0.42, 0.085],
          [0.1, 0.22],
          [0, 0.225],
        ],
        56,
      ),
      hat,
    ),
  );
  // 竹篾骨：沿斜面放射（真幾何，凸起喺面上）
  const slope = Math.atan2(0.345 - 0.0, 0.8 - 0.07);
  const len = Math.hypot(0.8 - 0.1, 0.33);
  for (let i = 0; i < 16; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i / 16) * Math.PI * 2;
    const b = mesh(rbox(len, 0.018, 0.022, 0.008), rib, 0.44, 0.17 + 0.012, 0);
    b.rotation.z = -slope;
    arm.add(b);
    g.add(arm);
  }
  // 包邊：外沿一圈竹圈
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.026, 8, 64), rib);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.02;
  g.add(rim);
  // 頂鈕
  g.add(mesh(new THREE.SphereGeometry(0.055, 16, 12), rib, 0, 0.36, 0));
  return g;
}

/** 垂紗：開口圓筒，直褶（半徑隨角度起伏）；頂點記住原位，受風時擺 */
function buildVeil(): { mesh: THREE.Mesh; base: Float32Array } {
  // 前面開縫（見到斗笠下嘅淡墨陰影面，冇五官）；下擺參差
  const GAP = 0.42;
  const geo = new THREE.CylinderGeometry(0.58, 0.61, 0.22, 72, 4, true, GAP, Math.PI * 2 - GAP * 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const a = Math.atan2(x, z);
    const k = 1 + 0.022 * Math.cos(a * 22);
    const bottom = (0.11 - y) / 0.22;
    const ragged = bottom * bottom * 0.035 * (0.5 + 0.5 * Math.cos(a * 9 + 1));
    pos.setXYZ(i, x * k, y + ragged, z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, toon2(HERO_COLORS.veil));
  return { mesh: m, base: Float32Array.from(pos.array as Float32Array) };
}

/** 披風：背後弧形網格，向下擴開；頂點逐幀受風 */
function buildCape(): { mesh: THREE.Mesh; base: Float32Array; v: Float32Array; u: Float32Array } {
  const COLS = 22;
  const ROWS = 16;
  const geo = new THREE.PlaneGeometry(1, 1, COLS, ROWS);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const us = new Float32Array(pos.count);
  const vs = new Float32Array(pos.count);
  const A0 = Math.PI - 1.12;
  const A1 = Math.PI + 1.12;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5; // 0–1 左右
    const v = 0.5 - pos.getY(i); // 0 頂 → 1 底
    const a = A0 + (A1 - A0) * u;
    const r = 0.41 + 0.3 * Math.pow(v, 0.9);
    const y = 1.6 - v * 1.2;
    pos.setXYZ(i, Math.sin(a) * r, y, Math.cos(a) * r);
    us[i] = u;
    vs[i] = v;
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, toon2(HERO_COLORS.cape));
  return { mesh: m, base: Float32Array.from(pos.array as Float32Array), u: us, v: vs };
}

/** 劍：劍首＋纏繩劍柄＋護手＋劍身（中脊）＋劍穗；原點＝護手，劍柄向 +y，劍身向 −y */
function buildSword(): { group: THREE.Group; tip: THREE.Object3D; tassel: THREE.Group } {
  const g = new THREE.Group();
  const gold = toon(HERO_COLORS.gold);
  const grip = toon(HERO_COLORS.grip);
  const blade = toon(HERO_COLORS.blade);
  // 護手
  g.add(mesh(rbox(0.2, 0.045, 0.075, 0.018), gold, 0, 0, 0));
  // 劍柄＋三圈纏繩
  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.2, 16), grip, 0, 0.12, 0));
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.008, 6, 20), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06 + i * 0.06;
    g.add(ring);
  }
  // 劍首
  g.add(mesh(new THREE.SphereGeometry(0.042, 16, 12), gold, 0, 0.24, 0));
  // 劍身：扁身＋中脊，尖端收窄
  const bl = 0.98;
  g.add(mesh(rbox(0.058, bl, 0.014, 0.006), blade, 0, -bl / 2 - 0.02, 0));
  g.add(mesh(rbox(0.012, bl * 0.95, 0.022, 0.005), blade, 0, -bl / 2 - 0.02, 0));
  const tipGeo = new THREE.ConeGeometry(0.029, 0.09, 4);
  tipGeo.scale(1, 1, 0.3);
  const tipMesh = mesh(tipGeo, blade, 0, -bl - 0.065, 0);
  tipMesh.rotation.x = Math.PI;
  g.add(tipMesh);
  const tip = new THREE.Object3D();
  tip.position.y = -bl - 0.11;
  g.add(tip);
  // 劍穗：繫喺劍首，受風擺
  const tassel = new THREE.Group();
  tassel.position.y = 0.26;
  tassel.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), grip, 0, -0.05, 0));
  tassel.add(mesh(new THREE.SphereGeometry(0.02, 10, 8), gold, 0, -0.1, 0));
  const tas = new THREE.ConeGeometry(0.035, 0.16, 10);
  tassel.add(mesh(tas, toon(HERO_COLORS.tassel), 0, -0.19, 0));
  g.add(tassel);
  return { group: g, tip, tassel };
}

/** 劍鞘：原點＝鞘口，向 −y 延伸；鞘口、中箍、鞘尾泥金 */
function buildScabbard(): THREE.Group {
  const g = new THREE.Group();
  const wood = toon(HERO_COLORS.scabbard);
  const gold = toon(HERO_COLORS.gold);
  g.add(mesh(rbox(0.09, 1.02, 0.045, 0.02), wood, 0, -0.51, 0));
  g.add(mesh(rbox(0.105, 0.08, 0.058, 0.02), gold, 0, -0.03, 0));
  g.add(mesh(rbox(0.1, 0.035, 0.054, 0.012), gold, 0, -0.42, 0));
  g.add(mesh(rbox(0.105, 0.1, 0.058, 0.03), gold, 0, -1.0, 0));
  return g;
}

/** 手臂：肩為原點，闊袖向下擴，袖口包邊，手 */
function buildArm(): { arm: THREE.Group; hand: THREE.Group } {
  const arm = new THREE.Group();
  const robe = toon(HERO_COLORS.robe);
  const trim = toon(HERO_COLORS.trim);
  const skin = toon(HERO_COLORS.skin);
  arm.add(mesh(new THREE.SphereGeometry(0.115, 16, 12), robe, 0, -0.02, 0));
  arm.add(mesh(new THREE.CylinderGeometry(0.105, 0.175, 0.6, 24), robe, 0, -0.31, 0));
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.022, 8, 28), trim);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.6;
  arm.add(cuff);
  const hand = new THREE.Group();
  hand.position.y = -0.68;
  hand.add(mesh(new THREE.SphereGeometry(0.068, 14, 10), skin, 0, 0, 0));
  arm.add(hand);
  return { arm, hand };
}

// ---------------------------------------------------------------- 組裝 ---

export function buildSwordsman(): HeroModel {
  const root = new THREE.Group();
  const body = new THREE.Group(); // 蹲低、扭腰都喺呢層
  root.add(body);
  const robe = toon(HERO_COLORS.robe);
  const robe2 = toon2(HERO_COLORS.robe);
  const inner = toon(HERO_COLORS.inner);
  const trim = toon(HERO_COLORS.trim);
  const boot = toon(HERO_COLORS.boot);
  const belt = toon(HERO_COLORS.belt);
  const jade = toon(HERO_COLORS.jade);
  const skin = toon(HERO_COLORS.skin);

  // 靴＋褲
  for (const x of [-0.14, 0.14]) {
    root.add(mesh(rbox(0.17, 0.12, 0.3, 0.05), boot, x, 0.06, 0.04));
    root.add(mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 16), inner, x, 0.36, 0));
  }

  // 長袍下擺：有厚度嘅開衩（前面留縫見褲）
  const SLIT = 0.36;
  body.add(
    mesh(
      lathe(
        [
          [0.3, 1.16],
          [0.34, 1.0],
          [0.43, 0.7],
          [0.5, 0.42],
          [0.53, 0.33],
          [0.5, 0.33],
          [0.47, 0.42],
          [0.4, 0.7],
          [0.31, 1.0],
          [0.27, 1.16],
        ],
        48,
        SLIT,
        Math.PI * 2 - SLIT * 2,
      ),
      robe2,
    ),
  );
  // 下擺包邊（弧形，跟開衩）
  const hemR = 0.53;
  const hem = new THREE.Mesh(new THREE.TorusGeometry(hemR, 0.026, 8, 60, Math.PI * 2 - SLIT * 2), trim);
  hem.rotation.x = Math.PI / 2;
  hem.rotation.z = Math.PI / 2 + SLIT; // 缺口對正前面
  hem.position.y = 0.34;
  body.add(hem);
  // 開衩兩邊直包邊
  for (const s of [-1, 1]) {
    const edge = new THREE.Group();
    edge.rotation.y = s * SLIT;
    const e = mesh(rbox(0.04, 0.86, 0.04, 0.015), trim, 0, 0.76, 0);
    // 沿袍邊斜落（上窄下闊）
    e.position.z = 0.41;
    e.rotation.x = -0.26;
    edge.add(e);
    body.add(edge);
  }

  // 上身
  const torso = new THREE.Group();
  body.add(torso);
  torso.add(
    mesh(
      lathe(
        [
          [0, 1.1],
          [0.3, 1.12],
          [0.33, 1.3],
          [0.37, 1.48],
          [0.35, 1.58],
          [0.22, 1.67],
          [0.1, 1.71],
          [0, 1.72],
        ],
        40,
      ),
      robe,
    ),
  );
  // 交領：兩條領緣斜交（右衽：角色左襟蓋右襟）
  const collarL = mesh(rbox(0.07, 0.46, 0.03, 0.012), trim, 0.05, 1.43, 0.325);
  collarL.rotation.set(-0.3, 0, 0.55);
  const collarR = mesh(rbox(0.07, 0.4, 0.03, 0.012), trim, -0.07, 1.46, 0.312);
  collarR.rotation.set(-0.3, 0, -0.5);
  // 內衫三角（淡墨）
  const innerV = mesh(rbox(0.1, 0.14, 0.02, 0.01), inner, -0.01, 1.57, 0.27);
  innerV.rotation.x = -0.45;
  torso.add(collarL, collarR, innerV);

  // 腰帶＋結＋兩條垂帶
  torso.add(mesh(new THREE.CylinderGeometry(0.325, 0.33, 0.11, 40), belt, 0, 1.16, 0));
  torso.add(mesh(rbox(0.1, 0.08, 0.05, 0.025), belt, 0.12, 1.16, 0.315));
  const ribbons: THREE.Group[] = [];
  for (const [x, len, rz] of [
    [0.1, 0.34, 0.06],
    [0.15, 0.28, -0.08],
  ] as const) {
    const rg = new THREE.Group();
    rg.position.set(x, 1.13, 0.33);
    rg.rotation.z = rz;
    rg.add(mesh(rbox(0.045, len, 0.014, 0.008), belt, 0, -len / 2, 0));
    torso.add(rg);
    ribbons.push(rg);
  }
  // 玉佩：繩（斜出袍外）＋玉環＋流蘇
  const pendant = new THREE.Group();
  pendant.position.set(-0.13, 1.1, 0.33);
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), inner, 0, -0.1, 0.04);
  cord.rotation.x = -0.4;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.017, 10, 24), jade);
  ring.position.set(0, -0.23, 0.09);
  const tas = mesh(new THREE.ConeGeometry(0.026, 0.12, 8), belt, 0, -0.33, 0.1);
  pendant.add(cord, ring, tas);
  torso.add(pendant);

  // 頸＋頭（大部分藏喺斗笠垂紗後面）
  torso.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 12), skin, 0, 1.74, 0));
  const head = new THREE.Group();
  head.position.y = 1.86;
  torso.add(head);
  // 斗笠下嘅面：淡墨陰影（冇五官，靠造型同姿態認人）
  head.add(mesh(new THREE.SphereGeometry(0.18, 20, 16), toon(HERO_COLORS.face), 0, 0, 0));
  const hat = buildHat();
  hat.position.y = 0.1;
  head.add(hat);
  const veil = buildVeil();
  veil.mesh.position.y = 0.1 - 0.13;
  head.add(veil.mesh);

  // 披風
  const cape = buildCape();
  torso.add(cape.mesh);

  // 手臂（肩為軸）
  const R = buildArm();
  R.arm.position.set(-0.4, 1.55, 0);
  const L = buildArm();
  L.arm.position.set(0.4, 1.55, 0);
  torso.add(R.arm, L.arm);

  // 劍鞘喺左手，斜握，劍柄向右上（身前）
  const scabbard = buildScabbard();
  scabbard.position.set(0, 0.34, 0.02);
  scabbard.rotation.set(0.55, 0, 0.3);
  L.hand.add(scabbard);
  const sword = buildSword();
  scabbard.add(sword.group);

  let drawn = false;

  const tmp = new THREE.Vector3();
  const veilPos = veil.mesh.geometry.attributes.position as THREE.BufferAttribute;
  const capePos = cape.mesh.geometry.attributes.position as THREE.BufferAttribute;

  function update(t: number, p: HeroPose) {
    const w = p.wind;
    // 蹲低：身體下沉、袍唔入地（下擺縮）
    body.position.y = -p.crouch * 0.12;
    body.scale.set(1 + p.crouch * 0.04, 1 - p.crouch * 0.06, 1 + p.crouch * 0.04);
    torso.rotation.y = p.twist;
    torso.scale.set(1 + p.breath * 0.012, 1 + p.breath * 0.02, 1 + p.breath * 0.015);
    // 頭：輕擺
    head.rotation.z = Math.sin(t * 0.9) * 0.025;
    head.rotation.x = Math.sin(t * 0.7 + 1) * 0.02;
    // 手臂
    R.arm.rotation.set(p.rArmX + Math.sin(t * 1.1) * 0.02, 0, p.rArmZ);
    L.arm.rotation.set(p.lArmX, 0, p.lArmZ);
    // 垂紗：越落越擺（受風向 +x）
    const vb = veil.base;
    for (let i = 0; i < veilPos.count; i++) {
      const y0 = vb[i * 3 + 1]!;
      const k = (0.11 - y0) / 0.22; // 0 頂 1 底
      const sway = k * k * (0.03 + w * 0.07) * Math.sin(t * 2.3 + vb[i * 3]! * 3 + vb[i * 3 + 2]! * 2);
      veilPos.setXYZ(i, vb[i * 3]! + sway + k * w * 0.05, y0, vb[i * 3 + 2]! + sway * 0.4);
    }
    veilPos.needsUpdate = true;
    veil.mesh.geometry.computeVertexNormals();
    // 披風：風由左吹向右，底部擺最大；一波一波
    const cb = cape.base;
    for (let i = 0; i < capePos.count; i++) {
      const v = cape.v[i]!;
      const u = cape.u[i]!;
      const k = Math.pow(v, 1.4);
      const wave = Math.sin(t * 2.6 + v * 4.2 + u * 5.5) * 0.5 + Math.sin(t * 1.3 + u * 3) * 0.5;
      const amp = k * (0.05 + w * 0.2);
      const bx = cb[i * 3]!;
      const bz = cb[i * 3 + 2]!;
      const rl = Math.hypot(bx, bz) || 1;
      capePos.setXYZ(
        i,
        bx + k * w * 0.32 + wave * amp * 0.5,
        cb[i * 3 + 1]! + k * w * 0.1 * (0.5 + 0.5 * wave),
        bz + (bz / rl) * (amp * (0.6 + wave)) - k * w * 0.12,
      );
    }
    capePos.needsUpdate = true;
    cape.mesh.geometry.computeVertexNormals();
    // 垂帶、劍穗、玉佩
    ribbons.forEach((r, i) => {
      r.rotation.x = -0.05 - w * 0.15 + Math.sin(t * 2.8 + i) * (0.05 + w * 0.12);
      r.rotation.z = (i ? -0.08 : 0.06) + w * 0.2 + Math.sin(t * 2.1 + i * 2) * 0.05;
    });
    sword.tassel.rotation.z = 0.3 * w + Math.sin(t * 3.1) * (0.12 + w * 0.2);
    sword.tassel.rotation.x = Math.sin(t * 2.4 + 1) * 0.1;
    pendant.rotation.z = Math.sin(t * 1.9) * 0.06 + w * 0.08;
  }

  function drawSword() {
    if (drawn) return;
    drawn = true;
    R.hand.add(sword.group);
    // 右手握柄：劍柄沿臂向肩，劍身向外延伸
    sword.group.position.set(0, 0.12, 0);
    sword.group.rotation.set(0, 0, 0);
  }

  function sheathSword() {
    if (!drawn) return;
    drawn = false;
    scabbard.add(sword.group);
    sword.group.position.set(0, 0, 0);
    sword.group.rotation.set(0, 0, 0);
  }

  update(0, defaultPose());
  const height = new THREE.Box3().setFromObject(root).getSize(tmp).y;

  return {
    root,
    update,
    drawSword,
    sheathSword,
    swordTip: (out) => {
      root.updateMatrixWorld(true);
      return sword.tip.getWorldPosition(out);
    },
    height,
  };
}
