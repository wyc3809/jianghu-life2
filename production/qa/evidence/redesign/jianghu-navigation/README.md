# 第32項：江湖列表／分層內容頁（未上線）

玩家表示功能大致OK，要求排版、字體及圖示跟返其他介面，江湖先顯示列表，再點入各功能，唔再全部攤開。本批只改前端導航及呈現，維持正式版本EA0.82.0，待玩家睇圖。

- `comparison.jpg`：EA0.82.0原長頁與改後入口列表，390×844 DPR2、seed42、玉石free600／paidTest0。
- `after.png`：江湖五入口：江湖風雲、秘笈閣、華山論劍、開宗立派、心性。沿用現有人物／修煉同一套InkIcon／InkBadge位圖器物牌章及介面字體，無新畫風／SVG。
- `gacha.png`、`huashan.png`、`founder.png`、`nature.png`：原有功能各自內容頁，均有返回江湖。
- `online-menu.png`：多人江湖只顯示自己身份／排名及五個入口，對手、配搭、收成、戰報及規則各自點入。
- `opponents.png`、`loadout.png`、`income.png`、`history.png`、`rules.png`、`new-battle-history.png`：真雲端資料及可操作內容，唔以假資料回覆充當連線驗證。
- `equip-selection.png`：單抽後馬上裝備仍先導向人物選欄；600玉石變540，未自動學習或換裝。
- `root-*.png`／`online-*.png`：320／390／420手機，無橫向溢出，主要入口觸控至少44px，所有牌章位圖載入成功；原有底欄保留。
- `navigation.mp4`：最後排版嘅正常速度導航；`functional-regression.mp4`：完整功能回歸（最後內功／身法邊框精修前，邏輯相同）。`navigation.gif`節錄最後排版導航，唔加速核心。
- `report.json`：完整Playwright報告，pageerror0；主頁秘笈閣／論劍捷徑直接開目標頁；重新點江湖底欄回列表；真正內容捲動容器返回頂部。
- `loadout-*.png`／`select-layout.json`：內功／身法選單補齊同款位圖框，320／390／420再次驗證觸控／溢出及pageerror0。
- `tests.txt`／`build.txt`／`narrate.txt`：全測、Pages build含tsc及narrate結果。

真雲端只操作既有自己QA身份：保存原配搭一次（角色不變）、連點領收益只一條claim、重播唔發challenge、向另一個自己QA身份挑戰一次，再喺獨立戰報頁讀同一戰報。冇挑戰其他玩家、改伺服器、數值或存檔格式。原圖、器物映射及授權沿用現有素材登記，冇產生新素材。

未改在線／離線規則：開住江湖風雲各內容頁保留原心跳；返回江湖總列表或其他功能即按原面板離場規則離線留場，唔假裝已實作全遊戲presence。減少動態沿用原有媒體偏好／回放設定。

本批未升版本、未合併main、未發布Pages或TestFlight，未當iPhone真機／60fps驗收。
