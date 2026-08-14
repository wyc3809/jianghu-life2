# 素材索引

本倉庫落地路徑以 `public/ink/`（執行時）、`assets/ink-pack/`（可攜 SVG／文檔包）與 `design/art/` 為準。風格鐵律見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)。

## 文件

| 檔案 | 用途 |
|------|------|
| `STYLE-BIBLE.md` | 視覺＋文字鐵律 |
| `AI-PROMPT-PACK.md` | AI 出圖提示詞（水墨專用） |
| `art-bible.md` | 實作摘要（指向 STYLE-BIBLE） |
| `ink-pack-pointer.md` | 指向可攜素材包 |
| `tokens-colors.json` | 色票 |
| `tokens-typography.json` | 字級 |
| `../ux/css-motions.md` | 動效片段 |

## AI 水墨包 `public/ink/ai/`（WebP · 玩法優先）

程式目錄：`src/ui/inkAiCatalog.ts`（`inkAiUrl` / `pickAiEventBanner` / `INK_AI_ASSETS`）

### 底圖 `backdrops/`

| 檔名 | 說明 |
|------|------|
| `backdrop-title-scroll.webp` | 開卷遠山（已接首屏洗底） |
| `backdrop-night-mountains.webp` | 夜山松煙（夜雨／奇遇／傳承） |
| `backdrop-town-scroll.webp` | 鎮居主景（遠山、石橋、千燈鎮） |
| `backdrop-result-mist.webp` | 結果匣霧嶺淡墨底 |

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
| `banner-mountain-road.webp` | 一般路遇／故人／通用事件 |

### 母題 `motifs/` · 印章 `seals/`

劍、傘、玉、酒旗、燈籠、卷軸、山門 · `seal-cinnabar-fate.webp`

說明見 `public/ink/ai/README.md`。

## 可攜 SVG 包 `assets/ink-pack/`

完整 STYLE／writing／prompts／svg（含印章與夜山）。執行時已同步至 `public/ink/`；見 [`ink-pack-pointer.md`](./ink-pack-pointer.md)。

## SVG · 裝飾 `public/ink/decor/`

| 檔名 | 說明 |
|------|------|
| `mountains-wide.svg` | 日間遠山底 |
| `mountains-night.svg` | 夜雨遠山（SVG 備援） |
| `ink-blots.svg` | 墨漬 |
| `bamboo-corner.svg` | 竹角飾 |
| `boat-mist.svg` | 孤舟煙波 |
| `event-banner-rain-inn.svg` | 夜雨投店橫幅（AI 無匹配時備援） |
| `event-banner-bridge.svg` | 橋上有人橫幅（備援） |

## SVG · 印章 `public/ink/seals/`

`seal-sheng.svg`（生）· `seal-zhong.svg`（終）· `seal-yuan.svg`（緣）· `seal-jianghu.svg`（江湖）

## SVG · 圖示 `public/ink/icons/`

劍、傘、酒旗、玉佩、石橋、卷軸、燈籠、山門、`stages-strip.svg`（十階意象條）

## SVG · 框線 `public/ink/frames/`

`scroll-frame.svg` · `title-slip.svg` · `ink-fade-line.svg` · `brush-stroke.svg`

## 遊戲專用

`public/ink/gear-*.svg`、`encounter-hermit.svg`、`event-bridge.svg`、`ui-header.svg`

## 程式接線

- AI 目錄：`src/ui/inkAiCatalog.ts`（玩法橫幅／首屏／命運印優先用 WebP）
- SVG 助手：`src/ui/inkAssets.ts`（`INK_SVG` / `pickEventBanner` / `sealSvgForText`）
- 遠山底：`InkScrollBackdrop` + 可選 `InkAiWashLayer`
- 開卷／掩卷朱砂印：`InkStaticSeal`
- 命運落印動畫：`InkSealStamp`
- 事件橫幅：`InkPlayScreen` + `InkEventBanner`（`src` WebP 或 SVG `markup`）
