/**
 * 頂級標準音頻系統 v3
 * 架構：Source → SFX Bus → Master Limiter → Destination
 * 原則：精確調度、零 setTimeout、ADSR 包絡、動態範圍控制
 */

import { haptic } from '../ui/haptics';

const MUTE_KEY = 'ink_audio_muted';
const AMBIENT_KEY = 'ink_ambient_enabled';

// ========== 全局狀態 ==========
let ac: AudioContext | null = null;
let muted = false;
let ambientEnabled = true;

// 混音台節點
let masterLimiter: DynamicsCompressorNode | null = null;
let sfxBus: GainNode | null = null;
let ambientBus: GainNode | null = null;
let ambientNode: AudioBufferSourceNode | null = null;

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

// ========== 混音台初始化 ==========
function getAC(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (muted) return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;

  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ac) {
      ac = new AC();
      initMixingConsole(ac);
    }
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

function initMixingConsole(audioCtx: AudioContext) {
  // Master Limiter：防止爆音，統一音量
  masterLimiter = audioCtx.createDynamicsCompressor();
  masterLimiter.threshold.value = -6;
  masterLimiter.knee.value = 3;
  masterLimiter.ratio.value = 12;
  masterLimiter.attack.value = 0.003;
  masterLimiter.release.value = 0.1;
  masterLimiter.connect(audioCtx.destination);

  // SFX Bus
  sfxBus = audioCtx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(masterLimiter);

  // Ambient Bus
  ambientBus = audioCtx.createGain();
  ambientBus.gain.value = 0.35;
  ambientBus.connect(masterLimiter);
}

// ========== 合成器 ==========
interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const DEFAULT_ADSR: ADSR = { attack: 0.005, decay: 0.08, sustain: 0.4, release: 0.15 };

interface SynthOpts {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  adsr?: Partial<ADSR>;
  freqSlide?: number;
  slideTarget?: number;
  harmonics?: number[];
  harmonicGain?: number;
  noiseMix?: number;
  noiseFilter?: number;
  detune?: number;
  when?: number; // 絕對時間（AudioContext time）
}

function synth(opts: SynthOpts) {
  const audioCtx = getAC();
  if (!audioCtx || !sfxBus) return;

  const t0 = opts.when ?? audioCtx.currentTime;
  const adsr = { ...DEFAULT_ADSR, ...opts.adsr };
  const total = adsr.attack + adsr.decay + adsr.release + (opts.dur ?? 0.1);
  const peakGain = opts.gain ?? 0.04;

  // 主振盪器
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.detune) osc.detune.value = opts.detune;

  if (opts.freqSlide && opts.slideTarget) {
    osc.frequency.exponentialRampToValueAtTime(opts.slideTarget, t0 + (opts.dur ?? 0.1));
  }

  // ADSR 包絡
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + adsr.attack);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, peakGain * adsr.sustain),
    t0 + adsr.attack + adsr.decay
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + total);

  osc.connect(gain);
  gain.connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + total + 0.05);

  // 泛音
  if (opts.harmonics && opts.harmonics.length > 0) {
    const hgain = opts.harmonicGain ?? 0.12;
    for (const h of opts.harmonics) {
      const hOsc = audioCtx.createOscillator();
      const hGain = audioCtx.createGain();
      hOsc.type = opts.type === 'square' ? 'sawtooth' : 'sine';
      hOsc.frequency.setValueAtTime(opts.freq * h, t0);
      hGain.gain.setValueAtTime(0, t0);
      hGain.gain.linearRampToValueAtTime(peakGain * hgain, t0 + adsr.attack * 0.5);
      hGain.gain.exponentialRampToValueAtTime(0.0001, t0 + total * 0.6);
      hOsc.connect(hGain);
      hGain.connect(sfxBus);
      hOsc.start(t0);
      hOsc.stop(t0 + total * 0.6);
    }
  }

  // 噪聲層
  if (opts.noiseMix && opts.noiseMix > 0) {
    const len = Math.floor(audioCtx.sampleRate * total);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const nSrc = audioCtx.createBufferSource();
    nSrc.buffer = buf;
    const nGain = audioCtx.createGain();
    const nFilter = audioCtx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.value = opts.noiseFilter ?? 800;
    nGain.gain.setValueAtTime(peakGain * opts.noiseMix, t0);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + total * 0.8);
    nSrc.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(sfxBus);
    nSrc.start(t0);
    nSrc.stop(t0 + total);
  }
}

// ========== 公開 API ==========
export function isInkAudioMuted(): boolean { return muted; }
export function isAmbientEnabled(): boolean { return ambientEnabled; }

export function setInkAudioMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch {}
  if (next) stopAmbient();
  else if (ambientEnabled) startAmbient();
}

export function toggleInkAudioMuted(): boolean {
  setInkAudioMuted(!muted);
  return muted;
}

export function setAmbientEnabled(next: boolean) {
  ambientEnabled = next;
  try { localStorage.setItem(AMBIENT_KEY, next ? '1' : '0'); } catch {}
  if (!next) stopAmbient();
  else if (!muted) startAmbient();
}

// ===== UI 音效 =====
export function playInkTap() {
  haptic('light');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 800, dur: 0.02, type: 'square', gain: 0.015, when: t });
  synth({ freq: 440, dur: 0.025, type: 'triangle', gain: 0.012, when: t + 0.01 });
}

export function playInkSeal() {
  haptic('medium');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 220, dur: 0.12, gain: 0.035, harmonics: [2, 3], when: t });
  synth({ freq: 330, dur: 0.1, gain: 0.02, harmonics: [2], when: t + 0.04 });
}

export function playInkWin() {
  haptic('ritual');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 392, dur: 0.1, gain: 0.03, harmonics: [1.5, 2], when: t });
  synth({ freq: 523, dur: 0.12, gain: 0.025, harmonics: [2], when: t + 0.07 });
  synth({ freq: 659, dur: 0.15, gain: 0.02, harmonics: [2], when: t + 0.18 });
}

export function playInkLose() {
  haptic('fail');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 180, dur: 0.16, type: 'triangle', gain: 0.03, when: t });
  synth({ freq: 140, dur: 0.2, gain: 0.025, when: t + 0.08 });
}

export function playInkPageFlip() {
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 520, dur: 0.03, type: 'triangle', gain: 0.012, when: t });
  synth({ freq: 380, dur: 0.04, type: 'sine', gain: 0.008, when: t + 0.025 });
}

// ===== 特效時刻 =====
/** 古琴撥弦：快起長收，帶泛音 */
function pluck(freq: number, when: number, gain = 0.03) {
  synth({ freq, dur: 0.5, type: 'triangle', gain, harmonics: [2, 3], harmonicGain: 0.18, adsr: { attack: 0.003, decay: 0.25, sustain: 0.15, release: 0.6 }, when });
}

/** 學新武學／升階／稱號：五聲音階上行撥弦（宮商角徵羽） */
export function playInkAscend(kind: 'learn' | 'rank' | 'title' | 'cure' = 'learn') {
  haptic(kind === 'title' ? 'medium' : 'ritual');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const scale = kind === 'rank' ? [392, 440, 523, 587, 784] : kind === 'title' ? [523, 659, 784] : [294, 330, 392, 440, 587];
  scale.forEach((f, i) => pluck(f, t + i * 0.09, 0.028));
}

/** 境界突破：寺鐘（非諧和泛音）＋低頻；失敗：沉悶破音 */
export function playInkBreakthrough(success: boolean) {
  haptic(success ? 'ritual' : 'fail');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  if (success) {
    synth({ freq: 196, dur: 1.2, type: 'sine', gain: 0.05, harmonics: [2.76, 5.4, 8.93], harmonicGain: 0.22, adsr: { attack: 0.004, decay: 0.6, sustain: 0.25, release: 1.4 }, when: t });
    synth({ freq: 98, dur: 1.4, type: 'sine', gain: 0.04, adsr: { attack: 0.02, decay: 0.8, sustain: 0.3, release: 1.4 }, when: t });
    [392, 523, 659].forEach((f, i) => pluck(f, t + 0.5 + i * 0.12, 0.022));
  } else {
    synth({ freq: 110, dur: 0.5, type: 'sawtooth', gain: 0.035, freqSlide: 2, slideTarget: 55, noiseMix: 0.35, noiseFilter: 400, adsr: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.4 }, when: t });
    synth({ freq: 233, dur: 0.4, type: 'triangle', gain: 0.02, detune: 30, when: t + 0.05 });
  }
}

/** 受傷：輕＝悶擊；重／殘＝重擊＋裂音 */
export function playInkWound(tier: 'light' | 'heavy' | 'crippled') {
  haptic(tier === 'light' ? 'medium' : 'heavy');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 70, dur: 0.14, type: 'sine', gain: tier === 'light' ? 0.04 : 0.07, freqSlide: 2, slideTarget: 35, noiseMix: 0.4, noiseFilter: 500, when: t });
  if (tier !== 'light') {
    synth({ freq: 160, dur: 0.3, type: 'sawtooth', gain: 0.025, freqSlide: 2, slideTarget: 80, noiseMix: 0.5, noiseFilter: 900, when: t + 0.08 });
  }
  if (tier === 'crippled') synth({ freq: 55, dur: 0.8, type: 'sine', gain: 0.04, adsr: { attack: 0.05, decay: 0.4, sustain: 0.3, release: 0.8 }, when: t + 0.2 });
}

// ===== 戰鬥音效 v3（精確調度） =====
export function playInkBlade() {
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 刀刃破空：高頻鋸齒 + 快速衰減
  synth({ freq: 1200, dur: 0.04, type: 'sawtooth', gain: 0.015, freqSlide: 2, slideTarget: 600, adsr: { attack: 0.001, decay: 0.03, sustain: 0.1, release: 0.05 }, when: t });
  synth({ freq: 300, dur: 0.06, type: 'triangle', gain: 0.008, noiseMix: 0.3, noiseFilter: 2000, when: t });
}

export function playInkHit() {
  haptic('medium');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 肉體打擊：低頻衝擊 + 短促噪聲
  synth({ freq: 90, dur: 0.08, type: 'square', gain: 0.06, freqSlide: 2, slideTarget: 45, adsr: { attack: 0.001, decay: 0.04, sustain: 0.2, release: 0.1 }, noiseMix: 0.4, noiseFilter: 500, when: t });
  synth({ freq: 55, dur: 0.12, type: 'sine', gain: 0.07, freqSlide: 2, slideTarget: 30, when: t });
}

export function playInkMiss() {
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 落空：高頻風切，快速上行
  synth({ freq: 600, dur: 0.05, type: 'sine', gain: 0.01, freqSlide: 2, slideTarget: 1200, adsr: { attack: 0.002, decay: 0.02, sustain: 0, release: 0.03 }, noiseMix: 0.2, noiseFilter: 3000, when: t });
}

export function playInkCrit() {
  haptic('heavy');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 暴擊：多層次衝擊
  synth({ freq: 150, dur: 0.15, type: 'sawtooth', gain: 0.06, harmonics: [2, 3, 5], harmonicGain: 0.15, freqSlide: 2, slideTarget: 60, adsr: { attack: 0.001, decay: 0.06, sustain: 0.3, release: 0.12 }, noiseMix: 0.5, noiseFilter: 400, when: t });
  synth({ freq: 880, dur: 0.08, type: 'sine', gain: 0.025, harmonics: [2], adsr: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.06 }, when: t + 0.02 });
}

export function playInkGuard() {
  haptic('light');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 格擋：金屬撞擊，高頻短促
  synth({ freq: 800, dur: 0.04, type: 'square', gain: 0.025, adsr: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.04 }, when: t });
  synth({ freq: 1200, dur: 0.03, type: 'sine', gain: 0.015, when: t + 0.005 });
  synth({ freq: 400, dur: 0.08, type: 'triangle', gain: 0.018, freqSlide: 2, slideTarget: 200, when: t + 0.01 });
}

export function playInkQiFlow() {
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 內力：低頻嗡鳴，和聲
  synth({ freq: 70, dur: 0.2, type: 'sine', gain: 0.025, harmonics: [2, 3], harmonicGain: 0.2, adsr: { attack: 0.05, decay: 0.1, sustain: 0.5, release: 0.15 }, when: t });
  synth({ freq: 105, dur: 0.18, type: 'triangle', gain: 0.018, harmonics: [2], adsr: { attack: 0.04, decay: 0.08, sustain: 0.4, release: 0.12 }, when: t + 0.02 });
}

export function playInkCombo() {
  haptic('medium');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // 連招：上行五聲音階，快速遞進
  synth({ freq: 523, dur: 0.06, type: 'sine', gain: 0.03, harmonics: [2], when: t });
  synth({ freq: 659, dur: 0.06, type: 'sine', gain: 0.03, harmonics: [2], when: t + 0.06 });
  synth({ freq: 784, dur: 0.08, type: 'sine', gain: 0.035, harmonics: [2], when: t + 0.12 });
  synth({ freq: 1047, dur: 0.12, type: 'sine', gain: 0.03, harmonics: [2], when: t + 0.2 });
}

export function playInkFlee() {
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 500, dur: 0.05, type: 'triangle', gain: 0.012, freqSlide: 2, slideTarget: 200, when: t });
  synth({ freq: 350, dur: 0.06, type: 'sine', gain: 0.008, freqSlide: 2, slideTarget: 150, noiseMix: 0.15, noiseFilter: 2000, when: t + 0.03 });
}

export function playInkDesperate() {
  haptic('heavy');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 80, dur: 0.25, type: 'sawtooth', gain: 0.04, harmonics: [2, 3, 4], harmonicGain: 0.12, freqSlide: 2, slideTarget: 40, adsr: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.2 }, noiseMix: 0.3, noiseFilter: 300, when: t });
  synth({ freq: 45, dur: 0.3, type: 'square', gain: 0.05, adsr: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.25 }, when: t });
}

export function playInkVictory() {
  haptic('ritual');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 523, dur: 0.12, gain: 0.035, harmonics: [2], when: t });
  synth({ freq: 659, dur: 0.12, gain: 0.03, harmonics: [2], when: t + 0.1 });
  synth({ freq: 784, dur: 0.15, gain: 0.035, harmonics: [2], when: t + 0.2 });
  synth({ freq: 1047, dur: 0.2, gain: 0.03, harmonics: [2], when: t + 0.32 });
}

export function playInkDefeat() {
  haptic('fail');
  const audioCtx = getAC();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  synth({ freq: 440, dur: 0.14, type: 'triangle', gain: 0.025, when: t });
  synth({ freq: 330, dur: 0.16, type: 'sine', gain: 0.02, when: t + 0.1 });
  synth({ freq: 220, dur: 0.2, type: 'sine', gain: 0.018, when: t + 0.22 });
  synth({ freq: 110, dur: 0.3, type: 'sine', gain: 0.015, when: t + 0.38 });
}

// ===== 環境音（專業級） ======
function createAmbientBuffer(audioCtx: AudioContext): AudioBuffer {
  const sr = audioCtx.sampleRate;
  const dur = 6; // 6 秒無縫循環
  const len = Math.floor(sr * dur);
  const buf = audioCtx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      // 粉噪（更自然的風聲）
      let sample = 0;
      // 疊加多個八度噪聲模擬粉噪
      for (let o = 0; o < 6; o++) {
        sample += (Math.random() * 2 - 1) / (1 << o);
      }
      sample *= 0.012;

      // 低頻風的呼吸感
      const breath = Math.sin(t * 2 * Math.PI * 0.15) * 0.5 + 0.5;
      sample *= breath;

      // 偶爾竹葉
      if (Math.random() < 0.0003) {
        sample += (Math.random() * 2 - 1) * 0.008;
      }

      data[i] = sample;
    }
  }
  return buf;
}

export function startAmbient() {
  const audioCtx = getAC();
  if (!audioCtx || !ambientBus || ambientNode) return;

  const buf = createAmbientBuffer(audioCtx);
  ambientNode = audioCtx.createBufferSource();
  ambientNode.buffer = buf;
  ambientNode.loop = true;

  // 環境音低通濾波
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;
  filter.Q.value = 0.5;

  ambientNode.connect(filter);
  filter.connect(ambientBus);
  ambientNode.start();
}

export function stopAmbient() {
  if (ambientNode) {
    try { ambientNode.stop(); } catch {}
    ambientNode = null;
  }
}

export function setAmbientVolume(vol: number) {
  if (ambientBus) {
    ambientBus.gain.value = Math.max(0, Math.min(1, vol));
  }
}
