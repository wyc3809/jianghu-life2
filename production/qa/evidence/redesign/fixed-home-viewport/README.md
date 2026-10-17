# 第27項：主頁固定一屏（未上線）

玩家要求當前目標下移，主頁所有介面同演武完整顯示，唔使碌主頁。

- `comparison.jpg`：同 seed42、390×690、DPR2，左 EA0.73.0 `55d5cff`，右修正。紅框標裁切及新任務位置。
- `chromium-*.png`／`webkit-*.png`：320×568、375×600、390×690、390×844、420×740、420×896。無 Safari 工具列嘅仿造外框；呢啲係真實網頁可見區截圖。
- `browser-qa.json`：主頁唔溢出／整頁唔移位、Canvas 真正尺寸與 DPR／四邊完整、功能入口點擊命中、任務詳情、可見高度變動、同一 Canvas／SparDuel 保留、分頁內容可讀。
- `extras-qa.json`：細屏奇遇待決／進行中、新手提示與過月訊息、幾種提示同時出現、事件選項。為專注排版，額外提示測試會將當前敵人血量設高，避免測試中途打入首領；唔用作數值驗證。
- `battle-regression/browser-qa.json`：148 項真實首領／江湖戰鬥、加速跳過、血量、過關獎勵一次、敗退同關重試及 Canvas 搬返主頁。直接沿用 `captureRelease73.mjs`，只將輸出目錄換成本目錄嘅 battle-regression。

主頁冇新增演出動效；呢次只改排版及畫面高度。人物等長列表同事件長內文保留局部閱讀捲動，外框、頂欄同底部導航固定。

重跑：新分支 `npm run dev -- --host 127.0.0.1 --port 5177`；EA0.73.0 `55d5cff` 獨立工作區用同一 node_modules、開 port5178。然後 `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureFixedHomeViewport.mjs`，`node scripts/qa/checkFixedHomeExtras.mjs`，`python3 scripts/qa/packageFixedHomeViewport.py`。手機 WebKit 不支援 mouse.wheel；該引擎以 scrollBy 及幾何驗證外框，Chromium 有實際 wheel 檢查；未宣稱做過實機觸控／Safari 工具列實測。

606 項 Vitest、Pages build、narrate hard-fail0 已通過。未升版本，未發布。
