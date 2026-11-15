# EA0.114.0 · 幫會及門派重啟驗收

玩家明確要求完成幫會及門派，接續第57／59項，取代暫停；沒有合併PR #156已否決的人體。規則與邊界見docs/online/guilds.md、sect-war.md及第78項。

- cloud.json：20個獨立匿名身份，非20名真人；真Edge／RLS驗兩派各十席、同ID／反向挑戰同一20人戰報、20份原雲存檔hash不變；創會／遞帖／審批、跨幫及職位越權、成員唯一、傳位／任免、24並發補讀不寫入、同ID接納／城戰／建設只生效一次。新五表前端直讀拒絕，組織RPC只service可執行。
- 城池先驗正常五分鐘整備拒絕，再以管理工具只回溯自建測試幫的洛陽heldSince／accruedAt及整備時間，快速驗十小時收入；不是改真玩家城池或聲稱真的等了十小時。原真公式攻城、易手前結清舊幫、幫庫建設只扣一次都通過，不改私人錢包。四個同人並發發言一成功／三429，已成功及限頻後原ID重試皆200。
- browser.json：三個Chromium context，將15秒輪詢延長60秒仍以真Realtime1.436秒收到幫眾訊息，外幫不可見；不是延遲SLA。三手機尺寸320×568／390×844／430×932、幫會全屏、原生管理確認取消、同門對話、真20人固定戰報、暫停像素穩定、繼續／跳過、返回恢復HUD與原能力／心性／裝備／配搭／造型／武學保留，pageerror／console／HTTP錯誤0。
- entry.json：另一個未入幫測試身份，從真畫面創會、解散取消後再確認、遞帖、幫主即時見申請並接納、新幫眾即時入幫及退出；390×500短視窗聚焦輸入與提交可見。沒有只用API當表單驗收。
- guild-hall、recruitment、create、application、guild-confirm、guild-chat、treasury及cities三尺寸為實際新功能；keyword-390為短視窗。實際檔名為keyboard-390.jpg。
- sect-lobby、sect-chat、sect-battle三尺寸及sect-result為真戰報。正式人物用原斗笠完整位圖及同幀兵器握點，肖像用現有完整漫畫立繪。第一次畫面檢查攔下人物重疊，before-after.jpg顯本輪修正前／後，同一戰報約兩秒的不同暫停時點；只比較投影，不比較氣血／退場人數。
- sect-battle.gif取本輪真瀏覽器原錄影四秒、12fps／320px、正常速度，沒有另造動畫。具體片段起點記於validation.json；五列投影只供可讀性，真碰撞仍按原同場模擬，沒有改成十場單挑。

150檔1,076項、最終Pages構建、敘事hard-fail0、禁句0及diff通過。新核心測試涵蓋權限／並發／重試／資材／建設／退幫不能洗次數／隔日／解散／無傷亡錢包；客戶端測試驗429及token續期仍沿用同一指令ID。

資料庫先完整BEGIN／ROLLBACK驗SQL及authenticated無RPC執行權，再apply migration；所有新增表開RLS／拒絕前端直讀，SECURITY INVOKER固定search_path，沒有service key入前端。原有[私有表RLS無前端policy提示](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)屬刻意拒絕；本人匿名登入通知沿用原own-row policy。新訊息不混入舊公頻或世界JSON。測試憑證只在ignored .local-online，最終精確清理二十個身份及其幫會／城池／名冊／訊息／戰報，保留真玩家。

首輪測試曾用舊幫名再創會而被正確拒絕，已改測試新名稱；未刪或跳過測試。未聲稱大規模負載、完整歷史成長反作弊、真iPhone／VoiceOver或Apple簽署上傳。iOS Archive及正式站版本以PR／Pages實錄另核。
