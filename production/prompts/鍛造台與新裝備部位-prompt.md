# 鍛造台與新裝備部位 · 工作 prompt（2026-11-28）

## 玩家已定

| 題目 | 決定 |
|---|---|
| 新部位 | 頭飾、鞋具、披風；預留之後再加（例如腰帶、護腕） |
| 立繪 | 先入裝備欄同數值，人物立繪暫時唔換 |
| 鍛造台 | 消耗品，一台打一件。奇遇同稀有事件先會跌落，分凡、良、珍、絕、曠、神六級 |
| 打造玩法 | 連點敲擊：每敲一下揭開一條屬性或者附加效果，途中有機會升一級稀有度 |
| 成本 | 鍛造台加銀兩；可以「加火」多付銀兩，提高升級機會；唔要嘅裝備可以熔回少量銀兩 |
| 參考 | 玩家提供嘅打造廣告截圖（`production/prompts/ref/forge-ad-*.png`）。**只參考玩法節奏**：敲擊、逐條開屬性、稀有度飆升、價值條。**唔好抄**佢嘅名、介面、配色或者美術。 |

## 分工

| 工作 | 邊個做 | 原因 |
|---|---|---|
| 圖示、鍛造場景、火花、稀有度光暈等點陣圖 | **Codex（ImageGen）** | 呢個環境冇出圖工具 |
| 存檔結構、裝備實例、跌落、打造邏輯、平衡、介面、動畫、測試、上線 | **Claude Code** | 要改核心、存檔同測試，動畫用現有 anime.js 管線 |

兩邊可以同時開工。美術未到之前，程式先用現有圖示代替；圖一到同一路徑，就會自動換上。

---

## Prompt A · 俾 Codex（美術資源）

```text
你喺 repo wyc3809/jianghu-life2（武俠人生模擬，Vite + React）出點陣圖素材，唔好改任何程式碼。

開工前先讀：
- design/art/STYLE.md
- design/art/CURRENT-STYLE.md
- public/ink/art/person/gear-sword.webp、gear-armor.webp、gear-accessory.webp（現有裝備圖示，新圖示要同一畫風、筆觸、構圖同留白）

風格規則：
- 明亮宣紙底，青綠暖金漫畫風，水墨筆觸。玩家拒絕過深色風格，唔好做深紫、黑底、霓虹。
- 只出 WebP 點陣圖。唔准 SVG，圖入面唔好有任何文字。
- 參考截圖只係一隻手遊廣告（打鐵開屬性）。唔好抄佢嘅名、介面、配色、武器造型或者特效樣式，全部要係原創武俠風。

請出以下檔案（透明底除非註明）：

1. 新裝備欄圖示，256×256，同現有 gear-*.webp 一致：
   - public/ink/art/person/gear-head.webp（頭飾：斗笠／髮冠一類）
   - public/ink/art/person/gear-feet.webp（鞋具：布靴／快靴）
   - public/ink/art/person/gear-cloak.webp（披風：江湖斗篷）
2. 鍛造台圖示，六個稀有度，256×256，同一個鐵砧輪廓，用框邊同光澤分級：
   - public/ink/art/forge/table-common.webp（凡，白）
   - table-fine.webp（良，綠）
   - table-rare.webp（珍，藍）
   - table-epic.webp（絕，紫）
   - table-mythic.webp（曠，橙）
   - table-divine.webp（神，紅）
3. 打造場景：
   - public/ink/art/forge/scene.webp：1080×1350，不透明。明亮鐵匠鋪內景，鐵砧喺畫面中下，上半留空俾數值面板。
   - public/ink/art/forge/hammer.webp：512×512，鐵鎚，鎚頭向左下，方便旋轉做敲擊動畫。
   - public/ink/art/forge/blank-ingot.webp：512×256，燒紅鐵胚。
4. 特效：
   - public/ink/art/forge/sparks-sheet.webp：2048×256，橫排 8 格火花迸濺序列，每格 256×256。
   - public/ink/art/forge/burst-{common,fine,rare,epic,mythic,divine}.webp：768×768，稀有度升級時嘅墨環光暈，顏色跟上面六級。
   - public/ink/art/forge/ember.webp：128×128，單粒火星，用嚟做粒子。

交付：
- 每個檔案放喺上面指定路徑，尺寸要準。
- 另出一張對照板 production/qa/evidence/redesign/forge-art/board.webp，將全部素材排喺宣紙底上，俾玩家揀。
- 寫 production/qa/evidence/redesign/forge-art/README.md，列出每個檔案嘅用途、尺寸同生成 prompt。
- 開新分支 codex/forge-art，commit 同開 PR 去 main，標題「江湖一生 · art: 鍛造台與新裝備部位素材」。PR 唔好合併，等玩家睇完對照板再決定。
```

---

## Prompt B · 俾 Claude Code（功能、平衡、動畫）

```text
喺 wyc3809/jianghu-life2 做「新裝備部位」同「鍛造台」兩個功能。玩家已定嘅決定見 production/prompts/鍛造台與新裝備部位-prompt.md，照住做；未定嘅數值放 data/redesign/forgeParams.ts，記入 production/redesign-scope.md 做候選值。

一、新裝備部位
1. data/equipment/catalog.ts 嘅 GearSlot 加 head（頭飾）、feet（鞋具）、cloak（披風）。用一個部位清單（SLOT 定義：id、名、圖示、排序）做唯一來源，之後加腰帶、護腕只需要加資料。
2. interfaces/lifeEngine.ts 嘅 equipment 同 MartialPreset.equipment 加新部位（nullable）；Zod schema 同存檔遷移：舊存檔補 null，唔改舊裝備。
3. 每個新部位加 3–4 件基本裝備（凡至珍），數值偏向部位特色：頭飾偏內力、命中；鞋具偏閃避、身法；披風偏防禦、氣血。
4. 人物頁裝備欄（src/components/ink/InkPersonOverview.tsx 等）加三格，用 public/ink/art/person/gear-{head,feet,cloak}.webp；圖未到就先用 gear-accessory.webp。戰力、演武數值（core/life/sparDuel.ts sparHeroBreakdown）、對戰配搭、裝備比較視窗都要計埋新部位。

二、鍛造台
1. 資料模型：
   - 加「裝備實例」：打造出嚟嘅裝備有自己嘅 id、部位、稀有度、底材、詞條同價值。存喺角色身上，equipment 欄可以放目錄 id 或者實例 id。
   - 鍛造台係消耗品，按稀有度計數存喺角色身上。
2. 跌落：只喺奇遇同稀有事件結果跌（例如 special、secret 類事件、首領交手勝利）。稀有度分佈跟境界升。每日上限放 forgeParams。用事件效果（effectSchema 加 grantForgeTable）表達，唔好喺 UI 寫死。
3. 打造流程：
   - 揀鍛造台，再揀部位同底材（武器可揀兵器種類）。
   - 付銀兩，成本 = 基數 × 稀有度倍率 ×（境界＋1）。
   - 可選「加火」：多付銀兩，提高每敲升級機率，有上限。
   - 敲擊次數跟鍛造台稀有度（例如凡 3 下至神 8 下）。每敲揭開一條：先基本數值（攻擊／防禦／氣血），再附加效果。附加效果用現有 GearCombatBonus：命中、閃避、反震、破甲、吸血、流血；絕以上可以有 GearSpecialEffect。
   - 每敲有機會升一級稀有度，最多升兩級，神為頂。
   - 最後顯示品階、名稱同「裝備價值」。
   - 隨機一律用 seeded RNG（getRng），唔准 Math.random()。
   - 開打前先一次過算好結果，寫入存檔，先至播動畫，防止中途退出重抽。
4. 熔煉：唔要嘅實例裝備可以熔回成本嘅一部分（比例放 forgeParams），唔可以熔目錄裝備。
5. 平衡：
   - 打造裝備上限跟境界走，唔可以令演武或者戰力跳級。
   - 用 scripts/balance/pacingSim.mts 加入鍛造，跑三種玩家 60 日，對比演武關數、戰力同銀兩。目標係銀兩有出路，但第 60 日演武關數唔好比 EA0.122.0 高超過一成。
   - 結果寫入 production/balance/。

三、動畫（anime.js，經 src/ui/inkMotion.ts；遵守減少動態設定）
- 敲擊：撳畫面任何位置，鎚落鐵胚，火花迸濺（forge/sparks-sheet.webp），輕微震動。
- 開屬性：每敲一條屬性由下滑入，數字跳動；附加效果用稀有度色。
- 稀有度飆升：停頓半拍，墨環光暈（forge/burst-*.webp）爆開，品階字換色。
- 完成：價值條由零數上去，裝備圖示落印。之後揀「裝備」「收起」或者「熔煉」。
- 可以「跳過」直接睇結果。
- 美術未到就用 CSS 同現有墨筆素材代替，唔准用 SVG。

四、規則
- 玩家睇到嘅文字一律書面語，跑 npm run audit:copy 同 audit:narrate。
- 只參考廣告嘅玩法節奏，唔好抄名、介面或者美術。
- 加 Vitest：
  - 部位遷移；
  - 跌落條件；
  - 同一種子結果一致；
  - 升級上限；
  - 成本同熔煉；
  - 存檔往返；
  - 打造先存檔後播放。
- 用正式構建喺 390×844 截圖：裝備欄、揀鍛造台、敲擊中、稀有度飆升、完成；整前後對照板。
- 呢個係大改動：先出設計同數值俾玩家確認，再寫程式；完成之後俾玩家睇截圖先上線。
```
