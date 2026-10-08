/**
 * 打鬥演出嘅水墨 shader：
 *   - 人物剪影：位圖剪影＋墨暈化開邊、受擊朱砂閃、化墨散開（溶解）
 *   - 筆觸刀光：沿弧線嘅毛筆帶（飛白、頭重尾輕），按 head／tail 畫出
 *   - 墨霧：fbm 雜訊飄移嘅淡墨
 * 全部係 Three.js 幾何＋shader，唔用 SVG。
 */
import * as THREE from 'three';
import type { VolumeStroke } from './strokes';

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
`;

const BASIC_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// ------------------------------------------------------------------ 人物剪影 ---

export function fighterMaterial(map: THREE.Texture, flip: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D map;
      uniform float uFlip;
      uniform float uDissolve;   // 0＝完整，1＝散晒
      uniform vec3 uInk;
      uniform vec3 uTint;
      uniform float uTintAmt;    // 受擊朱砂閃
      uniform float uBleed;      // 墨暈濃度
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 uv = vec2(uFlip > 0.5 ? 1.0 - vUv.x : vUv.x, vUv.y);
        float a = texture2D(map, uv).a;
        // 墨暈：周圍取樣，化開成淡墨邊
        float halo = 0.0;
        for (int i = 0; i < 8; i++) {
          float ang = float(i) * 0.785398;
          halo += texture2D(map, uv + vec2(cos(ang), sin(ang)) * 0.018).a;
        }
        halo /= 8.0;
        // 溶解：雜訊門檻，邊緣留一圈濃墨
        float n = fbm(uv * 9.0) * 0.75 + vnoise(uv * 38.0) * 0.25;
        float th = uDissolve * 1.15 - 0.05;
        float keep = smoothstep(th, th + 0.04, n);
        float rim = (1.0 - smoothstep(th + 0.04, th + 0.12, n)) * keep * step(0.001, uDissolve);
        vec3 col = mix(uInk, uTint, uTintAmt);
        col = mix(col, uInk * 0.6, rim);
        float body = a * keep;
        float wash = halo * uBleed * (1.0 - uDissolve) * (1.0 - a);
        float alpha = max(body, wash);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(mix(col, uInk * 1.6, wash > body ? 0.4 : 0.0), alpha);
      }
    `,
    uniforms: {
      map: { value: map },
      uFlip: { value: flip ? 1 : 0 },
      uDissolve: { value: 0 },
      uInk: { value: new THREE.Color('#1C1A17') },
      uTint: { value: new THREE.Color('#A33A32') },
      uTintAmt: { value: 0 },
      uBleed: { value: 0.32 },
    },
    transparent: true,
    depthWrite: false,
  });
}

// ------------------------------------------------------------------ 筆觸刀光 ---

/** 沿一條路徑生成毛筆帶（u＝沿線 0–1，v＝橫跨 0–1；闊度頭重尾輕） */
function ribbonGeometry(path: THREE.Vector2[], width: number): THREE.BufferGeometry {
  const n = path.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = path[i]!;
    const a = path[Math.max(0, i - 1)]!;
    const b = path[Math.min(n - 1, i + 1)]!;
    const dir = new THREE.Vector2(b.x - a.x, b.y - a.y).normalize();
    const nor = new THREE.Vector2(-dir.y, dir.x);
    // 起筆重、收筆尖
    const w = width * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.04)), 0.55) * (1 - 0.35 * t);
    pos.push(p.x + nor.x * w * 0.5, p.y + nor.y * w * 0.5, 0, p.x - nor.x * w * 0.5, p.y - nor.y * w * 0.5, 0);
    uv.push(t, 1, t, 0);
    if (i < n - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function line(len: number, angDeg: number, steps = 40): THREE.Vector2[] {
  const a = (angDeg * Math.PI) / 180;
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1) - 0.5;
    // 輕微弧度，似手揮出嚟
    const bow = Math.sin((t + 0.5) * Math.PI) * len * 0.06;
    out.push(new THREE.Vector2(Math.cos(a) * t * len - Math.sin(a) * bow, Math.sin(a) * t * len + Math.cos(a) * bow));
  }
  return out;
}

function arc(r: number, from: number, to: number, angDeg: number, steps = 56, spiral = 0): THREE.Vector2[] {
  const rot = (angDeg * Math.PI) / 180;
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const th = from + (to - from) * t;
    const rr = r * (1 + spiral * (t - 0.5));
    const x = Math.cos(th) * rr;
    const y = Math.sin(th) * rr * 0.72; // 壓扁少少，似斜斜揮過
    out.push(new THREE.Vector2(x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)));
  }
  return out;
}

/** 一招筆觸可以有幾條帶（交叉＝兩條、雙旋＝兩條） */
export function strokePaths(s: VolumeStroke, mirror = false): THREE.Vector2[][] {
  const m = (ps: THREE.Vector2[]) => (mirror ? ps.map((p) => new THREE.Vector2(-p.x, p.y)) : ps);
  switch (s.shape) {
    case 'straight':
      return [m(line(s.size, s.angle))];
    case 'horizontal':
      return [m(line(s.size, s.angle))];
    case 'cross':
      return [m(line(s.size, s.angle)), m(line(s.size, -s.angle).reverse())];
    case 'round':
      return [m(arc(s.size, Math.PI * 0.95, Math.PI * -0.55, s.angle))];
    case 'thrust':
      return [m(line(s.size, s.angle, 28))];
    case 'spiral':
      return [m(arc(s.size, Math.PI * 1.1, Math.PI * -0.4, s.angle, 56, 0.5)), m(arc(s.size * 0.8, Math.PI * 0.1, Math.PI * -1.4, -s.angle, 56, -0.4))];
    case 'grand':
      return [m(arc(s.size, Math.PI * 1.05, Math.PI * -0.35, s.angle, 64))];
  }
}

export interface BrushMesh {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
}

export function brushMesh(path: THREE.Vector2[], s: VolumeStroke, seed: number): BrushMesh {
  const mat = new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uHead;    // 筆頭位置（0→1.4）
      uniform float uTail;    // 可見長度
      uniform float uOpacity;
      uniform vec3 uColor;
      uniform vec3 uEdge;
      uniform float uEdgeAmt;
      uniform float uSeed;
      uniform float uCore;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        float along = vUv.x;
        float w = abs(vUv.y * 2.0 - 1.0);
        float vis = smoothstep(uHead - uTail, uHead - uTail + 0.18, along) * (1.0 - smoothstep(uHead - 0.015, uHead, along));
        // 飛白：沿筆劃方向拉長嘅雜訊，邊緣乾、中間濕
        float streak = vnoise(vec2(along * 26.0 + uSeed, vUv.y * 11.0)) * 0.6 + vnoise(vec2(along * 70.0, vUv.y * 30.0 + uSeed)) * 0.4;
        float dry = smoothstep(0.22, 0.5, streak + (1.0 - w) * 0.55 - along * 0.25);
        float body = 1.0 - smoothstep(0.72, 1.0, w + (vnoise(vec2(along * 18.0, uSeed)) - 0.5) * 0.25);
        float a = vis * body * dry * uOpacity;
        if (a < 0.01) discard;
        vec3 col = mix(uColor, uEdge, uEdgeAmt * smoothstep(0.45, 0.9, w));
        // 刀光：筆劃中心一道宣紙白，喺黑剪影上都睇得到
        float core = (1.0 - smoothstep(0.08, 0.38, w)) * (1.0 - smoothstep(0.55, 1.0, along)) * uCore;
        col = mix(col, vec3(0.98, 0.965, 0.93), core);
        gl_FragColor = vec4(col, a);
      }
    `,
    uniforms: {
      uHead: { value: 0 },
      uTail: { value: 0.75 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(s.color) },
      uEdge: { value: new THREE.Color(s.edge ?? s.color) },
      uEdgeAmt: { value: s.edgeAmt ?? 0 },
      uSeed: { value: seed },
      uCore: { value: 0.85 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(ribbonGeometry(path, s.width), mat);
  return { mesh, mat };
}

// ------------------------------------------------------------------ 墨霧 ---

export function mistMaterial(color: string, seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uAmt;
      uniform vec3 uColor;
      uniform float uSeed;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = vUv * vec2(3.0, 1.6) + vec2(uTime * 0.05 + uSeed, uSeed * 0.3);
        float n = fbm(p + fbm(p * 0.7 - uTime * 0.03));
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float a = smoothstep(0.38, 0.85, n) * edge * uAmt;
        if (a < 0.005) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uAmt: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSeed: { value: seed },
    },
    transparent: true,
    depthWrite: false,
  });
}
