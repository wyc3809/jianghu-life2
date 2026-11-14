# 珍品以上兵器獨有漫畫圖 · EA0.108.0

玩家要求rare或以上逐件獨有，rare以下可通用。本機真名錄63件武器：17珍品（rare／藍）、10絕品、2曠品、1神兵，共30張獨有；33件凡品／良品維持七類通用圖。現有抽卡是武學／書頁，沒有新增武器抽卡或改取得機率。

沿用已接受漫畫器物參考，按刀形、材質、護手、穗結、弓弩及機關區分，並非只換色。8張四格原圖在sources，最後一張只採用兩格。brief.json列逐件設計，generation.json與src/appearance/manhua/weapon-catalog.json記錄來源及hash。30張512×512透明WebP約2.6MB，檔名帶內容hash避免快取錯配。

分格沿各欄真正透明走廊自適應，不硬切畫布中線；完整器物等比例放入456px安全範圍，不裁刀尖或穗尾。全部30張尺寸／alpha／邊界守門及大圖、58px接觸表人工檢視通過。來源最窄透明邊緣仍保留整件器物，沒有拉伸或補造刀尖。

共用equipmentArtUrl按真正裝備ID對應，接入人物裝備牌章、列表、比較、詳情、獲得新裝備、開箱卡面及無WebGL後備。護甲／配飾圖片、低階通用圖、戰鬥黑影兵器與真裝備數值保持。新裝備對照內容可捲，短屏確認按鈕保留可見。

重建：`python scripts/art/build_rare_weapon_art.py`。素材檢查報告與實際手機畫面見production/qa/evidence/redesign/rare-weapons/README.md；瀏覽器重跑：啟動5300埠Vite後執行`python scripts/qa/checkRareWeaponArt.py`。本輪未改存檔schema、經濟、RNG、取得池或戰果。
