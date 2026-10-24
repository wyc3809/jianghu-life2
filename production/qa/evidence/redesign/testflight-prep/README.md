# EA0.88.0 TestFlight準備驗證

2026-10-24；不發布網頁或上傳Apple。舊PR #115停留EA0.69.0，本批選擇性沿用iOS工程，接目前EA0.88.0，未帶回舊遊戲程式。

本機Linux：100檔728項Vitest、mobile build含tsc、narrate hard-fail0及文案掃描通過。Capacitor同步789個public檔逐檔hash一致，主bundle版本EA0.88.0；直版Info.plist、RGB1024px圖示、App私隱manifest與Bundle ID一致。`ios-sync.log`、`tests.log`、`narrate.log`、`copy-audit.log`保存原始檢查結果。

工程包已實際解壓重建，mobile build與728項測試均通過；補齊舊包漏掉的server及兩份測試資料。隔離負面驗證拒絕Pages資源路徑、開發server、Bundle ID不符、被改動資源及build0。ZIP不包含.env／私鑰／簽署憑證。原始結果在`source-rebuild.log`、`source-tests.log`、`package-check.log`及`package.json`。

`release-readiness.log`為預期拒絕：已知Apple設定、原生登入、帳戶刪除、政策及真機等缺項尚未完成，不能把工程包當可上傳IPA。完整待辦見`production/ios/README.md`及`release-readiness.json`。

瀏覽器正式mobile構建已通過：網頁390×844、原生識別／47px頂部及34px底部安全區模擬320×568／390×844／768×1024，四個地標與返回、重開續玩及設定版本正常，pageerror0。外部雲端及Google Fonts請求攔截後仍可遊玩，沒有操作真玩家資料。`browser.json`、`safe-area-comparison.png`及相關截圖保留真實結果；這是Chromium標記模擬，不是WKWebView或iPhone真機。

Mac Archive結果待完成後補記；不宣稱iPhone真機、簽署IPA、App Store審核或TestFlight已完成。工程及未簽名Archive只能用來重建／簽署，不能直接在TestFlight安裝。
