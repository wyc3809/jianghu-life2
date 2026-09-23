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

## 位圖 · 朱砂印／氣場／筆觸 `public/ink/art/`

由 `scripts/art/build_ink_stamps.py` 產生（霞鶩文楷 TC Bold，OFL；固定種子可重跑）。取代舊手繪 SVG。

| 資料夾 | 檔案 | 用途 |
|--------|------|------|
| `seals/` | `seal-sheng`（生，朱文）· `seal-zhong`（終，白文）· `seal-yuan`（緣，朱文）· `seal-jianghu`（江湖，白文雙字） | 開卷／掩卷／命運落印 |
| `seals/` | `seal-zhao`（招）· `seal-sheng-win`（勝）· `seal-ming`（命，朱文）· `seal-wei`（危） | 戰鬥：連招、得勝、命懸、危 |
| `auras/` | `aura-guixi`（龜·青）· `aura-huxiao`（虎·朱）· `aura-hexian`（鶴·墨）· `aura-shepan`（蛇·金） | 內功模式呼吸氣場 |
| `strokes/` | `stroke-guard`（守）· `stroke-dodge`（遁） | 招式按鈕筆觸 |

## 已退役 SVG

`public/ink/{decor,seals,icons,frames}/*.svg`、`gear-*.svg`、`encounter-hermit.svg`、`event-bridge.svg`、`ui-header.svg` 已自 `public/` 移除（原始檔仍在 `assets/ink-pack/` 作參考）。遊戲內容美術一律位圖，見 `.claude/rules/no-svg-game-art.md`。

## 程式接線

- AI 目錄：`src/ui/inkAiCatalog.ts`（玩法橫幅／首屏／命運印優先用 WebP）
- 位圖助手：`src/ui/inkAssets.ts`（`sealUrlForText` / `auraUrlForInternalModeId` / `strokeUrl`）
- 遠山底：`InkScrollBackdrop` + 可選 `InkAiWashLayer`
- 開卷／掩卷朱砂印：`InkStaticSeal`
- 命運落印動畫：`InkSealStamp`
- 事件橫幅：`InkPlayScreen` + `InkEventBanner`（`src` WebP 或 SVG `markup`）
