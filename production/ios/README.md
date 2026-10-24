# 《江湖一生》iOS／TestFlight準備

最新進度：玩家已回報透過TestFlight安裝並提供主頁實機畫面；首個安裝流程已由玩家走通。已依該畫面精修安全區與主頁高度（第39項），並依寶箱實機回報精修材質、開啟／旋轉繪製負荷與結果靜止（第40項）。秘笈閣亦已改為如江湖地圖的獨立全畫面（第41項），圖見`production/qa/evidence/redesign/gacha-fullscreen/`。前後圖／動態分別見`production/qa/evidence/redesign/ios-safe-area/`及`production/qa/evidence/redesign/chest-quality/`。精修仍是待檢視原型，未再次上傳；原生登入、帳戶刪除與完整真機清單維持待辦。

內容版本EA0.89.0，已接入main的完整回合連招及難度調整；本工作準備iOS工程，不發布新網頁版本。承接舊PR #115的Capacitor8.5.3／SwiftPM工程，接入目前完整遊戲、資源及多人入口。候選Bundle ID `com.wyc3809.jianghulife2`，Apple版本暫用1.0；兩者尚未獲Apple服務側資料確認。

## 已準備

- 隨App打包完整Vite遊戲與793個public資源，非遠端Pages外殼。原生直版、安全區、紙色啟動畫面、1024px無透明App icon、App及SDK私隱manifest。
- `npm run ios:sync`：mobile根路徑構建、同步Swift工程，再對齊App識別／版本。`npm run ios:verify`核對真正主bundle版本、全部public資源hash、Bundle ID、私隱資源及無開發server。
- `npm run ios:package`：建立可交Mac重建的工程ZIP及SHA256資訊。含server型別／測試依賴；排除.env、憑證、私鑰、node_modules及私人存檔。ZIP不是IPA。
- GitHub `iOS Package`：Mac實際未簽名Archive並驗證SDK、版本與資源，保留Archive、工程包及編譯記錄。這不會上傳Apple或邀請測試者。
- `codemagic.yaml`：分開首次內測及外測發布；查詢正確App的歷史build後加一，首次無build才從1開始，查詢錯誤立即停止。兩者均不自動提交正式商店審核。
- 測試資訊草稿、私隱資料盤點、真機驗收清單及待辦狀態，見本目錄。沒有虛構聯絡人、Apple App ID或「不收集資料」聲明。

目前程式使用`AbortSignal.any`等Web API，原生最低系統暫定iOS／iPadOS17.4；相對舊工程iOS15提高，避免明知不支援API仍宣稱可執行。iPhone／iPad直版Target保留，iPad與iPhone真機仍待驗證。此最低系統是本次準備值，須依測試裝置再確認；不是Apple上傳SDK要求。Apple自2026-04-28要求Xcode26／iOS26 SDK以上，本工程另檢查實際SDK。

## 本機與Mac使用

Node24：`npm ci`，`npm run ios:package`。工程輸出在`artifacts/`（不進git），名稱依package版本；取出ZIP後亦可`npm ci`、`npm run ios:sync`重建。

Mac安裝Xcode26或以上：`npm ci`、`bash scripts/ios/check-xcode.sh`、`npm run ios:sync`、`npm run ios:open`。已存在App必須先確認原Bundle ID，然後設定`IOS_BUNDLE_ID`、`IOS_MARKETING_VERSION`、`IOS_BUILD_NUMBER`再sync。從Xcode選自己的Team，Archive／Distribute到App Store Connect。

GitHub PR會跑未簽名Mac Archive；亦可手動執行iOS Package。其Artifact保留30天，內含`.xcarchive`ZIP、完整工程ZIP、`build-verification.json`及log。過期後可重跑，不需Apple私鑰。

## 之後簽署與TestFlight

玩家已提供App Store Connect數字App ID `6826541114`，已填入Codemagic的`APP_STORE_APP_ID`。這是玩家提供的App識別資料，尚未以Apple API核實其Bundle ID、版本、簽署或授權；其餘待辦保持未完成。

### 首次安裝：ios-internal-testflight

玩家已回覆完成描述檔上傳、環境變數設定，並確認Apple整合名稱`jianghu-life2-app-store`；這是玩家回報，不等於本環境已登入Codemagic或驗證Apple簽署。Codemagic重新整理後，選分支`work/testflight-prep-ea088`及workflow「江湖一生 iOS 首次內測」（`ios-internal-testflight`）。分支名保留，但內容已是EA0.89.0。

- 檢查App ID、Bundle ID、內容版本、Apple數字版本及公開連線設定；拒絕漏填、Dashboard網址、不同專案的anon key及後端金鑰，不打印金鑰內容。
- 列出未完成待辦，保持JSON中的`done:false`。先上傳內測版，再按真iPhone完成存檔、前後台、效能與升級測試，避免把真機驗收當首次安裝的前置條件。
- 使用`testFlightInternalTestingOnly:true`匯出。`submit_to_testflight:false`表示不自動送Beta審核，`submit_to_app_store:false`表示不送正式商店審核；IPA仍上傳App Store Connect。此包只能加進內部群組，不能用作外測或商店發布。
- Apple處理完成後，由擁有者在App Store Connect的TestFlight建立內部群組、加入自己及此build，填測試內容，再用iPhone TestFlight安裝。只測已具備條件的功能；電郵回調、跨裝置還原及帳戶刪除仍是未完成項目。

### 外測發布：ios-testflight

1. 確認付費Apple Developer會員、App Store Connect權限、已存在App的Bundle ID及數字App ID。已有App不要另建另一個同名App；維持`capacitor://localhost`儲存origin。
2. 先完成`release-readiness.json`的實際待辦，逐項有證據才改done。`npm run ios:release-check`目前應明確失敗：它表示仍有已知缺項，不是編譯失敗。
3. 在Mac或Codemagic安全設定Distribution憑證及App Store profile。使用Codemagic時，建立`jianghu-life2-app-store` Apple整合，將p8放服務的整合設定；不要貼入聊天或提交Git。GitHub登入不等於Apple已授權。
4. Codemagic的`jianghu-public-config`環境group只需公開`VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY`，沿用現有遊戲專案；不可放service_role。核對YAML中Bundle ID，填`APP_STORE_APP_ID`，保留`VITE_ONLINE_PUBLIC=1`。
5. 完成真機／登入／隱私準備後，執行「江湖一生 iOS 外測發布」（ios-testflight）。完整`release-check`仍會拒絕未完成項目；需重新建置可供外測的已簽署IPA，不能沿用僅供內測的IPA。必須等Apple處理完成才算TestFlight可用。
6. 先加內部測試員；外部測試須提供Beta App Review資料，首個外測build通常需Apple審核，不能將上傳成功當外測已批准。正式App Store發布另行提交。

未有Mac可使用GitHub取得未簽名Archive，再用Codemagic簽署與上傳；Apple帳戶仍必需。這個Linux工作環境不具Xcode或Apple簽署身份。

## 已知未完成項目

- 電郵魔法連結目前導向網頁origin；原生需要註冊回調、處理App cold／warm啟動及Supabase redirect allowlist，或改為已驗證的電郵OTP流程。未做前不能宣稱App已可跨裝置登入。這批不改Auth或遠端設定。
- 現有App可建立匿名／綁定帳戶，未提供App內發起帳戶刪除及對應後端；須按Apple要求完成，不能以刪本機存檔代替刪帳戶。不可把admin key放App。此批不部署資料庫或刪除真帳戶。
- 私隱政策與支援聯絡資料尚未有獲確認的公開網址；`privacy-inventory.md`是事實盤點，不是已發布政策。
- 玉石中的「付費測試」目前只是測試點數，沒有StoreKit付款；測試資訊須說清楚不代表真實購買。日後售賣數碼內容再接Apple IAP，不可接外部付款替代。
- 真機前後台、存檔升級、WebGL演出／音效、長時間效能及iPad驗收未完成。瀏覽器或Mac Archive成功不可冒稱真機通過。

## 存檔

Safari與App有不同容器，不能自動讀同一IndexedDB／localStorage；匿名身份也不同。先保留原網頁存檔，不要求玩家刪除網頁或重新建立人生。原生同Bundle ID升級沿用既有格式，仍須真機升級測試。卸載App會移除本機資料；已綁定且驗證可還原的雲端存檔才可作跨裝置方案。

## 官方依據（2026-10-24已核對）

- Apple SDK要求：https://developer.apple.com/news/upcoming-requirements/
- TestFlight流程：https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- 帳戶刪除：https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Supabase原生回調：https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Supabase更新：https://supabase.com/changelog（已核對相關TLS更新，原生仍用系統標準HTTPS）。

工程驗證與Mac實際結果見`production/qa/evidence/redesign/testflight-prep/README.md`。
