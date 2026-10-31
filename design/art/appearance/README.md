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
