# 共用非同步江湖（EA0.82.0）

玩家更正「唔需要做房間，唔洗大家都即時」。本版取代EA0.81.0房間入口：所有入籍身份共用一個江湖，對手可以已關頁離線，唔需要開房、邀請或雙方同時在線。

人數範圍已發選項，暫未收到新答覆，按已向玩家說明嘅建議先開放共用封測。`ONLINE_TEST.maxPublicPlayers=100`係今輪容量保護參數，唔係已確認嘅正式人數／容量保證，亦未做負載驗收。

## 使用流程

開遊戲江湖頁或 `https://wyc3809.github.io/jianghu-life2/?online=1`，填俠名並按「踏入江湖」。首次以既有Supabase身份建立獨立試場角色，之後同一身份沿用同一角色、配搭、名次及銀兩；入籍重送唔會重設角色或改名。

直接喺對手名單選人挑戰；離線角色自動防守。伺服器一次產生戰報，1.5秒邏輯完成後按時間補結算；雙方重返都讀同一戰果，演出／跳過／重播唔改結果。低排名打贏較高排名先互換，其他人名次不變，失敗不變，PvP唔造成傷勢或死亡。

「離線留場」或關閉頁面之後，對手仍見到你。重返同一瀏覽器會載入已結算戰果及收益。身份保留方式沿用匿名登入／設定綁電郵，清除資料前應先綁定；未做匿名身份自助轉移。

## 權威儲存與隔離

現有Supabase `jianghu-life` 專案，新Edge `jianghu-world`（verify_jwt=true，入口再Auth驗JWT），共用JWT／CORS／16KiB上限驗證。身份只由可信JWT決定，前端唔送房間或可冒認account；名稱只係顯示文字，前端戰力／排名／傷害／時間／獎勵均不接受。

- `jianghu_world`：共用角色與分頁租約，只保留待結算戰鬥，唔載入全部歷史。
- `jianghu_world_battles`：完整不可重抽戰報，按兩位參戰者及時間索引；只向當事人回傳最近10場，第三人唔能讀其他人完整戰報。
- `jianghu_world_receipts`：每身份＋requestId永久去重收據，最近20條供回覆遺失後恢復；唔沿用每房100場／500操作限制。
- `commit_jianghu_world`：SECURITY INVOKER、固定空search_path，以revision條件UPDATE，再喺同一交易寫戰報與收據；失敗全部回滾。只service_role有execute，瀏覽器連RPC都無權直接呼叫。

三張表RLS全部開啟，撤回PUBLIC／anon／authenticated權限，刻意無前端policy。service key只讀Edge環境，永不回傳前端或入repo。所有查詢history／receipts按已驗身份過濾；名單只含名稱、名次、在線／保護／busy狀態。

Node本機兩帳戶原型仍只限loopback開發，與新共用江湖分開；核心命令與結算已支援動態玩家ID，唔再將river／cloud寫死入戰報。舊房間表留作歷史資料，EA0.82.0發布後舊公開房間API停止接受指令，提示重新整理；唔將舊房間或單機存檔偷偷轉成正式角色。

## 試場數值與後續

各身份由伺服器建立同一初始能力與武學嘅試場角色，按入籍次序取得初始名次；唔信任／匯入原有單機角色戰力。俠名2–12字，重名可存在，以身份分開。

沿用非正式測試值：30秒敗方保護、主動攻擊解除；在線每分鐘10／離線1試場銀兩、48小時離線上限、2秒心跳／8秒租約；40回合平手後備。收益只計江湖試場頁在線，離開江湖面板即離線留場，唔宣稱已接全遊戲全頁在線收益。此點與舊原型一致，日後統一全遊戲presence再擴展。

Edge係短請求，冇常駐世界程序；完成時間及結果已保存，下一次任何行動／讀取按伺服器時間補結算，唔靠雙方同時在線。全員關頁亦唔會遺失已產生嘅戰果／待領收益。

試場100人上限未當正式容量；共用世界CAS仍係封測架構，未做分區／排行分片。正式角色遷移、幫會／門派戰、經濟定案、營運及容量驗收留待後續，原有人生／玉石／銀兩／演武及存檔不變。

## 重建及驗收

`node scripts/buildOnlineEdge.mjs` 產生ignored `.local-online/world-edge/index.ts`、`deno.json`，只部署呢兩檔到 `jianghu-world`，維持verify_jwt=true；唔重新發布舊pair bundle。

DDL由CLI產生migration，再用Supabase apply_migration部署，檔名對齊遠端版本20261021134428。Auth匿名登入與原Actions Supabase variables沿用，Pages繼續 `VITE_ONLINE_PUBLIC=1`。無新建付費主機或其他專案，亦冇新增第三方邀請訊息。

`tests/online_shared.test.ts`驗三人同世界、重送不重設、動態ID、只互換兩人、第三人戰報隔離、歷史另表、離線收益／上限／多頁及CAS安全；舊原型測試保留。真雲端三身份及獨立瀏覽器驗收特別做「乙先離線關頁 → 甲之後入場挑戰 → 甲離場 → 乙另時返場看同一戰果」，並驗第三人直接入籍、卷六、回覆遺失、重播、重開及手機尺寸。

證據：`production/qa/evidence/redesign/online-shared/`。未當iPhone真機、60fps或公開容量驗收。新Supabase advisors只有刻意全拒絕前端嘅RLS無policy INFO，舊表／Auth警告未動。
