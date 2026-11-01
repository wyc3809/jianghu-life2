import { useEffect, useRef, useState } from "react";
import type {
  SectBattleReplay,
  SectBattleFigure,
} from "@interfaces/sectBattle";
import type { WarAssets } from "./assets";
import { WarRenderer } from "./renderer";
import { createVisualLoop, watchVisualActivity } from "../ui/visualActivity";
import { playInkBlade, playInkHit, playInkSeal } from "../audio/inkAudio";
export type WarStatus = "ready" | "playing" | "paused" | "result";
interface Controls {
  toggle(): void;
  skip(): void;
  select(id: string): void;
  speed(): void;
  reduced(value: boolean): void;
}
/** 游標與伺服器戰果分開；背景及名冊停畫，返回不補播或重新開戰。 */
export function useWarPlayback(
  assets: WarAssets | null,
  replay: SectBattleReplay | null,
  formation: SectBattleFigure[],
  reduced: boolean,
) {
  const canvas = useRef<HTMLCanvasElement>(null),
    controls = useRef<Controls | null>(null),
    selection = useRef<string | null>(null),
    reduce = useRef(reduced);
  reduce.current = reduced;
  const [view, setView] = useState({
    seconds: 0,
    status: "ready" as WarStatus,
    selected: null as string | null,
    speed: 1,
  });
  useEffect(() => {
    controls.current?.reduced(reduced);
  }, [reduced]);
  useEffect(() => {
    if (!assets || !canvas.current) return;
    const renderer = new WarRenderer(canvas.current, assets);
    let seconds = 0,
      status: WarStatus = "ready",
      selected = selection.current,
      speed = 1,
      active = true,
      published = -1,
      eventIndex = 0,
      lastSound = -1;
    const figures = replay?.frames[0]?.figures ?? formation;
    if (!figures.some((u) => u.id === selected))
      selected = figures[0]?.id ?? null;
    const publish = () => {
      published = seconds;
      selection.current = selected;
      setView({ seconds, status, selected, speed });
    };
    const draw = () =>
      renderer.draw(replay, formation, seconds, selected, reduce.current);
    const loop = createVisualLoop((_now, dt) => {
      if (!replay) return;
      seconds = Math.min(replay.duration, seconds + dt * speed);
      let struck = false;
      while (
        eventIndex < replay.events.length &&
        replay.events[eventIndex].at <= seconds
      ) {
        const e = replay.events[eventIndex++];
        struck ||=
          e.damage > 0 && (e.actor === selected || e.target === selected);
      }
      if (struck && seconds - lastSound > 0.34) {
        lastSound = seconds;
        playInkHit();
      }
      if (seconds >= replay.duration) {
        status = "result";
        loop.setActive(false);
        if (!reduce.current) playInkSeal();
        publish();
      } else if (seconds - published >= 0.15) publish();
      draw();
    });
    const refresh = () =>
      loop.setActive(active && status === "playing" && !reduce.current);
    controls.current = {
      toggle() {
        if (!replay) return;
        if (status === "result") {
          seconds = 0;
          eventIndex = 0;
          lastSound = -1;
          status = reduce.current ? "result" : "playing";
          if (reduce.current) seconds = replay.duration;
        } else if (reduce.current) {
          seconds = replay.duration;
          status = "result";
        } else status = status === "playing" ? "paused" : "playing";
        if (status === "playing" && !reduce.current) playInkBlade();
        refresh();
        publish();
        draw();
      },
      skip() {
        if (!replay) return;
        seconds = replay.duration;
        status = "result";
        refresh();
        publish();
        draw();
      },
      select(id) {
        selected = id;
        publish();
        draw();
      },
      speed() {
        speed = speed === 1 ? 2 : 1;
        publish();
      },
      reduced(value) {
        if (value && status === "playing") status = "paused";
        refresh();
        publish();
        draw();
      },
    };
    const element = canvas.current,
      resize = new ResizeObserver(() => {
        renderer.resize();
        draw();
      });
    resize.observe(element);
    renderer.resize();
    draw();
    publish();
    const unwatch = watchVisualActivity(
      (value) => {
        active = value;
        refresh();
      },
      { element, dialogs: true },
    );
    let down: { x: number; y: number } | null = null;
    const begin = (e: PointerEvent) => {
      if (e.isPrimary && e.button === 0) down = { x: e.clientX, y: e.clientY };
    };
    const end = (e: PointerEvent) => {
      if (!down || !e.isPrimary) return;
      const start = down;
      down = null;
      if (Math.hypot(start.x - e.clientX, start.y - e.clientY) > 8) return;
      const r = element.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      const hit = [...renderer.hitboxes]
        .sort(
          (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
        )
        .find((h) => Math.hypot(h.x - x, h.y - y) <= h.radius);
      if (hit) controls.current?.select(hit.id);
    };
    const cancel = () => {
      down = null;
    };
    element.addEventListener("pointerdown", begin);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", cancel);
    return () => {
      loop.dispose();
      unwatch();
      resize.disconnect();
      controls.current = null;
      element.removeEventListener("pointerdown", begin);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", cancel);
    };
  }, [assets, replay, formation]);
  return { canvas, controls, view };
}
