# 二人江湖雲端封測（EA0.81.0歷史記錄）

玩家已取消房間及同步入場流程。EA0.82.0起改用 [共用非同步江湖](shared-world.md)；唔再發布此文件嘅舊pair bundle。

玩家於2026-10-21回覆「上線」並釐清為「二人版本」。此版接駁現有Supabase專案，前端沿用GitHub Pages；唔再將本機選帳戶入口公開。

## 點玩

遊戲江湖頁有「江湖風雲」，亦可直接開 `https://wyc3809.github.io/jianghu-life2/?online=1`。房主按「開二人試場」後複製邀請連結，朋友用自己手機／瀏覽器接受邀請。房主固定沈雲舟，朋友固定謝清霜；兩人能力刻意不對等，方便驗證換位及挑戰失敗。並非正式玩家角色轉移。

身份沿用現有Supabase匿名登入，保留喺同一瀏覽器；可經原有設定綁電郵。每位玩家各自綁定一席，第三人無法入滿房；知道房間UUID亦不能冒認成員。邀請係隨機UUID，放URL片段，入場後移除。唔會寄出邀請訊息，由玩家自行分享。

離線留場或正常關頁撤回該頁租約，突斷線最多約8秒轉離線；同身份多頁租約合併。重開同一瀏覽器可返回上次試場；已開頁面固定本頁房間，另一分頁接受新邀請唔會改寫本頁指令目標。清除網站資料而未綁身份，匿名席位未設自助轉移／回收。

## 服務與資料

- 雲端：現有 `jianghu-life` Supabase（新加坡），Edge Function `jianghu-pair` + Postgres `public.jianghu_pair_rooms`。未另外租主機或新建付費專案。
- 靜態前端：GitHub Pages以 `VITE_ONLINE_PUBLIC=1` 構建。繼續用Actions既有 `SUPABASE_URL`／`SUPABASE_ANON_KEY` variables；金鑰不寫入repo。本機公開版QA用ignored `.env.local`。
- 所有請求先經 `verify_jwt=true` 平台檢查，入口再向Auth驗證JWT所屬身份。驗證成功後先查房及所屬席位；客戶端不能指定角色、排名、時間、傷害或獎勵。
- 房間表RLS開啟，刻意無瀏覽器policy，而且撤回anon／authenticated表權限。只有Edge runtime service role處理；service key只讀平台環境變數，絕不回傳前端。
- 每次提交以房間revision做Postgres條件UPDATE。競爭失敗重新讀取／執行，最多十次後回503，前端保留原requestId。收據與世界放同一列，同一CAS提交，唔會世界改咗但收據未儲存。
- 種子／戰報UUID由Edge crypto產生，每次指令內CAS重試沿用同一組。Node本機服務與Edge共用 `core/online/commands.ts`、戰鬥及結算規則。
- 封測每房最多100場戰鬥、500條有效操作收據；心跳／讀取不計。已保存收據唔會淘汰，達上限仍可讀戰報及重試既有操作。未提供清房重設。
- Edge係短請求服務，冇常駐世界迴圈。戰果及完成時間已保存；後續任何讀取／行動先按伺服器時計補結算，effective settledAt仍係原endsAt，唔需要敗方返嚟或重播先判勝負。兩人都離線時唔聲稱有背景程序即時寫入排名。
- 測試數值沿用 `ONLINE_TEST`：30秒敗方保護、在線10／離線1試場銀兩每分鐘、48小時離線上限、1.5秒邏輯完成、40回合平手後備。唔改正式經濟、舊存檔、人生氣血或傷亡。

呢個係二人自動逐招、離線防守、配搭、換位、保護、收益及戰報封測；幫會戰、門派戰、正式角色遷移、全服配對、容量及反作弊營運仍未做。唔當完整MMO上線。

## 重建／部署

1. `npx supabase --help`／migration help後，由CLI產生migration檔；本次DDL經Supabase MCP apply_migration部署，版本以遠端migration歷史對齊。
2. `node scripts/buildOnlineEdge.mjs`：從受測源碼產生ignored `.local-online/edge/index.ts`、`deno.json`。唔改核心再另抄一套雲端規則。
3. 用Supabase `deploy_edge_function` 上傳上述兩檔，名稱 `jianghu-pair`，入口 `index.ts`，維持 `verify_jwt=true`。部署會即時取代同名版本，先完成本機測試。
4. Auth匿名登入須啟用（本次已核對現有設定為啟用）；唔新增自製密碼或明文角色選擇登入。CORS只開現有GitHub Pages來源及localhost開發來源。
5. 頁面按AGENTS發布四處版本、PR、CI、Squash、Pages部署及正式網址驗證。

## 驗證

本機純規則／SQLite既有18測試保留，新增二人房間及HTTP身份／CORS測試11項，加一項跨分頁房間隔離測試。真雲端API三身份驗證雙席、第三人、非成員、偽JWT、直接表讀取、篡改拒絕、競爭重送、換位、真實離線超一分鐘、重複領取、配搭、雙方同一戰報及失敗不換位。

真瀏覽器分開身份，390×844 DPR2，實際雲端；驗證複製邀請、第三人拒絕、離線應戰、回覆遺失後恢復同一戰報、卷六招名、重播／重新載入、320／390／420觸控與溢出。證據見 `production/qa/evidence/redesign/online-cloud/`，唔當iPhone真機、60fps或容量測試。

Supabase advisors：新增房間表只有「RLS Enabled No Policy」INFO（刻意全部前端拒絕）及新guest外鍵索引未使用INFO；未改動舊存檔／舊榜的匿名政策及auth initplan警告，亦未改現有密碼政策。
