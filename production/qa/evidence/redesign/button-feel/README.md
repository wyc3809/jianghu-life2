# 按鍵份量感 · EA0.110.0

玩家指出舊按鍵仍缺質感，本輪加強壓下／短回彈、木印落紙聲及原生iPhone觸覺。沒有新增遊戲畫面標注或改玩法。

before-after.jpg是同一設定按鈕按下時的實畫；before-metrics.json保留原scale .97及實際transition。新按壓約.94／下沉2px／暖陰影，放手240ms內回彈至1.022再回原位。button-feel.gif來自真正遊戲正常速度錄影，剪掉載入片頭，沒有動畫加速或另造按鈕。pressed-390.jpg保留完整手機情境。

browser.json：Chromium固定隔離存檔、封鎖雲端，320×568、390×844、430×932。25ms短按逐幀最小約.94、最大1.022；真三連按各三次、鼠標／觸控按最左邊1px各一次、觸控切普通／對戰配搭、滑動制服名單不點擊、鍵盤及減少動態中斷／收尾均通過。沒有裝備、外觀、收藏或玉石改動，沒有pageerror。初次縮放造成邊位漏按及舊命中層移除造成連按丟點擊，均已修正；最終使用同一原生click路徑與穩定透明命中層，拖動取消，非人工重發click。

button-clicks.wav從瀏覽器真正WebAudio master輸出錄得三次按鍵聲，非重新合成的示意聲；audio-report.json記錄1.08秒、峰值約.042，沒有削波。聲音與震動開關、音量及同次click 65ms內合併保持；滑動起手不再播tap。

原生Capacitor Haptics已加入iOS Swift package及HapticsPlugin註冊；ios:verify核對插件及2,617份本機資源。144檔1,049項、Pages構建、敘事hard-fail 0、禁句0處及diff通過。真修煉／結果只扣一次、掛機關閉焦點檢查亦通過。單元測試覆蓋原生／網頁後備、關閉與減少動態、原生Promise拒絕、聲音去重及壓下／回彈重入清理。

重跑：啟動5310埠Vite（VITE_ONLINE_PUBLIC=1）後python scripts/qa/checkButtonFeel.py；可用BUTTON_FEEL_BASE改網址。原始影片與聲音暫存在.local-online/button-feel。原生插件為新增依賴，需要重新同步／編譯及安裝新TestFlight；iOS Safari不支援原生觸覺，不能從瀏覽器或Mac Archive宣稱真機手感已驗收。沒有更改存檔schema、經濟、RNG或黑影戰鬥；遠端發布與Apple上傳分開確認。
