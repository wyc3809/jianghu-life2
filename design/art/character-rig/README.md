# 單角色骨架位圖素材

階段二內測原型，未替換主線人物。沿現有淺色水墨武俠方向；八款頭部沿用 `src/appearance/asset-map.json`。新三套衣料只供真骨架角色，沒有把原本含手臂的舊torso再疊另一對手。

## 原圖及使用映射

| 原始來源 | 工具輸出識別 | 使用狀態 |
|---|---|---|
| traveller-original.png | exec-021201b5-6cdb-4de4-8598-97d558e1a019.png | 第一輪十件部件；保留追溯，圓形關節面已修訂 |
| scholar-original.png | exec-abcc42c9-e24d-41c5-87b3-e4dee06ee2c2.png | 同上，長衫變體 |
| cloak-original.png | exec-a68e6c5b-c43f-4209-b59a-ca7e2b4beb66.png | 同上，披風變體 |
| traveller-natural.png | exec-9a2e5a13-73a5-4992-a4ff-5793e0d4931f.png | 俠客勁裝正式原型來源 |
| scholar-natural.png | exec-1db2573c-758c-4b24-a5cd-308ffb9c5aec.png | 江湖長衫正式原型來源 |
| cloak-natural.png | exec-da2ea8db-63f2-4d33-870c-c7176385fad0.png | 行旅披風部件，torso另用下行修訂 |
| cloak-compact-torso.png | exec-01fd025f-1dc9-4b67-865e-c209066560f0.png | 只取torso，收短肩羽，避免橫躺時穿地；其餘部件仍取natural版本 |
| hips-original.png | exec-af41d38b-6f7e-4c46-9603-19e6810e3505.png | 三套短腰帶／髖布；不用第一輪過長裙擺遮住腿 |

以上原圖完整保留RGBA及來源，沒有覆寫工具輸出。原創生成資產適用工具使用條款，沒有冒認第三方素材或自行宣告CC0。頭部、兵器、字體及紙框沿用既有來源／授權；未新增付費runtime或編輯器。

## 處理方式

`python3 scripts/art/build_character_rig.py`：按已記錄分區裁切，取主要alpha連通件，去除鄰格碎片／透明邊暈，輸出30張高解像WebP、同件縮圖後備、素材映射及SHA-256。後備另包括四類既有兵器。原檔不動，不重畫臉或肢體。

每套包括torso、pelvis、upperArm、forearm、thigh、shin、foot、neck、handOpen、handGrip。腕點／骨軸在腳本人工標定；每件只按固定骨長及原圖軸線裝配，沒有每幀以透明包圍盒重新fit人物。袖寬是固定的橫向衣料比例，骨端點仍落在同一軸線。

左右肢體重用同套同向部件，前後遮擋由角色slot順序處理；正式人物由位圖繪製，骨線只在內測除錯開關顯示。膚色按既有頭部頸底取色，保留臉、鬍鬚及髮絲；布色只改可識別藍灰衣料，皮革與金屬不整塊染色。

輸出：`public/ink/art/character-rig/`、`src/fx/actor/asset-map.json`／`asset-fallback.json`、`asset-validation.json`。製作提示及修訂指示在 `prompts/`。原型驗收紀錄在 `production/qa/evidence/redesign/character-rig-prototype/`。
