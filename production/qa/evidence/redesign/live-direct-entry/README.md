# 同遊江湖一按直入 · EA0.116.1

玩家要求入同遊即加入，省去第二次「加入同遊」。首次入頁直接走原liveEnter及本世對戰配搭保存／身份驗證，成功後補讀不重複加入；失敗可重連，online／回前景補試。退出成功返回原入口；另一分頁退出時亦返回，不自動重新參與。開紅仍手動，原紅名／名次／敗方保護／經濟與戰果保持。

- 151檔1,084項Vitest通過；新增核心測試驗重入保留紅名、名次、銀兩、角色及30秒戰敗保護。
- Pages構建含TypeScript、敘事hard-fail0、玩家文案禁句0及diff通過。
- scripts/qa/checkLiveDirectEntry.py：真React UI及StrictMode，mock同遊傳輸，全部Supabase請求攔截503，沒有新增身份／真聊天／後端寫入。
- 首次只一次liveEnter，沒有加入按鈕；Realtime連續通知及online補讀不再次加入；退出不重加、重新進頁可加入；失敗後online恢復；另一分頁退出返回；新參與者沒有自動開紅。pageerror0。
- 320×568、390×844、430×932無橫向溢出。comparison.jpg用同一mock資料及舊版EA0.116.0元件作修改前，最終元件作修改後；live-*.jpg為三尺寸。

前後對照可用LIVE_ENTRY_BEFORE=1重做；工具暫存舊元件於同目錄，成功後刪除，未接正式輸出。UI的mock測試與核心服務測試分開，不宣稱本輪新增真多人／容量或真iPhone驗收。CI、iOS未簽署Archive、正式Pages另核；沒有Apple上傳結論。
