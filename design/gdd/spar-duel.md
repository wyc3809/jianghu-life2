# 演武台對打（長血條版）

## 1. Overview

主畫面演武台由「一擊一個」改為長血條對打：每關幾個小兵＋一個首領，俠客同敵人輪流出手，彈傷害、暴擊、吸血數字；首領倒下過關掉銅錢（銀兩＋修為），主角演武血條打光就「演武敗退」退關、回滿血再戰。純展示＋輕量放置收益，唔影響角色真氣血。

## 2. Player Fantasy

打開遊戲就見到自己個俠客喺度同一排敵人硬碰，數字越練越大、首領越打越強——「我變強咗」嘅即時感覺，似放置類武俠手遊。

## 3. Detailed Rules

- 一關＝`sparMinionCount(stage)` 個小兵（3 起，每 5 關 +1，最多 6）＋ 1 個首領。
- 主角每 ~1.2 秒出手一次（導演節奏 windup→strike→recover）；敵人入近身後每 1.6 秒（首領 1.15 秒）撲擊一次，±0.5 秒浮動。
- 主角每擊：±10% 浮動；暴擊率擲中 ×1.85；**有吸血招式／裝備先會吸血**。
- **無回血技唔會自動回血**：過關回血只限學咗回血招式（`move.healSelf > 0`）；冇就帶住傷入下一關。
- 敵人每擊 ±15% 浮動，扣主角減傷。
- **場景＋主題**：每 10 關換一個場景，一個場景一個敵人主題（`SPAR_SCENES`）：千燈鎮＝市井潑皮 → 山道＝山道劫匪 → 竹林＝影門殺陣 → 雨夜客棧＝夜行刺客 → 山門＝邪寺頭陀 → 夜山＝黑風寨，60 關一輪後循環（敵人照越嚟越強）。同主題小兵按固定次序輪流出，首領固定。
- 換場景：背景墨暈淡入淡出、中間題字「入 · 地名＋主題」約 2.6 秒、俠客由左重新行入；跨場景過關嘅獎勵併入題字卡。左上角地名跟場景（千燈鎮場景照用角色所在地）。
- 小兵倒下 → 下一個；首領倒下 → 過關（stage+1；有回血招式先回 35% 血），掉 6 個銅錢，入賬銀兩＋修為。
- 主角演武血條見底 → 倒地 1.6 秒 → 退 `max(1, floor(stage/10))` 關、回滿血。
- **場景氛圍**（`src/spar/ambience.ts`）：千燈鎮水光＋薄霧、山道落葉、竹林竹葉、雨夜客棧斜雨＋濺水＋偏暗、山門雲霧＋香煙、夜山流雲＋螢火；背景鏡頭慢慢推近拉遠（±2.2%）。粒子分前後兩層（角色後／角色前）。
- **條帶變形骨架**（`src/spar/stripRig.ts`）：剪影切 40 條橫帶，三組阻尼彈簧——上身傾（lean）、衣擺（cloth，膝下最大）、頭髮斗笠（hair，頭頂一截）；腳底永遠唔郁。行路拖衣擺、蓄勢後仰、出招前傾、受擊後彈；兵器握點跟變形移動；揮擊爆發段留 5 格淡墨殘影。倒地時唔疊加變形。
- 關數存喺 `character.flags.spar_stage`；每次命中仍經 `sparStrike()` +1 修為（同舊版一樣）。

## 4. Formulas

```
scale    = 1.32 ^ cultivationTier
heroMaxHp = (maxHealth × 12 + (martial + gearMartial) × 25) × scale
heroAtk   = (24 + (martial + gearMartial) × 1.6 + gearAttack × 3) × scale
critRate  = min(0.45, 0.10 + 膽識 × 0.003 + 悟性 × 0.001)
lifesteal = min(0.25, Σ已學招式 move.lifesteal + 裝備詞條 lifesteal)   // 冇就 0
clearHeal = 有任何已學招式 move.healSelf > 0 ? 0.35 : 0
guard     = min(0.6, gearDefense × 0.012)

g         = 1.16 ^ (stage − 1)
minionHp  = 140 × g,  minionAtk = 16 × g
bossHp    = minionHp × 7,  bossAtk = minionAtk × 2.2
reward    = { silver: 2 + floor(stage/3), xp: 10 + stage × 4 }
```

## 5. Edge Cases

- 角色升境／換兵器：`setHero()` 按比例保留血量，唔會即刻回滿或暴斃。
- 修為已到境界上限：過關修為只入到上限。
- 減少動態：關震屏、粒子、銅錢；數字照彈。
- 角色已死／總結中：store action 直接返 0，演武照播但唔入賬。

## 6. Dependencies

- `core/life/cultivation.ts`（境界）、`core/life/equipment.ts`（gearTotals）
- `src/spar/engine.ts`（動畫、`SparCombatHooks`）、`src/components/ink/InkSparStage.tsx`（血條浮層）
- `src/store/slices/progressionSlice.ts`（`sparStageClear` / `sparSetStage`）

## 7. Tuning Knobs

`SPAR_SCENES`／`SPAR_SCENE_SPAN`（場景、主題陣容、每場景關數）、`SPAR_TIER_SCALE`、`SPAR_STAGE_GROWTH`、`SPAR_BOSS_HP_MUL`、`SPAR_BOSS_ATK_MUL`、`SPAR_STAGE_CLEAR_HEAL`（`core/life/sparDuel.ts`）；氛圍配方 `AMBIENCE`（`src/spar/ambience.ts`）；骨架彈簧 `LEAN`／`CLOTH`／`HAIR`、位移上限 `RIG_LIMIT`（`src/spar/stripRig.ts`）、殘影 `AFTERIMAGE_LIFE`／`AFTERIMAGE_EVERY`；撲擊節奏 `LUNGE_DUR`／`LUNGE_HIT_AT`、敗退時長 `HERO_DOWN_DUR`（`src/spar/engine.ts`）。

## 8. Acceptance Criteria

- 新角色可以打過第 1 關（`tests/spar_duel.test.ts`）。
- 首領倒下必定過關、關數 +1；主角倒下必定退關且回滿血。
- 境界越高主角數值越大（第 6 境 > 第 0 境 ×4）。
- 畫面：兩條墨筆血條跟頭頂、首領名牌、餘敵數、暴擊大字震屏、回血綠字、受傷紅字、銅錢落地（截圖驗證）。


> 第 20 項：敵人圖鑑同首領特性（精英、首領、特性）見 `design/gdd/foe-roster.md`。
