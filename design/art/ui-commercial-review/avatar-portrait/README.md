# 無字水墨頭像

玩家更正：唔需要「人物」文字，直接做同一藝術風格嘅頭像。

原創透明面部及肩膊頭像：灰墨斗笠、灰青衣領、宣紙膚色、手繪輪廓及水墨紋理。頭像唔係全身剪影，冇文字；沿用現有灰墨菱形底牌，年齡提示另行保留。通用示意頭像，未按角色性別／年齡／門派自動換面。

`source.webp`保留生成原圖；`python scripts/art/prepare_avatar_portrait.py`只做256px WebP尺寸／格式準備，輸出`public/ink/art/portraits/wanderer.webp`。實際介面由InkBadge無標籤模式接入，按鈕無障礙名稱仍為「人物」。

實際圖及改前後對照：`production/qa/evidence/redesign/avatar-portrait/`。未上線，先交圖。
