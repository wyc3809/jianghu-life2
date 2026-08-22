import type { GameEvent } from '@interfaces/lifeEngine';

/**
 * 依心性（俠／惡／狂）解鎖的一次性劇情線：心性夠深時才會撞見，
 * 各自導向不同稱號與江湖風評，唔係淨係揀邊間門派入得（正邪值深化）。
 */
export const NATURE_ARC_EVENTS: GameEvent[] = [
  {
    id: 'nature_arc_xia_relief',
    title: '劫富濟貧',
    body: '城西惡霸強佔民田，苦主敢怒不敢言，鄉里都望向你。',
    tags: ['nature_arc', 'xia'],
    requirements: { minAge: 20, minNature: { xia: 55 }, once: true },
    choices: [
      {
        id: 'raid',
        text: '夜探莊院，奪回契據',
        outcomes: [
          {
            chance: 0.8,
            effects: [
              { type: 'reputation', amount: 30 },
              { type: 'money', amount: 40 },
              { type: 'flag', key: 'nature_arc_xia_hero', value: true },
              { type: 'narrate', text: '契據到手，你把地契一份份還給苦主。惡霸連夜捲細軟走了。' },
            ],
          },
          {
            chance: 0.2,
            effects: [
              { type: 'health', amount: -14 },
              { type: 'reputation', amount: 30 },
              { type: 'flag', key: 'nature_arc_xia_hero', value: true },
              { type: 'narrate', text: '護院纏了你半柱香，契據還是奪了出來，肩上添了道傷。' },
            ],
          },
        ],
      },
      {
        id: 'expose',
        text: '搜集罪證，告官究辦',
        outcomes: [
          {
            chance: 0.7,
            effects: [
              { type: 'reputation', amount: 20 },
              { type: 'flag', key: 'nature_arc_xia_hero', value: true },
              { type: 'narrate', text: '狀紙遞上，證據確鑿，惡霸被摘了頂戴。鄉里燒香謝你。' },
            ],
          },
          {
            chance: 0.3,
            effects: [
              { type: 'reputation', amount: 10 },
              { type: 'money', amount: -10 },
              { type: 'flag', key: 'nature_arc_xia_hero', value: true },
              { type: 'narrate', text: '官官相護，罰銀了事——但這事終究攤在了明處，惡霸收斂了不少。' },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '各人自掃門前雪',
        outcomes: [
          {
            chance: 0.5,
            effects: [
              { type: 'attr', delta: { danShi: -1 } },
              { type: 'narrate', text: '你轉身走了。身後鄉里的哭訴聲，過了幾年還會偶爾想起。' },
            ],
          },
          {
            chance: 0.5,
            effects: [
              { type: 'narrate', text: '你權當沒聽見。心裡那點俠氣，這回沒能撐得住腳。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nature_arc_e_underworld',
    title: '黑道拉攏',
    body: '黑棍幫遣人送來一份「投名狀」，邀你入夥，共分一條財路。',
    tags: ['nature_arc', 'e'],
    requirements: { minAge: 20, minNature: { e: 45 }, once: true },
    choices: [
      {
        id: 'join',
        text: '按下指印，入夥黑棍幫',
        outcomes: [
          {
            chance: 0.75,
            effects: [
              { type: 'money', amount: 80 },
              { type: 'martial', amount: 3 },
              { type: 'reputation', amount: -20 },
              { type: 'flag', key: 'nature_arc_e_underworld', value: true },
              { type: 'narrate', text: '投名狀按下指印，往後這條財路算是分你一份。江湖上你的名字開始跟「黑棍幫」連在一起。' },
            ],
          },
          {
            chance: 0.25,
            effects: [
              { type: 'money', amount: 50 },
              { type: 'health', amount: -10 },
              { type: 'reputation', amount: -25 },
              { type: 'flag', key: 'nature_arc_e_underworld', value: true },
              { type: 'narrate', text: '入夥那夜有仇家尋釁，挨了幾拳才算把這身份坐實。' },
            ],
          },
        ],
      },
      {
        id: 'extort',
        text: '甩開幫規，獨吞這條財路',
        outcomes: [
          {
            chance: 0.6,
            effects: [
              { type: 'money', amount: 50 },
              { type: 'reputation', amount: -15 },
              { type: 'flag', key: 'nature_arc_e_lone', value: true },
              { type: 'narrate', text: '你甩開幫規自己動手，財路搶到了，也把黑棍幫得罪透了。' },
            ],
          },
          {
            chance: 0.4,
            effects: [
              { type: 'health', amount: -20 },
              { type: 'money', amount: 20 },
              { type: 'reputation', amount: -15 },
              { type: 'flag', key: 'nature_arc_e_lone', value: true },
              { type: 'narrate', text: '黑棍幫的人堵了你一次，你硬吃了幾下，財路總算沒讓出去。' },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '撕毀投名狀，拒不同流',
        outcomes: [
          {
            chance: 0.6,
            effects: [
              { type: 'reputation', amount: 8 },
              { type: 'narrate', text: '投名狀當面撕碎。來人冷笑一聲走了，這條財路你沒沾手。' },
            ],
          },
          {
            chance: 0.4,
            effects: [
              { type: 'health', amount: -8 },
              { type: 'reputation', amount: 8 },
              { type: 'narrate', text: '撕了投名狀，臨走還是挨了記悶棍——算是黑棍幫給你的警告。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nature_arc_kuang_challenge',
    title: '踢館連環',
    body: '你一連踢了三家武館的場子，江湖都在傳你是個瘋魔。',
    tags: ['nature_arc', 'kuang'],
    requirements: { minAge: 18, minNature: { kuang: 55 }, once: true },
    choices: [
      {
        id: 'push_on',
        text: '再踢一家，踢到再無人敢應戰',
        outcomes: [
          {
            chance: 0.65,
            effects: [
              { type: 'martial', amount: 6 },
              { type: 'reputation', amount: 15 },
              { type: 'flag', key: 'nature_arc_kuang_done', value: true },
              { type: 'narrate', text: '這一家的場子也踢下了。再無人敢應你的戰帖，「瘋魔」二字倒成了名號。' },
            ],
          },
          {
            chance: 0.35,
            effects: [
              { type: 'health', amount: -18 },
              { type: 'martial', amount: 4 },
              { type: 'reputation', amount: 15 },
              { type: 'flag', key: 'nature_arc_kuang_done', value: true },
              { type: 'narrate', text: '這家館主是塊硬骨頭，你贏得渾身是傷，名號卻更響了。' },
            ],
          },
        ],
      },
      {
        id: 'brag',
        text: '見好就收，四處誇口這段戰績',
        outcomes: [
          {
            chance: 0.6,
            effects: [
              { type: 'reputation', amount: 10 },
              { type: 'flag', key: 'nature_arc_kuang_done', value: true },
              { type: 'narrate', text: '酒肆裡添了段吹噓的話本，你這幾場硬仗成了江湖飯後談資。' },
            ],
          },
          {
            chance: 0.4,
            effects: [
              { type: 'reputation', amount: 10 },
              { type: 'attr', delta: { meiLi: -2 } },
              { type: 'flag', key: 'nature_arc_kuang_done', value: true },
              { type: 'narrate', text: '誇口誇得太滿，聽的人心裡暗笑你這股輕狂勁。' },
            ],
          },
        ],
      },
      {
        id: 'cool_down',
        text: '收手歇一歇，免得樹敵太多',
        outcomes: [
          {
            chance: 0.5,
            effects: [
              { type: 'attr', delta: { danShi: 1 } },
              { type: 'narrate', text: '你把戰帖收了起來。江湖傳聞漸漸淡了，你這口氣總算沒再逞下去。' },
            ],
          },
          {
            chance: 0.5,
            effects: [
              { type: 'narrate', text: '收手是收手了，但心裡那股不服氣，還是悶在胸口。' },
            ],
          },
        ],
      },
    ],
  },
];
