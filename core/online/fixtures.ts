import { createNewLife } from '../life/gameState';
import { normalPreset } from '../life/loadoutPresets';
import type { OnlineAccountId, OnlinePlayer, OnlineWorld } from '@interfaces/online';

/** 隔離試場角色；唔匯入玩家存檔，唔代表正式服平衡。 */
export function createOnlineFixture(now: number): OnlineWorld {
  const make = (id: OnlineAccountId): OnlinePlayer => {
    const state = createNewLife({ seed: 42, name: id === 'river' ? '沈雲舟' : '謝清霜', skipCoach: true });
    const c = state.character;
    c.skills = ['art_river_fist', 'art_rain_sword', 'art_stone_palm', 'art_iron_body', 'qg_broken_bridge'];
    c.equippedArts = ['art_river_fist', 'art_rain_sword', null, null, null];
    c.supportArts = { internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    c.mainArts = { external: 'art_river_fist', internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    c.volumes = { art_river_fist: [1, 6], art_rain_sword: [1, 2], art_stone_palm: [1, 3] };
    c.skillRanks = Object.fromEntries(c.skills.map(skill => [skill, id === 'river' ? 5 : 2]));
    c.martial = id === 'river' ? 180 : 20;
    c.maxHealth = id === 'river' ? 520 : 300; c.health = c.maxHealth;
    c.maxQi = 360; c.qi = 360;
    c.flags.coach_done = true; c.flags.newbie_done = true;
    c.combatLoadout = normalPreset(c);
    return { id, character: c, rank: id === 'river' ? 100 : 20,
      protectedUntil: 0, onlineUntil: now, busy: null, rewardAt: now,
      offlineAccruedMs: 0, pendingOnline: 0, pendingOffline: 0,
      onlineRemainder: 0, offlineRemainder: 0, silver: 0 };
  };
  return { version: 1, revision: 0, players: { river: make('river'), cloud: make('cloud') }, battles: [] };
}
