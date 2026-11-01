# 玩家否決後的會武畫面驗收（未發布）

唯一來源：`design/art/sect-battle/selected-portrait.png`。修訂工作分支 `work/sect-war-visual-match`。不合併main、不部署、不更新TestFlight。

`first-comparison.jpg`及根目錄4秒截圖是第一輪構圖檢查，仍有上層太近文字、舊旅人素材及握點問題，不能當最終成品。`refined/4s.png`是中途再調；最後交付圖與影片另以 `final/` 保存，所有畫面都是真元件及引擎播放，不是生成的整頁圖。

保留0.75、2、3、4、6、8秒，而非只挑一張高光幀；`capture.json`記錄stage canvas每五分之一高度的人物覆蓋，配合視覺複查原本大片空白問題。這個數字不能代替人體、動作或藝術質素判斷。

單檔HTML位於 `/workspace/deliverables/sect-war-revision/門派會武-畫面驗收.html`，以esbuild打包同一React元件、同一Worker與繪圖器，所有位圖／字體內嵌，雲端設定留空；離線名冊、暫停、跳過及重播由真元件處理。`offline/report.json`記錄單檔內容經本機HTTP提供的實際檢查；環境禁止file://，沒有改動瀏覽器政策或聲稱直接檔案協定已驗證，不把能匯出檔案當作驗收通過。手機檔案預覽器不等於瀏覽器執行，沒有聲稱iPhone已測。

視覺驗收仍待玩家。全套測試與構建屬程式及相容性證據，不能代替原稿匹配；舊passed已撤回，見根 `design-qa.md`。


最後程式驗證：120檔928項全部通過；正式TypeScript／Vite構建、兩項文案檢查通過。真元件Chromium／WebKit各390×844、430×932，加減少動態及全部會武素材失效，共8例通過；單檔內容經HTTP提供，雙引擎390×844、320×568，共4例通過，沒有外部請求及pageerror。所用圖片／字體／Worker均內嵌；不能把這項當真iPhone／File QuickLook或TestFlight通過。

一輪全套測試曾與構建及兩個瀏覽器並行，舊有martial_poses回歸在5000ms上限逾時5104ms，保留concurrent-test-timeout.log。沒有修改或停用測試，全部獨立重跑通過（vitest.log）；不把逾時隱藏為斷言成功。

頁腳按原稿只保留姓名及當下招式；職位、氣血、內力保留於一按可開的名冊，沒有刪玩法或假造數值。名冊肖像也沿同一新墨線原畫。視覺仍待玩家確認，final source-comparison.jpg／before-after.jpg／six-moments.jpg與final/playback.mp4為本輪檢視入口。
