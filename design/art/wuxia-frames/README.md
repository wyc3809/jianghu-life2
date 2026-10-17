# 武學冊頁藝術框原型

玩家要求框可以更有藝術感。沿用已做嘅繁中楷筆題字，今次先做六派選擇、武學卡、收藏／抽卡結果及人物主修嘅藝術框；未發布，先交真實手機截圖。

## 美術方向

- 新作生成式原畫：淺色冊頁、紙纖維邊、淡竹綁冊角位、短筆墨線；中央留空俾真正文字及圖示。
- 平常用淡墨框、選中用朱砂框、珍本用淡金框；大區塊用較完整冊頁框。唔用玩家之前拒絕嘅雲紋框、深漆木古銅方向。
- 三列六派留足完整名嘅空間；收藏／人物嘅「全部」改成上方44px細欄，再列六派。
- 保留圖片之外嘅點擊範圍及鍵盤焦點；裝飾層 `pointer-events:none`，選中時有獨立暖紙底及朱砂字，缺圖仍識分選中。

## 原畫與遊戲素材

`frame-atlas.png` 係本次原始生成圖，1254×1254、RGBA。2×2四格依次係neutral、selected、panel、rare；原圖保留，唔重畫框，唔改色。製作提示：無文字、無圖示、明亮武俠手抄秘笈風、紙邊配綁冊角位、克制墨線／朱砂／淡金、空心前視框、每格完整同形、無雲紋或深木。

`scripts/art/prepare_wuxia_frames.py` 只裁四格、等比縮至512×512及編碼WebP。四張合共317,592 bytes（約310KiB）；來源SHA256、格位、尺寸及每張hash見 `manifest.json`。同一原圖可重建相同布局。

```bash
python scripts/art/prepare_wuxia_frames.py
```

輸出：`public/ink/art/wuxia-frames/frame-{neutral,selected,panel,rare}.webp`。

## 接法

用位圖 `border-image` 九宮格（slice128）保留角位，邊沿延伸；小標籤6px、流派印8px、卡片14px、大區塊18px。框係不攔截操作嘅獨立裝飾層，中心保留DOM真文字；紙紋位圖以soft-light同淺紙色混合，避免原本灰色噪點圖蓋黑內文。

大小及密度屬美術原型；玩法、武學效果、卡池、玉石、保底及存檔不變。無新增動效／SVG；演武台及主頁固定布局冇改。

實際畫面、改前後及驗證：`production/qa/evidence/redesign/wuxia-art-frames/`。
