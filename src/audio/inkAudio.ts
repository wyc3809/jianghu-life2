/**
 * 水墨風音效系統 v2
 * 分層音效：環境音 + 戰鬥音效 + UI 反饋
 * 使用 Web Audio API + 合成音色，無需外部音頻文件
 */

const MUTE_KEY = 'ink_audio_muted';
const AMBIENT_KEY = 'ink_ambient_enabled';

let ctx: AudioContext | null = null;
let muted = false;
let ambientEnabled = true;
let ambientNode: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;

// 初始化靜音狀態
try {
  if (typeof localStorage !== 'undefined') {
    muted = localStorage.getItem(MUTE_KEY) === '1';
    ambientEnabled = localStorage.getItem(AMBIENT_KEY) !== '0';
  }
} catch {
  muted = false;
  ambientEnabled = true;
}

export function isInkAudioMuted(): boolean {
  return muted;
}

export function isAmbientEnabled(): boolean {
  return ambientEnabled;
}

export function setInkAudioMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (next) {
    stopAmbient();
  } else if (ambientEnabled) {
    startAmbient();
  }
}

export function setAmbientEnabled(next: boolean): void {
  ambientEnabled = next;
  try {
    localStorage.setItem(AMBIENT_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (!next) {
    stopAmbient();
  } else if (!muted) {
    startAmbient();
  }
}

export function toggleInkAudioMuted(): boolean {
  setInkAudioMuted(!muted);
  return muted;
}

function canPlay(): boolean {
  if (typeof window === 'undefined') return false;
  if (muted) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function getCtx(): AudioContext | null {
  if (!canPlay()) return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 基礎音色合成 */
function tone(
  freq: number,
  dur = 0.08,
  type: OscillatorType = 'sine',
  gain = 0.03,
  opts?: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    freqSlide?: number;
    harmonics?: number[];
  }
) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const attack = opts?.attack ?? 0.005;
  const decay = opts?.decay ?? 0.1;
  const sustain = opts?.sustain ?? gain * 0.6;
  const release = opts?.release ?? 0.15;
  const total = attack + decay + release;

  // 主音
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (opts?.freqSlide) {
    osc.frequency.exponentialRampToValueAtTime(freq * opts.freqSlide, t0 + dur);
  }

  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t0 + attack + decay);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + total);

  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + total);

  // 泛音
  if (opts?.harmonics) {
    for (const h of opts.harmonics) {
      const hOsc = ac.createOscillator();
      const hG = ac.createGain();
      hOsc.type = type === 'square' ? 'sawtooth' : 'sine';
      hOsc.frequency.setValueAtTime(freq * h, t0);
      hG.gain.setValueAtTime(0, t0);
      hG.gain.linearRampToValueAtTime(gain * 0.15, t0 + attack);
      hG.gain.exponentialRampToValueAtTime(0.0001, t0 + total * 0.6);
      hOsc.connect(hG);
      hG.connect(ac.destination);
      hOsc.start(t0);
      hOsc.stop(t0 + total * 0.6);
    }
  }
}

/** 噪聲生成（風聲、打擊聲底） */
function noiseBuffer(ac: AudioContext, dur: number): AudioBuffer {
  const sr = ac.sampleRate;
  const len = Math.floor(sr * dur);
  const buf = ac.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  return buf;
}

function playNoise(dur: number, gain = 0.02, filterFreq = 800) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur);
  const g = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

// ===== UI 音效 =====

export function playInkTap() {
  tone(760, 0.022, 'square', 0.016);
  tone(420, 0.03, 'triangle', 0.012);
}

export function playInkSeal() {
  tone(220, 0.12, 'sine', 0.035, { harmonics: [2, 3] });
  setTimeout(() => tone(330, 0.1, 'sine', 0.02, { harmonics: [2] }), 40);
}

export function playInkWin() {
  tone(392, 0.1, 'sine', 0.03, { harmonics: [1.5, 2] });
  setTimeout(() => tone(523, 0.12, 'sine', 0.025, { harmonics: [2] }), 70);
  setTimeout(() => tone(659, 0.15, 'sine', 0.02, { harmonics: [2] }), 180);
}

export function playInkLose() {
  tone(180, 0.16, 'triangle', 0.03);
  setTimeout(() => tone(140, 0.2, 'sine', 0.025), 80);
}

export function playInkPageFlip() {
  tone(480, 0.035, 'triangle', 0.014);
  setTimeout(() => tone(360, 0.04, 'sine', 0.01), 28);
  setTimeout(() => tone(420, 0.025, 'triangle', 0.008), 55);
}

// ===== 戰鬥音效 v2 =====

export function playInkBlade() {
  // 出招：短刃氣 + 輕微風聲
  tone(640, 0.03, 'square', 0.012);
  setTimeout(() => tone(280, 0.05, 'triangle', 0.01), 20);
  playNoise(0.08, 0.008, 1200);
}

export function playInkHit() {
  // 命中：沉悶打擊 + 低頻震動
  tone(120, 0.06, 'square', 0.04, { freqSlide: 0.5 });
  tone(60, 0.1, 'sine', 0.06, { freqSlide: 0.3 });
  playNoise(0.05, 0.015, 600);
}

export function playInkMiss() {
  // 落空：高頻風切
  tone(800, 0.04, 'sine', 0.008, { freqSlide: 1.5 });
  playNoise(0.06, 0.005, 2000);
}

export function playInkCrit() {
  // 暴擊：多重泛音 + 強震動
  tone(220, 0.08, 'sawtooth', 0.04, { harmonics: [2, 3, 4], freqSlide: 0.5 });
  tone(110, 0.12, 'square', 0.05, { freqSlide: 0.3 });
  playNoise(0.1, 0.02, 400);
  setTimeout(() => tone(440, 0.06, 'sine', 0.025, { harmonics: [2] }), 60);
}

export function playInkGuard() {
  // 格擋：金屬感
  tone(520, 0.05, 'square', 0.025);
  tone(780, 0.04, 'sine', 0.015);
  setTimeout(() => tone(260, 0.08, 'triangle', 0.02), 30);
}

export function playInkQiFlow() {
  // 內力運轉：低頻嗡鳴
  tone(80, 0.15, 'sine', 0.02, { harmonics: [2, 3] });
  tone(120, 0.12, 'triangle', 0.015, { harmonics: [2] });
}

export function playInkCombo() {
  // 連招完成：快速上行音階
  tone(440, 0.06, 'sine', 0.025);
  setTimeout(() => tone(554, 0.06, 'sine', 0.025), 60);
  setTimeout(() => tone(659, 0.08, 'sine', 0.03, { harmonics: [2] }), 120);
  setTimeout(() => tone(880, 0.1, 'sine', 0.025, { harmonics: [2] }), 190);
}

export function playInkFlee() {
  // 逃跑：快速下行
  tone(600, 0.04, 'triangle', 0.012, { freqSlide: 0.3 });
  setTimeout(() => tone(400, 0.05, 'sine', 0.008, { freqSlide: 0.3 }), 40);
  playNoise(0.08, 0.006, 1500);
}

export function playInkDesperate() {
  // 絕地反擊：緊張的低頻堆疊
  tone(100, 0.2, 'sawtooth', 0.03, { harmonics: [2, 3], freqSlide: 0.5 });
  tone(55, 0.25, 'square', 0.04);
  playNoise(0.15, 0.02, 300);
}

export function playInkVictory() {
  // 戰勝：五聲音階
  tone(523, 0.1, 'sine', 0.03, { harmonics: [2] });
  setTimeout(() => tone(659, 0.1, 'sine', 0.025, { harmonics: [2] }), 100);
  setTimeout(() => tone(784, 0.12, 'sine', 0.03, { harmonics: [2] }), 200);
  setTimeout(() => tone(1047, 0.15, 'sine', 0.025, { harmonics: [2] }), 320);
}

export function playInkDefeat() {
  // 戰敗：下行音階
  tone(440, 0.12, 'triangle', 0.025);
  setTimeout(() => tone(330, 0.14, 'sine', 0.02), 100);
  setTimeout(() => tone(220, 0.18, 'sine', 0.02), 220);
  setTimeout(() => tone(110, 0.25, 'sine', 0.015), 380);
}

// ===== 環境音 =====

function createAmbientBuffer(ac: AudioContext): AudioBuffer {
  const sr = ac.sampleRate;
  const dur = 4; // 4 秒循環
  const len = Math.floor(sr * dur);
  const buf = ac.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      // 基礎風聲：低頻噪聲
      let sample = (Math.random() * 2 - 1) * 0.02;
      // 添加低頻正弦波模擬風的節奏
      sample += Math.sin(t * 2 * Math.PI * (2 + ch * 0.5)) * 0.008;
      sample += Math.sin(t * 2 * Math.PI * (3.7 + ch * 0.3)) * 0.005;
      // 偶爾的「竹葉聲」
      if (Math.random() < 0.001) {
        sample += (Math.random() * 2 - 1) * 0.015;
      }
      data[i] = sample;
    }
  }
  return buf;
}

export function startAmbient() {
  const ac = getCtx();
  if (!ac || ambientNode) return;

  const buf = createAmbientBuffer(ac);
  ambientNode = ac.createBufferSource();
  ambientNode.buffer = buf;
  ambientNode.loop = true;

  ambientGain = ac.createGain();
  ambientGain.gain.value = 0.012;

  // 低通濾波，讓環境音更柔和
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  ambientNode.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(ac.destination);
  ambientNode.start();
}

export function stopAmbient() {
  if (ambientNode) {
    try {
      ambientNode.stop();
    } catch {
      /* ignore */
    }
    ambientNode = null;
  }
  ambientGain = null;
}

export function setAmbientVolume(vol: number) {
  if (ambientGain) {
    ambientGain.gain.value = Math.max(0, Math.min(0.05, vol));
  }
}
