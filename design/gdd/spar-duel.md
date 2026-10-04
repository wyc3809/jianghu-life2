# 演武台對打（長血條版）

## 1. Overview

主畫面演武台由「一擊一個」改為長血條對打：每關幾個小兵＋一個首領，俠客同敵人輪流出手，彈傷害、暴擊、吸血數字；首領倒下過關掉銅錢（銀兩＋修為），主角演武血條打光就「演武敗退」退關、回滿血再戰。純展示＋輕量放置收益，唔影響角色真氣血。

## 2. Player Fantasy

打開遊戲就見到自己個俠客喺度同一排敵人硬碰，數字越練越大、首領越打越強——「我變強咗」嘅即時感覺，似放置類武俠手遊。

## 3. Detailed Rules

- 一關＝`sparMinionCount(stage)` 個小兵（3 起，每 5 關 +1，最多 6）＋ 1 個首領。
- 主角每 ~1.2 秒出手一次（導演節奏 windup→strike→recover）；敵人入近身後每 1.6 秒（首領 1.15 秒）撲擊一次，±0.5 秒浮動。
- 主角每擊：±10% 浮動；暴擊率擲中 ×1.85；按傷害吸血。敵人每擊 ±15% 浮動，扣主角減傷。
- 小兵倒下 → 下一個；首領倒下 → 過關（stage+1、回 35% 血），掉 6 個銅錢，入賬銀兩＋修為。
- 主角演武血條見底 → 倒地 1.6 秒 → 退 `max(1, floor(stage/10))` 關、回滿血。
- 關數存喺 `character.flags.spar_stage`；每次命中仍經 `sparStrike()` +1 修為（同舊版一樣）。

## 4. Formulas

```
scale    = 1.32 ^ cultivationTier
heroMaxHp = (maxHealth × 12 + (martial + gearMartial) × 25) × scale
heroAtk   = (24 + (martial + gearMartial) × 1.6 + gearAttack × 3) × scale
critRate  = min(0.45, 0.10 + 膽識 × 0.003 + 悟性 × 0.001)
lifesteal = min(0.25, 0.06 + tier × 0.008)
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

`SPAR_TIER_SCALE`、`SPAR_STAGE_GROWTH`、`SPAR_BOSS_HP_MUL`、`SPAR_BOSS_ATK_MUL`、`SPAR_STAGE_CLEAR_HEAL`（`core/life/sparDuel.ts`）；撲擊節奏 `LUNGE_DUR`／`LUNGE_HIT_AT`、敗退時長 `HERO_DOWN_DUR`（`src/spar/engine.ts`）。

## 8. Acceptance Criteria

- 新角色可以打過第 1 關（`tests/spar_duel.test.ts`）。
- 首領倒下必定過關、關數 +1；主角倒下必定退關且回滿血。
- 境界越高主角數值越大（第 6 境 > 第 0 境 ×4）。
- 畫面：兩條墨筆血條跟頭頂、首領名牌、餘敵數、暴擊大字震屏、回血綠字、受傷紅字、銅錢落地（截圖驗證）。
