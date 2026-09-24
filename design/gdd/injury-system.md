# 部位傷勢系統（Injury System）

> 狀態：**已審批（寬鬆機率）**　·　擁有模組（預定）：`core/life/injuries.ts`　·　UI：`InkPersonPanel`、`InkMomentFx`

## 1. Overview

角色身上分 **四個部位**：頭、軀幹、手臂、腿腳。每個部位最多一處傷，分 **輕傷／重傷／傷殘** 三級。
輕傷、重傷隨時間或醫館調養好返；**傷殘係永久**，只有少數奇遇可以醫。每處傷按部位扣唔同能力（手傷出手弱、腳傷難閃避、頭傷難領悟、軀幹傷氣血上限低）。
受傷一刻有按部位嘅墨濺特效；人物欄有人形剪影標出傷處，加一張傷勢清單。
現有「流血、內傷、餘毒、舊疤」係全身狀態，照舊留喺 `conditions`；「骨裂、腿傷難行」併入部位傷勢。

## 2. Player Fantasy

「呢隻手係當年喺黑風寨斷嘅。」傷係人生留低嘅痕，唔係一條會自己回滿嘅血。
玩家要揀：帶傷去比武搏一搏，定係養好先出門。一次傷殘會改變之後嘅打法（斷臂轉練腿法、傷咗頭就少啲閉關悟道），
而遇到神醫、得到續骨膏嗰刻，係一世人難得嘅轉機。

## 3. Detailed Rules

### 3.1 資料

```ts
type InjuryPart = 'head' | 'torso' | 'arm' | 'leg';
type InjuryTier = 'light' | 'heavy' | 'crippled';
interface LifeInjury {
  part: InjuryPart;
  tier: InjuryTier;
  monthsLeft: number | null; // null＝傷殘（永久）
  cause: string;             // 「敗於黑風寨主」等，人物欄顯示
}
// character.injuries?: LifeInjury[]   舊存檔無此欄 → 當 []
```

- 每部位**最多一條**記錄。
- 部位中文：頭＝頭部、torso＝軀幹、arm＝手臂、leg＝腿腳（唔分左右）。

### 3.2 受傷（`addInjury(state, part, tier, cause)`）

| 該部位現況 | 新傷輕 | 新傷重 |
|------------|--------|--------|
| 無 | 輕傷 | 重傷 |
| 輕傷 | 升重傷 | 重傷 |
| 重傷 | 重傷（時間重置） | 擲 `CRIPPLE_ON_STACK`：中→傷殘，否則重傷（時間重置） |
| 傷殘 | 不變；改扣氣血 `CRIPPLED_REHIT_HP` | 同左 |

- 時間：輕傷 `LIGHT_MONTHS`，重傷 `HEAVY_MONTHS`；重置取較長者。
- 部位未指明時按 `PART_WEIGHTS` 擲（種子 RNG）。

### 3.3 來源

1. **戰鬥**（`finishCombat`）
   - 戰敗：`LOSS_INJURY_CHANCE` 受一處傷；按敵強度擲重傷（`LOSS_HEAVY_CHANCE`：弱 10%／普通 25%／強 50%／首領 70%），否則輕傷。（戰敗時氣血必為 0，故唔用氣血門檻）
   - 險勝（氣血 < 30%）：`WIN_INJURY_CHANCE` 輕傷。
   - 首領戰敗且重傷：額外 `BOSS_CRIPPLE_CHANCE` 直接傷殘。
   - 切磋（spar）唔會傷殘，最多重傷。
2. **事件**：新效果 `{ type: 'injury', part?, tier }`。舊資料 `condition: fracture` → 隨機手臂／腿腳重傷；`condition: limp` → 腿腳重傷（相容層，唔使改事件檔）。
3. **修煉意外**：外功走岔（原 12% 流血）→ 改為手臂或腿腳輕傷。

### 3.4 復原（每月 `tickInjuries`）

- 輕傷：`monthsLeft` 每月 −1，到 0 消失。
- 重傷：到 0 降為輕傷（`LIGHT_MONTHS`），唔會一下好晒。
- 傷殘：唔會自己好。
- **醫館調養**（現有 `heal` 行動）：所有非傷殘傷 `monthsLeft −HEAL_MONTHS`，重傷減到 0 同樣只降輕傷。
- **奇遇醫殘**：新增 3 個低權重事件（神醫出手、續骨黑玉膏、易筋經殘頁），效果 `{ type: 'cure_crippled', part? }` → 傷殘變重傷（仲要再養）。每世預期遇到 ≤ 1 次。

### 3.5 效果

| 部位 | 輕傷 | 重傷 | 傷殘 | 影響落邊 |
|------|------|------|------|----------|
| 頭部 | 修煉／領悟進度 −10% | −25% | −40% | `tryAdvanceSkill` 進度、修為增長 |
| 軀幹 | 氣血上限 −5% | −15% | −25% | `maxHealth` 衍生值 |
| 手臂 | 出手 −8% | −20% | −35% | 戰鬥攻擊 |
| 腿腳 | 閃避 −3%、每月精力 −4 | −6%、−10 | −12%、−16 | 戰鬥閃避、`stamina` |

所有數值喺 `data/injuries/tuning.ts`（資料驅動），核心只讀表。

### 3.6 呈現

- **受傷特效**（`LifeMoment` 新增 `{ kind: 'injury'; part; tier }`，同一隊列）：
  - 輕傷：唔開全屏，只喺畫面邊一滴淡墨濺落＋一行旁註（唔打斷節奏）。
  - 重傷：短全屏：人形剪影喺該部位濺朱砂墨，寫「右臂重傷」類字，1.8s 自動收。
  - 傷殘：完整儀式：剪影該部位墨裂，直書「手臂 · 殘」，蓋新「殘」印（`build_ink_stamps.py` 加印），要撳先收。
  - 醫好傷殘：用「武學入懷」同款紙卷，蓋「癒」印（新印）。
- **人物欄**（`InkPersonPanel`）新「傷勢」卷：
  - 左：主角剪影（現有 `heroSilhouetteUrl`），四部位用位圖墨點標記：輕＝淡墨點、重＝朱砂點、殘＝朱砂斜劃＋小「殘」印。唔用 SVG。
  - 右：清單「手臂 · 重傷 · 尚餘 5 月 · 出手 −20% · 敗於黑風寨主」。無傷時顯示「身無新傷」。
- 頂欄：有重傷／傷殘時，名字旁顯示一個細朱砂點（撳入人物欄）。

## 4. Formulas

```
部位擲選：P(part) = PART_WEIGHTS[part] / Σ PART_WEIGHTS
  預設 PART_WEIGHTS = { torso: 35, arm: 30, leg: 25, head: 10 }

戰敗受傷：P(injury | loss) = LOSS_INJURY_CHANCE = 0.60
戰敗傷級：P(heavy | loss, power) = LOSS_HEAVY_CHANCE[power] = { weak .10, normal .25, strong .50, boss .70 }

疊傷成殘：P(crippled | heavy + heavy) = CRIPPLE_ON_STACK = 0.20
首領戰敗：P(crippled | boss ∧ heavy) = BOSS_CRIPPLE_CHANCE = 0.05
險勝受傷：P(light | win ∧ hp/maxHp < 0.30) = WIN_INJURY_CHANCE = 0.20

效果（乘法疊加，同部位只有一條所以唔會自疊）：
  attack'   = attack   × (1 − ARM_PENALTY[tier])        ARM   = { .08, .20, .35 }
  maxHealth'= maxHealth× (1 − TORSO_PENALTY[tier])      TORSO = { .05, .15, .25 }
  progress' = progress × (1 − HEAD_PENALTY[tier])       HEAD  = { .10, .25, .40 }
  evasion'  = evasion − LEG_EVASION[tier]               LEG_EVASION = { .03, .06, .12 }（戰鬥閃避 0–0.45，下限 0）
  每月 stamina −= LEG_STAMINA[tier]                      LEG_STAMINA = { 4, 10, 16 }

時間：LIGHT_MONTHS = 3，HEAVY_MONTHS = 8，HEAL_MONTHS = 2
```

理由：輕傷 3 月約等於「一季養好」；重傷 8＋3 月約一年，令戰敗有分量但唔會拖死一世人；
傷殘機率要兩次重傷疊埋或首領重創先會出，普通路遇唔會一次就殘。

## 5. Edge Cases

- **舊存檔**：無 `injuries` → 當 `[]`；舊 `conditions` 入面嘅 `fracture`／`limp` 讀檔時轉成對應部位重傷（保留剩餘月數），其餘 condition 不變。
- **傷殘部位再受傷**：唔再升級，改扣氣血 `CRIPPLED_REHIT_HP = 8`，旁註「舊患處再受重擊」。
- **四肢全殘**：容許；唔直接判死，但戰鬥幾乎打唔贏——死亡仍由現有死亡規則決定。
- **軀幹傷令現有氣血高過新上限**：氣血即時夾返上限。
- **醫館錢唔夠**：同現在一樣，無效果。
- **死亡／傳承**：傷勢唔遺傳；總結頁列出「一生傷殘」作為生平痕跡。
- **減少動態**：受傷特效只顯示靜態卷面，時長按 motion token（1ms 動畫）；傷殘仍要撳先收。
- **同一個月多處受傷**：特效隊列上限 4，傷殘優先保留（入隊時如滿，先丟最舊嘅輕傷）。
- **切磋**：最高重傷，唔會觸發傷殘。

## 6. Dependencies

- `core/life/combat.ts`（`finishCombat` 受傷、攻擊／閃避讀傷勢）
- `core/life/flavor.ts`（`tryAdvanceSkill` 讀頭部傷）
- `core/life/monthly.ts`（`tickConditions` 旁加 `tickInjuries`；`fracture`／`limp` 相容）
- `core/life/actions.ts`（醫館、修煉意外）
- `core/life/effects.ts`（新 `injury`、`cure_crippled` 效果）
- `core/life/moments.ts`（新 `injury`／`cure` 時刻）
- `interfaces/lifeEngine.ts`（型別＋Zod）、存檔讀取遷移
- `data/events/`（3 個醫殘奇遇）
- UI：`InkPersonPanel`、`InkMomentFx`、頂欄；素材：新「殘」「癒」印、墨點位圖（`build_ink_stamps.py`／`build_ink_ui.py`）

## 7. Tuning Knobs

| 參數 | 預設 | 安全範圍 | 影響 |
|------|------|----------|------|
| `PART_WEIGHTS` | 35/30/25/10 | 各 5–50 | 邊個部位最常傷 |
| `LIGHT_MONTHS` | 3 | 1–6 | 輕傷持續 |
| `HEAVY_MONTHS` | 8 | 4–14 | 重傷持續 |
| `HEAL_MONTHS` | 2 | 1–4 | 醫館效率 |
| `LOSS_HEAVY_CHANCE` | .10/.25/.50/.70 | 各 0–0.9 | 戰敗變重傷（按敵強度） |
| `LOSS_INJURY_CHANCE` | 0.60 | 0.3–1 | 戰敗代價 |
| `WIN_INJURY_CHANCE` | 0.20 | 0–0.6 | 險勝代價 |
| `CRIPPLE_ON_STACK` | 0.20 | 0.1–0.6 | 疊傷成殘 |
| `BOSS_CRIPPLE_CHANCE` | 0.05 | 0–0.25 | 首領重創 |
| 各部位懲罰表 | 見 §4 | 輕 ≤ .15、殘 ≤ .5 | 傷勢手感 |
| 醫殘奇遇權重 | 低（≈ 每世 ≤ 1 次） | — | 傷殘可逆程度 |

## 8. Acceptance Criteria

1. `addInjury` 按 §3.2 表格升級；同部位永遠只得一條（單元測試覆蓋每一格）。
2. 同一種子、同一操作序列 → 受傷部位同級別完全一致（決定性測試）。
3. `tickInjuries`：輕傷 3 月後消失；重傷 8 月後變輕傷，再 3 月消失；傷殘 120 月後仍在。
4. 醫館：非傷殘傷減 2 月；傷殘不變。
5. `cure_crippled` 將傷殘變重傷，且只作用於傷殘。
6. 舊存檔（無 `injuries`、有 `fracture`）讀入後：`injuries` 有對應重傷，`conditions` 無 `fracture`；Zod 驗證通過。
7. 手臂重傷時戰鬥攻擊 = 原值 × 0.8（誤差 ±1 捨入）；軀幹傷殘時 `maxHealth` = 原值 × 0.75。
8. 戰敗受傷率 ≈ 60%（1,000 次種子模擬 ±5%）；切磋永不出傷殘（1,000 次種子模擬）。
9. 人物欄：有傷時剪影標記數目 = 傷勢條數，清單文字正確；無傷顯示「身無新傷」（截圖證據）。
10. 重傷／傷殘特效顯示並可跳過；輕傷唔開全屏（截圖證據）。
11. 全程無 SVG（`no-svg-game-art` 規則）。
