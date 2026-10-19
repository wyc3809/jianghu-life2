# EA0.79.0 發布驗證

玩家睇過細人物前後對照及正常速度GIF後，明確要求「上線」。本次發布PR #126全程細節人物及固定細比例。

- 發布前完整Vitest：89檔656項全部通過；Pages build含tsc通過；narrate hard-fail0，記錄見本目錄log。
- 103門加30套收勢／細節守勢校準、12生命週期及七組真正入口共1,948幀驗證，見 `../hero-small-scale/README.md`；原圖、生成提示及映射見 `design/art/hero-continuity/`。
- 同一手機由演武台轉全屏，固定細比例；核心時序、距離、速度、敵人、傷害、RNG、獎勵、裝備及存檔不變。
- 發布版本四處同步EA0.79.0／0.79.0-ea；合併前核對最新提交CI，squash merge後核對Pages工作及正式網頁版本／人物素材／真實演武。

呢批只發布網頁，未更新TestFlight，唔代表iPhone真機或60fps性能驗收。
