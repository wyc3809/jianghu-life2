# EA0.70.0 正式發布驗收

玩家已睇演武四季／貼地動作嘅截圖及動畫，並講「上線」，EA0.70.0 已發布。

- PR #116 squash merge，main `3ca1a2990490692f9774940251510200e0e05ba6`。
- 583項測試、Pages build、內容audit hard-fail0通過；GitHub CI／GitHub Pages／pages-build-deployment／Cloudflare Pages部署流程成功。
- 正式網址 https://wyc3809.github.io/jianghu-life2/ ，線上主bundle `/jianghu-life2/assets/index-CerZIRQS.js`含EA0.70.0、演武生成素材及固定底欄／首領獨立畫面代碼。
- 122個新WebP全部HTTP200，SHA-256逐個同已驗收素材相符。
- 用隔離瀏覽器嘅seed42本機測試存檔，透過正式版「續寫前緣」入口載入，四個月份分開context；四季Canvas確實有畫面，當季素材成功載入、任務及底欄存在，頁面錯誤0。
- `live-*-home.png`／`live-*-stage.png`係正式網站真實截圖。驗收存檔係測試fixture，唔係真玩家帳號／平衡示範；未聲稱實機性能已驗收。
- 本次只發布網頁版，iOS打包PR #115及舊封裝包冇包含呢次更新。

細項：`live-validation.json`。原有改前後及動畫證據：`../spar-commercial/`。
