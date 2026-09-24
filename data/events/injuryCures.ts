import type { GameEvent } from '@interfaces/lifeEngine';

/**
 * 奇遇醫殘（design/gdd/injury-system.md §3.4）：只喺身有傷殘時入奇遇池。
 * 效果 cure_crippled：傷殘 → 重傷（仍要再養）。每世預期遇到 ≤ 1 次。
 */
export const INJURY_CURE_EVENTS: GameEvent[] = [
  {
    id: 'cure_wandering_physician',
    title: '雲遊神醫',
    body: '破廟簷下，一個背藥簍的老者盯著你的舊傷看了半晌：「這傷，老夫見過更糟的。只是治起來，要你吃些苦頭。」',
    tags: ['special', 'injury_cure'],
    weight: 4,
    requirements: { minAge: 14, once: true, hasCrippled: true },
    choices: [
      {
        id: 'accept',
        text: '任他施針，咬牙忍痛',
        outcomes: [
          {
            effects: [
              { type: 'cure_crippled' },
              { type: 'health', amount: -12 },
              { type: 'money', amount: -30 },
              {
                type: 'narrate',
                text: '七日七夜，金針入骨，藥湯滾燙。老者臨去只留一句「好生將養」，便不知所蹤。那處殘疾，竟真有了知覺。',
              },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '江湖騙子多，婉拒',
        outcomes: [
          {
            effects: [{ type: 'narrate', text: '老者也不強求，拄杖而去。你望著他背影，心裡忽然空了一塊。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cure_black_jade_ointment',
    title: '續骨黑玉膏',
    body: '當鋪老朝奉從櫃底摸出一個黑漆小盒：「祖上傳下的續骨黑玉膏，只剩這一貼。你要，便拿你最值錢的東西來換。」',
    tags: ['special', 'injury_cure'],
    weight: 4,
    requirements: { minAge: 14, once: true, hasCrippled: true, minMoney: 60 },
    choices: [
      {
        id: 'buy',
        text: '傾囊換膏',
        outcomes: [
          {
            effects: [
              { type: 'cure_crippled' },
              { type: 'money', amount: -60 },
              {
                type: 'narrate',
                text: '黑玉膏敷上，先是冰涼，繼而如火燎原。三個月後，你竟能慢慢使上力氣——雖不復當年，卻已是天大的造化。',
              },
            ],
          },
        ],
      },
      {
        id: 'pass',
        text: '銀兩另有用處',
        outcomes: [{ effects: [{ type: 'narrate', text: '你把小盒推回櫃上。老朝奉嘆口氣，又將它收回暗處。' }] }],
      },
    ],
  },
  {
    id: 'cure_yijin_fragment',
    title: '易筋殘頁',
    body: '古寺藏經閣塌了一角，瓦礫間露出半頁焦黃經文，字跡古拙：「易筋者，易其筋也……」',
    tags: ['special', 'injury_cure', 'secret'],
    weight: 3,
    requirements: { minAge: 16, once: true, hasCrippled: true, minAttrs: { wuXing: 30 } },
    choices: [
      {
        id: 'study',
        text: '依經文導氣，重塑筋脈',
        outcomes: [
          {
            effects: [
              { type: 'cure_crippled' },
              { type: 'qi', amount: -30 },
              {
                type: 'narrate',
                text: '你照殘頁所載，日夜導引。真氣在斷處一遍遍沖刷，痛如刀割。某夜醒來，那處殘疾竟隱隱發熱——筋脈續上了。',
              },
            ],
          },
        ],
      },
      {
        id: 'keep',
        text: '收好殘頁，改日再參',
        outcomes: [{ effects: [{ type: 'narrate', text: '你把殘頁夾進行囊。字太古奧，一時也參不透。' }] }],
      },
    ],
  },
];
