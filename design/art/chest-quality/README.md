# 寶箱原創水彩材質

2026-10-24以本次圖像生成工具原創製作四格材質圖，用於現有可旋轉／翻蓋的3D寶箱，不以靜圖取代結構動作。沒有使用第三方素材或參考人物。素材供本專案使用，相關權利依生成服務適用條款；不宣稱第三方開源授權。原圖無文字、水印或假透明。

- 原始輸出：`material-atlas-original.png`，1254×1254 RGB，未修改生成原圖；原始工作目錄檔亦保留。
- 固定處理：`scripts/art/prepare_chest_materials.py`，四象限各裁627×627後以Lanczos轉512×512 WebP，quality92。只裁切及轉檔，不重繪素材。
- 映射／hash：`materials.json`。左上木紋→wood.webp、右上中性雲紋金屬→metal.webp、左下絲襯→lining.webp、右下硯石→stone.webp。四圖總共368340 bytes。
- 程式：`scene/chestMaterials.ts`，木／絲／石用漫反射，金屬用較輕的Phong高光與真實品階主色。512材質有mipmap與4倍anisotropy；錯誤載入有單色後備，遲到圖片可要求一次重畫，離場取消訂閱。

原圖與生成提示隨repo保留，完整iOS工程包亦收錄本目錄。此素材不是任何玩家存檔或機密資料。
