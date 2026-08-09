# AI 出圖提示詞包 — 江湖一生水墨

> 最適合本專案風格的方向：**中國傳統水墨／手卷感插畫模型**（例如以 ink wash、sumi-e、宣紙為強約束的圖像模型）。  
> 不要用「通用奇幻／賽博霓虹」提示詞。硬約束見 [`STYLE-BIBLE.md`](./STYLE-BIBLE.md)。

## 通用前綴（每次都加）

```
Traditional Chinese ink wash painting (水墨画 / sumi-e), scholarly handscroll aesthetic,
rice paper background color #F3EBDC, diluted black ink washes, vast negative space (留白),
even paper lighting, no dramatic shadows, no glow, no neon, no purple gradients,
no photorealism, no western fantasy armor, no emoji, sparse brush strokes, minimal detail
```

## 通用後綴

```
Suitable as mobile text-game UI art. Do not fill the frame with detail.
Keep upper area mostly empty paper for Chinese text overlay.
```

## 橫幅（16:9）

| 主題 | 主體提示（接在前綴後） |
|------|------------------------|
| 霧橋 | stone bridge over misty river, pale mountains in lower third |
| 夜雨客棧 | roadside inn silhouette, wine shop banner, soft rain strokes, pine-smoke dark ink |
| 山門 | mountain sect gate among misty pines |
| 竹林 | sparse bamboo grove, mist between stalks |
| 劍路 | sheathed sword by a stone path in mist (no gore) |
| 庭院 | quiet courtyard tiled roof silhouette and pine |
| 孤舟 | tiny boat on misty river |
| 殘碑 | faded memorial stele among mist and pine |
| 梅緣 | twin plum blossom branches in mist (no faces, no heart icons) |
| 市井 | sparse street stall silhouettes and hanging cloth banners |

## 方印母題（1:1）

單一物象置中、大量留白：劍 · 傘 · 玉佩（可極淡 `#3D5C4F`）· 酒旗 · 燈籠 · 卷軸 · 山門

## 底圖（9:16）

- 開卷：下半淡墨遠山＋可選孤舟，上半 55% 留白
- 夜山：松煙青 `#2A3530` 遠山，仍留白給 UI

## 朱砂印（1:1）

```
Traditional square Chinese cinnabar seal stamp impression,
deep red #A33A32 on aged rice paper #F3EBDC, weathered edges,
abstract seal pattern for destiny/fate UI stamp, no glow
```

## 落地規格

1. 產出後縮放：橫幅寬 ≈960、母題 320、底圖寬 ≈720、印 256  
2. 轉 WebP（quality ≈78），放入 `public/ink/ai/{banners|motifs|backdrops|seals}/`  
3. 在 `src/ui/inkAiCatalog.ts` 的 `INK_AI_ASSETS` 加一筆  
4. 更新 `ASSET_INDEX.md`
