/** 幫會首輪封測參數；獨立幫會資材，不進私人銀兩／玉石錢包。 */
export const GUILD_TEST = {
  maxGuilds: 50, maxMembers: 200, baseCapacity: 20, capacityPerLevel: 5,
  maxLevel: 5, upgradeBase: 100, cityMaterialsPerHour: 10,
  incomeCapMs: 48 * 3600000, cityProtectionMs: 5 * 60000,
  attackCooldownMs: 60000, attacksPerDay: 5, applicationMs: 7 * 86400000,
} as const;
/** 十城只屬幫會；門派會武另用原十名代表規則。 */
export const GUILD_CITIES = [
  {id:'luoyang',name:'洛陽',scene:'古都武館'}, {id:'changan',name:'長安',scene:'關中城闕'},
  {id:'xiangyang',name:'襄陽',scene:'漢水要衝'}, {id:'dali',name:'大理',scene:'南疆山城'},
  {id:'chengdu',name:'成都',scene:'蜀中竹院'}, {id:'gusu',name:'姑蘇',scene:'江南水巷'},
  {id:'linan',name:'臨安',scene:'湖畔茶坊'}, {id:'kaifeng',name:'開封',scene:'汴河長街'},
  {id:'quanzhou',name:'泉州',scene:'南方海港'}, {id:'yangzhou',name:'揚州',scene:'運河渡口'},
] as const;
/** 香港每日04:00重置城戰次數，由服務端時計決定。 */
export const guildDay = (now:number) => Math.floor((now-20*3600000)/86400000);
