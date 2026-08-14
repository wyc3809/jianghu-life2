# Combat Ink FX — 交手水墨特效

## Overview

文字武俠交手的視覺反饋：傷勢旁註、血條墨滲、招式筆勢。讀作紙上批註，不作動作遊戲 HUD。

## Player Fantasy

每一擊像筆落紙面——數字是旁註，招式是筆勢，危急是朱砂「危／傷」字，不是飄血彈跳。

## Detailed Rules

1. 每次 `playerCombatTurn` 後，由 HP／內力差分＋新增戰報句產生 ≤4 條 `InkCombatFx`。
2. 旁註種類：`hp`／`qi`／`miss`／`crit`／`guard`／`heal`／`move`／`danger`。
3. 血條：舊寬度作 ghost fill，0.55s 淡出；活條平滑縮短。
4. 招式站位筆勢：`shi` 斜飛白、`xu` 松煙沉、`jia` 橫擋一筆（選招後 400ms）。
5. 重創／己方大傷：短紙震 `ink-combat--shock`（~100ms）。
6. 朱砂不獨撐語意：重創必帶「危」或「傷」字。

## Formulas

- 顯示傷害量：`round(|Δhp|)`，若 `0 < |Δ| < 1` 則顯示 1
- 己方「傷」閾：`Δhp / maxHp ≥ 0.18` 或戰報含 crit

## Edge Cases

- 無 prev snap（開戰首幀）：只可出招名，不出假傷害
- reduced-motion／`data-ink-motion=reduce`：瞬顯字、無 rise／shock／飛白
- 同屏超過 4 條：丟棄較低優先（保留 move）

## Dependencies

- `core/life/combatPresentation.classifyBeat`
- `core/life/moveStance`
- `InkPlayScreen` 交手區

## Tuning Knobs

| Knob | Default | Range |
|------|---------|-------|
| FX lifetime | 1600ms | 1200–2000 |
| FX animation | 1450ms（先停住再淡） | 1000–1800 |
| Max on-screen | 4 | 2–6 |
| Shock duration | 120ms | 80–140 |
| Stance brush | 700ms | 400–900 |

## Acceptance Criteria

- [ ] 扣敵／己血可見旁註淡出
- [ ] 內力消長有青玉／松煙旁註
- [ ] 血條有墨滲殘影
- [ ] 實／虛／架選招有可分辨筆勢
- [ ] 減少動態時無位移／震動，字仍可讀
- [ ] 無霓虹 glow、無彈跳數字、無技能圖示牆
