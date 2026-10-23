# 江湖淡彩地圖驗收

2026-10-23，工作分支 `work/jianghu-map`，維持EA0.86.0，未上線。承接尚未發布的第33項書面語修訂；本次範圍為第34項地圖與功能導航。

## 可檢視成品

- `after-390.png`：390×844、DPR2的實際遊戲地圖。
- `comparison.png`：同尺寸前後對照，原功能列表改為四個地標。
- `navigation.mp4`：正常速度真瀏覽器操作，包含地標、名稱、返回、主頁捷徑、人物心性與手機尺寸切換。
- `landmark-glow.gif`：真實動畫連續抽樣，展示輕微高亮呼吸；完整時序以影片為準。
- `map-320-568.png`、`map-390-720.png`、`map-390-844.png`、`map-420-896.png`：各手機尺寸；短屏捲至最底，核對城鎮名稱仍在固定導航上方且沒有被漸層淡出。
- `detail-gacha.png`、`detail-huashan.png`、`detail-founder.png`、`detail-online.png`：原有功能頁。
- `person-nature.png`：人物「五維與心性」中的原有四項心性與說明。
- `keyboard-focus.png`、`image-fallback.png`：鍵盤焦點及圖片載入失敗後備。
- `pages-build-map.png`、`pages-build-report.json`：Pages正式構建，以普通介面建立新人物後進入地圖；不匯入開發模組。

## 驗證

開發版使用隔離瀏覽器存檔、seed42、玉石免費600／付費測試0；`scripts/qa/checkJianghuMap.py` 可重跑。全部Supabase請求在本機阻斷，江湖風雲只驗證原有未登入入口與返回，不操作真玩家或遠端資料。不宣稱重驗多人伺服器、對戰與收益。

- 四個地標直接取代總目錄；只掛載所選功能，返回與底部江湖都恢復地圖。
- 建築範圍及真正文字可點擊；人物心性四項保留，原有主頁捷徑仍直達。
- 導航前後比對玉石、抽數／保底、收藏、書頁、人物武學、裝備及心性，完全相同。既有空收藏／書頁欄位以空集合與零正規化比較。
- 四種手機尺寸無橫向溢出；建築及名稱觸控高度至少44px，名稱至少16px。390×844完整顯示，320×568可自然縱捲，不裁切地圖或縮小字體。
- 真瀏覽器高亮透明度連續採樣有變化；減少動態時沒有高亮動畫。Enter可進功能；設定可開關；位圖失敗仍可進功能。
- Pages構建以 `/jianghu-life2/` 實測真實載入路徑，四處入口及位圖正常，秘笈閣與返回正常，無本機HTTP錯誤及pageerror。

完整Vitest 99檔719項通過；Pages build含tsc通過；narrate hard-fail0；文案掃描9703段、口語／禁句0。對應記錄為 `tests.txt`、`build.txt`、`narrate.txt`、`copy-audit.txt`、`report.json`。

## 重跑

```bash
npx vite --host 127.0.0.1 --port 5173
python scripts/qa/checkJianghuMap.py
npm run build:pages
VITE_BASE=/jianghu-life2/ npm run preview -- --host 127.0.0.1 --port 5175
python scripts/qa/checkJianghuMapBuilt.py
```

原圖、各輪提示、來源說明及轉檔方法見 `design/art/jianghu-map-concept/README.md`。遊戲只載入約431KiB的WebP，原始PNG不放入public。未改動玩法、機率、保底、多人服務或存檔格式；尚未部署。
