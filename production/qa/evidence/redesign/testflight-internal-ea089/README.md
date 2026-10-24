# EA0.89.0 首次TestFlight內測準備

已將main的EA0.89.0接入iOS分支；沿用原生工程及安全區。新增`ios-internal-testflight`，只匯出Apple限定內部測試的IPA並上傳，擁有者再手動加入內部群組。外測仍經完整readiness檢查。分支保留`work/testflight-prep-ea088`名稱。

- `tests.log`：102檔758項通過，含17項公開設定拒錯、金鑰不入log及Apple build查詢失敗不重設等回歸。
- `ios-sync.log`／`ios-verify.log`：tsc、mobile build、Capacitor同步及789個資源hash；主程式EA0.89.0。
- `narrate.log`／`copy-audit.log`：hard-fail0、9682段中文字串／口語禁句0。
- `workflow-check.json`：Codemagic官方JSON schema及內／外測的匯出和發布條件。
- `external-readiness.log`：外測命令仍因已知缺項返回1；沒有將待辦亂改為完成。
- `browser/`：Chromium以webkit bridge標記及明確47／34px模擬原生識別／安全區；320×568、390×844、768×1024及網頁390×844，四地標／返回、重開續玩與設定版本通過，外部雲端及字體請求阻擋，pageerror0。這不是WKWebView或iPhone實機。

本地只驗證設定與構建，不讀取使用者的p8／憑證／Codemagic Secret值。公開URL／anon key的檢查只是格式與claims配對，沒有替代伺服器授權驗證。Apple App權限、Bundle ID、簽署與上傳須由實際Codemagic build核對；未產生已簽名IPA、未上傳TestFlight、未驗收原生登入／帳戶刪除／跨裝置還原。真機清單與外測待辦保持未完成。

官方依據（2026-10-24核對）：

- https://docs.codemagic.io/yaml-code-signing/signing-ios/ （internal-only export及其限制）
- https://docs.codemagic.io/yaml-publishing/app-store-connect/ （上傳與Beta提交分開）
- https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/ （anchors、手動啟動及官方schema）
- https://github.com/codemagic-ci-cd/cli-tools/blob/master/docs/app-store-connect/get-latest-build-number.md
- https://github.com/codemagic-ci-cd/cli-tools/blob/master/src/codemagic/tools/app_store_connect/actions/latest_build_number_actions.py （成功無build返回空；失敗拋錯）

最新程式提交`5e4b592e544c5de24e03eb9636e931e83fbc5cf3`已通過GitHub CI [40084637904](https://github.com/wyc3809/jianghu-life2/actions/runs/40084637904)及Mac iOS Package [40084637880](https://github.com/wyc3809/jianghu-life2/actions/runs/40084637880)，見`ci.json`／`mac-ci.json`。Mac工作流程實際未簽名Archive、資源核對與工程包均成功；沒有Apple發佈簽署或TestFlight上傳，不將未簽名Archive當作已簽名IPA。
