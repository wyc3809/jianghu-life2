# 第70項：按鍵壓下、回彈、聲音及原生觸覺

玩家表示EA0.109.1按鍵仍欠質感，並要求繼續。本輪只加強回饋，沿用水墨宣紙及器物外觀，沒有重設玩法或人物動畫。

## 實測根因

- 舊版只有scale .97與brightness .94，放手即還原；設定按鈕自身transition覆蓋了共用scale transition，快按不易察覺。
- haptics只用navigator.vibrate，原生iPhone未有Capacitor Haptics接入。
- 共用pointerdown及局部onClick均可能播tap，拖動起手亦會響；新方案只在真正click播短木印聲，同次共用／局部呼叫65ms內合併。

## 實作

共用anime.js獨立CSS變數控制壓下約6%、下沉2px，放手240ms內到1.022倍／上提1px再回原位；暖色陰影與亮度同步，不覆蓋原有transform定位或重設紙／朱砂底。動態偏好、背景、拖動、離場及同按鈕重入均有清理，不阻塞或重發指令。

初次邊位測試發現整個按鈕縮放會使觸控click落到外層。增加透明反向縮放命中層，保留原生click及React事件路徑；同一按鈕連按重用該層，不在pointerdown移除當次命中節點。動畫結束層display:none，不攔操作；按鈕卸載時隨父節點清除。拖動立即取消按壓、釋放指針及關閉命中補償。這不是派發人工click補救。

原生App以@capacitor/haptics官方插件接輕／中／重impact及通知，設定開關與減少動態保持；主要確認鍵是中級、普通入口輕級。可用瀏覽器仍走vibrate後備，iOS Safari不宣稱有原生觸覺。Swift package及HapticsPlugin註冊均由cap sync產生，ios:verify會拒絕插件漏接。

## 驗證

320／390／430三尺寸真正25ms短按，最小scale約.94、最大1.022，之後還原。實際三連按各三次、鼠標及觸控邊位各一次、對戰配搭切換、真觸控滑動不點擊、鍵盤與減少動態、外觀／裝備／收藏不變均通過。真修煉只扣一次及掛機焦點仍通過。

證據在production/qa/evidence/redesign/button-feel：正常速度GIF、同一設定按鈕前後、瀏覽器逐幀度量、實際WebAudio錄音及音量報告。原生硬件份量未有真iPhone驗收，程式測試／Mac Archive不當成已實機通過。
