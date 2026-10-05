/**
 * 高光時刻音效：全部 Web Audio 即時合成，唔用音檔。
 * 第一次點擊先 init（瀏覽器自動播放政策）；音量跟遊戲設定嘅「音效」（sfxGainFactor）。
 */
import { sfxGainFactor } from '../../audio/inkAudio';
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
  const f = sfxGainFactor();
  if (!ctx || !master || f <= 0) return null;
  master.gain.value = 0.7 * f;
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

/** 古琴撥弦：三角波＋泛音，快起長收 */
function pluck(freq: number, when = 0, gain = 0.07) {
  tone(freq, 0.9, 'triangle', gain, when);
  tone(freq * 2, 0.5, 'sine', gain * 0.35, when);
  tone(freq * 3.01, 0.25, 'sine', gain * 0.12, when);
}

/** 鑼／鐘：非諧和泛音 */
function gong(freq: number, dur: number, gain: number, when = 0) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(freq * m, dur / (1 + i * 0.6), 'sine', gain / (1 + i * 1.4), when));
}

/** 宮商角徵羽（D 調五聲） */
const PENTA = [294, 330, 370, 440, 494, 587, 659, 740, 880];

export const sfx = {
  /** 起跳：木魚一聲 */
  jump() {
    tone(620, 0.08, 'sine', 0.12, 0, 380);
    noise(0.03, 0.05, 2400, 0, 'bandpass');
    haptic('light');
  },
  /** 落地：堂鼓 */
  land() {
    tone(110, 0.28, 'sine', 0.26, 0, 62);
    noise(0.07, 0.07, 500);
    haptic('medium');
  },
  /** 升級：五聲撥弦上行，品階越高音越高、越多音 */
  levelUp(grade: number) {
    const start = Math.min(grade, 4);
    const notes = PENTA.slice(start, start + 3 + Math.floor(grade / 2));
    notes.forEach((f, i) => pluck(f, i * 0.07, 0.06));
  },
  /** 蓄力：擦弦（三角波顫音）漸升＋沙沙聲；回傳停止函數 */
  charge(seconds: number): () => void {
    const c = ok();
    if (!c) return () => {};
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(147, t);
    o.frequency.exponentialRampToValueAtTime(587, t + seconds);
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.setValueAtTime(5, t);
    lfo.frequency.linearRampToValueAtTime(14, t + seconds);
    lfoG.gain.value = 8;
    lfo.connect(lfoG).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + seconds);
    o.connect(g).connect(master!);
    o.start(t);
    lfo.start(t);
    noise(seconds, 0.03, 3000, 0, 'highpass');
    return () => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      o.stop(now + 0.06);
      lfo.stop(now + 0.06);
    };
  },
  /** 爆發：大鼓＋鑼；power 越大鑼聲越長 */
  explode(power: number) {
    tone(70, 0.7, 'sine', 0.5, 0, 38);
    noise(0.35, 0.25, 700);
    gong(147, 1.2 + power * 0.8, 0.14 * Math.min(1.4, power), 0.02);
    haptic('heavy');
  },
  /** 卡片彈出：撥一下 */
  pop() {
    pluck(PENTA[5]!, 0, 0.05);
    haptic('light');
  },
  /** 數字滾動：梆子 */
  tick() {
    tone(1500, 0.025, 'sine', 0.05);
  },
  /** 錢入賬：小鈴 */
  coin() {
    gong(1320, 0.35, 0.05);
  },
  /** 揭曉：五聲琶音＋鑼 */
  fanfare() {
    PENTA.slice(2, 8).forEach((f, i) => pluck(f, i * 0.08, 0.055));
    gong(196, 1.8, 0.1, 0.5);
    haptic('ritual');
  },
};
