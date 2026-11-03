# EA0.101.0：共用連續蒙皮人物

玩家在看過v02近鏡後確認「Ok!套用哂再上線，以後用呢個標準」，授權現有單人模式及造型套用與發布。此資料夾記錄正式接入；舊原型及v01不因本次通過而變成合格版本。

## 畫面與操作

- `person-390.png`、`wardrobe-390.png`、`home-390.png`：真App、390×844、DPR2，預覽／確認換裝、回主頁、重開後沿用同造型，沒有改配搭、內力、玉石或書頁。
- `webkit/browser-report.json`：Linux WebKit的320×568、390×844、430×932與素材後備檢查。不是iPhone／Safari真機。
- `battle-spar.png`、`battle-event.png`、`battle-event-boss.png`與`battle-operation.webm`：真交手元件、隔離真引擎戰報、正常速度及加速／略過／重播操作。使用兩個造型快照檢查共用renderer，不連接真人配對或多人後端，不能當作在線服務驗收。
- `battle-browser-report.json`：Chromium及Linux WebKit各三類交手、加速、連點略過、重播、localStorage不變、無pageerror。另各自用正式renderer實畫96造型×兩朝向×六姿勢=1152次；不是另一套假人體繪圖器。
- `before-after.png`：EA0.100.0的真正舊renderer與新renderer、同一topknot／traveller／ink ID、固定400px角色顯示身高、同一待機姿勢與高解像立繪輸出。是隔離renderer對照，不冒稱兩版素材相同或原生實機錄影。

## 真位圖連通與程式檢查

`bitmap-connectivity.json`：以官方Runtime計算臉／胸材質點，檢查最終有損WebP的連通像素。24套、待機／出拳／受擊／行走共2064幀通過。alpha門檻160、點位只在兩像素內找最近不透明像素，沒有直接取最大元件來掩蓋分頭。原圖頸柱另維持alpha≥200。這些攔截斷面，仍不代替解剖及自然度的畫面評閱。

完整123檔955項測試通過。曾在同時跑瀏覽器及構建時出現三項5秒逾時；停止畫面工作後，維持相同測試及容差重跑完整套件，98.52秒全部通過。沒有放寬時限、跳過、停用或刪測試。普通構建、Pages構建、敘事及文案檢查見`checks.txt`。

角色身高及每幀原點保持固定，裁透明邊只改圖集位置。原圖、24連續上身、99動作幀／套、同幀握點、兩張高解像靜態／套、原型及失圖後備均保留。真正入口、素材來源與重建流程見`design/art/spine-character/PRODUCTION.md`。

## 不能從這份記錄推論的事

沒有真iPhone／WKWebView、原生前後台、溫度／耗電／長跑、原生Spine Editor回合或新TestFlight驗收。瀏覽器實播及影片標稱幀率不等於真機60fps。正式手機畫面改為離線Spine位圖幀，未把原型WebGL軟件繪圖慢幀數字當作此版成效。

沒有改核心數值、卷序、扣內／回內、經濟、裝備、存檔格式、結算或獎勵；沒有重啟幫會／門派戰、PR #156或新增多人功能。
