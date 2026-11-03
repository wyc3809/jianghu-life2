# 正式人物：連續頭頸與共用動作

2026-11-03。玩家已接受v02近鏡並明確授權「套用哂再上線，以後用呢個標準」。目標發布EA0.101.0；此文件取代PROJECT.md原型時期「v02待評閱」的狀態。v01與更早的原型仍是被否決歷史。

## 固定標準

1. 頭、頸、上胸是同一張連續材質及同一網格。正常轉頭保留，不靠獨立頭部逐幀追蹤、補頸片、鎖頭或大衣領遮錯位。
2. 全部造型共用18骨節與父子鏈，基準身高1533設計單位。只整體縮放；角色轉向只在根變換處做一次。
3. 不按每幀透明包圍盒fit人物。裁透明邊時必須保留原點；腳底、握點、接觸及角色倍率讀同一幀資料。
4. 動作只呈現既有事件：蓄勢→接觸→收束對齊既有命中點。素材、跳過、重播及動畫失效不重新產生戰果、扣費或發獎。
5. 頭／衣著／配色ID保持原存檔選擇。不能為方便把全部玩家或首領換同一張臉。
6. 新角色須檢查原圖、權重、最終有損圖集及實際App，不能只以骨長正常或測試通過代替畫面判斷。

## 接入方式

正式入口是`src/appearance/model.ts`的共用`drawAppearance`。人物立繪、頭像、衣櫥、演武主角、事件交手、華山與非同步江湖一對一的造型快照都使用同一輸出。保留的Three適配器亦取此輸出，不另拼頭身；其舊演出並未擴展為新的主流程。NPC既有整幅身份圖保留，沒有拿玩家臉取代首領。

正式手機畫面不建立每角色WebGL context，不即時逐三角形求解。由官方Spine 4.2.120 Runtime離線輸出99幀／造型：待機24、出拳30、受擊16、行走16、倒地12、盤坐1。骨架、關鍵幀與網格JSON仍保留，日後可以繼續編輯及擴充。初始三段動作及骨架與已接受v02一致；新增走路／倒地／盤坐亦用同一骨架，沒有改戰鬥規則或恢復自由剛體布娃娃。

`spine/frames.ts`只讀既有演出時間；多段編排用真命中事件切分蓄勢及收招，敵方撲擊讀真正lunge時鐘，受擊讀hit時鐘。沒有新增角色RAF／物理時鐘或戰鬥提交者。原有真核心與一次提交守門保持。

圖集只裁透明邊並重排；`rects`保存來源區與原畫布位置，`bounds`只供靜態立繪fit，戰鬥仍固定身高。兵器綁到同幀真正手骨握點，握拳局部用同一整體幀作前景遮擋，不增加一隻獨立手。徒手／指法不憑空顯示劍。減少動態取固定姿勢；失圖取同身份整體後備，盤坐有對應後備，不能重抽身份或改遊戲資料。

圖集及靜態有界LRU最多4項，調色只在載入時做，正常每幀不讀像素或重新調色。普通構建不包含Spine審閱頁完整HTML及其Runtime。檔案總量不等於首屏載入量：圖集與立繪按造型載入；舊素材保留作歷史／適配用途，不代表全部已重新製作。

## 素材及重建

- 保留的已接受連續原圖：`sources/upper-body-v02.png`。topknot／traveller直接沿用這張，沒有用新分件覆蓋。
- 新八頭三衣上身：`sources/sheet-traveller.png`、`sheet-scholar.png`、`sheet-cloak.png`。每件均從頭到腰連續繪製，並非程式填頸或拼接舊頭。原圖／生成識別／hash在`production/source-manifest.json`，提示在`prompts/production-skins.txt`，生成參照拼圖在`sources/reference-wardrobe.png`。
- `build_spine_production.py`按固定格位、頸腰指引等比放置整件上身。只以真alpha選近指引的連通頸柱；不拉長頭、不補畫缺口、不放寬200透明門檻。六個加權網格與權重由同一資料生成。
- `production/character.json`與`editor-parts/`提供可匯入圖片路徑；24件連續上身及對位保留。尚未在原生Spine Editor完成儲存／重開／匯出，不把JSON當作已驗收的原生`.spine`專案。
- 原創生成資產沿適用生成服務條款使用，沒有宣稱CC0。玩家已確認skill商用及Spine編輯器授權；Runtime原授權隨審閱頁及公開圖集保留，不重新索取密鑰。

在有固定4.2.120審閱Runtime、Python Pillow／numpy／Playwright與Chromium的環境，從repo根目錄執行：

```bash
python scripts/art/build_spine_production.py
python -m http.server 5280 --bind 127.0.0.1
# 另一個終端：
python scripts/art/bake_spine_production.py
python scripts/art/finalize_spine_catalog.py
```

中間圖集只寫`.local-online/spine-rollout/atlases/`；正式WebP與高解像靜態在`public/ink/art/spine-character/`。最後的來源映射在`src/appearance/spine/catalog.json`。不在遊戲執行Python或連接生成服務。

## 實測與邊界

詳見`production/qa/evidence/redesign/spine-rollout/README.md`。本輪統一接駁與基礎動作；各兵器的獨立招式、雙手持握及自由物理反應沒有一概算作完成。程式、最終位圖及瀏覽器驗證通過，不將此說成真iPhone穩定60fps。原生編輯器回合、真機溫度／耗電／長跑及TestFlight新build仍須分開驗收。此輪沒有重啟幫會戰／門派戰、PR #156、配對或獎勵開發。
