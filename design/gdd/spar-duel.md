# 演武台對打（長血條版）

## 1. Overview

主畫面演武台由「一擊一個」改為長血條對打：每關幾個小兵＋一個首領，俠客同敵人輪流出手，彈傷害、暴擊、吸血數字；首領倒下過關掉銅錢（銀兩＋修為），主角血條打光就「演武敗退」，同一關由第一個敵人重新挑戰、回滿血。演武氣血就係角色真氣血（雙向同步），但演武唔會令角色死亡。

## 2. Player Fantasy

打開遊戲就見到自己個俠客喺度同一排敵人硬碰，數字越練越大、首領越打越強——「我變強咗」嘅即時感覺，似放置類武俠手遊。

## 3. Detailed Rules

- 一關＝`sparMinionCount(stage)` 個小兵（3 起，每 5 關 +1，最多 6）＋ 1 個首領。
- 主角每 ~1.2 秒出手一次（導演節奏 windup→strike→recover）；敵人入近身後每 1.6 秒（首領 1.15 秒）撲擊一次，±0.5 秒浮動。
- 主角每擊：±10% 浮動；暴擊率擲中 ×1.85；**有吸血招式／裝備先會吸血**。
- **過關一律回滿血**（玩家 2026-10-14）。關內回血：有吸血招式／裝備先吸血；學咗回血招式（`move.healSelf > 0`）每打低一個小兵／精英回 `SPAR_KILL_HEAL`。
- 敵人每擊 ±15% 浮動，扣主角減傷。
- **場景＋主題**：每 10 關換一個場景，一個場景一個敵人主題（`SPAR_SCENES`）：千燈鎮＝市井潑皮 → 山道＝山道劫匪 → 竹林＝影門殺陣 → 雨夜客棧＝夜行刺客 → 山門＝邪寺頭陀 → 夜山＝黑風寨，60 關一輪後循環（敵人照越嚟越強）。同主題小兵按固定次序輪流出，首領固定。
- 換場景：背景墨暈淡入淡出、中間題字「入 · 地名＋主題」約 2.6 秒、俠客由左重新行入；跨場景過關嘅獎勵併入題字卡。左上角地名跟場景（千燈鎮場景照用角色所在地）。
- 小兵倒下 → 下一個（有回血招式回少少血）；首領倒下 → 過關（stage+1、回滿血），掉 6 個銅錢，入賬銀兩＋修為。
- 主角血條見底 → 倒地 1.6 秒 → 同一關由第一個敵人重新挑戰、回滿血（EA0.68.0 起唔再退關）。
- 隨機（暴擊、浮動、特性）用演武專用 seeded RNG（`sparRand(角色 seed, 關數)`），唔推進人生事件 RNG；同一角色同一關結果可重現。
- **場景氛圍**（`src/spar/ambience.ts`）：千燈鎮水光＋薄霧、山道落葉、竹林竹葉、雨夜客棧斜雨＋濺水＋偏暗、山門雲霧＋香煙、夜山流雲＋螢火；背景鏡頭慢慢推近拉遠（±2.2%）。粒子分前後兩層（角色後／角色前）。
- **條帶變形骨架**（`src/spar/stripRig.ts`）：剪影切 40 條橫帶，三組阻尼彈簧——上身傾（lean）、衣擺（cloth，膝下最大）、頭髮斗笠（hair，頭頂一截）；腳底永遠唔郁。行路拖衣擺、蓄勢後仰、出招前傾、受擊後彈；兵器握點跟變形移動；揮擊爆發段留 5 格淡墨殘影。倒地時唔疊加變形。
- 關數存喺 `character.flags.spar_stage`；每次命中仍經 `sparStrike()` +1 修為（同舊版一樣）。

## 4. Formulas

```
scale     = 1.32 ^ cultivationTier
heroMaxHp = maxHealth                       // 角色真氣血上限，唔另外放大（玩家要求：主角血量唔可以亂加）
heroAtk   = (24 + (martial + gearMartial) × 1.6 + gearAttack × 3) × scale
critRate  = min(0.45, 0.10 + 膽識 × 0.003 + 悟性 × 0.001)
lifesteal = min(0.25, Σ已學招式 move.lifesteal + 裝備詞條 lifesteal)   // 冇就 0
killHeal  = 有任何已學招式 move.healSelf > 0 ? SPAR_KILL_HEAL(0.12) : 0
guard     = min(0.6, gearDefense × 0.012)

// 2026-10-14：血量同攻擊分兩條曲線
minionHp  = 140 × SPAR_FOE_HP_GROWTH(1.18) ^ (stage − 1)    // 跟主角攻擊成長：過唔過關睇攻擊
minionAtk = 16  × SPAR_FOE_ATK_GROWTH(1.032) ^ (stage − 1)  // 跟主角氣血自然成長（境界 0→14 約 ×3.3）
eliteHp   = minionHp × 2.4,  eliteAtk = minionAtk × 1.35
bossHp    = minionHp × SPAR_BOSS_HP_MUL(4),  bossAtk = minionAtk × SPAR_BOSS_ATK_MUL(2.2)
reward    = { silver: 2 + floor(stage/3), xp: 10 + stage × 4 }
```

例（固定 seed 42，只計突破成長，實測節奏：普通敵人每 2.5 下主角出手還一下、首領每 1.9 下）：

| 境界 | 氣血 | 攻擊 | 舊曲線卡喺（首領一擊） | 新曲線卡喺（首領一擊） |
|---|---:|---:|---:|---:|
| 0 | 325 | 49 | 第 1 關（11%） | 第 3 關（11%） |
| 4 | 439 | 362 | 第 8 關（26%） | 第 14 關（12%） |
| 8 | 633 | 2,219 | 第 17 關（79%） | 第 26 關（12%） |
| 14 | 1,074 | 25,315 | 第 27 關（242%） | 第 39 關（11%） |

「首領一擊」＝撞牆嗰關首領一下扣主角幾多 % 氣血；舊版後期超過 100%＝一擊倒地。

```
```

## 5. Edge Cases

- 角色升境／換兵器：`setHero()` 跟角色現有氣血，唔會即刻回滿或暴斃。
- 演武傷害同步角色氣血；最低留 1 點，唔會死亡。
- 修為已到境界上限：過關修為只入到上限。
- 減少動態：關震屏、粒子、銅錢；數字照彈。
- 角色已死／總結中：store action 直接返 0，演武照播但唔入賬。

## 6. Dependencies

- `core/life/cultivation.ts`（境界）、`core/life/equipment.ts`（gearTotals）
- `src/spar/engine.ts`（動畫、`SparCombatHooks`）、`src/components/ink/InkSparStage.tsx`（血條浮層）
- `src/store/slices/progressionSlice.ts`（`sparStageClear` / `sparSetStage`）

## 7. Tuning Knobs

`SPAR_SCENES`／`SPAR_SCENE_SPAN`（場景、主題陣容、每場景關數）、`SPAR_TIER_SCALE`（`core/life/sparDuel.ts`）；測試參數 `SPAR_FOE_HP_GROWTH`、`SPAR_FOE_ATK_GROWTH`、`SPAR_BOSS_HP_MUL`、`SPAR_BOSS_ATK_MUL`、`SPAR_KILL_HEAL`（`data/redesign/testParams.ts`）；氛圍配方 `AMBIENCE`（`src/spar/ambience.ts`）；骨架彈簧 `LEAN`／`CLOTH`／`HAIR`、位移上限 `RIG_LIMIT`（`src/spar/stripRig.ts`）、殘影 `AFTERIMAGE_LIFE`／`AFTERIMAGE_EVERY`；撲擊節奏 `LUNGE_DUR`／`LUNGE_HIT_AT`、敗退時長 `HERO_DOWN_DUR`（`src/spar/engine.ts`）。

## 8. Acceptance Criteria

- 新角色可以打過第 1 關；每升境界都推得更遠；頂境唔會卡喺 20 幾關（`tests/spar_curve.test.ts`）。
- 撞牆時首領一擊唔超過主角氣血 20%（唔再一擊倒地）。
- 首領倒下必定過關、關數 +1、回滿血；主角倒下同一關重來且回滿血。
- 同一 seed 同一關結果一樣。
- 畫面：兩條墨筆血條跟頭頂、首領名牌、餘敵數、暴擊大字震屏、回血綠字、受傷紅字、銅錢落地（截圖驗證）。


> 第 20 項：敵人圖鑑同首領特性（精英、首領、特性）見 `design/gdd/foe-roster.md`。
