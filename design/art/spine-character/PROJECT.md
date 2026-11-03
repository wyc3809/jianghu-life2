# Spine 人物母版與動畫審閱

更新：2026-11-03。狀態：玩家已接受完整母版，按該母版製作待機、出拳及受擊。已輸出真Spine 4.2資料、七個加權網格及官方Runtime審閱頁，接入App開發／內測入口；三段動作品質待玩家評閱。沒有上線。

## 本輪決定

玩家否決 PR #157 原型的頭身比例及接駁。先前 941 項測試只代表既有數值及程式檢查通過，不代表人體、美術或動作驗收通過。舊原型保持草稿，不能據此進入實戰整合。

玩家指定改用 GenielabsOpenSource/spine-animation-ai，並表示已取得其商用授權；其後亦明確確認同時持有 Esoteric Software 的 Spine 編輯器授權。按玩家提供的兩項確認進行，不向玩家索取授權密鑰。尚未在此環境啟動編輯器、匯入或完成原生匯出驗收。

## 已安裝與可重現資料

- 上游：<https://github.com/GenielabsOpenSource/spine-animation-ai>
- 固定來源：`702b71689cac826efee942ee4564fef9560d6ef8`。
- 完整技能：`/home/agent/.codex/skills/spine-animation/SKILL.md`，包含 scripts、references 及原授權資料；不是只複製說明文字。
- 執行依賴隔離於 `.local-online/spine-ai/venv`；備份執行腳本放 `.local-online/spine-ai/scripts`。不將環境路徑寫入遊戲，不修改正式依賴。
- 上游五個腳本與本機 SHA-256 及 CLI 檢查見 `installation.json`。
- 素材生成使用本輪可用的圖像工具；所選skill的可選Gemini自動生圖步驟未執行。實際運行所選skill的`position_parts.py`、`build_spine_json.py`資料生成函數、`make_atlas.py`及`generate_spine_player.py`，保留原始自動對位與人工修正。沒有用完整圖片晃動代替這些資料。
- 審閱播放器使用官方`@esotericsoftware/spine-player`固定`4.2.120`，Runtime授權與毛筆字OFL均隨HTML保留。普通構建不載入審閱模組；內測構建沿用`VITE_CHARACTER_RIG_LAB=1`。沒有新增正式npm依賴。

## 第一張完整母版

`sources/master-v01.png` 是本輪原始 RGBA 圖，生成來源 `exec-4a227a08-4087-4ebd-97d3-3eb3a744c386.png`，原提示完整保留於 `prompts/master.txt`。

參照既有束髮頭部及俠客勁裝作身份與藝術方向參考，整個人物一次繪製。頭、頸、肩膊及身體在同一圖內連續成形；沒有另加圓筒頸件、縮放舊頭再拼接。玩家已明確答覆「可以，按呢張母版製作待機、出拳及受擊」。這項接受只適用母版，不代表後來動作已被接受。

`sources/parts-v01.png`來源`exec-d060e3d6-1b03-4a1d-80ea-fb10aadc5595.png`，提示在`prompts/parts.txt`。由同一母版補畫遮擋區，前後臂／腿各自製作，非盲目翻面共用。頸是頭圖的一部分，不另加頸圖；母版座標的`layout.json`、解剖骨點及每頂點權重保留於`authoring.json`。七件RGBA裁切可由`build_spine_review.py`重建。原圖依生成服務適用條款使用，不自行宣稱CC0。

原自動定位七件均找到SIFT配對，但頭頸與腰線仍人工校正：衣領下移、腰帶覆蓋，不能把SIFT分數當作人體通過。手臂完整圖以肩／肘／腕的骨架權重變形，頭頸沿同一父子鏈更新，足部在三個原地動作中保持支點。未製作走跑、倒地、換裝、持武或多人場景，不冒稱本輪涵蓋它們。

本輪實際修正：官方Player會在成功回調後自動播放，現由每幀先暫停內建時間更新，只保留審閱頁固定1/60步來源，最多4步、過大dt丟棄；修正肩部跨胸權重導致的可見三角形翻面，沒有放寬翻面檢查；UI只在標籤改變時更新文字，減少無謂DOM寫入。暫停／逐幀只影響動畫，不觸發戰果。

入口：開發版`?spine-lab=1`或內測設定→角色動畫驗收；舊`?rig-lab=1`保留供追溯，不能當成被接受版本。審閱頁以專用iframe載入本地固定內容，沒有戰鬥或存檔API。為避開Chromium在不透明來源WebGL iframe截圖後失去點擊的重現問題，改用同源受信任內容；不宣稱sandbox可阻擋存檔存取，以程式不接資料API及既存存檔操作檢查驗證。此frame不得載入任意外部HTML。獨立`runtime/review.html`內嵌資料、位圖及同一官方Runtime，不需要CDN。

本輪仍需評閱動作中頭頸、肩肘、腕部、衣領／袖根遮擋及重心是否自然。美術評閱不能用「骨長誤差為零」代替。仍未在原生Spine編輯器儲存／重開／匯出`.spine`，不能把可匯入JSON說成已完成原生專案驗收；iPhone／TestFlight效能亦待實測。

本頁按鈕為各段起點重播，便於相同姿勢驗收；Runtime混合的數值測試不等於App實戰中斷已接好。真正出招接觸、中斷／控制／低內力銜接留待動作評閱後處理。量測發現慢幀後已關閉`preserveDrawingBuffer`，保留改動前後紀錄，不宣稱已達真機穩定幀率。

## 下一個製作關卡

1. 玩家先看三段連續播放及接點近鏡；有問題在此小範圍修正，不擴展全遊戲。
2. 原生Spine編輯器回合驗證及真iPhone操作／前後台／載入／幀時間／耗電，分別實測。
3. 動作通過後才接原定事件一對一replay；保留舊播放器回退，不修改戰果。

現有戰鬥、耗內／回內、數值、經濟、裝備及存檔不變；多人戰及 PR #156 維持暫停。
