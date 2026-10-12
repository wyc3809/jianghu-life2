# EA0.65.0 發布驗收

玩家已確認上線，另授權真氣血／難度、人物圖示、統一字體、戰力與人物排名四項改動。

seed42、完成新手、103銀兩、600免費玉石，390×844、DPR2；320／420同情境。掛機及對打照常運行，後續截圖數字會更新。

- `comparison.png`：實際改前／改後紅框對照。
- `home-*`：三個手機尺寸；`person-390.png`及`combat-390.png`：人物排名、綜合戰力及數值拆解。
- `spar-health.gif`：實際對打，同步角色及演武氣血。
- `validation.json`：9項通過，無頁面錯誤或失敗請求；檢查手機溢出、圖像人物入口、字體、真氣血與上限、主頁戰力及人物排名／詳細頁。

574項Vitest、build、audit:narrate通過；實體手機未驗證。演武敗退最低保留1點，1.6秒休整完成後退關回滿，不會因掛機死亡。戰力權重／階級與敵人成長放測試參數，存檔格式不變。

重跑：Vite5175後 `node scripts/qa/captureRelease65.mjs`、`python scripts/qa/packageRelease65.py`。對照字體NotoSansCJK，環境未有文泉驛。
