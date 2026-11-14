# 青雲八職位服與四款時裝：首批

2026-11-14。玩家接受青雲八職位及四時裝樣板，確認首批保留八種人物造型，再按門派逐批完成其餘。這輪是青雲，不是全部十派已完成。

## 服飾與資格

- 記名弟子、外門弟子、內門弟子、真傳弟子、門中執事、護法、長老、掌門，各有不同衣形、袖口、繡紋、腰帶及披掛，保持青雲藍白辨識。
- 制服限角色目前屬於青雲、且單機地位已達該職位。低階制服仍可選；高階可預覽但不能換上。多人會武席位不作資格來源。
- 玄夜行裝、朱霞宴服、雪山裘衣、金縷華服是四款免費純外觀時裝，沒有戰力或其他加成。
- 常服三款四色保留。制服／時裝用固定配色；選回常服可恢復配色操作。
- 失去制服資格時，人物頁及頭像顯示回退最近選定時裝，沒有時裝則用原常服。保留服飾偏好，不修改真門派、職位或能力。
- 預覽取消不保存，確認時由store按當下身份再次核對。資料新增可選costume／fashion欄位，舊存檔缺少欄位時沿用原外觀。

## 素材及來源

12款服飾×8種造型，共96張完整立繪，由24張四人圖集正規化。人物完整生成，沒有拼頭、身、腳。`approved-uniforms.png`、`approved-fashions.png`為已接受樣板；24張原圖保留於sources。生成工具為image_gen.imagegen，人物身份參照既有漫畫四人圖集。`generation.json`記錄圖集與服飾對應；`src/appearance/manhua/wardrobe-catalog.json`記錄來源hash、輸出hash、頭靴邊界及每款頭像裁切。

輸出512×1024 RGBA WebP，首批約8.5MB，按需載入並使用既有16外觀有界快取。網址按內容hash更新；失圖以同身份舊立繪後備。動作、兵器、裝備及黑影戰鬥保持。

## 重建及檢查

```bash
python3 scripts/art/build_wardrobe_figures.py
python3 /home/agent/.agents/skills/create-game-assets/scripts/asset_report.py public/ink/art/wardrobe/*.webp --expect-size 512x1024 --require-alpha --json
npm run dev -- --host 127.0.0.1 --port 5300
python3 scripts/qa/checkWardrobe.py
```

重建後必須重新檢查，不能直接保留technicalChecksPassed。瀏覽器使用design/art/manhua/fixtures.json的隔離測試存檔，封鎖Supabase。離派回退測試以隔離身份模擬變更並走正式保存排程；不當成真人故事事件或跨裝置完成。

八種造型的12款服飾接觸表已逐組檢視；96種實畫、資格與存檔驗證見production/qa/evidence/redesign/qingyun-fashion。其他九派屬後續批次，不在這輪生成或發布範圍。
