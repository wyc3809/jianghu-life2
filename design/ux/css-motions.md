# 水墨動效片段（可直接引用）

```css
@keyframes inkFadeUp {
  from { opacity: 0; transform: translateY(10px); filter: blur(2px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes sealStamp {
  0%   { opacity: 0; transform: scale(1.35) rotate(-12deg); }
  45%  { opacity: 1; transform: scale(0.96) rotate(-6deg); }
  100% { opacity: 0; transform: scale(1) rotate(-8deg); }
}

@keyframes pageYear {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}

.ink-enter { animation: inkFadeUp 0.55s ease both; }
.seal-once { animation: sealStamp 0.9s ease forwards; }
```

原則：慢、薄、少；一次畫面最多兩種動效同時出現。

## A+B 紙氣昇華（見 `paper-atmosphere.md`）

```css
@keyframes inkPaperBreathe { /* 翻月 380ms 墨暈 */ }
@keyframes inkWriteIn { /* 事件正文寫入 */ }
.scroll-shell.ink-month-turn::after { animation: inkPaperBreathe 0.38s … }
.ink-event-body.ink-write-in { animation: inkWriteIn 0.32s … }
.ink-choice-list--await → --reveal /* 選項延遲 */
.ink-result--staged /* 故事 → 消長 → 印 */
```

`prefers-reduced-motion` 與 `html[data-ink-motion=reduce]` 雙閘。

## 交手水墨特效（`combat-ink-fx.md`）

```css
@keyframes inkFxRise { /* 傷勢旁註上浮淡出 420ms */ }
@keyframes inkBarGhostFade { /* 血條墨滲殘影 */ }
@keyframes inkBrushSlash|Mist|Guard { /* 實／虛／架筆勢 */ }
@keyframes inkCombatShock { /* 重創紙震 100ms */ }
.ink-combat-fx-layer · .ink-bar-fill--ghost · .ink-combat--shock
```


