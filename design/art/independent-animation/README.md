# 第60f項 · 所選造型的逐門動作

玩家已選「保留」：八款面孔、三套衣著及四色照原存檔使用。103門武學各自有起手、接觸、收勢的明確姿勢序列；共用基本人體語彙，但不能用速度、色調或粒子當作新增動作。七卷按真核心順序播放該門動作，沒有假稱製作了721套招式。

## 真來源與授權

`sources/`保留生成原圖，`prompts/`保留逐項提示，`materials.json`記錄裁切範圍、人工關節指引、握點、圖像hash及來源。來源是本輪原創生成位圖，使用依生成服務適用條款，不宣稱CC0。連續頭／頸／上胸沿用`design/art/spine-character/production/upper-{head}-{outfit}.png`，不重新拼頭；其母版及處理沿用原項目記錄。

玩家已確認持有Spine Animation AI商用授權及Spine Editor授權。離線出幀使用項目既有固定版本的官方Spine Runtime 4.2.120；沒有把商用授權假稱為開源。正式App只讀位圖及同幀定位，不新增WebGL播放器或另起角色RAF。

武器原圖中左下格錯生成短刃，已拒絕，不當細針用；細針另有完整原圖。另一項弓箭出圖沒有得到素材，提示保留作失敗紀錄。弓沿用既有位圖，技術分離弓身、弦及箭；沒有宣稱產生新弓原畫。隱藏RGB的紅／黃技術底只在透明像素，處理將alpha低於30歸零並清RGB，原圖不改。

## 骨架及素材

同一20骨父子樹：根→髖→軀幹→胸→頸→頭，左右臂與腿各自固定骨長。衣擺另有受限次級骨。手形有拳、掌、指、捏、持握、拉弦、簫及棋子；袖口在手腕上層，肩／髖有原畫重疊。

`rig/`是可審查的Spine綁定及共用動畫；`motions.json`是103門明確姿勢編排；`compiled-clips.json`含真時計、採樣、手勢及持握意圖。正常動作是受控關鍵幀／兩節IK，沒有自由鬆散物理。雙手持武用真掌心握點閉合，刀桿方向與手腕角分開，不把副手拉長去追武器。角度越界或無共同可達位置會使編譯失敗。

## 可重做流程

在repo根目錄運行（Pillow、numpy、Playwright Chromium已安裝）：

```bash
python scripts/art/build_independent_rigs.py
python scripts/art/author_independent_motions.py
npx vite-node scripts/qa/exportIndependentClocks.mts
python scripts/art/compile_independent_motions.py
python scripts/art/build_independent_props.py
python -m http.server 5293 --bind 127.0.0.1
```

另開終端：

```bash
python scripts/art/bake_independent_motions.py
python scripts/art/finalize_independent_motions.py
```

烘焙支援`--outfits traveller`、`--only art_river_fist`及`--resume`；快取核對綁定與單段動畫hash。單改一段不應當重用舊圖。完整body每衣131段（103門＋28生命週期），頭部每衣8張，各有−6至+6度連續頸面預設。

## 手機呈現

離線固定設計身高1533、密度0.125，原點[192,272]。裁透明邊保留原點，不按姿勢包圍盒重新縮放。上身、手腳、衣擺、持武讀同一採樣；預合成整體後一次繪製。倒地按真alpha落地，沒有另一個頭部時計。

素材按當前戰報／已裝備武學載入。Body快取最多32段及24M像素，連續上身最多4個造型，整體幀最多96張。弓弦讀同幀副手；柔鞭沿固定鏈長位圖曲線播放；機關讀同幀腕點。缺圖退回同身份舊完整姿勢，不換黑袍、重抽結果或阻擋跳過。

## 狀態

本目錄是製作來源，不代表已獲玩家接受或真iPhone驗收。實際播放、手機尺寸、前後對照、CPU／記憶體及發布狀態另見`production/qa/evidence/redesign/independent-animations/README.md`。幫會／門派戰及PR #156仍暫停。
