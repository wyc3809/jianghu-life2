# 十派制服補全：其餘九派

2026-11-14，第65項，EA0.107.0。玩家在青雲首批上線後要求完成其他門派，並選擇保留原入派條件、開齊十派制服及入口。這輪補天刀、峨嵋、少林、武當、唐門、魔教、華山、桃花島、無根門；不重做已接受的青雲及四款時裝。

## 範圍及畫面規格

九派各八職位、每套保留八種人物造型：144張四人原始圖集、576張完整立繪。加上原96張，正式衣櫥共672張。八職位沿用真門派名錄：記名、外門、內門、真傳、執事、護法、長老、掌門。不同職位包含短衫／長袍、袖口、腰封、衣層、刺繡與披掛變化，不以換色當八職位。

水墨漫畫線條、乾淨賽璐璐陰影，天然布料／絲綢／皮革；每派配色及八級設計見brief.json。少林使用在家弟子武服，仍保留玩家原本髮型，不替換成統一光頭。原人物面孔／髮型／斗笠按四人母版參照，完整人體生成，沒有分頭身腳拼接。八種造型均有完整換衫圖；正式戰鬥保持斗笠黑影。

輸出512×1024透明RGBA WebP，完整身體等比例落相同腳點；頭像按實際頭部位置整幅裁切，不另拼陌生面孔。沿用16外觀有界快取及按需載入，不在開始遊戲時預載672張。制服固定配色，原常服三款四色及四免費時裝保持。

## 身份及入口

衣櫥「門派服」提供十派切換及八職位預覽，預設目前門派。無門派及其他門派可以預覽，不能穿著；換上時store再核對當時真sectId及sectStanding，較低階制服仍可選。轉派／離派／降職後回退最近時裝或原常服，不改真身份、裝備、能力、資源、RNG或晉升。

拜師入口為「修煉→門派」，使用既有十派SECT_DEFS，不新建假門派或繞過門規。根基、心性、桃花島雅藝、無根門奇緣及原收錄機率保持；多人門派戰繼續暫停。存檔版本維持1，新制服使用已存在的可選costume欄位；舊常服／青雲／時裝ID不變。

## 來源及重建

生成工具image_gen.imagegen；依玩家授權及工具條款生成的遊戲素材，沒有採用外部角色／標誌或要求在世畫師風格。參照已接受青雲四人身份母版：男exec-5106b016-4c2f-49d5-8620-7ba00704e939.png、女exec-62cf1827-20b2-4fd9-86ea-1103015f31ff.png，來源存於design/art/qingyun-fashion/sources。brief.json記錄服飾設計及生成工作；generation.json與sources保留144張採用原圖。四張帶背景殘留的原圖被守門拒絕，移至rejected供追溯；修正對應見retakes.json，未放入正式目錄。目錄記錄來源／輸出hash、格位、全身及頭像邊界，來源編輯僅裁切、整幅縮放及壓縮。

```bash
python3 scripts/art/build_all_sect_figures.py
python3 /home/agent/.agents/skills/create-game-assets/scripts/asset_report.py public/ink/art/wardrobe/*.webp --expect-size 512x1024 --require-alpha --json
python3 scripts/qa/checkAllSectWardrobe.py
```

新批重建保留上一批96張，不覆寫已接受圖片；整批來源與透明留白檢查成功才更新目錄。重建會將technicalChecksPassed重設為false，須重新完成素材及實際遊戲檢查。驗證與截圖見production/qa/evidence/redesign/all-sect-uniforms/README.md。
