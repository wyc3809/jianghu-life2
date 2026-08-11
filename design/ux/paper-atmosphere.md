# 紙氣昇華 — 四季／晝夜 × 事件手卷（A+B）

## 方向

整頁紙氣跟季節與夜氣走；翻月一次短促墨暈。事件頁正文先寫入、選項後現；結果匣故事→消長→朱砂印。

## 做／不做

- 做：`ink-scene--{season|night}` CSS 變量、`ink-month-turn`、事件 `ink-write-in`／`ink-choice-list--reveal`、設定「減少動態」
- 不做：首屏統計卡、戰鬥大改、關係卡片牆、紫漸層／glow

## 招牌動效（≤3）

| 名 | 觸發 | 時長 |
|----|------|------|
| ink-paper-breathe | 年月變更 → `.ink-month-turn` | 380ms |
| ink-seal-stamp | 蓋印（既有） | ~0.8s |
| ink-write-in | 事件正文入場 | 段 320ms + stagger |

`prefers-reduced-motion` 與 `html[data-ink-motion=reduce]` 雙閘關閉。

## 選擇器

- `.scroll-shell.ink-scene--spring|summer|autumn|winter`
- `.scroll-shell.ink-scene--night`
- `.scroll-shell.ink-month-turn::after`
- `.ink-event-body.ink-write-in`
- `.ink-choice-list--await` / `--reveal`
- `.ink-result--staged`（故事→delta→seal）
