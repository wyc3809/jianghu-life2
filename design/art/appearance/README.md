# 共用人物造型素材

第58項原創模組素材，供建立角色、衣櫥、HUD、人物盤坐、演武、自動交手、華山與非同步多人快照共用。八款頭部、三種衣服剪裁、四種布色；只保存三個代號，不接受玩家任意圖片網址。不收費，不改裝備或能力。

` sources/ ` 保留本輪生成工具輸出的原始PNG與真正透明通道；沒有下載第三方人物素材，沒有水印或圖中文字。製作提示的可重製美術規格見 `prompts/production-spec.md`。生成資產由本專案使用，未自行宣告CC0或第三方授權；工具的使用條款適用。工具輸出原檔對應：

| 原圖 | 輸出檔識別 | 用途 |
|---|---|---|
| heads-original.png | exec-f57bca8f-4c53-4430-85eb-8fe873d87591.png | 六個有效頭部（前兩格越界，棄用） |
| traveller-original.png | exec-991ca151-9712-42e1-8c6c-425e77603588.png | 單獨斗笠頭部 |
| ponytail-original.png | exec-8be025ec-c51a-4ca5-9197-5505b7953237.png | 單獨束髮男性頭部 |
| outfits-original.png | exec-87c826c5-fc37-4d9f-8a1f-b94cf7051e9e.png | 三套六組關節部件 |
| seated-original.png | exec-84263013-e295-4b5e-a75c-1e2d0f98c810.png | 三套盤腿下半身 |

執行 `python3 scripts/art/build_appearance.py`，裁切、清透明邊、輸出29張WebP與同圖縮小後備，更新 `src/appearance/asset-map.json`、`asset-fallback.json`、`alpha-validation.json`。原圖不覆寫。短髮頭部裁除上格越界白髮；後備使用相同原圖，避免缺圖換臉。兵器沿用既有 `public/ink/spar/weapon-*.webp`，牌章與框沿用既有宣紙UI及素材來源紀錄。

`src/appearance/model.ts` 使用同一套位圖關節與固定身高。藍布區按明度改色，保留膚色、皮革及墨線；調色結果快取，不逐幀讀取像素。走、攻、受擊、倒地只改關節，盤坐使用真正交叉腿部件。資料只供顯示；新戰報保存外觀快照，重播不讀衣櫥的新選擇。

## EA0.99.1 肢體修正

EA0.99.0獨立部件合成已停用：軀幹原圖包含袖臂，疊畫會出現重複與錯接，盤坐亦會與站姿軀幹不匹配。舊來源保留供追溯，執行繪圖只載入八款頭部與每套八格完整身體。

新原始來源 `sources/poses-{traveller,scholar,cloak}-original.png` 分別對應生成輸出 `exec-7e87ecd8-6c93-4d2e-9262-e42457d5f34d.png`、`exec-cc86f168-adb3-4129-b8e7-f61bb72dc9e5.png`、`exec-55f5623a-d19e-4773-82a0-46196d226f48.png`。逐字製作提示在 `prompts/connected-*.txt`，工具原始檔完整保留，未冒認第三方素材或CC0。

執行 `python3 scripts/art/build_appearance_poses.py`：以連通區分離完整姿勢，裁切不截斷手腳；輸出24張WebP、`pose-layout.json`原圖頸位／腳底／握點與固定倍率、`pose-validation.json`及同姿勢縮小後備。更新舊頭部來源時，原 `build_appearance.py` 會在最後接續此程序，避免丟失新映射。執行依賴為Pillow與numpy。

`model.ts` 每次只畫一張完整身體、一個所選頭部及相應兵器；不再畫任何獨立上臂、前臂或腿。調色只變藍布，不改人體幾何，身體快取有96格上限（完整三套四配色八姿勢）；Three合成幀36格上限。

人物頁盤坐另使用高解像完整來源 `sources/poses-seated-original.png`（輸出 `exec-dea2cbe7-a11b-456f-9392-1c76213f8ed3.png`，提示 `prompts/connected-seated.txt`）；處理器以固定來源密度對齊原本盤坐比例，不按動畫逐格縮放。頭部最後繪畫，頸位落在實際領口內，避免衣領蓋過頸部。

## EA0.99.2 頭頸接位

`sources/neck-bridge-original.png` 對應原始輸出 `exec-c24d6818-e182-41f2-9c30-7e09dd523f0d.png`；逐字提示 `prompts/neck-bridge.txt`。生成參考為八款既有頭像及EA0.99.1實際接位放大圖，均屬本專案。此素材沿用上述工具使用條款，未宣告CC0。執行 `python scripts/art/build_appearance_neck.py` 清除透明邊異色、裁切有效通道並輸出512px以內WebP與同圖128px後備；完整姿勢重建器亦會接續執行，保留映射。

`src/appearance/neck.ts` 將真頸部材質按原頭像膚色調色，裁進原衣領的內緣；只柔化頸底膚色及衣領遮擋區。面孔、下顎與長髮保留原像素，不使用矩形衣領重疊裁斷頭髮。頭部處理最多24款、頸部配色最多8款，皆按資產物件WeakMap保存，不在熱幀讀像素。缺圖仍用同一透明材質，原本96個衣著姿勢與36張Three合成幀快取上限不變。
