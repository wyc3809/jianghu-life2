# 敵我同一細人物比例

玩家以EA0.79.0手機圖指出：短版演武台主角約56px、敵人只有28px，要求以主角大小為準對齊敵人。本批保留主角比例及所有原圖，唔重畫敵人、唔新增美術來源。

- `sources.json`：25張站立原圖及100格既有倒地WebP嘅SHA256。原圖及生成記錄沿用 `design/art/SILHOUETTE-PROMPTS.md`、`design/art/spar-commercial/` 及 `data/foes/sprites.json`。
- `scripts/art/measure_foe_figures.py`：只讀透明像素、量度有足夠寬度嘅身高及腳底，寫出 `src/spar/foeFigureMetrics.json`。唔改PNG／WebP、唔繪畫角色、無SVG。
- 站立用自己原圖嘅身高及腳底校準；目標係主角生命週期待機實測身高（設計218中有204px人物）。主角手機比例保持 `.23 × .65`，敵人身高跟返同一身形；原圖長兵器、頭飾及披風仍可伸出輪廓。
- 倒地四格共用一個固定比例，由四格中最高人物推算；唔按每格低矮bbox放大。底部共用788du腳底，保留原有倒地／淡出時點。
- 一般、精英及首領同一人物身高，身份仍用原造型、朱砂／金邊及真實特性提示；移除待機垂直拉伸。受擊／撲擊原有身體動作保留。
- `enemyKe`仍處理原有企位、近身距離及時計；新`enemyFigure`只處理畫面比例／腳底。頭頂條、傷害及接觸提示跟正確畫面身高。

真正短畫布前後圖、25款位圖檢視及首領正常速度影片：`production/qa/evidence/redesign/spar-sequence-scale/`。正式版仍EA0.79.0，本批未上線。
