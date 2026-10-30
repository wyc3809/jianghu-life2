# EA0.98.0：App動畫及試煉換裝引導第一批

2026-10-30；redesign-scope第55項。玩家同意先完成動畫基礎效能及試煉至比較換裝引導，完成後按既有授權直接發布。沒有重設經濟、戰鬥或存檔版本。

## 可檢視成品

- `person-before-after.jpg`：同一試煉後隔離存檔，新增局部指引及既有朱砂位圖入口框。
- `picker-before-after.jpg`：選擇只預覽，可取消；確認才換上，顯示真攻擊前後值。
- `home-before-after.jpg`：主頁改為前往人物，取代直接裝備；提示可略過及重開。
- `guide-demo.gif`：真瀏覽器操作節錄，6fps匯出；不是遊戲幀率。
- `animation-demo.gif`：實際高光播放／背景暫停／返回片段，8fps匯出；不是效能測量。
- 原始DPR2截圖及錄影位置保留在各JSON；原始暫存影片不加入App。

新提示重用現有紙纖維、磨邊、朱砂選框與毛筆字體；字體子集補掃core文字，保留來源／授權／重建腳本。人物頁不增加全局頂欄或底部導覽。

## 動畫對照

`before-animation-report.json`對EA0.97.2開發版寶箱，`after-animation-report.json`對本版同一開發入口。只計Director自己的bound tick，沒有把GSAP全局ticker當成背景空轉。

| 650ms模擬背景期間 | 原版 | 新版 |
| --- | --- | --- |
| 寶箱Director RAF回調 | 39 | 0 |
| WebGL繪畫 | 0 | 0 |
| 背景蓄力階段 | charging推進至bursting | charging保持 |

新版寶箱、武學令、丹爐返回後均正常到結果，靜止結果不持續繪畫。這證明生命週期處理，不是iPhone FPS／耗電比較。自動畫質先兩級減粒子，再降低動態3D DPR；結果恢復完整DPR，DOM文字／卡面不降質。

錄影時曾因軟件GPU極慢幀超時；追蹤主時間線與UI代理時間線確認有續播。另補上連續超過一秒的可見慢幀仍降質，真正背景切換明確重設歷史；單次停頓不立即降質。重跑正常與邊緣9情境通過，沒有更改GSAP全局lagSmoothing或用加速掩蓋。

## 驗證結果

- `tests.log`：114檔892項全過，新增15項測視覺啟停、遲到回調、預載取消、品質階梯／嚴重慢幀、真換裝／對戰隔離、提示重開、舊檔補回及JSON往返。
- `build.log`：公開江湖開關的正式Pages構建及TypeScript通過；大型bundle既有警告保留。
- `narrate.log`：hard-fail 0；`copy.log`：10,098段文字，口語及禁句0。
- `guide-report.json`：正式構建Chromium／WebKit ×320×568、390×844、430×932，共6完整流程；另各引擎驗證試煉入口、獲物導向及舊檔缺兵器，共12情境。比較取消不換裝、確認連點一次、普通／對戰分開、重開／略過保留、重看不重派或清進度。
- `gacha-motion-report.json`：正式構建兩引擎一般單抽及珍本十連，共4情境。真核心先結算，玉石、保底、收藏、書頁逐項符合獨立核心預覽；冊頁遮住待機停畫、背景不推演出、跳過、領取背景暫停／恢復及重開均不重扣／重派。
- `chest/report.json`：正式構建良品完整旋轉／開箱、最高階減少動態兩情境；核心已入帳物品數保持一、不自動裝備、不重開演出，背景畫布停畫及返回恢復。
- `after-animation-report.json`：開發限定的高光示範，共9情境。三種一般完整演出／背景恢復；寶箱與令牌最高階的跳過、減少動態加跳過、WebGL中斷。不是所有品階完整演出的重新驗收。
- 以上共27個新版本瀏覽器情境（18正式遊戲入口、9開發示範），全部無pageerror。
- `ios-verify.log`：mobile根路徑主bundle含EA0.98.0，Bundle ID一致、823個public資源逐一hash通過，無開發server。Mac未簽名Archive由本PR的iOS Package check獨立核對；本機Linux不能簽署或執行Xcode。

## 遊戲及舊檔邊界

比較前沿用ensureNewbieReward修復仍在新手階段、已贏試煉但遺失兵器的舊檔；只補原已得兵器，不換裝、不重派銀兩，重按不再寫檔。未贏試煉／已完成者不補。攻擊前值存於既有flags記錄，未改schema或存檔版本。

略過與重開只改提示旗標；真正任務條件、普通／對戰配搭、30／120首次獎勵、已領收據及抽取規則保持。演武僅接原homeVisible／前景啟停；高光覆蓋仍按原規則推進引擎並略過繪畫，不改離線收益或派獎公式。

## 重建與限制

沿用現有人物／點按QA基底，再執行`makeAppMotionGuideFixtures.mts`、`makeCodexQualityFixtures.mts`、`makeChestFixtures.mts`。`checkAppMotionGuide.py`及`checkAppGachaMotion.py`的MOTION_BASE可指定正式Pages根路徑；`checkAppAnimation.py`只用開發版，因示範入口不在發布包。素材與影片整理腳本為`buildAppMotionEvidence.py`。

所有測試隔離存檔及封鎖Supabase，沒有登入／刪除／改動玩家帳戶或多人服務。visibilitychange是瀏覽器合成，部分開箱安全區為CSS模擬，不能當真iPhone前後台、FPS、發熱、電池、記憶體長測或VoiceOver驗收。真正iPhone驗收及已簽署TestFlight上傳仍需Codemagic；八項發布準備待辦沒有被標成完成。本批沒有常駐隱藏WebGL預熱舞台，冷啟GPU編譯留待真機量度。
