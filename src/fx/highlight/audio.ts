/**
 * 高光時刻音效：全部 Web Audio 即時合成，唔用音檔。
 * 第一次點擊先 init（瀏覽器自動播放政策）；靜音跟遊戲設定（isInkAudioMuted）。
 */
import { isInkAudioMuted } from '../../audio/inkAudio';
import { haptic } from '../../ui/haptics';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

export function initHighlightAudio(): void {
  if (ctx || typeof window === 'undefined') return;
  const AC =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.ratio.value = 8;
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(comp).connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function ok(): AudioContext | null {
  if (!ctx || !master || isInkAudioMuted()) return null;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slideTo?: number) {
  const c = ok();
  if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, filterHz: number, when = 0, type: BiquadFilterType = 'lowpass') {
  const c = ok();
  if (!c || !noiseBuf) return;
  const t = c.currentTime + when;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterHz;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(t);
  s.stop(t + dur + 0.02);
}

export const sfx = {
  jump() {
    tone(260, 0.18, 'square', 0.05, 0, 620);
    haptic('light');
  },
  land() {
    tone(120, 0.16, 'sine', 0.22, 0, 55);
    noise(0.08, 0.08, 900);
    haptic('medium');
  },
  /** 升級和弦：品階越高越高、越厚 */
  levelUp(grade: number) {
    const base = 262 * Math.pow(2, grade / 6);
    [1, 1.25, 1.5, 2].forEach((m, i) => tone(base * m, 0.5, i % 2 ? 'triangle' : 'square', 0.045, i * 0.035));
  },
  /** 蓄力上升音：回傳停止函數 */
  charge(seconds: number): () => void {
    const c = ok();
    if (!c) return () => {};
    const t = c.currentTime;
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o1.type = 'sawtooth';
    o2.type = 'square';
    o1.frequency.setValueAtTime(110, t);
    o1.frequency.exponentialRampToValueAtTime(880, t + seconds);
    o2.frequency.setValueAtTime(111.5, t);
    o2.frequency.exponentialRampToValueAtTime(884, t + seconds);
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.setValueAtTime(6, t);
    lfo.frequency.linearRampToValueAtTime(28, t + seconds);
    lfoG.gain.value = 0.02;
    lfo.connect(lfoG).connect(g.gain);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + seconds);
    o1.connect(g);
    o2.connect(g);
    g.connect(master!);
    [o1, o2, lfo].forEach((o) => o.start(t));
    return () => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      [o1, o2, lfo].forEach((o) => o.stop(now + 0.06));
    };
  },
  /** 爆炸：低頻衝擊＋噪聲；power 越大越厚 */
  explode(power: number) {
    tone(80, 0.6 + power * 0.2, 'sine', 0.5, 0, 30);
    tone(160, 0.3, 'triangle', 0.18, 0, 50);
    noise(0.7 + power * 0.25, 0.35 * Math.min(1.4, power), 1400);
    noise(0.25, 0.2, 5000, 0, 'highpass');
    haptic('heavy');
  },
  pop() {
    tone(660, 0.09, 'sine', 0.12, 0, 1320);
    haptic('light');
  },
  tick() {
    tone(1800, 0.03, 'square', 0.025);
  },
  coin() {
    tone(1568, 0.09, 'square', 0.04);
    tone(2093, 0.18, 'square', 0.035, 0.06);
  },
  /** 勝利號角：上行大三和弦 */
  fanfare() {
    const seq: [number, number, number][] = [
      [523, 0, 0.14],
      [659, 0.12, 0.14],
      [784, 0.24, 0.14],
      [1047, 0.36, 0.55],
    ];
    for (const [f, w, d] of seq) {
      tone(f, d, 'sawtooth', 0.05, w);
      tone(f / 2, d, 'square', 0.03, w);
    }
    haptic('ritual');
  },
};
