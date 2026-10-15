# 第26項：雙方氣血一齊放頂部

玩家要求敵人同自己血條都放上邊，方便比較。今次只更新原型：敵人紅墨、自身黑墨上下兩行，共用欄寬，名字、筆條起點／終點、數字欄對齊。原型底部保留武功輪替同七卷，唔再放自身血條。正式版仍EA0.72.0，未上線。

`prototype.png`係演武首領／江湖交手實際畫面並列；`before-after.png`嘅改前係上一版原型16cf2a1，改後係本次修改。`battle.gif`係真實Canvas播放；JSON手機驗證涵蓋兩種瀏覽器、三種戰鬥、320／390／420×690／844、DPR2，以及兩條血條喺頂部同寬對齊。唔當實機驗收。

重跑：DEV伺服器用5177，依次執行：

```bash
QA_EVIDENCE_DIR=production/qa/evidence/redesign/unified-battle-top-health PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureUnifiedBattle.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/unified-battle-top-health node scripts/qa/recordUnifiedBattle.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/unified-battle-top-health python scripts/qa/packageUnifiedBattle.py
```

原型fixtures、底部暫定方案及生成素材限制見上一版`../unified-battle/README.md`。
