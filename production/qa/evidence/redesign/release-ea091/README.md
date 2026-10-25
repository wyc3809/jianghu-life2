# EA0.91.0 發布驗收

2026-10-25。玩家已檢視第43、44項原型並回覆「上線」。本批發布書頁缺卷自選、重複轉頁、升階、四模式武學效果、演武熟練、整套一次耗內／回內、雙配搭及免費玉石獎勵；數值仍屬封測候選。前後圖、真操作與逐招GIF見../martial-economy-v2/。

本輪發布前107檔820項Vitest通過，Pages正式構建含TypeScript、敘事hard-fail0及9788段文案禁句0通過。iOS本機同步及793資源驗證通過；Apple版本維持1.0，未簽署或上傳TestFlight。測試／構建完整log一併保留，只正規化行尾空白。

多人Edge由jianghu-world v1更新至v2，沿用verify_jwt=true、同一世界及既有資料表／CAS函數，不改schema、不清除玩家或歷史。加入固定capacitor://localhost來源；任意來源、偽造身份／戰力仍拒絕。舊版target及收據保留相容；已有雲端存檔但無雙配搭時，合法舊配搭指令仍保留。

遠端冒煙結果見edge-smoke.json：兩個隔離驗收身份透過真Auth、雲端存檔及Edge確認新舊角色／雙配搭讀取、iOS來源及RLS封鎖。未向現有玩家發起測試戰鬥，未將HTTP模擬稱為iPhone聯測；戰鬥／限次派獎的並行與重試由受測核心／儲存介面覆核。真機舊TestFlight與完整多人聯測、跨裝置權威錢包、最終配平、歷史境界補領政策及幫會／門派戰仍未完成。

資料庫安全advisors覆核：共用世界表RLS開啟且不設瀏覽器policy是預期後端專用設計，表grant及RPC execute另由真身份測試拒絕；現有匿名登入與公開榜單提示保留，不為消除提示改動既有身份流程。本輪無新資料庫權限。

本提交交CI／Mac未簽名archive驗證；合併後須再核對Pages真正bundle及正式網址操作，結果記於發布PR及本目錄live證據。唔用本機構建或未簽名archive冒充網頁／TestFlight發布。
