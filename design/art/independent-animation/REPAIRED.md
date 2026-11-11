# 第60h項 · 已接受自然比例的全量動作

2026-11-10，目標EA0.103.0。玩家在短拳v03正常／慢鏡評閱後回覆「Ok 做哂其他全部」，授權完成其餘動作、103門武學及八頭三衣四色；正式發布仍需實際檢查，唔把數量或骨長當作人體合格。

## 來源及範圍

自然比例、十八骨、旅裝袖形及下身取自`../character-bind-review/punch-v03/`與已接受`upright-v02`；其他面孔、衣著及手形沿既有原圖。頭／頸／胸保持連續材質。腿及鞋沿完整母版人工選區，唔再按舊鞋尖指引旋轉鞋底；腰帶與衣襬由同一來源接住，外袍保持原衣著剪裁。八個造型ID、三衣、四色與存檔不遷移。

103門原有逐門編排與19類兵器保留，唔把同一短拳複製成103份。待機／行走／受擊各八種持武分組，三種基本攻擊與倒地，共28段生命週期；每衣131段。七卷仍按真順序播放該門，唔宣稱721套新動作。

`materials.json`記錄來源hash、真手形連通島、截面及逐衣掌心點。舊等分格將1246×1263來源當作規則格，會帶入下一個手腕；修正版以16個獨立alpha島保留完整手形。原始失敗綁定另存`../character-bind-review/rejected-baseline.json`，供回歸重現，唔因新綁定已修正就刪除負例。

## 製作規則

每頂點先決定唯一世界綁定點，再對所有影響骨取逆矩陣。禁止各骨獨立縮放頂點；骨長正常並唔足以攔截舊問題。自然十八骨完全保留，衣擺另有兩個次級骨。

手臂材質用真肩／肘／腕截面，同一材質面保持連續；袖根沿原畫，肘至腕以C1曲線及曲率受限內褶作標準Spine deform。腕面與原拳頭共用修形，其他手形沿同一腕骨；唔用伸長骨、鎖死頭或額外補頸掩蓋問題。旅裝抬袖仍用v03同拓撲補畫，底層保持實心。兩種材質唔各自淡入淡出成兩隻手。

倒地只以有真alpha的材質頂點量地面，唔以透明腿圖四角估算落地。畫面最後仍按完整人物真alpha落地，固定身高及原點，不逐幀fit包圍盒。

正式App只讀位圖與同幀握點，唔載入Spine Runtime或deform來源。圖集JSON要求HTTP重新驗證，位圖網址用實際sha256分開快取，避免更新後讀新座標但沿用舊圖。缺圖後備仍保留同身份，唔重抽戰果或派獎。

## 重做流程

需repo既有Pillow、numpy、scipy、Playwright Chromium及npm依賴。官方Runtime4.2.120與既有授權保留；玩家已確認商用及編輯器授權。

```bash
python3 scripts/art/build_repaired_martial_rigs.py
python3 scripts/art/compile_independent_motions.py --repaired
python3 scripts/art/compile_repaired_surfaces.py
python3 -m http.server 5293 --bind 127.0.0.1
```

另開終端：

```bash
python3 scripts/art/bake_independent_motions.py --resume
python3 scripts/art/finalize_independent_motions.py
node scripts/qa/auditRepairedSurfaces.mjs
python3 scripts/qa/auditIndependentMotionArtifacts.py
```

逐衣動畫來源以確定mtime的`rig/animations-{outfit}.json.gz`保存，原始大JSON及逐段工作檔放`.local-online/`；gzip只壓縮資料，唔參與手機播放器。烘焙逐門載入，唔一次在瀏覽器解析全目錄材質修形；四個繪圖層同次GPU回讀後分格，仍由產品呈現器合成整體。

`--only`、`--outfits`及`--resume`可接續；快取核對綁定、動畫、烘焙規則及圖像hash。修改來源後先重建與編譯，唔拿舊快取冒充新輸出。

完整產品、兩引擎手機、減少動態、缺圖、前後圖與正常速度證據見`production/qa/evidence/redesign/character-bind-rollout/`。真iPhone、耗電、熱穩定、原生編輯器儲存重開及新TestFlight係獨立驗收，唔以Linux瀏覽器冒充。幫會／門派戰繼續暫停；核心戰鬥、耗內回內、經濟、裝備及存檔不變。
