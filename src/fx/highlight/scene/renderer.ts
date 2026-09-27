/**
 * 高光時刻 3D 舞台：卡通著色 ＋ 後期邊緣描邊。
 *
 * 流程（每幀）：
 *   1. colorRT（MSAA×4，1.5 倍超採樣）：卡通材質正常渲染，透明底（背後係 DOM 光效層）
 *   2. normalRT（無 MSAA，附 depthTexture）：覆蓋成法線材質，出視空間法線＋深度
 *   3. 合成 pass：外輪廓（覆蓋率跨背景，粗）＋ 零件交界（法線差為主、深度差放寬，幼）→ 畫到畫布
 * 線寬以螢幕像素計，鏡頭推近推遠都一樣粗。唔用「放大背面」描邊。
 */
import * as THREE from 'three';
import { OUTLINE } from '../grades';

const SUPERSAMPLE = 1.5;

const COMPOSITE_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 texel;        // 1 / RT 尺寸
uniform float outerPx;     // 外輪廓半徑（RT 像素）
uniform float innerPx;     // 內線半徑（RT 像素）
uniform vec3 lineColor;
uniform float cameraNear;
uniform float cameraFar;
varying vec2 vUv;

float linDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
}
float covered(vec2 uv) { return texture2D(tDepth, uv).x < 0.9999 ? 1.0 : 0.0; }

void main() {
  vec4 col = texture2D(tColor, vUv);
  float here = covered(vUv);

  // 外輪廓：半徑內任何一點覆蓋狀態唔同 → 邊（向內外各長，粗細一致）
  float outer = 0.0;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 0.3926991;
    vec2 d = vec2(cos(a), sin(a));
    outer = max(outer, abs(covered(vUv + d * outerPx * texel) - here));
    outer = max(outer, abs(covered(vUv + d * outerPx * 0.5 * texel) - here));
  }

  // 內線：只喺主體上計；法線差為主，深度差門檻放寬（斜面唔會冒細碎斜紋）
  float inner = 0.0;
  if (here > 0.5) {
    vec3 n0 = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
    float z0 = linDepth(texture2D(tDepth, vUv).x);
    vec2 offs[4];
    offs[0] = vec2(innerPx, 0.0); offs[1] = vec2(-innerPx, 0.0);
    offs[2] = vec2(0.0, innerPx); offs[3] = vec2(0.0, -innerPx);
    for (int i = 0; i < 4; i++) {
      vec2 uv = vUv + offs[i] * texel;
      if (covered(uv) < 0.5) continue;
      vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
      float z = linDepth(texture2D(tDepth, uv).x);
      float nEdge = smoothstep(0.55, 0.35, dot(n0, n));
      float zEdge = smoothstep(0.06, 0.12, abs(z - z0) / max(z0, 0.001));
      inner = max(inner, max(nEdge, zEdge));
    }
  }

  float edge = max(outer, inner);
  // colorRT 背景透明（rgb＝0），即係預乘；線色疊上去保持預乘
  vec3 rgb = col.rgb * (1.0 - edge) + lineColor * edge;
  float alpha = max(col.a, edge);
  gl_FragColor = vec4(rgb, alpha);
  #include <colorspace_fragment>
}
`;

export interface StageOptions {
  canvas: HTMLCanvasElement;
  /** 低端機／減少動態：唔超採樣 */
  lowPower?: boolean;
}

export class HighlightStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  /** 主體掛喺呢度（動畫改 subjectRoot 嘅 transform） */
  readonly subjectRoot = new THREE.Group();
  /** 台座等其他物件（揭曉舞台時隱藏，免得描邊畫落幕布） */
  readonly props = new THREE.Group();
  readonly keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
  readonly skyLight = new THREE.HemisphereLight(0xcfe3ff, 0x3a2a4a, 1.1);
  readonly rimLight = new THREE.DirectionalLight(0xffffff, 3.2);

  private colorRT: THREE.WebGLRenderTarget;
  private normalRT: THREE.WebGLRenderTarget;
  private normalMat = new THREE.MeshNormalMaterial();
  private quadScene = new THREE.Scene();
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private composite: THREE.ShaderMaterial;
  private ss: number;
  private width = 1;
  private height = 1;

  constructor(opts: StageOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.ss = opts.lowPower ? 1 : SUPERSAMPLE;

    this.colorRT = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
    this.normalRT = new THREE.WebGLRenderTarget(1, 1, { samples: 0 });
    this.normalRT.depthTexture = new THREE.DepthTexture(1, 1);
    this.normalRT.depthTexture.type = THREE.UnsignedIntType;

    this.composite = new THREE.ShaderMaterial({
      vertexShader: COMPOSITE_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: this.normalRT.depthTexture },
        texel: { value: new THREE.Vector2() },
        outerPx: { value: 3.2 },
        innerPx: { value: 1.2 },
        lineColor: { value: new THREE.Color(OUTLINE) },
        cameraNear: { value: this.camera.near },
        cameraFar: { value: this.camera.far },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.composite));

    this.camera.position.set(0, 1.15, 9.2);
    this.camera.lookAt(0, 0.55, 0);

    this.keyLight.position.set(-3, 5, 4);
    this.rimLight.position.set(2.5, 2.2, -5);
    this.scene.add(this.keyLight, this.skyLight, this.rimLight, this.subjectRoot, this.props);
  }

  /** CSS 尺寸 × dpr；RT 再乘超採樣（上限 2560，免得高解像手機爆記憶體） */
  resize(cssW: number, cssH: number, dpr: number) {
    this.width = Math.max(1, Math.round(cssW * dpr));
    this.height = Math.max(1, Math.round(cssH * dpr));
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.width, this.height, false);
    const k = Math.min(this.ss, 2560 / Math.max(this.width, this.height));
    const rw = Math.round(this.width * k);
    const rh = Math.round(this.height * k);
    this.colorRT.setSize(rw, rh);
    this.normalRT.setSize(rw, rh);
    this.composite.uniforms.texel!.value.set(1 / rw, 1 / rh);
    // 線寬以輸出像素定義（dpr 1 時外 2.2px、內 0.9px），換算落 RT 像素
    const perOut = rw / this.width;
    this.composite.uniforms.outerPx!.value = 2.4 * dpr * perOut;
    this.composite.uniforms.innerPx!.value = Math.max(1, 0.9 * dpr * perOut);
    this.camera.aspect = cssW / cssH;
    // 窄屏：拉遠少少，主體唔好出界
    this.camera.fov = cssW / cssH < 0.62 ? 38 : 32;
    this.camera.updateProjectionMatrix();
  }

  setRimColor(color: THREE.ColorRepresentation) {
    this.rimLight.color.set(color);
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(this.colorRT);
    r.clear();
    r.render(this.scene, this.camera);

    this.scene.overrideMaterial = this.normalMat;
    r.setRenderTarget(this.normalRT);
    r.clear();
    r.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;

    r.setRenderTarget(null);
    r.clear();
    r.render(this.quadScene, this.quadCam);
  }

  /** 世界座標 → 畫布 CSS 座標（粒子、卡片由主體飛出用） */
  project(v: THREE.Vector3, cssW: number, cssH: number): { x: number; y: number } {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * cssW, y: (-p.y * 0.5 + 0.5) * cssH };
  }

  dispose() {
    this.colorRT.dispose();
    this.normalRT.dispose();
    this.normalMat.dispose();
    this.composite.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
  }
}
