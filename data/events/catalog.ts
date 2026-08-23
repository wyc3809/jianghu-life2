import type { GameEvent } from '@interfaces/lifeEngine';

/** 江湖一生 V1 — 事件資料庫（50） */
export const EVENT_CATALOG: GameEvent[] = [
  {
    id: 'life_birth',
    title: '降生',
    body: '嬰兒啼哭，家人歡喜。',
    weight: 100,
    requirements: { maxAge: 0, once: true },
    choices: [
      {
        id: 'cry',
        text: '哭聲洪亮',
        outcomes: [{ effects: [{ type: 'attr', delta: { genGu: 2 } }, { type: 'narrate', text: '你落地便哭。穩婆笑說嗓門大——爹把你舉高，窗外雪正落。' }] }],
      },
      {
        id: 'quiet',
        text: '安靜凝視',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 2 } }, { type: 'narrate', text: '你睜着眼看梁上塵。房裡人說這孩子安靜，像在聽什麼。' }] }],
      },
    ],
  },
  {
    id: 'childhood_play',
    title: '童年嬉戲',
    requirements: { minAge: 3, maxAge: 10 },
    choices: [
      {
        id: 'stick',
        text: '木劍為伴',
        outcomes: [{ effects: [{ type: 'martial', amount: 2 }, { type: 'attr', delta: { danShi: 1 } }, { type: 'narrate', text: '木劍磕在牆根，你學說書人喊招式。娘在門口喊吃飯，你才記起手臂酸。' }] }],
      },
      {
        id: 'book',
        text: '偷聽說書',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 2, meiLi: 1 } }, { type: 'narrate', text: '茶棚角落，你偷聽「劍俠夜奔」。銅板聲裡，江湖比鎮口遠。' }] }],
      },
    ],
  },
  {
    id: 'family_poverty',
    title: '家道中落',
    requirements: { minAge: 6, maxAge: 16 },
    choices: [
      {
        id: 'help',
        text: '幫父母分憂',
        outcomes: [{ effects: [{ type: 'money', amount: 5 }, { type: 'attr', delta: { meiLi: 1 } }, { type: 'narrate', text: '米缸見底那天，你去鎮口幫工。銀子不多，夠換半袋雜糧。' }] }],
      },
      {
        id: 'complain',
        text: '怨天尤人',
        outcomes: [{ effects: [{ type: 'attr', delta: { fuYuan: -2 } }, { type: 'reputation', amount: -3 }, { type: 'narrate', text: '你摔了碗，又默默掃乾淨。怨氣散在灶灰裡，家里更靜了。' }] }],
      },
    ],
  },
  {
    id: 'find_coin',
    title: '路拾銅錢',
    requirements: { minAge: 5, maxAge: 20 },
    weight: 15,
    choices: [
      {
        id: 'keep',
        text: '收進懷裡',
        outcomes: [{ effects: [{ type: 'money', amount: 15 }, { type: 'attr', delta: { fuYuan: 1 } }, { type: 'narrate', text: '銅錢入手，掌心一涼。你環顧左右，街口無人喚失，便把錢貼身收好。' }] }],
      },
      {
        id: 'return',
        text: '交還失主',
        outcomes: [{ effects: [{ type: 'reputation', amount: 8 }, { type: 'attr', delta: { meiLi: 2 } }, { type: 'narrate', text: '你追上去，把銅錢塞回那人手裡。對方一愣，連聲道謝。巷口風過，胸口輕了一寸。' }] }],
      },
    ],
  },
  {
    id: 'master_wanderer',
    title: '遊方道人',
    requirements: { minAge: 8, maxAge: 18, once: true },
    choices: [
      {
        id: 'learn',
        text: '請教吐納',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'skill_breath', name: '基礎吐納' },
              { type: 'martial', amount: 3 },
              { type: 'flag', key: 'met_master', value: true },
              { type: 'narrate', text: '遊方道人看你一眼，袖裡抖出半卷殘篇：「緣到便傳。」晨霧未散，你已記得三式吐納。' },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '匆匆離去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你拱手退去。道人也不強留，只把葫蘆一晃，消失在鎮外官道的楊塵裡。' }] }],
      },
    ],
  },
  {
    id: 'sect_recruit',
    title: '門派招收弟子',
    requirements: { minAge: 12, maxAge: 25, noSect: true, once: true },
    choices: [
      {
        id: 'join',
        text: '拜入山門',
        outcomes: [{ effects: [{ type: 'joinSect' }, { type: 'martial', amount: 5 }, { type: 'narrate', text: '門中人遞過一枚冷鐵腰牌。你按手印時，遠山如墨。' }] }],
      },
      {
        id: 'decline',
        text: '婉言謝絕',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: 1 } }, { type: 'narrate', text: '你婉拒門中之邀。來人也不惱，只把腰牌收回袖裡，轉身就走。' }] }],
      },
    ],
  },
  {
    id: 'sect_training',
    title: '門派演武',
    requirements: { minAge: 14, sectRequired: true },
    choices: [
      {
        id: 'hard',
        text: '苦練不止',
        outcomes: [{ effects: [{ type: 'martial', amount: 6 }, { type: 'health', amount: -5 }, { type: 'narrate', text: '晨練到肘臂發顫，教習才喝停。汗滴在青石上，像一行寫不完的字。' }] }],
      },
      {
        id: 'rest',
        text: '適度調息',
        outcomes: [{ effects: [{ type: 'martial', amount: 3 }, { type: 'health', amount: 5 }, { type: 'narrate', text: '你偷得半日清閒，聽師兄師姐閒話門中舊事。招式沒多練幾遍，門道倒是聽懂了幾分。' }] }],
      },
    ],
  },
  {
    id: 'learn_sword',
    title: '劍譜殘頁',
    requirements: { minAge: 15, minMartial: 5, once: true },
    choices: [
      {
        id: 'study',
        text: '日夜鑽研',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'skill_sword_basic', name: '青雲劍法（殘篇）' },
              { type: 'martial', amount: 8 },
              { type: 'attr', delta: { wuXing: 2 } },
              { type: 'narrate', text: '劍譜上的圈點漸漸被你讀懂。出招時風聲變了——不是更快，是更準。' },
            ],
          },
        ],
      },
      {
        id: 'sell',
        text: '賣給書商',
        outcomes: [{ effects: [{ type: 'money', amount: 40 }, { type: 'narrate', text: '你把譜本易了銀兩。銀子沉甸甸，心底卻像缺了一角。' }] }],
      },
    ],
  },
  {
    id: 'love_meet',
    title: '燈會相逢',
    requirements: { minAge: 16, maxAge: 35, once: true, notFlags: ['wugenSevered'] },
    choices: [
      {
        id: 'talk',
        text: '主動搭話',
        outcomes: [
          {
            effects: [
              { type: 'memory', npcId: 'lover_candidate', text: '燈會初遇', affinity: 20 },
              { type: 'flag', key: 'romance_started', value: true },
              { type: 'narrate', text: '你們在橋邊說了很久。河燈一盞盞漂過，誰也沒問明日。' },
            ],
          },
        ],
      },
      {
        id: 'shy',
        text: '遠遠相望',
        outcomes: [{ effects: [{ type: 'attr', delta: { meiLi: -1 } }, { type: 'narrate', text: '你低眉過去，對方似笑非笑。有些話卡在喉嚨，過橋時才散掉。' }] }],
      },
    ],
  },
  {
    id: 'love_confess',
    title: '表白心跡',
    requirements: {
      minAge: 18,
      flags: { romance_started: true },
      once: true,
      notFlags: ['wugenSevered'],
    },
    choices: [
      {
        id: 'yes',
        text: '真情告白',
        outcomes: [
          {
            chance: 0.65,
            effects: [
              { type: 'lover', npcId: 'lover_candidate' },
              { type: 'attr', delta: { meiLi: 3 } },
            ],
          },
          {
            chance: 0.35,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '對方別過臉去，一句話沒說。你在雨裡站到半夜才回去，隔天發起燒來。' }, { type: 'health', amount: -10 }],
          },
        ],
      },
      {
        id: 'wait',
        text: '再等等',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: -1 } }, { type: 'narrate', text: '你把話嚥回去。月色很好，橋欄卻涼。' }] }],
      },
    ],
  },
  {
    id: 'duel_street',
    title: '街頭決鬥',
    requirements: { minAge: 16, minMartial: 10 },
    choices: [
      {
        id: 'fight',
        text: '拔劍應戰',
        outcomes: [
          {
            chance: 0.55,
            effects: [
              { type: 'martial', amount: 4 },
              { type: 'reputation', amount: 10 },
            ],
          },
          {
            chance: 0.45,
            label: '事與願違',
            effects: [{ type: 'health', amount: -25 }, { type: 'narrate', text: '對方一招快過一招，你擋到第三合，肋下捱了實打實一劍，跌坐在地。' }],
          },
        ],
      },
      {
        id: 'flee',
        text: '避其鋒芒',
        outcomes: [{ effects: [{ type: 'reputation', amount: -5 }, { type: 'attr', delta: { danShi: -2 } }, { type: 'narrate', text: '你抽身退入人潮。背後有人笑，有人罵。你低頭摸了摸腰間，刀還在。' }] }],
      },
    ],
  },
  {
    id: 'bandit_raid',
    title: '山賊劫道',
    requirements: { minAge: 14 },
    choices: [
      {
        id: 'defend',
        text: '護送商旅',
        outcomes: [
          {
            chance: 0.5,
            effects: [{ type: 'money', amount: 25 }, { type: 'reputation', amount: 12 }, { type: 'health', amount: -15 }],
          },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [
              { type: 'narrate', text: '山賊人多，你們且戰且退，商隊貨箱還是被劫走了幾口，你自己也掛了彩。' },
              { type: 'health', amount: -30 },
              { type: 'money', amount: -10 },
            ],
          },
        ],
      },
      {
        id: 'hide',
        text: '躲入草叢',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: -1 } }, { type: 'narrate', text: '你把家人推進地窖，自己屏息聽著外頭的馬蹄。土腥氣裡，燈火滅了。' }] }],
      },
    ],
  },
  {
    id: 'wealth_trade',
    title: '商路機緣',
    requirements: { minAge: 18, minAttrs: { wuXing: 45 } },
    choices: [
      {
        id: 'invest',
        text: '投資貨棧',
        outcomes: [{ effects: [{ type: 'money', amount: 60 }, { type: 'attr', delta: { fuYuan: 1 } }, { type: 'narrate', text: '你把銀兩押進貨船。掌櫃拍胸脯，你卻只看見江面上的霧。' }] }],
      },
      {
        id: 'pass',
        text: '穩妥為上',
        outcomes: [{ effects: [{ type: 'money', amount: 10 }, { type: 'narrate', text: '你搖頭不入股。船走了，岸上的你口袋輕，風也輕。' }] }],
      },
    ],
  },
  {
    id: 'plague',
    title: '瘟疫蔓延',
    requirements: { minAge: 10 },
    weight: 8,
    choices: [
      {
        id: 'aid',
        text: '施粥救患',
        outcomes: [{ effects: [{ type: 'health', amount: -15 }, { type: 'reputation', amount: 15 }, { type: 'narrate', text: '藥香與苦汗混在一起。你幫着抬水、送藥，直到手指發白。' }] }],
      },
      {
        id: 'flee_city',
        text: '離城避禍',
        outcomes: [{ effects: [{ type: 'money', amount: -20 }, { type: 'health', amount: 5 }, { type: 'narrate', text: '你連夜出城。回頭時，鎮燈稀疏，像一雙眼慢慢閉上。' }] }],
      },
    ],
  },
  {
    id: 'martial_tournament',
    title: '武林大會',
    requirements: { minAge: 20, minMartial: 25, once: true },
    choices: [
      {
        id: 'enter',
        text: '登台比武',
        outcomes: [
          {
            chance: 0.4,
            effects: [
              { type: 'reputation', amount: 30 },
              { type: 'martial', amount: 10 },
              { type: 'money', amount: 50 },
            ],
          },
          {
            chance: 0.6,
            label: '波折',
            effects: [{ type: 'narrate', text: '你這場打得艱難，捱了不少拳腳才撐到終局，名次不上不下，倒也練出了些門道。' }, { type: 'health', amount: -20 }, { type: 'martial', amount: 3 }],
          },
        ],
      },
      {
        id: 'watch',
        text: '旁觀學藝',
        outcomes: [{ effects: [{ type: 'martial', amount: 5 }, { type: 'attr', delta: { wuXing: 2 } }, { type: 'narrate', text: '你站在場邊看完三場。有人贏得很醜，有人輸得很漂亮。袖裡多了三道沙痕。' }] }],
      },
    ],
  },
  {
    id: 'inner_power',
    title: '內力突破',
    requirements: { minAge: 18, minMartial: 20, once: true },
    choices: [
      {
        id: 'breakthrough',
        text: '閉關七日',
        outcomes: [
          {
            chance: 0.6,
            effects: [
              { type: 'martial', amount: 12 },
              { type: 'attr', delta: { genGu: 3 } },
              { type: 'learnSkill', skillId: 'skill_internal', name: '混元心法' },
            ],
          },
          {
            chance: 0.4,
            label: '事與願違',
            effects: [{ type: 'health', amount: -20 }, { type: 'narrate', text: '氣息岔了道，你跌坐在地，吐出一口血。師兄們把你抬出關房，撿回一條命。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'betray_sect',
    title: '師門猜忌',
    requirements: { minAge: 22, sectRequired: true },
    choices: [
      {
        id: 'explain',
        text: '稟明掌門',
        outcomes: [{ effects: [{ type: 'reputation', amount: 5 }, { type: 'narrate', text: '你把來龍去脈說盡。長老沉默良久，只嘆了一聲，茶沫散了。' }] }],
      },
      {
        id: 'leave',
        text: '憤而離山',
        outcomes: [{ effects: [{ type: 'leaveSect' }, { type: 'martial', amount: 2 }, { type: 'narrate', text: '你摘下腰牌，放在山門石上。身後鐘聲一記，灰塵揚起。' }] }],
      },
    ],
  },
  {
    id: 'elder_task',
    title: '長老密令',
    requirements: { minAge: 25, sectRequired: true, minMartial: 30 },
    choices: [
      {
        id: 'accept',
        text: '奉命行事',
        outcomes: [{ effects: [{ type: 'money', amount: 35 }, { type: 'martial', amount: 5 }, { type: 'reputation', amount: 8 }, { type: 'narrate', text: '你領了差事下山。信封不重，汗卻先濕了後背。' }] }],
      },
      {
        id: 'refuse',
        text: '稱病推辭',
        outcomes: [{ effects: [{ type: 'reputation', amount: -8 }, { type: 'narrate', text: '你推了這趟差。門中人看你的眼神淡了些，山門石上還留着你的腳印。' }] }],
      },
    ],
  },
  {
    id: 'rival_challenge',
    title: '宿敵挑戰',
    requirements: { minAge: 20, minMartial: 15 },
    choices: [
      {
        id: 'duel',
        text: '應戰',
        outcomes: [
          {
            chance: 0.5,
            effects: [{ type: 'martial', amount: 6 }, { type: 'reputation', amount: 15 }],
          },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '宿敵這回有備而來，一套組合拳把你逼到牆角，你捱到收場才勉強站穩。' }, { type: 'health', amount: -35 }],
          },
        ],
      },
    ],
  },
  {
    id: 'treasure_map',
    title: '藏寶圖',
    requirements: { minAge: 18, minAttrs: { fuYuan: 50 }, once: true },
    choices: [
      {
        id: 'dig',
        text: '按圖尋寶',
        outcomes: [
          {
            chance: 0.7,
            effects: [{ type: 'money', amount: 120 }, { type: 'martial', amount: 3 }],
          },
          {
            chance: 0.3,
            label: '事與願違',
            effects: [{ type: 'health', amount: -25 }, { type: 'narrate', text: '鏟子挖到一半，機關的竹釘從土裡彈出，扎穿你的小腿。寶藏的事，看來是有人先來過了。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wine_poet',
    title: '酒肆詩會',
    requirements: { minAge: 16, minAttrs: { meiLi: 40 } },
    choices: [
      {
        id: 'recite',
        text: '即興吟詩',
        outcomes: [{ effects: [{ type: 'reputation', amount: 12 }, { type: 'attr', delta: { meiLi: 2 } }, { type: 'narrate', text: '你拍案而起，把胸中那幾句吼完。酒客叫好，詩人不置可否，只再滿上一碗。' }] }],
      },
      {
        id: 'drink',
        text: '只顧暢飲',
        outcomes: [{ effects: [{ type: 'health', amount: -5 }, { type: 'money', amount: -8 }, { type: 'narrate', text: '你與詩人對飲到更殘。醉意裡桌面發黏，明天的路變遠。' }] }],
      },
    ],
  },
  {
    id: 'assassin',
    title: '殺手夜襲',
    requirements: { minAge: 22, minMartial: 20 },
    choices: [
      {
        id: 'fight',
        text: '反殺',
        outcomes: [
          {
            chance: 0.45,
            effects: [{ type: 'martial', amount: 8 }, { type: 'money', amount: 30 }],
          },
          {
            chance: 0.55,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '黑暗裡一把匕首搶先扎進你肩頭，你反手撂倒對方時，血已經浸透了半件衣裳。' }, { type: 'health', amount: -40 }],
          },
        ],
      },
      {
        id: 'escape',
        text: '翻窗逃走',
        outcomes: [{ effects: [{ type: 'health', amount: -10 }, { type: 'reputation', amount: -10 }, { type: 'narrate', text: '你踏屋脊而去。身後衣袂割風，瓦片還在顫。' }] }],
      },
    ],
  },
  {
    id: 'parent_ill',
    title: '父母染恙',
    requirements: { minAge: 12, maxAge: 40, once: true },
    choices: [
      {
        id: 'care',
        text: '床前盡孝',
        outcomes: [{ effects: [{ type: 'money', amount: -25 }, { type: 'attr', delta: { meiLi: 3, fuYuan: 2 } }, { type: 'narrate', text: '榻前燈芯跳了又跳。你徹夜換巾、喂藥，直到窗外魚肚白。' }] }],
      },
      {
        id: 'doctor',
        text: '請名醫診治',
        outcomes: [{ effects: [{ type: 'money', amount: -50 }, { type: 'reputation', amount: 5 }, { type: 'narrate', text: '你奔去請醫。銀兩少了一截，藥包的紙繩勒進掌心。' }] }],
      },
    ],
  },
  {
    id: 'war_draft',
    title: '征召從軍',
    requirements: { minAge: 18, maxAge: 45 },
    weight: 6,
    choices: [
      {
        id: 'serve',
        text: '從軍出征',
        outcomes: [{ effects: [{ type: 'martial', amount: 10 }, { type: 'health', amount: -25 }, { type: 'reputation', amount: 10 }, { type: 'narrate', text: '兵符到手，你跟著隊列出鎮。塵土揚起，千燈的燈火被甩在背後。' }] }],
      },
      {
        id: 'bribe',
        text: '設法逃避',
        outcomes: [{ effects: [{ type: 'money', amount: -40 }, { type: 'reputation', amount: -15 }, { type: 'narrate', text: '你塞了銀子給差役。隊伍走了，你站在空街上，鞋底還有別人揚起的灰。' }] }],
      },
    ],
  },
  {
    id: 'inn_brawl',
    title: '客棧鬥毆',
    requirements: { minAge: 15 },
    choices: [
      {
        id: 'join',
        text: '捲入其中',
        outcomes: [{ effects: [{ type: 'health', amount: -12 }, { type: 'martial', amount: 2 }, { type: 'narrate', text: '酒碗砸碎的瞬間你已出手。店小二哭着算帳，桌腳還在轉。' }] }],
      },
      {
        id: 'mediate',
        text: '居中調停',
        outcomes: [{ effects: [{ type: 'reputation', amount: 6 }, { type: 'attr', delta: { meiLi: 1 } }, { type: 'narrate', text: '你橫身勸開兩邊。拳头停了，目光卻還燙。酒漬在桌上畫出一條線。' }] }],
      },
    ],
  },
  {
    id: 'secret_manual',
    title: '密室經書',
    requirements: { minAge: 20, minAttrs: { wuXing: 55 }, once: true },
    choices: [
      {
        id: 'read',
        text: '研讀經書',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'skill_palm', name: '降龍十八掌（殘）' },
              { type: 'martial', amount: 15 },
              { type: 'narrate', text: '殘頁字跡古怪，你硬生生讀進去。天亮時眼眶發乾，指節反倒熱。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gamble',
    title: '賭坊際遇',
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'play',
        text: '小賭怡情',
        outcomes: [
          { chance: 0.4, effects: [{ type: 'money', amount: 30 }] },
          {
            chance: 0.6,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '骰子滾停，點數不對。莊家笑瞇瞇收走你面前那疊銅錢。' }, { type: 'money', amount: -25 }],
          },
        ],
      },
      {
        id: 'quit',
        text: '見好就收',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: 1 } }, { type: 'narrate', text: '你把籌碼推回去。有人笑你怯，你只覺口袋裡的銀子還溫着。' }] }],
      },
    ],
  },
  {
    id: 'rescue_child',
    title: '落水孩童',
    requirements: { minAge: 10, maxAge: 50 },
    choices: [
      {
        id: 'save',
        text: '跳水救人',
        outcomes: [{ effects: [{ type: 'reputation', amount: 10 }, { type: 'health', amount: -8 }, { type: 'attr', delta: { danShi: 2 } }, { type: 'narrate', text: '你衝進水裡，懷裡小孩哭得撕心。上岸後，鎮人讓出一條路，你的袖在滴水。' }] }],
      },
    ],
  },
  {
    id: 'herb_gather',
    title: '採藥深山',
    requirements: { minAge: 12 },
    choices: [
      {
        id: 'go',
        text: '入山採藥',
        outcomes: [
          { chance: 0.6, effects: [{ type: 'money', amount: 20 }, { type: 'health', amount: 5 }] },
          {
            chance: 0.4,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '一腳踩滑，你從碎石坡上滾了半截，藥籃子摔在山溝裡，找都找不回來。' }, { type: 'health', amount: -15 }],
          },
        ],
      },
    ],
  },
  {
    id: 'sect_promotion',
    title: '晉升內門',
    requirements: { minAge: 20, sectRequired: true, minMartial: 35, once: true },
    choices: [
      {
        id: 'trial',
        text: '參加考核',
        outcomes: [
          {
            chance: 0.55,
            effects: [{ type: 'martial', amount: 8 }, { type: 'reputation', amount: 12 }, { type: 'flag', key: 'inner_disciple', value: true }],
          },
          {
            chance: 0.45,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '最後一式收得急了些，長老搖頭：「根基還差一口氣，來年再考。」' }],
          },
        ],
      },
    ],
  },
  {
    id: 'love_rival',
    title: '情敵出現',
    requirements: { minAge: 18, flags: { romance_started: true } },
    choices: [
      {
        id: 'confront',
        text: '當面對質',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'reputation', amount: 5 }, { type: 'martial', amount: 2 }] },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [
              { type: 'narrate', text: '話沒說開反而吵大了，對方甩袖而去，你這幾天連飯都吃不香。' },
              { type: 'health', amount: -15 },
              { type: 'memory', npcId: 'lover_candidate', text: '因爭執疏遠', affinity: -15 },
            ],
          },
        ],
      },
      {
        id: 'trust',
        text: '選擇信任',
        outcomes: [{ effects: [{ type: 'attr', delta: { meiLi: 2 } }, { type: 'narrate', text: '你選擇相信。裂縫還在，你只是沒伸手去掰。' }] }],
      },
    ],
  },
  {
    id: 'monk_alms',
    title: '僧侶化緣',
    requirements: { minAge: 8 },
    choices: [
      {
        id: 'give',
        text: '布施銀錢',
        outcomes: [{ effects: [{ type: 'money', amount: -5 }, { type: 'attr', delta: { fuYuan: 3 } }, { type: 'narrate', text: '你把銅錢放進缽裡。和尚點頭，並不謝。缽沿涼得像石。' }] }],
      },
      {
        id: 'listen',
        text: '聽經半日',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 2 } }, { type: 'narrate', text: '你聽完一席因果。未必全信，卻記得一句：「刀快不如心穩。」' }] }],
      },
    ],
  },
  {
    id: 'blacksmith',
    title: '名匠鑄劍',
    requirements: { minAge: 18, minMoney: 50, once: true },
    choices: [
      {
        id: 'buy',
        text: '重金求劍',
        outcomes: [{ effects: [{ type: 'money', amount: -50 }, { type: 'martial', amount: 5 }, { type: 'narrate', text: '新兵刃上手，沉甸甸的。爐火映紅半邊臉，鐵腥味還在。' }] }],
      },
      {
        id: 'apprentice',
        text: '學徒打雜',
        outcomes: [{ effects: [{ type: 'martial', amount: 3 }, { type: 'money', amount: -10 }, { type: 'narrate', text: '你留下來拉風箱。鐵屑進了指甲縫，師傅只丟來一句：「先學會忍熱。」' }] }],
      },
    ],
  },
  {
    id: 'court_summon',
    title: '朝廷徵召',
    requirements: { minAge: 25, minReputation: 30 },
    choices: [
      {
        id: 'serve_court',
        text: '入朝為官',
        outcomes: [{ effects: [{ type: 'money', amount: 80 }, { type: 'reputation', amount: 20 }, { type: 'flag', key: 'court_official', value: true }, { type: 'narrate', text: '公門文書蓋了印。你踏進衙門側廊，皂靴聲比刀響。' }] }],
      },
      {
        id: 'decline_court',
        text: '辭不就徵',
        outcomes: [{ effects: [{ type: 'reputation', amount: 5 }, { type: 'narrate', text: '你辭了差事。官道外的風更自由，口袋也更空。' }] }],
      },
    ],
  },
  {
    id: 'jianghu_rumor',
    title: '江湖傳聞',
    requirements: { minAge: 14 },
    weight: 12,
    choices: [
      {
        id: 'investigate',
        text: '追查真相',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'martial', amount: 4 }, { type: 'money', amount: 15 }] },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '你追到最後才發現，傳聞的源頭是一夥設局的騙子，還讓你白挨了一頓打。' }, { type: 'health', amount: -10 }],
          },
        ],
      },
      {
        id: 'ignore_rumor',
        text: '一笑置之',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 1 } }, { type: 'narrate', text: '你一笑置之。茶棚裡還在講，你把茶碗扣回去。' }] }],
      },
    ],
  },
  {
    id: 'poison_test',
    title: '試毒疑雲',
    requirements: { minAge: 20, sectRequired: true },
    choices: [
      {
        id: 'taste',
        text: '親自試毒',
        outcomes: [
          { chance: 0.6, effects: [{ type: 'reputation', amount: 10 }, { type: 'attr', delta: { danShi: 3 } }] },
          {
            chance: 0.4,
            label: '事與願違',
            effects: [{ type: 'narrate', text: '這一味藥性比想的烈，你吐了半宿，臉色青白了好幾天才緩過來。' }, { type: 'health', amount: -30 }],
          },
        ],
      },
      {
        id: 'send',
        text: '讓弟子試',
        outcomes: [{ effects: [{ type: 'reputation', amount: -12 }, { type: 'narrate', text: '你讓弟子先試。門中安靜得可怕。藥碗邊沿還留着指印。' }] }],
      },
    ],
  },
  {
    id: 'wedding',
    title: '好友婚禮',
    requirements: { minAge: 18 },
    choices: [
      {
        id: 'gift',
        text: '厚禮出席',
        outcomes: [{ effects: [{ type: 'money', amount: -15 }, { type: 'reputation', amount: 6 }, { type: 'narrate', text: '禮盒遞上，紅綢扎得發緊。席上有人看你一眼，又去敬酒——銀子少了，面子多了一寸。' }] }],
      },
      {
        id: 'perform',
        text: '獻藝助興',
        outcomes: [{ effects: [{ type: 'reputation', amount: 10 }, { type: 'martial', amount: 1 }, { type: 'narrate', text: '你在席間走了一趟拳。掌聲稀疏，卻真，新娘母親塞來一盤年糕。' }] }],
      },
    ],
  },
  {
    id: 'night_assault',
    title: '夜練劍法',
    requirements: { minAge: 14, minMartial: 8 },
    choices: [
      {
        id: 'practice',
        text: '月下苦練',
        outcomes: [{ effects: [{ type: 'martial', amount: 4 }, { type: 'health', amount: -3 }, { type: 'narrate', text: '月下劍風帶涼。你練到袖口濕透，牆角貓看了你很久，才跳走。' }] }],
      },
    ],
  },
  {
    id: 'caravan_guard',
    title: '護鏢任務',
    requirements: { minAge: 17, minMartial: 12 },
    choices: [
      {
        id: 'guard',
        text: '押鏢千里',
        outcomes: [
          { chance: 0.65, effects: [{ type: 'money', amount: 45 }, { type: 'martial', amount: 3 }] },
          {
            chance: 0.35,
            label: '事與願違',
            effects: [
              { type: 'narrate', text: '半路殺出一撥劫匪，你捱了幾記悶棍才把人逼退。鏢主看貨箱完好，還是給了雙倍腳錢。' },
              { type: 'health', amount: -22 },
              { type: 'money', amount: 10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lost_in_forest',
    title: '迷失林海',
    requirements: { minAge: 10, maxAge: 30 },
    choices: [
      {
        id: 'calm',
        text: '靜心辨位',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 2, danShi: 1 } }, { type: 'narrate', text: '你蹲下摸苔蘚的潮向，聽遠處溪聲。林霧薄了些，腳下路重新成形。' }] }],
      },
      {
        id: 'panic',
        text: '慌亂奔逃',
        outcomes: [{ effects: [{ type: 'health', amount: -12 }, { type: 'narrate', text: '你亂闖灌木，臉被划破。等到喘定，才發現自己在原地打轉。' }] }],
      },
    ],
  },
  {
    id: 'sect_library',
    title: '藏經閣',
    requirements: { minAge: 16, sectRequired: true },
    choices: [
      {
        id: 'steal_read',
        text: '偷閱秘笈',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'martial', amount: 7 }, { type: 'attr', delta: { wuXing: 3 } }] },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [
              { type: 'narrate', text: '守閣長老半夜巡查，當場逮個正著。你捱了一頓戒尺，這事還傳遍了門中。' },
              { type: 'reputation', amount: -15 },
              { type: 'health', amount: -10 },
            ],
          },
        ],
      },
      {
        id: 'proper',
        text: '正規借閱',
        outcomes: [{ effects: [{ type: 'martial', amount: 4 }, { type: 'narrate', text: '你按規矩登記借閱。管閣的人翻出你要的那卷，站在旁邊看你抄完才收回去。' }] }],
      },
    ],
  },
  {
    id: 'old_age_reflect',
    title: '花甲回首',
    requirements: { minAge: 60 },
    weight: 20,
    choices: [
      {
        id: 'write',
        text: '撰寫遊記',
        outcomes: [{ effects: [{ type: 'reputation', amount: 15 }, { type: 'narrate', text: '你研墨寫遊記。寫到舊傷那一段，筆尖停了很久，才落下一個「雨」字。' }] }],
      },
      {
        id: 'teach',
        text: '傳功後輩',
        outcomes: [{ effects: [{ type: 'reputation', amount: 20 }, { type: 'flag', key: 'legacy_teacher', value: true }, { type: 'narrate', text: '後進的孩子握拳不穩。你把他們的手腕按正，自己肩頭倒先酸了。' }] }],
      },
    ],
  },
  {
    id: 'fatal_illness',
    title: '惡疾纏身',
    requirements: { minAge: 55 },
    weight: 15,
    choices: [
      {
        id: 'fight',
        text: '求醫問藥',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'money', amount: -60 }, { type: 'health', amount: 20 }] },
          { chance: 0.5, label: '事與願違', effects: [{ type: 'die', reason: '藥石罔效，病逝。' }] },
        ],
      },
      {
        id: 'accept',
        text: '安然面對',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: 3 } }, { type: 'narrate', text: '你不再到處求藥，日子過得慢了一點。窗外的天，看得比從前清楚。' }] }],
      },
    ],
  },
  {
    id: 'final_duel',
    title: '生涯之戰',
    requirements: { minAge: 40, minMartial: 50, once: true },
    choices: [
      {
        id: 'all_in',
        text: '全力一戰',
        outcomes: [
          { chance: 0.55, effects: [{ type: 'reputation', amount: 40 }, { type: 'martial', amount: 5 }] },
          { chance: 0.45, label: '事與願違', effects: [{ type: 'die', reason: '力竭而亡，江湖扼腕。' }] },
        ],
      },
      {
        id: 'retire',
        text: '金盆洗手',
        outcomes: [{ effects: [{ type: 'flag', key: 'retired', value: true }, { type: 'martial', amount: -5 }, { type: 'narrate', text: '金盆水涼。你把刀橫在盆沿，聽水聲一圈圈散開——門外有人等著看你洗不洗手。' }] }],
      },
    ],
  },
  {
    id: 'inheritance',
    title: '家族傳承',
    requirements: { minAge: 30, minMoney: 100, once: true },
    choices: [
      {
        id: 'pass',
        text: '立族規傳後人',
        outcomes: [{ effects: [{ type: 'flag', key: 'family_legacy', value: true }, { type: 'reputation', amount: 10 }, { type: 'narrate', text: '族規寫在粗紙上。你蓋印時手穩，紙邊卻被風掀起一角。' }] }],
      },
    ],
  },
  {
    id: 'random_fortune',
    title: '算命先生',
    requirements: { minAge: 12 },
    weight: 10,
    choices: [
      {
        id: 'pay',
        text: '花錢算命',
        outcomes: [{ effects: [{ type: 'money', amount: -8 }, { type: 'attr', delta: { fuYuan: 2 } }, { type: 'narrate', text: '先生搖卦，銅錢響了三下。他說的話你只記住半句，其餘散在茶煙裡。' }] }],
      },
    ],
  },
  {
    id: 'kidnap_plot',
    title: '綁架陰謀',
    requirements: { minAge: 16, minAttrs: { danShi: 35 } },
    choices: [
      {
        id: 'rescue',
        text: '營救人質',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'reputation', amount: 18 }, { type: 'health', amount: -18 }] },
          {
            chance: 0.5,
            label: '事與願違',
            effects: [
              { type: 'narrate', text: '你摸進去時，人質已被轉移。守衛聽見動靜圍上來，你捱了一頓好打才逃出來。' },
              { type: 'health', amount: -35 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'peaceful_year',
    title: '歲月靜好',
    requirements: { minAge: 1 },
    weight: 25,
    choices: [
      {
        id: 'rest',
        text: '平淡度日',
        outcomes: [{ effects: [{ type: 'health', amount: 5 }, { type: 'attr', delta: { fuYuan: 1 } }, { type: 'narrate', text: '這一年沒大事。你修了院牆，曬了兩回醬，枕邊多了一本看完的話本。' }] }],
      },
    ],
  },
  {
    id: 'accident_fall',
    title: '失足墜崖',
    requirements: { minAge: 15 },
    weight: 5,
    choices: [
      {
        id: 'lucky',
        text: '抓住藤蔓',
        outcomes: [
          { chance: 0.7, effects: [{ type: 'attr', delta: { fuYuan: 2 } }, { type: 'martial', amount: 2 }] },
          { chance: 0.3, label: '事與願違', effects: [{ type: 'die', reason: '墜崖身亡。' }] },
        ],
      },
    ],
  },
  {
    id: 'meet_hermit',
    title: '世外高人',
    requirements: { minAge: 25, minAttrs: { fuYuan: 55 }, once: true },
    choices: [
      {
        id: 'kowtow',
        text: '拜師求道',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 20 },
              { type: 'learnSkill', skillId: 'skill_hermit', name: '逍遙步' },
              { type: 'flag', key: 'hermit_student', value: true },
              { type: 'narrate', text: '高人只教你半息吐納。松針落在肩上，你起身時膝蓋印着泥。' },
            ],
          },
        ],
      },
      {
        id: 'miss',
        text: '錯過機緣',
        outcomes: [{ effects: [{ type: 'narrate', text: '你猶豫了一下，老人已經走遠。山風把他的背影吹得很淡。' }] }],
      },
    ],
  },
  {
    id: 'wugen_encounter',
    title: '無根門說客',
    requirements: { minAge: 16, maxAge: 50, noSect: true, once: true },
    weight: 5,
    choices: [
      {
        id: 'accept',
        text: '應允奇緣',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'wugenInvited', value: true },
              { type: 'narrate', text: '灰袍人只留下一句「無根門，斷塵緣」，便消失在巷口。你記下了那個地址。' },
            ],
          },
        ],
      },
      {
        id: 'decline',
        text: '婉言謝絕',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { danShi: 1 } },
              { type: 'narrate', text: '你搖頭謝絕。灰袍人也不強求，只道「有緣再會」，轉身沒入人群。' },
            ],
          },
        ],
      },
    ],
  },
];

export const EVENT_COUNT = EVENT_CATALOG.length;

/** 依標題／id 補 tags，供人生階段權重使用 */
for (const ev of EVENT_CATALOG) {
  if (ev.tags?.length) continue;
  const tags: string[] = [];
  if (/child|birth|family|parent|童年|父母|襁褓|降生|嬉戲/.test(ev.id + ev.title)) tags.push('childhood', 'family');
  if (/love|romance|表白|燈會|情敵|眷屬/.test(ev.id + ev.title)) tags.push('romance');
  if (/duel|assassin|bandit|rival|combat|決鬥|殺手|山賊|宿敵|比武/.test(ev.id + ev.title))
    tags.push('combat', 'martial');
  if (/sect|master|門派|拜|劍譜|內力|藏經|晉升/.test(ev.id + ev.title)) tags.push('martial');
  if (/old|fatal|花甲|惡疾|遲暮|生涯/.test(ev.id + ev.title)) tags.push('old_age');
  if (/die|墜崖|身亡/.test(ev.id + ev.title)) tags.push('death');
  if (tags.length) ev.tags = tags;
}
