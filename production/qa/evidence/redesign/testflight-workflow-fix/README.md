# 第69項：TestFlight入口誤走外測檢查 · EA0.109.1

玩家提供Codemagic截圖：Set up code signing identities後，「核對TestFlight準備狀態」失敗，下方列apple-membership、app-record、signing、privacy-metadata、native-email-login、account-deletion、device-save-upgrade等待辦；安裝及編譯未開始。此步名及輸出與舊ios-testflight的release-check.mjs一致。這是外測清單被用作內測入口，不是遊戲編譯錯誤；未宣稱憑截圖驗證了Apple簽署。

修正預設／第一個ios-testflight入口為「江湖一生 iOS TestFlight 內測更新」，使用internal-check.mjs及testFlightInternalTestingOnly:true。舊ios-internal-testflight保留並繼承相同流程；外測用ios-external-testflight，仍使用release-check.mjs、一般簽署與Beta提交。兩個內測入口仍上傳App Store Connect，但不送Beta或正式商店審核；沒有改任何done:false、App識別、Apple版本或查Apple遞增build策略。

新增測試真正解析codemagic.yaml的anchor及merge，從各入口提取實際檢查腳本並執行：未完成真機清單的固定fixture在兩個內測入口均通過，清單檔案位元不變；外測仍失敗，錯誤訊息指向正確內測入口。另核對內部IPA匯出、Beta／商店提交旗標及build遞增腳本沒有丟失。既有錯誤App／Bundle、過期版本、公開連線設定及後端金鑰拒絕測試保持。yaml只作開發／測試解析，不進遊戲runtime。

141檔1,036項、Pages構建、敘事hard-fail 0、文案禁句0處及diff檢查通過。入口解析結果在workflow-report.json。這批沒有遊戲介面或核心邏輯修改，不新增畫面／動畫素材。Mac未簽名Archive與Codemagic已簽署上傳分開核對。

使用：Codemagic重新整理後Start new build → main → ios-testflight；確認包含EA0.109.1的新commit。不要Restart舊build，舊commit仍可能讀舊YAML。如果仍顯示「核對TestFlight準備狀態」，尚未使用新流程；新步名是「核對內測設定（待辦不阻擋內測）」。真正Apple處理／內部群組可安裝仍須新建置確認；此環境沒有Codemagic／Apple可操作連線，不冒稱已觸發或上傳。
