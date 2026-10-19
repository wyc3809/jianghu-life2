# 主角全狀態細節人物

玩家要求演武台由頭到尾保持有細節嘅人物，唔喺待機黑影同出招人物之間跳換。沿用現有武學圖集嘅同一斗笠旅俠：炭灰衣袍、淡灰內襟、披風、綁腿及皮靴；冇新增裝備、時裝或角色屬性。

## 原圖、來源與映射

- `source.png`：本次對話圖像生成工具參照 `public/ink/art/martial/art_river_fist-guard.webp` 編輯生成，1448×1086 RGBA。原輸出 `exec-e6624284-713f-4ebd-9a23-66ab0d1ea3ba.png` 保留，冇刪。
- 同一人12姿勢：四格行路、兩格待機、兩格受擊、四格倒地。無武器、無字、無陰影／地板、真透明；出招仍用既有103門圖集，唔拿12姿勢冒充103套武學。
- `manifest.json` 保留原圖／產品hash、每格真實來源座標、固定比例及腳底錨點。
- `public/ink/spar/hero-detail/lifecycle.webp`：2048×1056，4列3行，每格512×352，腳底256／328；約200KiB。保持倒地同站立同一人物比例，唔將低矮倒地bbox放大。
- `src/fx/art/heroStanceScale.json`：從103門主圖及30套暴擊／擊倒／內功細節守勢計算固定身高校準，排除幼長槍尖。玩家追加要求「全程都細」後，所有人物用同一細比例，各套圖按本身守勢校準一次；生命週期唔再跟上一招放大，亦唔按蹲低／倒地逐格fit。保留原圖及核心時間，手部、血條及受擊提示跟畫面比例定位。
- 重建 `python scripts/art/prepare_hero_continuity.py`；只做透明連通人物分割、等比縮放、錨點對齊、編碼及映射，唔繪製或重畫人物，無SVG。
- 來源係本次工具生成及專案既有原創素材，冇新增第三方照片、商標或角色。未另外宣稱商用授權審計。

待機可用當前／上一門武學圖集嘅同款守勢，維持正確持武。行路、受擊、倒地用生命週期圖；空手步行冇疊錯誤裝備劍。無武學嘅基本攻擊用既有長河拳人物序列作一般肢體呈現，唔新增武學或攻擊結算。全部網絡圖失敗時先解碼嵌入細節人物後備，使用靜態姿勢及現有倒地／淡出節點，唔聲稱仍有完整12格。

細比例由 `HERO_VISUAL_SCALE = .65` 統一設定；參考身高用手機視窗闊度乘`.23`（桌面上限420px），唔跟頁內留白或全屏畫布高度。每套出招圖顯示比例係 `.65 / heroStanceScale[id]`，生命週期固定`.65`。嵌入後備按 `MARTIAL_FALLBACK_ART` 真正來源校準，唔按未載到嘅招式。待機唔再用垂直scale扮呼吸；103門武學、結果收勢及12幀驗證見 `production/qa/evidence/redesign/hero-small-scale/`。

## 完整生成提示

Create a production-ready 4-column by 3-row CHARACTER ANIMATION SPRITE SHEET, exactly 12 separate complete full-body poses, TRUE TRANSPARENT background. This reference is the established hero of our Chinese wuxia mobile game. Keep exactly this same adult male traveler: weathered broad conical bamboo hat, visible natural face and hands beneath brim, layered charcoal gray robes with clearly lit woven cloth folds and seams, pale gray inner lapel, tattered charcoal cloak trailing left, muted brown sash, wrapped black leather boots. Painterly realistic detailed Chinese ink-wash game sprite, readable cloth detail at small mobile sizes, warm gray midtones and highlights, NOT a featureless black silhouette, NOT a new colorful costume. Same identity, hat, clothing, build, body proportions, scale, camera, and gentle upper-left lighting in all 12 cells. All poses face RIGHT in a consistent side / slight three-quarter view. NO WEAPONS in any pose, hands empty, no energy effects, no particles, no shadows, no floor, no text, no cell borders or numbers. EXACT LAYOUT: Row 1 cells 1-4 = four distinct frames of a natural RIGHTWARD WALK cycle: left heel contact, left passing step, right heel contact, right passing step, arms relaxed and cloak naturally trailing. Row 2 cells 1-2 = relaxed combat-ready IDLE with empty hands, two subtly different breathing poses, upright and calm; cells 3-4 = RECOIL from a hit: brief backward recoil then protective hunched recovery, hands guarding torso, not attacking. Row 3 cells 1-4 = a continuous DEFEAT / FALL sequence from a hit arriving from the right: 1 knees bending and body leaning back, 2 one knee touching ground, 3 controlled sideways fall towards left, 4 lying fully on left side on the ground with hat still recognizable. All 12 remain the same full-size human, do not shrink the fallen figure to match a standing bounding box. Fixed equal 4x3 cells, wide transparent gutters, every hand, cloak, hat, foot must stay entirely INSIDE its own cell with safe margins. No figure touching its neighbor. Render each pose crisply with real cloth/material detail, consistent face and hands, correct limb count. This will be split into separate frame PNGs so absolute clean transparency and clean separation are essential.
