/** 秘笈閣待機主體，與正式啟封演出共用同一個線裝書模型。 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCodex } from './scene/codex';

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
    const codex = buildCodex(); scene.add(codex.root);
    const light = new THREE.DirectionalLight('#fff4d9', 3); light.position.set(-3, 5, 5);
    scene.add(light, new THREE.HemisphereLight('#fff8eb', '#718076', 2));
    camera.position.set(0, 1.5, 5.3); camera.lookAt(0, 1.25, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height); camera.updateProjectionMatrix();
      camera.position.z = Math.max(4.8, 3.1 / camera.aspect); renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    let visible = true, raf = 0, last = 0;
    const io = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; }); io.observe(canvas);
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden || now - last < 32) return;
      last = now;
      codex.root.rotation.y = reduce ? -.08 : Math.sin(now / 3700) * .11;
      codex.root.position.y = reduce ? 0 : Math.sin(now / 1500) * .025;
      renderer.render(scene, camera);
    };
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    canvas.addEventListener('webglcontextlost', lost);
    codex.root.userData.invalidate = () => renderer.render(scene, camera);
    resize(); if (!reduce) raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('webglcontextlost', lost);
      delete codex.root.userData.invalidate; codex.root.userData.dispose?.();
      scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose();
        const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
        mats.forEach(mat => mat.dispose()); });
      renderer.dispose(); renderer.forceContextLoss();
    };
  }, [failed]);
  return failed ? <img className="ink-codex-static" src={`${import.meta.env.BASE_URL}ink/art/gacha/codex-cover.webp`} alt="線裝秘笈" />
    : <canvas className="ink-codex-canvas" ref={host} aria-label={premium ? '珍本線裝秘笈' : '江湖線裝秘笈'} role="img" />;
}
