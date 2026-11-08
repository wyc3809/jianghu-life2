# 單角色短拳 · 動畫待玩家評閱

2026-11-08。自然站姿v02已獲玩家「Ok!」，本輪只續做同一角色短拳。**新動畫未獲玩家接受、未接正式戰鬥、未合併／發布或上傳TestFlight。**

- `punch-normal.gif`：全身正常速度，同一固定鏡頭，含起訖停留供觀察。
- `punch-slow-close.gif`：同一段原始幀嘅四分之一速度近鏡，固定裁切／放大以檢查肩、頸、袖及腕，唔係另一段動作或改人物比例。
- `punch-normal.mp4`／`punch-slow.mp4`：相同正常／慢速影片，慢版有正確速度標題。
- `standing/windup/contact/recover/settled-raw.png`：官方Spine Runtime直接出嘅透明幀。JPG只加證據標題及宣紙底，冇後製修畫人體。
- `before-after.jpg`及`transition-samples.jpg`：出片時逐段抽查。原分開淡入淡出造成透明重影，已拒絕；現兩材質使用完全同一拓撲與deform，實心底層不退透明。失敗參照亦保留喺素材來源目錄。
- `bones-debug.png`：實際骨架除錯顯示，普通模式唔顯示。
- `mobile-reduced.png`：390×844、DPR2，減少動態下手動逐格，無橫向溢出。
- `operation.json`：實播播放／暫停、逐格、四分之一速度、重播至終點及減少動態記錄；片尾RGBA同起點逐位元組一致。
- `offline-review.json`：自含HTML透過localhost零外部素材請求，接觸幀與開發操作頁逐像素相同。本環境`file://`被管理政策阻擋，唔把直接本機開檔列為通過。

完整131檔990項通過；TypeScript／Vite構建通過（保留既有大chunk警告）；`audit:narrate` hard-fail 0。新七項守門見`tests/punch_character_review.test.ts`，包括錯曲線、切斷腕面、錯位修形等負例；不是只驗數值存在。衣袖補畫係投影形狀改變，所有可見三角形不得翻面，固定護腕段保留既有拉伸門檻；關節、骨長及腳位另有嚴格檢查。

離線影片以60fps出幀（97幀取樣0至1.6秒），**唔代表瀏覽器即時或真iPhone穩定60fps**。未驗收真機、TestFlight、耗電、熱穩定、長跑或原生Spine編輯器回合。

重跑：`python3 scripts/art/build_punch_character_review.py`再`python3 scripts/art/render_punch_character_review.py`。素材、提示、來源hash及實作限制見`design/art/character-bind-review/punch-v03/README.md`。正式src／core／data／interfaces／public／存檔不變，幫會／門派戰仍暫停；未擴展其他武學或造型。
