# EA0.90.0 發布驗證

2026-10-24，玩家檢視秘笈畫質／翻冊及主頁同款介面預覽後回覆「上線」，批准第39至42項一併發布；PR #138。

發布主頁原生安全區與可用高度、寶箱原創材質與繪製優化、秘笈閣獨立全畫面、高清書封／可彎曲翻頁、按負荷調節3D解像度／結果恢復高清、主頁同款按鈕文字及短屏十連操作。現有抽卡機率、玉石成本、40抽心願、書頁、真核心一次入帳、指定欄位裝備、出招與舊存檔保留。iOS／Codemagic工程接入main，不部署後端或資料庫。

發布前105檔775項Vitest、Pages build含tsc、mobile build／Capacitor同步、793個public資源hash、narrate hard-fail0及玩家文案9685段／口語禁句0通過。Apple版本保留1.0，內測內容與readiness版本同步EA0.90.0，沒有把未驗收項目改成done。日誌見本目錄。

正式Pages構建以普通介面建立人物（非DEV模組或存檔注入），320×568／390×844／420×896江湖全圖、四入口／返回、秘笈閣無人物／導航、其他子頁恢復人物／導航及設定版本EA0.90.0通過，pageerror0／HTTP錯誤0。證據local/navigation。更新舊驗收腳本的秘笈頁預期，以反映已確認獨立全畫面；其餘子頁仍檢查原有頂底欄。

完整畫質／動態／失效／裝備銜接及前後圖沿用同一發布內容的相鄰codex-quality、gacha-fullscreen、chest-quality及ios-safe-area驗收。效能是SwiftShader相對樣本與繪製次數，不宣稱iPhone60fps或新真機已通過。

發布提交的CI及Mac未簽名Archive通過後才squash合併；Pages部署與正式網站版本／操作會核對並記錄於PR #138及本機發布記錄。Mac未簽名Archive、網頁上線或工程ZIP不等於已上傳TestFlight。

此環境沒有可操作的Codemagic／Apple連線，沒有觸發簽署上傳。新版工程、內測workflow及build遞增均已備妥；擁有者在Codemagic選原分支work/testflight-prep-ea088與「江湖一生 iOS 首次內測」（ios-internal-testflight）開始建置，即使用既有憑證／整合上傳內部版。外測流程仍受未完成清單阻擋；此批不提交外測或正式商店審核。真正幀率及舊檔升級要在新TestFlight安裝後驗證。
