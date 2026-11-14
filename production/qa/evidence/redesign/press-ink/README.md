# 按下落墨 · EA0.110.1

按下即在指尖落一點墨，短暈染後自然淡出；配合已上線的壓感、木印聲與原生Haptics。放手不追加，長按不重播。拖動超9px或取消時收走當次墨跡，捲動／背景／減少動態清理；開卷、創角及遊戲共用同一層，原生彈窗亦可見。

before-after.jpg為同一固定隔離存檔的人物頁實畫，之後取自正常速度錄影中按下尚未放手的一幀，沒有停鐘或另造墨跡。before-report.json顯示舊版按下畫布0、放手後1；新browser.json驗證按下已有可見墨像素，位置接近指尖，放手不追加第二組。press-ink.gif為遊戲真正操作正常速度錄影，未另造按鈕或加速動畫；after-down-390.jpg、dialog-down-390.jpg、start-down.jpg與create-down.jpg保留實際畫面。

Chromium 320×568、390×844、430×932：墨點定位、單一畫布、放手不重覆、拖動／取消清理、長按不重播、真三連按各三次、鍵盤、原生觸控touchEnd前落墨、非主鍵／disabled／高光遮蔽不落墨、閒時停止、原生彈窗內可見及關閉清理、系統／遊戲減少動態中途清理通過。預覽不改裝備、外觀、武學、收藏及玉石，沒有pageerror或橫向溢出。新開卷及創角亦驗證按下可見。

144檔1,050項、Pages構建、敘事hard-fail 0、文案禁句0處及diff通過。重跑：VITE_ONLINE_PUBLIC=1啟動5311埠Vite後python3 scripts/qa/checkPressInk.py；PRESS_INK_BASE可改正式網址。歷史checkTapInk.py保留舊版放手契約，現行以新腳本為準。

墨心透明度上限.46，暈染.24，範圍44px、最多三處、520ms內清理；沿用位圖、無模糊／混色濾鏡及額外遊戲RNG。沒有新增畫面文字或改玩法、存檔、黑影。網頁可見墨跡不代表iPhone硬件已驗收；新TestFlight需重新建置安裝，Mac Archive與Apple上傳分開確認。
