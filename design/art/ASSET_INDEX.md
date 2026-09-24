# 素材索引

本倉庫落地路徑以 `public/ink/`（執行時）、`assets/art-source/`（只作腳本來源，唔部署）與 `design/art/` 為準。風格鐵律見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)。

## 文件

| 檔案 | 用途 |
|------|------|
| `STYLE-BIBLE.md` | 視覺＋文字鐵律 |
| `AI-PROMPT-PACK.md` | AI 出圖提示詞（水墨專用） |
| `art-bible.md` | 實作摘要（指向 STYLE-BIBLE） |
| `tokens-colors.json` | 色票 |
| `tokens-typography.json` | 字級 |
| `../ux/css-motions.md` | 動效片段 |

## AI 水墨包 `public/ink/ai/`（WebP · 玩法優先）

程式目錄：`src/ui/inkAiCatalog.ts`（`inkAiUrl` / `pickAiEventBanner` / `INK_AI_ASSETS`）

### 底圖 `backdrops/`

| 檔名 | 說明 |
|------|------|
| `backdrop-title-night.webp` | 開卷夜嶺雙閣（首屏） |
| `backdrop-play-main.webp` | 主畫面江上孤舟 |
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

## 來源圖 `assets/art-source/`（唔部署）

| 路徑 | 用途 |
|------|------|
| `hero-v3/hero-v3-{sect}-full.webp` | 十派主角立繪 → `build_silhouettes.py` 生成人物誌剪影 |

## 位圖 · 朱砂印／氣場／筆觸 `public/ink/art/`

由 `scripts/art/build_ink_stamps.py` 產生（霞鶩文楷 TC Bold，OFL；固定種子可重跑）。取代舊手繪 SVG。

| 資料夾 | 檔案 | 用途 |
|--------|------|------|
| `seals/` | `seal-sheng`（生，朱文）· `seal-zhong`（終，白文）· `seal-yuan`（緣，朱文）· `seal-jianghu`（江湖，白文雙字） | 開卷／掩卷／命運落印 |
| `seals/` | `seal-zhao`（招）· `seal-sheng-win`（勝）· `seal-ming`（命，朱文）· `seal-wei`（危） | 戰鬥：連招、得勝、命懸、危 |
| `auras/` | `aura-guixi`（龜·青）· `aura-huxiao`（虎·朱）· `aura-hexian`（鶴·墨）· `aura-shepan`（蛇·金） | 內功模式呼吸氣場 |
| `strokes/` | `stroke-guard`（守）· `stroke-dodge`（遁） | 招式按鈕筆觸 |

## 位圖 · 水墨 UI `public/ink/art/ui/`

由 `scripts/art/build_ink_ui.py` 產生（毛筆刷毛模擬，固定種子）。UI 一律不用 SVG；AI 出圖可同名同尺寸直接替換。

| 檔案 | 用途 | 用法 |
|------|------|------|
| `brush-bar` / `brush-bar-rail` | 氣血、內力、五維、威望、首領血條 | `InkBrushBar`：mask + 染色，`--pct` 羽化前緣，入場落筆動畫 |
| `brush-ring` / `brush-ring-rail` | 修為環 | `InkBrushRing`：mask ∩ conic 扇形，自 12 點順時針寫出 |
| `ink-halo-a` / `ink-halo-b` | 過一月鈕外圈殘墨 | 兩層反向慢轉 |
| `corner-bracket` | 人物誌四角 | clip-path 自角點寫出 |
| `nature-grid` / `nature-wash` / `ink-dot` | 心性四象圖 | clip-path 多邊形 + 由中心暈開 |
| `slash-stroke` | 首領現身一斬 | CSS 旋轉 + clip-path 劃出 |
| `paper-grain` | 全域／彈窗紙紋 | 平鋪背景（取代 SVG feTurbulence data URI） |

## 位圖 · 剪影（C 款）`public/ink/art/sil/`

由 `scripts/art/build_silhouettes.py` 產生：純墨剪影＋乾筆描邊＋一筆朱砂。出圖要求見 [`SILHOUETTE-PROMPTS.md`](./SILHOUETTE-PROMPTS.md)。

| 檔案 | 描邊 | 朱砂 | 用喺 |
|------|------|------|------|
| `hero-{sect}`（10 派） | 門派色 | 頭帶一筆 | 人物誌橫幅 |
| `boss-{key}`（daoke／gouke／nvcike／toutuo／tiemian，1400px） | 朱砂 | 描邊 | 首領現身（月下剪影） |

門派色：武當 `#3D5C4F`、少林 `#8A7355`、峨嵋 `#8A93A0`、華山 `#44607A`、唐門 `#4F5B3A`、桃花 `#B07A78`、青雲 `#5E7F8C`、天刀 `#5A5650`、魔教 `#5A3E48`、無根 `#8A8278`。
名 → 剪影對應：`src/ui/inkSilhouettes.ts`。切磋小窗仍用 `public/ink/spar/sil/`（刻意保留）。戰鬥畫面不放剪影。

## 已退役 SVG

`public/ink/{decor,seals,icons,frames}/*.svg`、`gear-*.svg`、`encounter-hermit.svg`、`event-bridge.svg`、`ui-header.svg` 已全數移除（原 `assets/ink-pack/` SVG 參考包亦已刪）。遊戲內容美術一律位圖，見 `.claude/rules/no-svg-game-art.md`。

## 程式接線

- AI 目錄：`src/ui/inkAiCatalog.ts`（玩法橫幅／首屏／命運印優先用 WebP）
- 位圖助手：`src/ui/inkAssets.ts`（`sealUrlForText` / `auraUrlForInternalModeId` / `strokeUrl`）
- 遠山底：`InkScrollBackdrop` + 可選 `InkAiWashLayer`
- 開卷／掩卷朱砂印：`InkStaticSeal`
- 命運落印動畫：`InkSealStamp`
- 事件橫幅：`InkPlayScreen` + `InkEventBanner`（`src` WebP 或 SVG `markup`）
