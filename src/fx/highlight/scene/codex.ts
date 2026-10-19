/** 第31項：生成絲織封面、書脊鉸位、逐張可翻紙頁；抽卡專用，唔改寶箱。 */
import * as THREE from 'three';
import type { SubjectModel } from './models';
import { codexCoverUrl } from '../codexAppearance';

/** 線裝秘笈以左書脊為軸啟封；setOpen只控制畫面，唔產生抽卡結果。 */
export function buildCodex(premium = false): SubjectModel {
  const root = new THREE.Group();
  const book = new THREE.Group();
  root.add(book);
  book.position.y = 1.22;
  book.rotation.set(-0.15, -0.22, -0.08);
  const cloth = new THREE.MeshStandardMaterial({ color: premium ? '#92703c' : '#325a52', roughness: .94 });
  const paperTexture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}ink/art/gacha/codex-page-right.webp`, () => root.userData.invalidate?.());
  paperTexture.colorSpace = THREE.SRGBColorSpace;
  const leftTexture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}ink/art/gacha/codex-page-left.webp`, () => root.userData.invalidate?.());
  leftTexture.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.MeshStandardMaterial({ color: '#faf0db', map: paperTexture, roughness: 1, side: THREE.DoubleSide });
  const leftPaper = paper.clone(); leftPaper.map = leftTexture;
  const edge = new THREE.MeshStandardMaterial({ color: '#a59069', roughness: .9 });
  const gold = new THREE.MeshStandardMaterial({ color: premium ? '#d0ac60' : '#a7936b', roughness: .6, metalness: .28 });
  const coverMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .92, side: THREE.DoubleSide });
  const loading = new THREE.TextureLoader().load(codexCoverUrl(premium), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    root.userData.invalidate?.();
  });
  coverMat.map = loading;
  // 一旦外層離場dispose，禁止遲到嘅圖片重新建立GPU引用。
  let disposed = false;
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); return m;
  };
  const W = 1.48, H = 2.17;
  book.add(box(W, H, .07, cloth, 0, 0, -.16));
  book.add(box(W - .06, H - .06, .23, paper));
  // 紙張沿右邊及上下露出真正分層，唔以一個白盒冒充紙頁。
  for (let i = 0; i < 17; i++) {
    const z = -.105 + i * .013;
    book.add(box(.013, H - .08, .004, edge, W / 2 - .034, 0, z));
    for (const sy of [-1, 1]) book.add(box(W - .09, .004, .004, edge, 0, sy * (H / 2 - .032), z));
  }
  const cover = new THREE.Group();
  cover.position.set(-W / 2, 0, .155);
  cover.add(box(W, H, .055, cloth, W / 2));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coverMat);
  face.position.set(W / 2, 0, .032); cover.add(face); book.add(cover);
  const lining = new THREE.Mesh(new THREE.PlaneGeometry(W - .035, H - .035), leftPaper);
  lining.position.set(W / 2, 0, -.032); lining.rotation.y = Math.PI; cover.add(lining);
  const leaves: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Group(); leaf.position.set(-W / 2 + .04, 0, .115 - i * .024);
    const sheet = box(W - .08, H - .075, .006, i < 6 ? leftPaper : paper, (W - .08) / 2);
    leaf.add(sheet);
    // 用既有宣紙位圖作紙面材質；唔畫假字或假的武學內容。
    leaves.push(leaf); book.add(leaf);
  }
  for (const y of [-.85, -.3, .3, .85]) {
    const thread = new THREE.Mesh(new THREE.TorusGeometry(.075, .013, 5, 16), gold);
    thread.rotation.y = Math.PI / 2; thread.position.set(-W / 2 + .025, y, 0); book.add(thread);
  }
  const ribbon = box(.075, .7, .015, new THREE.MeshStandardMaterial({ color: '#9c3a30', roughness: 1 }), .44, -1.04, -.135);
  book.add(ribbon);
  const coreMat = new THREE.MeshBasicMaterial({ color: '#e4c68a', transparent: true, opacity: 0, depthWrite: false });
  const core = box(W - .15, H - .15, .025, coreMat, 0, 0, .133); book.add(core);
  const clasps = new THREE.Group();
  for (const sy of [-1, 1]) {
    clasps.add(box(.18, .035, .08, gold, W - .11, sy * (H / 2 - .08), .03));
    clasps.add(box(.035, .19, .08, gold, W - .035, sy * (H / 2 - .13), .03));
  }
  cover.add(clasps); clasps.visible = premium;
  root.userData.dispose = () => { disposed = true; loading.dispose(); paperTexture.dispose(); leftTexture.dispose(); };
  return {
    root, height: 2.4, burstPoint: new THREE.Vector3(.12, 1.4, .25),
    // 高光強度仍由導演控制；心願命中唔會令青綠書封變成珍本金封。
    setGrade() {},
    setGlow(k) { coreMat.opacity = disposed ? 0 : Math.min(.5, k * .5); },
    setOpen(k) {
      const t = Math.max(0, Math.min(1, k));
      cover.rotation.y = -t * 2.9;
      leaves.forEach((leaf, i) => {
        const p = THREE.MathUtils.smoothstep(t, .12 + i * .065, .5 + i * .065);
        leaf.rotation.y = -p * (i < 6 ? 2.82 - i * .022 : .12 - (i - 6) * .08);
        leaf.rotation.z = Math.sin(p * Math.PI) * .035;
      });
      ribbon.rotation.z = Math.sin(t * Math.PI) * .22;
    },
  };
}
