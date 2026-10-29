# EA0.97.2：TestFlight內測版本守門修正

2026-10-29；redesign-scope第54項。玩家貼出Codemagic停止訊息，已重現遊戲EA0.97.1但準備紀錄仍為EA0.91.0。不是八項未驗收提示令內測停止；原內測流程只把它們列作待辦。

## 修正與防再發

- 遊戲、package／lockfile、內測準備及測試內容同步EA0.97.2。
- 每次Vitest／CI直接比較實際版本檔案，漏升準備紀錄會在合併前失敗；AGENTS發布清單補上此檔。
- 原版本檢查保留並列明兩個版本及修正檔案；未驗收狀態全部保留false。內測明示它們僅作待辦；外測發布仍拒絕未完成驗收。
- iOS文件統一main／ios-internal-testflight。Apple版本1.0、Bundle ID、App ID與查Apple遞增build流程不變。Codemagic必須從最新main建立新build；舊build重跑仍可能使用舊commit。

## 驗證

- `reproduce.log`：新增版本一致測試對原碼失敗，明確顯示EA0.91.0與EA0.97.1不符。
- `targeted.log`：21項版本／內測測試通過，包括過期版本拒絕、待辦不被修改、外測仍阻擋、錯誤識別及後端金鑰拒絕、不洩漏key、Apple查詢失敗不重設build。
- `tests.log`：113檔877項全過；未跳過或刪測試。
- `build.log`：正式Pages根路徑構建及TypeScript通過。已知大型bundle警告保留，無宣稱此批優化載入效能。
- `narrate.log`／`copy.log`：hard-fail 0；10,075段文字禁句0。
- `internal-format.log`：以明確假Project URL／publishable key測根目錄真設定格式通過，不代表真帳號、金鑰或連線驗證。
- `external-blocked.log`：同樣假環境下外測仍因待辦返回1，沒有為內測繞過外測守門。
- `ios-verify.log`：mobile根路徑同步後，主bundle含EA0.97.2、Bundle ID一致、823個public資源逐一hash通過，沒有開發server。
- Mac未簽名Archive由本PR的`iOS Package` GitHub check獨立核對；Linux本機不能執行Xcode。本機檢查不是Apple簽署或上傳成功證據。

本批沒有改畫面／動畫、核心、經濟、存檔、雲端或原生登入；無新增畫面對比需求。沒有操作真帳戶、改Supabase allowlist或刪資料。沒有可操作Codemagic／Apple連線，未觸發已簽署IPA或新TestFlight上傳。Apple會員／App配對／簽署、隱私與分級、原生登入還原、帳戶刪除、完整iPhone升級與效能、Beta Review仍須相應證據；曾由玩家回報安裝不等同全部驗收。
