import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/**
 * 江湖百事：100 則日常／遊歷向事件（原創文案；題材參考話本、名著氛圍與武俠網遊奇遇類型，如黑店、鏢局、擂台、殘譜、經脈走火等，不使用受保護專名）。
 * 搭配 recentEvents 50 月冷卻，降低短線重複。
 */
const RAW: GameEvent[] = [
  {
    id: "jx_black_inn",
    title: "夜宿黑店",
    body: "山道客棧燈火昏黃，掌櫃笑得過分殷勤，酒裡似有異味。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你端起酒碗嗅了嗅，藉故推說腸胃不適。掌櫃臉色一僵，你趁機摸清了後院有幾道門。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你抱刀坐在門檻外，聽着裡頭的算盤聲斷斷續續。天亮前，那盞燈終於滅了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你摸黑翻牆出了客棧，寧可露宿林邊，也不睡這一夜安穩覺。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_escort_cart",
    title: "鏢車過鎮",
    body: "一輛鏢車軋過青石板，鏢旗獵獵，車轍旁有人鬼祟窺視。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "escort"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "義務護鏢",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你隨車護送出鎮。林蔭處響馬試探，被你喝退。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "收點護路費",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 15
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你談妥護路銀。一路無事，銀子進袋。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只看熱鬧",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你躲在茶棚看完經過，聽見半句貨在第三箱。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bandit_toll",
    title: "剪徑索銀",
    body: "山口橫着幾人，刀背拍掌：買路錢，少一文打斷腿。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "bandit"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "丟銀過關",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你拋出銀子。匪徒讓路，你捏緊刀柄走過。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬闖則過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -10
              },
              {
                type: "martial",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你拔刀硬闖。匪徒散開，你衣袖見血。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞山小徑",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你退回岔路翻過山脊。多走半日，避開惡戰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bridge_duel",
    title: "橋頭約戰",
    body: "石橋中央插着一把竹劍，旁寫：有膽者，過橋一試。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你拔劍過橋，竹劍相交數合，對方棄劍認輸，只求留個姓名。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你拱手道明來意不為爭勝，橋頭那人愣了愣，親手拔劍讓路。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你繞了小徑過河，這種立牌邀戰的把戲，不值得陪。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ruin_temple",
    title: "破廟夜雨",
    body: "破廟漏雨，塑像缺臂。牆角似有人影蜷縮。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你舉着火摺子挨近牆角，那團黑影原是個凍僵的孩子，你把乾糧塞進他懷裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你倚着斷樑守了一夜，雨聲裡那影子始終沒動，天亮才發覺是堆破麻袋。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你不喜這破廟陰氣，索性冒雨繼續趕路，圖個心安。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_poison_mist",
    title: "谷口毒霧",
    body: "山谷瀰漫淡綠薄霧，藥香混着腐味，深處似有殘碑。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你屏息疾行穿谷，喉頭發苦卻沒倒下，出谷後看清了殘碑上半個「藏」字。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你撕布浸水掩了口鼻，慢慢摸進谷去，把那殘碑的字跡一一記下。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你攔住後面趕路的商旅，勸他們改道，自己也沒再往谷裡去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lost_manual",
    title: "殘譜飄落",
    body: "一陣風吹來黃紙殘頁，字跡潦草，隱約是步法圖。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "manual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "收下研讀",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你將殘頁收入懷中反覆比劃。雖不成系統，身法卻活了一寸。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "張貼尋主",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "money",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你貼出失物招領。主人以銀相謝，並指點你一式。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "置之不理",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你怕是陷阱，由它去。草繩結還在原處，你沒伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_arena_challenge",
    title: "擂台叫陣",
    body: "鎮中擂台有人擊鼓叫陣：有本事的，上來領銀！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "arena"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上台應戰",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "money",
                amount: 12
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "鼓聲中你躍上台。三招兩式分出高下——賞銀入手，肩頭也青了一塊。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "在下觀摩",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不上場，只看步法與呼吸，默記兩處破綻。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸止血腥",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你高聲勸點到為止。有人噓你，也有人點頭。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tea_master",
    title: "茶棚說劍",
    body: "茶博士一邊沏茶一邊講昨夜誰在碼頭比劍，聽客圍成一圈。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rumor"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仔細聽完",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你把人名地名都記住。茶涼了，江湖版圖卻亮了一角。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出錢請詳",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 4
                }
              },
              {
                type: "narrate",
                text: "你添一碟花生，對方把壓箱底傳聞也倒了出來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "揭穿誇大",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你指出破綻，茶客哄笑。誇大的故事被拆穿，也算小事一樁。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ferry_ghost",
    title: "渡口怪談",
    body: "老船工說對岸有鬼火，年輕船伕卻只笑他喝醉。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ferry"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "僱船夜探",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你僱船靠岸。所謂鬼火是盜掘的燈——交手一場，得了些散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "白日再渡",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不冒險，次日陽光下安然渡河。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "記錄傳聞",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你把怪談寫進冊子。真假不論，至少能嚇退糊塗劫匪。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_herb_cliff",
    title: "絕壁採藥",
    body: "藥農指着峭壁：那簇靈芝值二十兩，敢上去的對半分。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "herb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "攀崖一試",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "health",
                amount: -10
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你攀岩採藥。對方守信分銀，你手肘擦破，膽氣卻長了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "在下接應",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你在崖底拉繩接應，雙方都少了風險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸他勿貪",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你勸風大勿上。他收起繩索——保住的是命。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_qin_pavilion",
    title: "亭中撫琴",
    body: "湖心亭有人撫琴，曲聲忽滯——弦斷，琴者臉色發白。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你遞上隨身備用的琴弦，那人指尖一顫，斷弦重續，曲聲再起。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你趁機請教了一段指法，那人斷弦之後倒有閒心，點撥你兩句。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不打擾這場尷尬，遠遠聽完剩下的半闋曲子便走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_go_match",
    title: "棋亭殘局",
    body: "石桌上擺着殘局，旁題：解此局者，請茶三碗。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你替一旁苦思的老者指出一步妙棋，兩人相視一笑，分了那三碗茶。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你自己坐下推演半晌，解不開全局，倒也向擺局人討教了半招。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你看着旁人對着殘局抓耳撓腮，自己沒去碰那三碗茶。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_calligraphy_wall",
    title: "粉牆題字",
    body: "客棧粉牆新題墨蹟未乾，字勢張狂，似挑戰當地名家。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你借了筆墨在旁邊題了一句應和，圍觀的人倒替你叫了聲好。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你細看那筆勢，湊上前去請教運筆的訣竅，題字人倒也不藏私。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你看熱鬧似地站了片刻，這場筆墨官司，不必你插手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_painting_scroll",
    title: "舊畫藏機",
    body: "地攤一幅山水，遠峰線條裡竟藏着路線符號。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你買下那畫，按圖索驥找到了畫中舊處——沒有金山，倒有一堆散銀與銹劍。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把這畫轉手賣給識貨的牙行，銀子爽快到手，夜裡卻覺得心裡發空。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把畫上的符號描下交給公議，免得這條線索惹出腥風血雨。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_beggar_hint",
    title: "丐者密語",
    body: "一個瘸腿乞丐扯你衣角，低聲說西巷今夜有貨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你跟着乞丐去西巷探看究竟，那批「貨」原是逃難的孩子，你幫着接應了幾個。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你順着這消息去打聽，換來一個眼線的名號，往後倒能少走不少冤枉路。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你甩開乞丐的手繼續趕路，這種街頭密語，十有八九是圈套。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_thief_chase",
    title: "竊賊飛簷",
    body: "屋頂人影一閃，包裹落地滾到你腳邊。後方追喊：攔住他！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "chase"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "攔截竊賊",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你截住竊賊，物歸原主。失主塞你謝銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "撿起包裹",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你撿起包裹轉身就走。銀飾入手，背後罵聲遠了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "指路官差",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你向官差指明方向，少了場惡鬥。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_medical_debt",
    title: "醫館討債",
    body: "醫館外有人哭喊被索重金，郎中堅稱藥石值錢。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "clinic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "代付藥金",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替病人墊付了藥金，郎中收下銀子時，眼神閃了閃，悄悄退回了兩成。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "查驗藥方",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你細問了那帖藥的分量，果然摻了水，郎中被你問住，雙方各退一步。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不介入",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你不是斷案的差爺，這樁醫館糾紛，你沒插手，轉身離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_drunk_swordsman",
    title: "醉漢舞劍",
    body: "酒肆裡一名醉漢以酒壺當劍，險些劈到過路客。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tavern"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "制住醉漢",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你點穴制住醉漢，避免傷人。老板送酒致謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "陪他喝完",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你陪喝，聽醉話裡的舊仇，天亮得了條線索。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "報官了事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你叫來巡夜，醉漢被架走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_wedding_crash",
    title: "喜事橫刀",
    body: "迎親隊被攔在巷口，紅蓋頭微顫，對方索要過路彩禮。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前拆穿了攔路人的把戲，迎親隊得以順利過巷，新娘家塞了紅包給你。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你跟攔路人談了個彩禮數目，兩邊都下得了台，你也落了點跑腿錢。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你袖手看着這場討價還價，喜事自有喜事的規矩，不必你來斷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_wanted_poster",
    title: "海捕文書",
    body: "城門新貼畫像，賞金不菲，五官與你有幾分相似。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你主動上前向差役說明來歷，花了些打點銀，那張畫像上的烏雲總算散了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你買了頂斗笠遮住半張臉，混在人群裡出了城，安全第一。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你循着畫像上的細節查訪，險些撞進伏擊，卻也摸到了真兇的名號。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spy_letter",
    title: "密信錯投",
    body: "飛鴿落下，腳環密信寫着門派暗號——收件人卻不是你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你原封不動交還給該收信的人，對方記下了你這份人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你先拆開密信看了個究竟再封回去，知情是把刃，也容易割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你把密信投進爐火，灰燼裡，江湖上少了一條牽扯不清的線。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fire_ward",
    title: "巷中失火",
    body: "半夜火起，婦孺尖叫。水桶傳着傳着，人手不夠。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你捲袖加入了傳水滅火的行列，煙塵散盡後，街坊都記住了你的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你高聲喊人分工，一組傳水一組疏散，這場火滅得比預想快。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你站在遠處看着火勢，沒有貿然衝進煙裡添亂。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_kidnap_ransom",
    title: "綁票紙條",
    body: "窗縫塞進一張紙：三日內銀五十兩，否則撕票。字跡稚嫩。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把紙條交給了官府，這樁綁票案，風險轉給了公門去查。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你連夜摸去了紙條提到的地點，銀子與一身刀傷都一併到手，孩子救了回來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你把紙條揉了扔進溝裡，這種黑事，你暫時不想沾。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tomb_lantern",
    title: "荒塚青燈",
    body: "亂葬崗一盞青燈不滅，風吹不熄，近處有新挖痕跡。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tomb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "近前喝止",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前喝止了那盜掘的人，對方逃散，你把翻起的土堆重新填平。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "暗中跟隨",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你遠遠跟着那盜墓人，討了點封口費，沒聲張這樁事。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠離是非",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你覺得這荒塚透着邪門，繞道走了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lake_ice",
    title: "湖面薄冰",
    body: "冬湖結薄冰，有孩童滑倒中央，冰裂聲細細傳來。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你趴着爬上薄冰把孩子拖了回來，事後那家人哭謝聲不絕。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊岸上眾人拿繩索來，眾人合力把孩子拉了回來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷貿然衝上去只會兩人一起落水，先繞去找了塊木板再說。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_meridian_block",
    title: "經脈滯澀",
    body: "運功時胸口一窒，像有熱流逆走——旁人勸你去找明醫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "cultivation"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "停功就醫",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: 12
              },
              {
                type: "qi",
                amount: 15
              },
              {
                type: "maxQi",
                amount: 3
              },
              {
                type: "narrate",
                text: "你聽勸停功求醫，診金花了不少，經脈總算順了過來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬衝破關",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -12
              },
              {
                type: "maxQi",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你咬牙硬闖過這一竅，險後倒打通了一關，臉色卻蒼白了好幾日。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "溫養靜待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 10
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你收了外功，只做吐納調息，慢是慢，卻穩妥。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_qi_deviation",
    title: "走火徵兆",
    body: "打坐時耳鳴目眩，眼前金星亂迸，舊傷隱隱作痛。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "cultivation"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "停功就醫",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: 12
              },
              {
                type: "qi",
                amount: 15
              },
              {
                type: "maxQi",
                amount: 3
              },
              {
                type: "narrate",
                text: "你停了功去看了郎中，銀子花了些，那走火的徵兆總算壓了下去。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬衝破關",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -12
              },
              {
                type: "maxQi",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你咬牙逆着氣機闖了過去，闖關雖險，卻也因此進了一層，人蒼白了幾日。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "溫養靜待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 10
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你放緩了外功，只練吐納，這一步走得慢，卻沒再出岔子。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lightness_race",
    title: "屋脊競速",
    body: "兩三少年在屋脊上比輕功，瓦片紛落，街坊叫苦。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "qinggong"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "加入比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你躍上屋脊比了兩段。瓦涼如雪，笑聲散在巷風裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "喝止危險",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你喝止別踩塌民房。少年散去，街坊作揖。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "在下偷師",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你不現身，只看落點與借力。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_hidden_weapon",
    title: "暗器無聲",
    body: "茶煙裡一點寒芒擦耳而過，釘進柱子——是枚細針。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手朝來勢方向甩出一擊，刺客沒能得手，逃走時留下了標記與散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你先把身旁的茶客推開擋住去路，自己扛下了這一險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你感到殺意未消，沒有戀戰，先退出了這片是非之地。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_broken_blade",
    title: "斷刃求修",
    body: "鐵匠攤前一位刀客捧着斷刀，眼神發紅：還能接否？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "gear"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出資修復",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -15
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你付錢幫修。對方感激，傳你一式拆刀手法。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以物易物",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你用閑置物換一點實戰心得。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只給指點",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你指出問題所在。對方沉默離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sword_polish",
    title: "磨劍聽雨",
    body: "雨廊裡有人慢磨長劍，砂石聲與雨聲合拍，旁若無人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sword"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "請教劍意",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "money",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你奉茶請教。他不傳招式，只談劍在意先。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "默契對練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你們過了幾招。無仇無恨，只有劍風。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不打擾",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你靜靜聽完才離開。有些修行需要安靜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_palm_demo",
    title: "掌法賣藝",
    body: "廣場有人打掌花，木樁應聲而裂，圍觀者丟銅板。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "palm"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "丟錢叫好",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你投了銅板。賣藝人額外展示一式收掌。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "上台過招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你上台點到為止。雙方拱手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "指出破綻",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你低聲指出破綻。他一愣，隨即請教。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_staff_monk",
    title: "行腳僧杖",
    body: "僧人拄杖问路，杖頭鐵環輕響，目光卻掃過你腰間兵刃。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "monk"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "坦誠相告",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你指路並問安。僧人送你一串念珠壓驚。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "試探來歷",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你旁敲側擊。他笑而不答，反問你心性。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持距離",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你簡單指路便走。江湖裡太多面具。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_whip_merchant",
    title: "鞭商叫賣",
    body: "商販甩鞭驅蠅：軟鞭護身，遠近皆宜！目光落在你身上。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "whip"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "買下一條",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -18
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "narrate",
                text: "你買下軟鞭練習手感。兵器多一樣，路也多一條。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請他示範",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你付錢看示範。鞭梢繞花的勁道，比空講有用。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "婉拒離開",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你暫時不需鞭法，拱手離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bow_hunter",
    title: "獵戶借箭",
    body: "獵戶箭盡，隔溪對你喊：借三枝箭，回來加倍還！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "bow"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "借箭相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把箭借出。後來對方加倍送還，還送乾肉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "一起圍獵",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "narrate",
                text: "你同他入林。獵物分成，箭法也練了手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不肯借",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你箭不多，搖頭拒絕。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spear_drill",
    title: "校場槍陣",
    body: "衙役在校場練槍，隊形散亂，教頭罵聲不絕。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "spear"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "指點隊形",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你說了兩句站位。教頭先怒後默，請你喝茶。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "下場同練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你借槍入隊。汗濕衣背，槍桿越握越穩。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只看不動",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你看完一輪操練才走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_gamble_dice",
    title: "賭坊骨骰",
    body: "賭坊裡骨骰砰然落地，有人指控灌鉛，氣氛劍拔弩張。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "gamble"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "喝止衝突",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你擋住即將出鞘的刀。賭帳另算，人命現在。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "趁亂撈錢",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 18
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "骰子亂飛時你摸走一袋銀。良心不安，口袋卻沉。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "報官查封",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你引來衙役。賭坊暫時熄燈。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_loan_shark",
    title: "印子錢局",
    body: "錢莊後門討債聲兇，欠戶跪地求緩，旁人皆作不見。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替那欠戶墊了銀子，袋子輕了，心裡卻沒那麼堵。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你出面跟錢莊談了個緩期還款的法子，雙方各讓一步，你也得了句謝。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清了這討債的行情與人心，沒有出手，繼續趕路。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_famine_rice",
    title: "米倉開閘",
    body: "災民擠在米倉外，官差壓陣，有人欲搶米包。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把身上的銀子分給了排在後頭領不到米的人，袋輕了，心卻踏實。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你出面跟官差和災民都說了幾句公道話，秩序總算穩了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你站在人群外看着這場擁擠，沒有貿然插手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_flood_bridge",
    title: "洪水斷橋",
    body: "大雨斷橋，兩岸喊渡，船家坐地起價。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "disaster"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出資擺渡",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你付錢讓船家減價載人。雨聲裡兩邊都說你是好人。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "搭索開路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你找繩索木板搭臨時通道。有人因此過了河。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "等待水退",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不冒險，找高處等水勢。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_snow_shelter",
    title: "風雪寄宿",
    body: "風雪封路，莊院拒客，只有柴房還開着門縫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把柴房的乾草和乾糧分給了同行的旅人，患難裡結下的情誼，格外牢靠。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你搶先佔了柴房裡最避風的一角，活是活了，卻被旁人的目光戳得心慌。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你不與人爭這柴房一角，自己摸黑找了另一處避風的岩縫。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_heat_stroke",
    title: "酷暑中暑",
    body: "官道無人，路人忽然栽倒，臉紅如炭。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把隨身的水分給了栽倒的路人，兩人分着喝，總算撐過了這段官道。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你先自己找了樹蔭歇息，看那路人自行緩過來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你沒有停留，繼續趕路，另尋前頭的茶棚求助。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ghost_market",
    title: "鬼市燈籠",
    body: "子時荒市忽然燈籠成排，賣的盡是奇物舊物，賣家遮面。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你湊近一盞燈籠細看，攤主遮面的布巾滑了半寸——底下是張再尋常不過的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你站在市外看了半宿，那些攤子雞鳴時分便悄無聲息地散了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你繞開那片燈火，這種買賣，不沾為妙。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mask_ball",
    title: "面具夜宴",
    body: "富戶夜宴請來客皆戴面具，酒過三巡，有人低聲談貨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你端着酒杯湊近那桌，聽了半句「貨」字，便被人瞪了回來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你戴着面具在廊下守了半夜，看誰進誰出，倒也記下幾張走路的姿態。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你藉口更衣，提早離席，這場面具下的交易，不必你來湊。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_rival_letter",
    title: "戰書到門",
    body: "一封戰書釘在門板：三日後林中見，敗者留兵器。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你如期赴約，林中交手三招，對方兵刃落地，倒也算了了這樁恩怨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你託人回信，說明此戰無謂，對方見信後竟主動撤了戰書。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你把戰書撕了收進懷裡，這種約戰，不赴也罷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_friend_debt",
    title: "故人欠銀",
    body: "舊識攔路苦笑：差十兩過關，日後雙倍還你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "friend"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "伸手相助",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你把銀子借了給他，這份人情記在心裡，沒催着要利息。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "有條件幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你借了一半，留一半日後交換個人情，把話說在了前頭。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你搖頭婉拒，這種舊識的借貸，幫了怕是要陷進去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_master_scold",
    title: "前輩訓斥",
    body: "路邊老者忽然杖擊你肩：肩垮、肘聳，這也叫功夫？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "master"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "低頭請教",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 4
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你受了訓還拱手。老者哼一聲，反把關鍵點明。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "不服反駁",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你辯了兩句，換來一場過招。打完痛快。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "敷衍走開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你賠笑走開，耳尖卻記下那句指點。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_child_apprentice",
    title: "童子拜師",
    body: "孩子扯你袖：教我一招防身！娘親給的糖都給你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kind"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "溫柔以待",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你摸了摸孩子的頭，給了他一塊乾糧，糖你沒收，小事一樁，暖意卻真實。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "教導一招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你比劃了一式簡單的防身架子，孩子眼睛亮得像星星。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持界線",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你陪他練到天黑他娘來尋人，沒有應下收徒的承諾，量力而為。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_widow_well",
    title: "井邊哭聲",
    body: "井邊婦人夜哭，說夫君入山未歸，求你帶話或尋人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "quest"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "答應找人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你答應入山打聽。也許找不到，但至少有人在找。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "給安家銀",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你塞給她安家銀，不敢隨口打包票。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "請官差處理",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你帶她去衙門報案。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_map_half",
    title: "半張藏圖",
    body: "酒醉漢枕下掉出半張羊皮圖，標着北洞二字。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你循着圖上標記找到北洞，洞裡沒有寶藏，只剩幾件銹蝕的舊兵器。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把這半張圖賣給了收古物的商人，銀子不多，夜裡卻總覺得少了點什麼。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把圖交給了鎮上公議，讓有能耐的人去核實，自己不摻和。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_jade_drop",
    title: "落玉無主",
    body: "鬧市有人碰落玉佩，俯身去撿時已被腳踩進泥裡。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你替那人把玉佩從泥裡摳出來擦淨還回去，對方連聲道謝，直說失而復得。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你認出那玉佩的成色，順勢替雙方談了個公道的賠法，自己也落了點介紹費。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看着人群為了半塊玉佩爭執，自己沒摻和，繼續趕路。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_poison_wine",
    title: "賀酒有異",
    body: "有人敬你賀酒，色澤偏暗，香氣刺鼻。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你屏息一飲而盡，強撐着沒露破綻，事後才發覺舌尖發麻了半宿。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你藉口更衣避開這杯酒，回頭卻聽見旁人替你喝下，臉色頓時發青。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你出言提醒同席的人，那酒色澤不對，這桌賀酒，最後誰也沒再碰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_antidote_trade",
    title: "解藥交換",
    body: "中毒旅人顫聲：誰有解藥……我以短刃交換。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你翻出隨身藥丸遞了過去，那短刃你倒沒收，圖的是這條人命。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你細問中毒症狀，辨出是尋常蛇毒，教了他土法急救。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你勸他自己去求醫館，這荒郊野外的交易，你信不過。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sect_patrol",
    title: "師門巡邏",
    body: "門中弟子列隊巡街，目光銳利，似在尋細作。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把撿到的密信原樣交給巡邏隊，對方記下了你的樣貌，算你一份人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你先看清了信裡寫的暗號再交出去，這一手，知道得比誰都清楚。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你把那密信燒了不留痕跡，這樁細作疑雲，自此與你無關。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_book_steal",
    title: "護書驚變",
    body: "書僮抱匣狂奔，後方黑衣人追近，匣鎖喀然鬆動。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你接過書僮手裡的匣子交還原主，對方鬆了口氣，記下你這份仗義。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你趁亂看了匣裡那卷書的幾頁，知情是把刃，也容易割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你把那卷書投入路邊爐火，寧可燒了，也不讓這是非纏上身。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_court_spy",
    title: "朝廷眼線",
    body: "茶客袖裡露出腰牌一角，似官差便衣，正在打量你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你索性上前遞了個眼色，坦然說明自己的來歷，那便衣官差倒也不再追問。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你换了個座位，扯下外袍露出粗布衣裳，混進了送貨的腳夫堆裡。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你反過來留意他的來路，跟了兩條街，倒摸清了他背後的來頭。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_prison_break",
    title: "夜半劫牢",
    body: "城外有人招手：幫手撬鎖，事成分銀。遙見牢房燈火。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把這樁劫牢的勾當捅給了官差，風險轉給了公門去查。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你跟着摸黑撬了鎖，銀子到手，肩上也添了一道刀傷。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你轉身走開，沒理會那招手的人，這種黑夜的買賣，不碰為妙。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_execute_ground",
    title: "法場圍觀",
    body: "法場外人群嘈雜，犯人呼冤，刀斧手已在磨刀。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你擠到前頭替犯人喊了句冤，監斬官皺眉看你，你把來龍去脈說了個清楚。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你裹緊斗篷退到人群外沿，這種場合，露臉不是好事。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你趁亂查訪了幾句口供，竟聽出這案子背後另有隱情。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_orphan_food",
    title: "粥棚孤兒",
    body: "施粥棚前孩子搶勺，大孩欺負小孩，粥涼了一地。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kind"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "溫柔以待",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你重新盛了一碗粥給那被欺負的小孩，順手拍了拍大孩的手心。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "教導一招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你教了那小孩一招護食的架式，往後倒不容易再被搶。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持界線",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你看着他們排好隊分完了粥才離開，沒有承諾自己做不到的事。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_actor_troupe",
    title: "戲班邀角",
    body: "戲班班主看你身法：可願客串打戲？分帳從優。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你應下客串一場，台上翻打幾招，台下叫好聲不絕。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你請班主指點了幾個亮相的架子，這行當裡的門道，倒也有趣。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你婉拒了這樁差事，站在後台看了一場戲便走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_storyteller",
    title: "書場評話",
    body: "書場說到英雄斷臂，聽客拍案，忽有人摔碗抗議說錯了。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前替說書人圓了場，指出那段其實還有後續，聽客倒也服氣。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你招呼幾個熟客分開勸解，這場口角很快平息了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你坐在角落看這場爭執收場，沒摻和進去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fortune_teller",
    title: "卦攤半真",
    body: "算命先生拉你：面帶刀兵劫，三日內慎夜行。伸手要銅板。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "認真對待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 8
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你付了銅板，往後三日果真收斂夜行，說不清是心安還是心事。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "理性拆解",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你留意這算命先生說話的門道，多半是察言觀色的手段，沒往心裡去。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "一笑置之",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你笑着扔下一枚銅板就走，這種卦，聽個熱鬧就罷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_night_watch",
    title: "打更人驚",
    body: "打更人狂奔敲鑼：北巷進賊了！聲音發顫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你抄起傢伙隨打更人往北巷去，煙塵之後，街坊都記住了你這一趟。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你招呼附近幾戶壯丁一起去堵，人多勢眾，賊人不戰而走。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你留在原地看着這陣騷動，沒有貿然衝進黑巷子裡。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_dog_bite",
    title: "惡犬攔路",
    body: "宅院惡犬掙斷鐵鍊，對準過路人狂吠撲來。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你搶身擋在過路人前頭，一腳踢開撲來的惡犬，對方連聲道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你認得這犬的脾性，喝了一聲讓牠退開，順道提醒宅院主人該補牢鐵鍊。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你躲進旁邊的巷子，等狗被人牽走才繼續趕路。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_horse_bolt",
    title: "驚馬狂奔",
    body: "驚馬拖着空車衝向菜攤，販夫嚇得趴地。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你衝上去攔住了馬韁，驚馬止步，販夫哭着道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊街坊讓路兼幫手，眾人合力才把馬勒停。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷硬衝只會被撞飛，先推開身旁的人躲開這一輪衝撞。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_well_poison",
    title: "井水異味",
    body: "井水發苦，街坊腹痛，有人懷疑是仇家下藥。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你幫着挨家挨戶送信，別喝這口井的水，街坊記住了你這份熱心。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你招呼街坊分頭去請郎中、去查井口，事情辦得又快又齊。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你留意着井邊的動靜，沒有貿然去碰那口井，只把始末看清。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_grave_robber",
    title: "盜墓人影",
    body: "月下荒墳有人影彎腰挖掘，土堆旁亮着短燈。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tomb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "近前喝止",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你喝止了那盜墓人，對方丟下鏟子逃了，你把坑填了回去。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "暗中跟隨",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你跟蹤那人影到了鎮口，換了點封口費就沒再多管。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠離是非",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你不喜這荒墳夜色，繞路而行，任那短燈在身後亮着。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mirror_mist",
    title: "鏡湖晨霧",
    body: "湖霧裡傳來對掌聲，兩人影若隱若現，似在比試而非生死。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你踏進霧裡加入戰團，掌風擦身而過，倒也印證了幾路招式。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你隔霧喊話問明緣由，兩人聽出你並無惡意，收了掌力。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不涉這場霧裡糾纏，繞湖而行，任那掌聲漸漸遠了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sandstorm_camp",
    title: "沙暴扎營",
    body: "沙暴將至，商旅爭搶避風石壁，水源只剩一壺。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把那壺水分給了同行的商旅，大家擠在石壁下，總算熬過了風沙。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你搶先佔了石壁最避風的位置，活是活了，卻沒睡安穩。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你不跟人爭那道石壁，自己找了處低窪避了風沙。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_reed_ambush",
    title: "蘆葦伏兵",
    body: "渡船近岸，蘆葦叢箭矢乍起——有人喊：留下包裹！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手擋開飛來的箭矢，伏兵見討不到便宜，退走時扔下了幾支箭作記號。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把船上的婦孺護在身後，自己頂着這一波箭雨。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你察覺伏兵殺意未散，示意船夫調頭，先避開這片蘆葦叢再說。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_silk_deal",
    title: "絲路交易",
    body: "胡商展示一枚玉扳指：此物可換你腰間短刃，如何？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "trade"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "公平交易",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你按公道的行情跟他換了，東西未必是神兵，過程卻乾淨爽快。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "討價還價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  economy: 1
                }
              },
              {
                type: "narrate",
                text: "你跟他磨了半天價，把價格壓下來一些，順道聽了些邊地的新聞。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕離開",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你覺得這筆交易不對盤，拱手告辭，短刃還是留在自己腰間。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fake_monk",
    title: "假僧化緣",
    body: "僧人化緣開口索銀十兩，戒疤卻像新燙，眼神發飄。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你當眾點破他戒疤是新燙的，假僧臉色一白，灰溜溜地走了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你不動聲色地跟假僧周旋了幾句，套出他背後還有同夥在鎮口候着。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你丟下一句「阿彌陀佛」便繞開了，這種化緣，不佈施也罷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_true_hero",
    title: "俠義兩難",
    body: "老人摔倒銅盆滾落；同時遠處孩童幾乎被車撞——只能先顧一端。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xia"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "救更危者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你衝向遠處那輛失控的車，把孩童拉了回來，有人罵你冷血放着老人不顧，也有人說你懂輕重。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "救眼前人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你先扶起摔倒的老人，遠處那一份遺憾，你只能咬牙承受。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "設法兩全",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你喊了旁人分頭去救孩童，自己扶起老人，這一次算是險勝兩全。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_evil_offer",
    title: "邪功誘餌",
    body: "蒙面人塞給你一頁黑譜：練了七日可加倍掌力……只要心夠狠。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "evil"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "撕毀黑譜",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3,
                  e: -2
                }
              },
              {
                type: "narrate",
                text: "你當面撕碎黑譜。對方冷笑消失。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "收下暗練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 5
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  e: 3,
                  xia: -2
                }
              },
              {
                type: "narrate",
                text: "你把譜藏進靴筒。功力長了，睡夢卻血腥。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝答應",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你虛與委蛇，套出他們聚集地。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_kuang_feast",
    title: "狂生夜宴",
    body: "酒樓上有人砸桌狂笑，邀你對飲三十碗：喝不下的，不是英雄。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kuang"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "喝就喝到底",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 3
                }
              },
              {
                type: "narrate",
                text: "你沒先倒下。狂名傳開，肝卻在抗議。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以茶代酒",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你聲明以茶代酒論英雄。有人笑，有人敬。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "掀桌離席",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你嫌虛偽，掀桌就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_xie_whisper",
    title: "邪道耳語",
    body: "暗巷人聲：那家藥鋪後門運的不是藥……是人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xie"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線查清",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你像影子跟到後門。知情讓你主動。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣給人",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "narrate",
                text: "你把消息賣給需要的一方。銀子不辯善惡。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "匿名報官",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你寫了封無名帖。刀不見血，事也可能了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_xia_escort",
    title: "護送老人",
    body: "老者腳步蹣跚，要去城南掃墓，路上匪患未清。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xia"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "救更危者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你半途察覺更遠處有人遇險，衝去救了那頭，老者這頭只能託旁人照看。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "救眼前人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你寸步不離護送老者到了城南，遠處那樁事，你顧不上了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "設法兩全",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你安排熟人分段接應老者，自己去查看了匪患的動靜，兩頭都顧上了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_market_fraud",
    title: "假藥攤子",
    body: "攤販賣續命丹，誇得天花亂墜，老婦掏出全部零錢。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你悄悄把買藥的銀子退還給了老婦，自己承擔了這筆損失。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你當面戳穿了攤販的誇大之詞，逼他退回了老婦的銀兩。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清這攤子的行情，知道多說無益，沒有上前。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bridge_check",
    title: "官卡盤查",
    body: "官卡攔人核對腰牌，排尾有人塞銀想插隊，差役眼神閃爍。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你老實遞上路引，說明自己的來歷去向，差役核對後便放行了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你换了身行商的打扮，混在貨車隊伍裡低調過了關卡。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你留意那插隊塞銀的人，跟蹤了一段，查出他要過關卡另有目的。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_river_pack",
    title: "河上浮物",
    body: "河邊發現無人認領的包裹，裡面似有兵器與書信。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystery"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "保全現場",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你沒讓圍上來的人亂翻包裹，只把細節都記了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下搜證",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你趁人不注意搜出了裡頭的信物，這東西也許能換賞，也許能換禍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "盡快離開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不想沾這樁無主的東西，怕被人當替罪羊，轉身就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lantern_riddle",
    title: "燈謎高台",
    body: "元宵燈謎高台懸賞，末一題極難，無人能解。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你擠進人群跟着猜了幾個燈謎，笑聲裡，這一夜的殺氣淡了幾分。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你解開了那道無人能答的難題，彩頭到手，也在人前露了臉。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你站在燈火外沿看着人潮，熱鬧是他們的，安靜是你的。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_dragon_boat",
    title: "龍舟爭渡",
    body: "端午龍舟缺一名掌舵，班主急得團團轉。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你跳上船搭了把手划槳，喊聲震天裡，殺氣也淡了一夜。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你自告奮勇掌了舵，那船搶先渡岸，彩頭與臉面都到了手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你站在岸邊看着龍舟競渡，沒有下場，熱鬧留給願意較勁的人。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_midautumn",
    title: "中秋無月",
    body: "中秋雲遮月，酒肆勸人買醉，角落有人獨酌落淚。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你湊過去陪那獨酌的人喝了兩杯，笑聲裡，那份落寞淡了幾分。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你應和着酒肆的酒令贏了彩頭，也算給這個沒有月亮的中秋添了點彩。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你坐在燈火外沿看着這片熱鬧，安靜是你自己的中秋。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_newyear_debt",
    title: "年關逼債",
    body: "年關將至，債主堵門，孩童嚇得哭，灶上冷鍋。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替這戶人家墊了年關的欠款，袋子輕了，那孩子總算不哭了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你跟債主談了個延期還款的法子，雙方都退了一步，這個年總算能過。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清這戶人家與債主之間的糾葛，沒有貿然插手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spring_outing",
    title: "踏青遇刺",
    body: "踏青路上暗器擦肩，草葉間有人倉皇逃竄，似誤傷。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手接下那一擊擲了回去，草叢裡的人影驚慌逃遠，留下一枚暗器。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你先把同行的人拉到身後，自己擋在明處看清來路。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你覺得這誤傷疑點重重，沒有追上去，帶着同行的人先離開這片草地。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_autumn_hunt",
    title: "秋獵圍場",
    body: "富戶秋獵邀請賓客，獵物卻被人提前放跑，主人震怒。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "hunt"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "協助圍捕",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你幫忙截獵物。分成公平，箭傷也算學費。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "放走生靈",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你故意嚇跑獵物。主人罵你，你只當沒聽見。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只做見證",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不參賽，只看誰作弊、誰手軟。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_winter_rite",
    title: "冬至祭祖",
    body: "冬至祠堂缺人手上香，長老看你面善，請你代勞一炷。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ritual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "恭敬行事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你依禮上了香，香煙裊裊間，連自己心裡也靜了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出力扛事",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你挽起袖子幫着搬了供桌抬了椅子，禮儀之外，肩膀也是要緊的。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默哀即可",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你上完那炷香便退到一旁，尊重不必張揚。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ghost_fest",
    title: "中元河燈",
    body: "中元夜河燈漂流，有一盞燈逆流而回，停在你腳邊。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "認真對待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 8
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把那盞燈重新推回河中，心裡默唸了幾句，說不清是心安還是心事。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "理性拆解",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你蹲下細看那河燈逆流的緣故，原是水底暗礁擋住了燈盞。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "一笑置之",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你笑着沒把這事放在心上，當個故事聽完就走了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_plague_mask",
    title: "瘟疫面紗",
    body: "鎮上有人傳瘟疫，郎中分發藥粉，也有人趁機抬價。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "clinic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "代付藥金",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替買不起藥粉的人家墊了銀子，郎中見你出手，也少收了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "查驗藥方",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你查了那藥粉的成色，戳穿了抬價那家摻假的把戲。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不介入",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你戴上布巾繞開這片是非，瘟疫真假，自有郎中去斷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mine_collapse",
    title: "礦坑塌方",
    body: "山礦塌方，喊聲從地下傳來，礦主卻攔人：官差未到勿入。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你不顧礦主阻攔衝了進去，把困在裡頭的人一個個拖了出來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊召集附近礦工一起挖，人多力量大，總算搶在坍塌前救出人。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷硬闖只會添一具屍體，先在外頭穩住陣腳，等官差和工具到齊。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_actor_mask",
    title: "戲假情真",
    body: "夜戲散場，花旦摘面具後竟是舊識，眼神示意有事相求。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "friend"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "伸手相助",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你聽她把難處說完，二話不說幫了這個忙，人情記在心裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "有條件幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你聽她把話說完，答應幫一半，留一半作以後的交換。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你搖頭婉拒，戲台上的舊情，你不想再牽扯進去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_letter_home",
    title: "家書晚到",
    body: "家書遲到兩月，字跡模糊，只寫母病……速歸……其餘被雨洇。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "family"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻起程",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你收拾包袱就走。家書一到，江湖再大也變小。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "先安頓事務",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你先把手頭事託人，再上路。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "回信探問",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -2
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你先託信使回問詳情。焦急裡仍留冷靜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_rival_spare",
    title: "宿敵求饒",
    body: "昔日對手跪地：我母病重，此戰求你手下留情。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "答應饒恕",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 3,
                  e: -2
                }
              },
              {
                type: "narrate",
                text: "你收刃：去吧。仇未消，卻把刀暫時放下。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "打到認輸",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你仍要分個高低，只在最後留了餘地。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "要他代價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 15
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "narrate",
                text: "你放人，但收下兵器或銀兩作代價。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_master_funeral",
    title: "前輩喪禮",
    body: "一位無關門派的前輩驟逝，喪禮缺人抬棺，路人多袖手。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ritual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "恭敬行事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你依禮上前弔唁磕了頭，靈堂香煙裡，連自己都靜了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出力扛事",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你挽起袖子幫忙抬了棺，這禮數之外的一份力氣，也是敬意。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默哀即可",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你上完香便退到一旁默哀，不必張揚自己的敬意。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_disciple_betray",
    title: "同門反目",
    body: "有人自稱同道，當眾指控你偷學，圍觀者起鬨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把手裡的那份「證據」原樣交還給對方，任人評理，對方倒也記下你的坦蕩。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你先看清了那份「證據」寫的是什麼再做打算，知情總比矇在鼓裡強。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你當眾把那份東西燒了了斷，這樁羅生門，你不想再糾纏。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_inn_murder",
    title: "客棧命案",
    body: "客棧夜半尖叫，房門內一具屍體，掌櫃要封鎖全樓。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystery"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "保全現場",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你按住了想進屋亂翻的客人，讓現場保持原樣，只把細節記在心裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下搜證",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你趁封樓前溜進屋裡搜了一圈，找到的東西，是福是禍還說不準。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "盡快離開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不想被捲進這樁命案，趁掌櫃封樓前先結了賬離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_salt_smuggle",
    title: "私鹽過境",
    body: "車隊鹽包渗白，押運者塞銀求你看開些。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把私鹽的事捅給了鹽務官差，風險轉給公門，自己不落把柄。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你收下那筆銀子沒聲張，心裡卻明白，這樁買賣藏着刀傷般的風險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你別過臉繼續趕路，這車私鹽，你就當沒看見。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tea_horse",
    title: "茶馬互市",
    body: "邊市茶馬交換吵翻，譯者被推搡，交易眼看破裂。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "trade"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "公平交易",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你出面按公道的行情重新議了價，雙方總算平心靜氣地成交。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "討價還價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  economy: 1
                }
              },
              {
                type: "narrate",
                text: "你替兩邊都壓了壓價，順道聽了些邊地的新聞，交易才沒散。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕離開",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你覺得這場交易水太深，拱手離開，不想蹚這渾水。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_pearl_dive",
    title: "寒潭摸蚌",
    body: "漁人說潭底有珠蚌，水深且寒，上去者分紅。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你潛下寒潭摸了一圈，蚌沒摸着幾顆，倒撿回一柄鏽劍。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把潭底的傳聞轉手賣給了好奇的旅人，自己沒下水那趟寒潭。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把這潭底傳聞說給了漁村的人聽，免得有人貿然下水出事。"
              }
            ]
          }
        ]
      }
    ]
  }
];

export const JIANGHU_EXTRA_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    () => [
      { type: 'health', amount: -10 },
      { type: 'money', amount: -5 },
    ],
    0.15,
  ),
);
