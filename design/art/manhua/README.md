# 人物及器物：武俠漫畫立繪

2026-11-14。玩家提供武俠漫畫參考，接受霜髮青玉角色與器物小樣後，要求生成其他兵器、配飾、衣服並套用人物換衫畫面。

## 範圍

使用粗細墨線、兩至三階明暗、清楚衣層及完整站姿。保留原來8個頭部造型ID、3套衣服、4種配色及存檔；24張完整人物圖經現有衣櫥切換形成96個外觀組合。人物不再拆頭身或硬屈腳，戰鬥仍用原斗笠黑影，不輸入新人物動作。

裝備仍是63件兵器按7類共用新圖，加4件護甲及3件飾品的獨立器物圖，共14款。沒有宣稱63件兵器各有不同圖。沿用現有規則：衣櫥選人物外觀，裝備欄選真裝備；沒有把護甲ID當成衣櫥外觀ID或改變玩法。

## 來源與規格

`sources/approved-style.png` 是玩家接受的小樣；其他7張PNG由 `image_gen.imagegen` 以它作參考生成（6張四人圖集及1張器物圖集）。來源hash、分格及輸出hash見 `src/appearance/manhua/catalog.json` 和 `icons-manifest.json`。原圖保留；沒有搬用參考廣告的商標、人物或老虎素材。

人物圖輸出512×1024 RGBA WebP，器物圖256×256 RGBA WebP，合共約2.4MB。人物圖按實際像素邊界等比例顯示，頭像裁切按每張圖的頭部位置計算。配色只處理衣料，使用小範圍平滑色罩避免斑駁，保留霜髮、皮膚、皮革及腰帶原色。人物圖按需要載入，有界快取16個已處理外觀，並按內容hash更新網址。新圖失敗時使用原同身份完整圖後備，沒有換臉或改存檔。

## 重建與驗證

```bash
python3 scripts/art/build_manhua_icons.py
python3 scripts/art/build_manhua_figures.py
python3 /home/agent/.agents/skills/create-game-assets/scripts/asset_report.py public/ink/art/manhua/figures/*.webp --expect-size 512x1024 --require-alpha --json
npm run dev -- --host 127.0.0.1 --port 5300
python3 scripts/qa/checkManhuaArt.py
```

重建後要重新跑素材QA，再將catalog的technicalChecksPassed標真；不能只憑生成成功當完成。瀏覽器工具使用本目錄 `fixtures.json` 的隔離測試存檔，封鎖Supabase，沒有真人帳戶或雲端資料。證據及限制見 `production/qa/evidence/redesign/manhua-static/README.md`。
