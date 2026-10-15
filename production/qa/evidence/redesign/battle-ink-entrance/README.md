# B · 全屏墨暈揭幕原型

玩家揀B（先討論轉場，再做原型）。宣紙全屏淡入180ms，中央墨暈位圖揭幕540ms，總720ms。血條／武功欄跟戰場一齊露出；揭幕完成先解除播放閘門，唔遮首擊。開咗減少動態就140ms快速淡入，唔載墨暈素材。缺墨圖用相同快速淡入後備。

- `entrance-spar.gif`／`entrance-event.gif`：真Canvas及DOM逐格播放，唔係概念圖；原型結束定格900ms供睇清楚，唔係遊戲額外停頓。
- `storyboard-*.png`：0／160／320／480／640／800ms實際轉場截圖。
- `chromium-*`／`webkit-*`：揭幕之後、第一次交手嘅390×844／DPR2實際畫面。
- `paper-coverage.json`：紙底四角完全不透明，揭幕前血量保持不變。
- `browser-qa.json`：198項通過；三類戰鬥、兩種瀏覽器、320／390／420×690／844，核對全屏遮罩、揭幕期間HP不變、操作暫停、完成後解除、第一次交手、跳過，以及減少動態／缺墨圖後備。

Chrome擷取轉場用Playwright虛擬時鐘固定時間，每40ms取真實瀏覽器畫面；GIF為390×844／DPR1，PNG交手圖為DPR2。WebKit虛擬時鐘擷取曾崩潰，最終改用正常播放核對流程，唔當逐格時序驗收。呢個係排版／流程驗收，唔當真手機幀率測量。墨形係AI生成位圖，Canvas只做紙底與透明位圖合成，唔用SVG／程序路徑畫墨。

重跑：DEV 5177；`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureBattleEntrance.mjs`，再`python scripts/qa/packageBattleEntrance.py`。紙底回歸檢查：`node scripts/qa/checkBattlePaperCoverage.mjs`。

仍係DEV隔離戰報原型，正式入口／EA0.72.0未變；唔改難度、傷害或獎勵。底部武功暫定方案沿用第26項。素材出處：`design/art/unified-battle/entrance/README.md`。

605項Vitest、Pages build、narrate hard-fail0通過（2026-10-15）。紙底有不透明紙色底層，避免原紙紋素材嘅透明邊提早漏出畫面。
