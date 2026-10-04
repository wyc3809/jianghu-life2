# ADR-003：雲端存檔＋排行榜用 Supabase

- **狀態**：Accepted（EA0.49）
- **決策者**：製作人（用戶選擇 Supabase、匿名＋可綁電郵、雲端存檔＋換機同步）

## 背景

玩家要求「做排行榜、數據上雲端」。遊戲係純前端（GitHub Pages 靜態部署），冇自己嘅伺服器。

## 決定

用 **Supabase**（Postgres＋Auth＋Row Level Security），前端直接連，唔寫自家伺服器。

- 身份：開機自動 **匿名登入**；設定頁可 **綁定電郵**（同一個 user id 變永久），換機用 **電郵魔法連結** 登入。
- 雲端存檔：表 `saves`，每人一行，`payload` 存人生存檔＋祖蔭原文；RLS 只准本人讀寫。
- 排行榜：
  - `leaderboard_live`：每人一行（現役角色）— 江湖排名、修為境界；所有人可讀，只准本人寫。
  - `life_scores`：每完結一世一行（`user_id + life_key` 唯一）— 一生總結分。
- 數值計算集中喺 `core/life/leaderboardScore.ts`（純函數、有單元測試）。
- SDK `@supabase/supabase-js` **按需載入**（dynamic import），未設定環境變數時全部功能靜默停用，遊戲照玩。
- 同步策略（`src/cloud/sync.ts`）：本機存檔仍係主；寫盤後節流上傳（≤ 每 45 秒），頁面隱藏時沖刷；開機時雲端比本機新（> 5 秒）就以雲端覆蓋本機。

## 考慮過嘅其他方案

| 方案 | 唔揀原因 |
|------|----------|
| Cloudflare Workers + D1 | 要自己寫 API 同驗證；現有 Cloudflare 部署仲未設好 secrets |
| Firebase | 收費規則較複雜；Firestore 排序查詢要額外索引 |
| 只做本機排行榜 | 唔符合「上雲端」要求 |

## 後果

- ✅ 無伺服器維護；免費額度足夠 EA 規模。
- ✅ RLS 保證存檔私隱；排行榜公開讀。
- ⚠️ **分數由客戶端上報，可被改**。現時只靠資料表 check constraint 擋住離譜數值；如作弊成問題，下一步加 Edge Function 驗證存檔再寫榜。
- ⚠️ 「雲端較新就覆蓋本機」喺兩部機同時玩時，後開嗰部會攞到較新嗰份；舊機未上傳嘅進度可能被蓋。設定頁「由雲端載入」有確認提示。

## ADR Dependencies

- 無硬依賴；同 ADR-001（事件運行時）無衝突。存檔格式沿用 `core/life/saveIndexedDb.ts` 嘅 `LifeGameState`。

## Engine Compatibility

- Web（Vite 6 + React 19）；`@supabase/supabase-js` v2 以 lazy chunk 載入，唔入首屏 bundle。
- 環境變數 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 喺 build 時注入（GitHub Actions repo variables）。

## GDD Requirements Addressed

- 祖蔭（`design/gdd/ancestral-merit.md`）：一生總結分沿用祖蔭公式（未封頂）×10 ＋ 成就 ×5；祖蔭資料隨雲端存檔同步。

## 設定

見 `docs/CLOUD-SETUP.md`；資料表 SQL 喺 `supabase/schema.sql`。

## EA0.51.2 可靠性修正

- localStorage 同 IndexedDB 獨立保存；讀取時間較新而且有效嗰份，IDB 按序寫入。兩者都失敗會提示並保留最新進度供重試。
- 雲端 payload 喺排隊時固定時間同祖蔭；上傳按序執行，失敗保留並在 5 秒後重試，頁面隱藏／恢復網絡可立即沖刷。每次網絡請求最多 15 秒。
- 開機逾時後唔會再寫入遲到存檔；下載期間本機已改動亦唔覆蓋。已開始寫入就等寫入完成再開遊戲。
- 祖蔭購買／裝備操作會排隊同步；清人生存檔會同步空人生，保留祖蔭。比較新舊時亦計祖蔭時間。
- 呢個仍然係整份存檔同步；跨裝置同時遊玩唔係合併模式。
- CI 同發布用 Node 24；GitHub Pages 先跑測試及敘事審核。Cloudflare 缺少部署 secrets 時明確跳過，唔影響 Pages。
