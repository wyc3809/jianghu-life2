# 主角全程細比例驗收

玩家要求人物保持細比例，唔再隨待機／行路／出招變大變細。呢批接PR #126細節人物修正，基線係上一批草稿8ab12fa，唔係正式版黑影；正式版仍EA0.78.0，未部署。

- `comparison.jpg`：改前／改後390×844 DPR2真正產品頁，seed42、免費600／付費0；暫停update固定同一拳守勢及位置，紅框標示人物。呢張係狀態檢視，唔冒稱自然戰鬥同一幀。
- `fixed-scale-poses.jpg`：產品drawWarrior直接畫各姿勢，原尺寸，冇後製縮放人物；拳／劍／珍本真暴擊及擊倒收勢／內功／行路／待機／受擊／倒地。
- `scale-report.json`：真正呈現器逐套讀103門主圖及30套收勢／細節，共133套，用守勢像素身高核對實際drawImage尺寸；390尺寸守勢身高約54.56 CSS px，誤差上限0.02px。此數係校準身高，蹲低、踢腿、披風及兵器自然改輪廓，唔會按bbox反向放大。12生命週期幀固定同一draw尺寸；換103門後行路／受擊／倒地尺寸不變。
- `report.json`、`home.mp4`、`event-boss.mp4`、`home-preview.gif`：真正主頁演武、演武首領、江湖普通及首領交手，另320／390缺圖／420及減少動態；逐幀追蹤人物來源／繪圖尺寸、可見性及頁面錯誤。影片係正常速度，24fps只係交付編碼，唔作裝置fps或iPhone真機驗收。
- `vitest.log`：89檔656項全部通過，包括換招生命週期、基本攻擊、後備真圖及頁內留白／全屏切換尺寸回歸；原有66外功×900步核心事件／敵方行動一致。
- `build.log`：Pages build含tsc通過；`narrate.log` hard-fail0；`browser.log`、`scales.log`保留最終瀏覽器及校準執行結果。

重跑：兩個Vite工作區各用獨立cacheDir（5174基線8ab12fa、5173改後），`HERO_QA_FOLDER=hero-small-scale HERO_QA_BASELINE=8ab12fa HERO_QA_TITLE='主角全程細比例 · 改前／改後' python scripts/qa/checkHeroContinuity.py`；校準用 `python scripts/qa/checkHeroScale.py`。

驗收工具修正歷史：第一次兩個Vite共用symlink node_modules快取，導致第二頁React載入錯誤、鎮居入口逾時；分開cache後重跑。第一次尺寸探針等待下一張圖時被產品RAF繪圖覆蓋最後一次draw記錄，產生假細尺寸；探針固定停止render／update後重新讀真正人物繪圖。兩次失敗唔當產品通過，未改產品hook或測試時限掩蓋錯誤。

第一輪真正入口檢查亦搵到頁內演武轉全屏時，舊motionHeight令同套圖由80.96px變60.56px高；來源／可見性通過唔代表尺寸完成。原報告保留喺 `history/height-dependent-report.json`。最終改用手機視窗闊度固定，避開畫布高度及頁內留白變動，重新跑全部入口。影片亦改為從人物載入完成先輸出，移除瀏覽器初始白頁，冇改播放速度。

最終七組共1,948幀：舊主角黑影0、無人物繪圖空格0、pageerror0，同一圖集draw高度漂移0。包含真正63幀倒地；133套守勢校準及12生命週期尺寸通過。主頁GIF係正常影片第2至10秒、12fps及原手機尺寸場景裁切；冇後製放大／縮細人物。
