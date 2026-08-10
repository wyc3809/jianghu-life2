# 素材索引

本倉庫落地路徑以 `public/ink/` 與 `design/art/` 為準。風格鐵律見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)。

## 文件

| 檔案 | 用途 |
|------|------|
| `STYLE-BIBLE.md` | 視覺＋文字鐵律 |
| `AI-PROMPT-PACK.md` | AI 出圖提示詞（水墨專用） |
| `art-bible.md` | 實作摘要（指向 STYLE-BIBLE） |
| `tokens-colors.json` | 色票 |
| `tokens-typography.json` | 字級 |
| `../ux/css-motions.md` | 動效片段 |

## AI 水墨包 `public/ink/ai/`（WebP）

程式目錄：`src/ui/inkAiCatalog.ts`（`inkAiUrl` / `pickAiEventBanner` / `INK_AI_ASSETS`）

### 底圖 `backdrops/`

| 檔名 | 說明 |
|------|------|
| `backdrop-title-scroll.webp` | 開卷遠山（已接首屏洗底） |
| `backdrop-night-mountains.webp` | 夜山松煙 |

### 事件橫幅 `banners/`

| 檔名 | 觸發意象（見 `pickAiEventBanner`） |
|------|-----------------------------------|
| `banner-bridge-mist.webp` | 橋／路遇／奇遇 |
| `banner-rain-inn.webp` | 雨／夜／客棧／酒 |
| `banner-sect-gate.webp` | 門派／拜師 |
| `banner-bamboo-practice.webp` | 習武／竹林 |
| `banner-sword-road.webp` | 戰鬥／兵刃 |
| `banner-courtyard.webp` | 家庭 |
| `banner-lonely-boat.webp` | 遠行／漂泊 |
| `banner-legacy-stele.webp` | 傳承／老年／死亡 |
| `banner-bond-plum.webp` | 結緣／戀愛 |
| `banner-market.webp` | 買賣／經濟 |

### 母題 `motifs/` · 印章 `seals/`

劍、傘、玉、酒旗、燈籠、卷軸、山門 · `seal-cinnabar-fate.webp`

說明見 `public/ink/ai/README.md`。

## SVG · 裝飾 `public/ink/decor/`

| 檔名 | 說明 |
|------|------|
| `mountains-wide.svg` | 日間遠山底 |
| `ink-blots.svg` | 墨漬 |
| `bamboo-corner.svg` | 竹角飾 |
| `boat-mist.svg` | 孤舟煙波 |
| `event-banner-rain-inn.svg` | 夜雨投店橫幅 |
| `event-banner-bridge.svg` | 橋上有人橫幅 |

## SVG · 圖示 `public/ink/icons/`

劍、傘、酒旗、玉佩、石橋、卷軸、燈籠、山門、`stages-strip.svg`（十階意象條）

## SVG · 框線 `public/ink/frames/`

`scroll-frame.svg` · `title-slip.svg` · `ink-fade-line.svg` · `brush-stroke.svg`

## 程式接線

- 路徑助手：`src/ui/inkAssets.ts`（`inkUrl` / SVG `pickEventBanner`）
- AI 目錄：`src/ui/inkAiCatalog.ts`（玩法橫幅優先用 AI WebP）
- 遠山底：`InkScrollBackdrop`（`InkDecor.tsx`）；首屏另疊 `InkAiWashLayer`
- 開卷題簽：`InkStartScreen.tsx`
- 事件橫幅：`InkPlayScreen` + `InkEventBanner`（`src` 或 SVG `markup`）
