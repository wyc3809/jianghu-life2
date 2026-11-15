# 千燈鎮晨景首頁

玩家否決首頁直接放人物立繪，明確選三款示意的第三張。selected.png保留當時展示原圖，source.png為同圖移除所有文字、底線及按鈕後的背景；由ImageGen參考編輯，並非重新發明構圖。石橋左、茶樓右、日出、柳枝、紅燈籠、空舟及桃花保持，沒有任何人物或剪影。

852×1846 RGB，淺色上下留白。正式輸出public/ink/art/theme/town-opening.webp為305,634 bytes，僅WebP quality92、method6格式轉換，沒有裁切、改色或拉伸。原始來源、hash及視覺檢查見manifest.json。

重建：python3 scripts/art/build_town_opening.py。標題、卷首、續寫提示及操作均由InkStartScreen真DOM繪製；背景object-fit:cover等比例適配。只供首頁，不替換人物頁或共用日景；不修改任何造型ID／存檔。根目錄design-qa.md及production/qa/evidence/redesign/town-opening/保存實際比較與操作證據。
