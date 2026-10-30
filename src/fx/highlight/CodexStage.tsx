/** 秘笈閣待機主體，與正式啟封共用原畫、材質及可彎曲書頁。 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCodex } from './scene/codex';
import { codexCoverUrl } from './codexAppearance';
import { watchVisualActivity } from '../../ui/visualActivity';
import { highlightCoversPage } from '../../ui/highlightVisibility';

export default function CodexStage({ premium }: { premium: boolean }) {
  const host = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const canvas = host.current;
    if (!canvas || failed) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
    const codex = buildCodex(premium); scene.add(codex.root);
    const light = new THREE.DirectionalLight('#fff4df', 2.2); light.position.set(-3, 5, 5);
    scene.add(light, new THREE.HemisphereLight('#fff8eb', '#718076', 1.4));
    camera.position.set(0, 1.5, 5.3); camera.lookAt(0, 1.25, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => motion.matches || document.documentElement.dataset.inkMotion === 'reduce';
    let active = false, raf = 0, disposed = false;
    const render = () => { if (!disposed && !document.hidden && !highlightCoversPage() && !document.querySelector('dialog[open]')) renderer.render(scene, camera); };
    const draw = (now: number) => {
      raf = 0;
      if (disposed || !active) return;
      // 對話框遮住書冊時只停繪畫，關閉即可接續；不搶抽卡或結果的GPU。
      if (!document.querySelector('dialog.ink-codex-sheet[open]')) {
        codex.root.rotation.y = Math.sin(now / 3700) * .08;
        codex.root.position.y = Math.sin(now / 1500) * .018;
        render();
      }
      raf = requestAnimationFrame(draw);
    };
    const resume = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (reduce()) { codex.root.rotation.y = -.08; codex.root.position.y = 0; }
      render();
      if (active) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height); camera.updateProjectionMatrix();
      camera.position.z = Math.max(4.8, 3.1 / camera.aspect); render();
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const unwatch = watchVisualActivity(value => { active = value; resume(); }, { element: canvas, covered: true, reduced: true, dialogs: true });
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    canvas.addEventListener('webglcontextlost', lost);
    codex.root.userData.invalidate = render;
    resize(); resume();
    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); unwatch();
      canvas.removeEventListener('webglcontextlost', lost);
      delete codex.root.userData.invalidate; codex.root.userData.dispose?.();
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) geometries.add(m.geometry);
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mat => materials.add(mat));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(mat => {
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value);
        mat.dispose();
      });
      textures.forEach(texture => texture.dispose()); renderer.dispose();
      // 切池／StrictMode即時沿用Canvas，真正離場才釋放context。
      queueMicrotask(() => { if (!canvas.isConnected) renderer.forceContextLoss(); });
    };
  }, [failed, premium]);
  return failed ? <img className="ink-codex-static" src={codexCoverUrl(premium)} alt={premium ? '珍本金封秘笈' : '江湖青封秘笈'} />
    : <canvas className="ink-codex-canvas" data-codex-rarity={premium ? 'premium' : 'ordinary'} ref={host} aria-label={premium ? '珍本線裝秘笈' : '江湖線裝秘笈'} role="img" />;
}
