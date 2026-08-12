import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { extractLegacy } from '../core/life/legacy';
import { buildLifeSummary } from '../core/life/summary';
import { applyChoice, startMonth, resolvePendingEvent } from '../core/life/eventEngine';
import { jianghuHints } from '../core/life/jianghuHints';
import {
  LIFE_THEMES,
  ensureLifeTheme,
  getLifeTheme,
  pathBias,
  themeBias,
  applyPathAndEcho,
  takeEchoLine,
  buildLegacyScriptEvent,
  pickVarianceEpitaph,
  decorateEventBody,
} from '../core/life/lifeVariance';
import type { GameEvent } from '../interfaces/lifeEngine';

describe('life variance 1-7', () => {
  it('assigns life theme on create and surfaces vow in log', () => {
    const state = createNewLife({ seed: 42, lifeTheme: 'revenge', skipCoach: true });
    expect(state.character.flags.life_theme).toBe('revenge');
    expect(getLifeTheme(state).label).toBe('報仇');
    expect(state.lifeLog.some((l) => l.includes('題眼·報仇'))).toBe(true);
  });

  it('does not pin theme vow on the home hint strip', () => {
    const state = createNewLife({ seed: 42, lifeTheme: 'fame', skipCoach: true });
    const hints = jianghuHints(state);
    expect(hints.some((h) => h.includes('題眼'))).toBe(false);
    expect(state.character.flags.life_theme).toBe('fame');
  });

  it('theme bias lifts combat for revenge and mutes romance', () => {
    const state = createNewLife({ seed: 7, lifeTheme: 'revenge', skipCoach: true });
    const combat: GameEvent = {
      id: 't_combat',
      title: '宿敵',
      tags: ['combat', 'road'],
      choices: [{ id: 'a', text: '戰', outcomes: [{ effects: [{ type: 'narrate', text: 'x' }] }] }],
    };
    const romance: GameEvent = {
      id: 't_rom',
      title: '梅花',
      tags: ['romance'],
      choices: [{ id: 'a', text: '看', outcomes: [{ effects: [{ type: 'narrate', text: 'x' }] }] }],
    };
    expect(themeBias(state, combat)).toBeGreaterThan(themeBias(state, romance));
  });

  it('path flags close and open routes from choices', () => {
    const state = createNewLife({ seed: 9, lifeTheme: 'fame', skipCoach: true });
    const ev: GameEvent = {
      id: 't_path',
      title: '橋上',
      tags: ['road'],
      choices: [{ id: 'a', text: '硬闖', outcomes: [{ effects: [{ type: 'narrate', text: 'x' }] }] }],
    };
    const { pathLines } = applyPathAndEcho(state, '拔刀硬闖', ev);
    expect(state.character.flags.path_open_blade).toBe(true);
    expect(pathLines.length).toBeGreaterThan(0);
    const combat: GameEvent = { ...ev, tags: ['combat'] };
    const bond: GameEvent = { ...ev, tags: ['romance', 'family'] };
    expect(pathBias(state, combat)).toBeGreaterThan(pathBias(state, bond));
  });

  it('echo lingers into next month chronicle', () => {
    const state = createNewLife({ seed: 11, lifeTheme: 'clan', skipCoach: true });
    const ev: GameEvent = {
      id: 't_echo',
      title: '夜雨投店',
      body: '雨',
      tags: ['ordinary'],
      choices: [{ id: 'a', text: '出手相助', outcomes: [{ effects: [{ type: 'narrate', text: 'x' }] }] }],
    };
    applyPathAndEcho(state, '出手相助', ev);
    expect(typeof state.character.flags.echo_pending).toBe('string');
    const line = takeEchoLine(state);
    expect(line).toMatch(/茶棚|出手/);
  });

  it('legacy carries theme and schedules rival script', () => {
    const prev = createNewLife({ seed: 13, lifeTheme: 'revenge', skipCoach: true });
    prev.character.flags.aftermath_blood_foe = '赤練';
    // force a low-affinity npc as rival
    prev.npcs.foe1 = {
      id: 'foe1',
      name: '舊仇張',
      gender: 'male',
      role: 'rival',
      affinity: -40,
      memories: [],
      alive: true,
    };
    const legacy = extractLegacy(prev);
    expect(legacy.lifeTheme).toBe('revenge');
    const next = createNewLife({ seed: 14, legacy, skipCoach: true });
    expect(next.character.flags.legacy_theme_echo).toBe('revenge');
    expect(next.character.flags.legacy_script_rival || next.character.flags.born_with_rival_hint).toBeTruthy();
    const script = buildLegacyScriptEvent(next);
    expect(script?.id).toMatch(/^legacy_script_/);
  });

  it('epitaph follows theme × nature', () => {
    const state = createNewLife({ seed: 21, lifeTheme: 'wealth', skipCoach: true });
    state.character.nature = { xia: 5, xie: 40, kuang: 8, e: 6 };
    state.character.alive = false;
    state.phase = 'summary';
    const epitaph = pickVarianceEpitaph(state);
    expect(epitaph).toMatch(/算盤|匣/);
    const summary = buildLifeSummary(state);
    expect(summary).toMatch(/題眼：發財/);
    expect(summary).toContain(epitaph.trim());
  });

  it('nature tone prefixes event body when heart leans hard', () => {
    const state = createNewLife({ seed: 33, lifeTheme: 'master', skipCoach: true });
    state.character.nature = { xia: 8, xie: 8, kuang: 40, e: 5 };
    const body = decorateEventBody(state, '石橋中央立着人。');
    expect(body).toMatch(/動手/);
    expect(body).toContain('石橋中央立着人。');
  });

  it('ensureLifeTheme is stable once set', () => {
    const state = createNewLife({ seed: 55, lifeTheme: 'reclusion', skipCoach: true });
    const a = ensureLifeTheme(state);
    const b = ensureLifeTheme(state, 'fame');
    expect(a).toBe('reclusion');
    expect(b).toBe('reclusion');
    expect(LIFE_THEMES.reclusion.vow).toBeTruthy();
  });

  it('applying a choice then starting month keeps engine healthy', () => {
    const s2 = createNewLife({ seed: 77, lifeTheme: 'clan', skipCoach: true });
    startMonth(s2);
    const pending = resolvePendingEvent(s2);
    if (pending) {
      const choice = pending.choices[0];
      if (choice) {
        const result = applyChoice(s2, pending, choice.id);
        expect(result.feedback.length).toBeGreaterThan(0);
      }
    }
    expect(getLifeTheme(s2).id).toBe('clan');
  });
});
