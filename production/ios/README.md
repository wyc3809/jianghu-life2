# 江湖一生 iPhone打包／TestFlight

遊戲內容版本EA0.69.0；原生App用Capacitor8.5.3及Swift Package Manager，iOS15或以上，直版。完整遊戲及位圖隨App打包，唔係只打開Pages網址。網頁版本保持原有發布。

## 即刻可打包

Node24：`npm ci`，`npm run ios:package`。輸出`artifacts/jianghu-life2-0.69.0-ea-ios-project.zip`，內有Xcode工程、遊戲原始碼、npm鎖檔、已編譯web資源及發布配置，冇Appleprivate key。呢個ZIP係工程包，唔係IPA；不能直接上傳TestFlight。

Mac裝Xcode後：`npm ci`、`npm run ios:sync`、`npm run ios:open`。Apptarget揀自己Appleteam及Bundle ID，再Archive／Distribute至App Store Connect。

GitHub `iOS Package` workflow會喺Mac編譯未簽名`.xcarchive`，Artifact包含Archive ZIP、工程ZIP及編譯紀錄；未簽名Archive唔可以直接TestFlight安裝。

## Codemagic上傳TestFlight

1. 先有已啟用Apple Developer會員及App Store Connect遊戲App。已有App必須沿用原本Bundle ID及版本規則，唔好重新開另一個同名App。
2. 本工程候選Bundle ID係`com.wyc3809.jianghulife2`；未確認已喺Apple註冊。若已有App用另一ID，改`codemagic.yaml`嘅`ios_signing.bundle_identifier`同`IOS_BUNDLE_ID`。Xcode target會由scripts/ios/configure.mjs更新。
3. Codemagic帳戶設定新增App Store Connect整合，名稱`jianghu-life2-app-store`。喺服務設定填Issuer ID、Key ID、p8，唔好喺聊天貼key或commit入GitHub。服務需有簽名憑證／App Store provisioning profile，可以用Codemagic嘅Apple整合管理；GitHub App「已安裝」唔等於Apple整合已配置。
4. Codemagic設定環境group `jianghu-public-config`，加入公開`VITE_SUPABASE_URL`同`VITE_SUPABASE_ANON_KEY`（沿用已配置專案，唔用service_role）；唔需要更改資料庫。
5. 已有App，喺YAML填`APP_STORE_APP_ID`數字ID；會讀最新TestFlight build加一。新App未有ID時，使用Codemagic BUILD_NUMBER。Apple marketing version預設1.0，同遊戲EA版本分開。
6. 選此分支及`ios-testflight`工作流開始Build；成功先產生已簽名IPA並上傳App Store Connect，等待Apple處理後喺TestFlight出現。此workflow唔提交正式App Store審核，亦唔自動邀請新測試者。

## 目前限制

本機係Linux，無Xcode，不能在本機產生或驗證Apple簽名IPA。Apple帳戶／Bundle ID／簽名整合尚待玩家確認。只可將Mac實際編譯、IPA上傳及TestFlight處理完成分開報告，唔會將ZIP／未簽名Archive當成已上線。

首次原生安裝同Safari使用唔同本機儲存空間；工程包唔包含玩家私人存檔。現有匿名雲端身份亦唔應當成已完成跨平台帳戶配對。升級同一原生App時，必須維持Bundle ID及儲存格式，先驗證存檔兼容。

目前遊戲只用標準HTTPS等系統加密，Info.plist預設非豁免加密為false；將來加入自訂加密時需重新核對出口合規声明。發布前亦需完成Apple測試資訊／隱私資料等服務側設定。
