# 秘笈閣 · 線裝啟封素材

原型主體係一冊可開封、逐張翻頁嘅線裝秘笈，待機舞台及抽卡高光共用 `scene/codex.ts`。書封以生成原畫貼到真3D封面，紙頁、書脊鉸位、穿線、書籤保留厚度同獨立動作；唔係單張圖片縮放。

- 原始生成PNG：`cover-source.png`，1024×1536，保留原檔。
- 產品素材：`public/ink/art/gacha/codex-cover.webp`，640×960。
- 重建：`python scripts/art/prepare_gacha_codex.py`；只縮放／轉格式，唔重畫。
- 頁面文字由真DOM排版，封面題簽留白，唔把生成亂字當武學名稱。
- 最終紙頁採用下方獨立生成嘅左右山水原畫；早期沿用紙紋已被取代。
- 來源：本次對話圖像生成工具製作原創素材，冇引入第三方照片、角色或商標。未宣稱另有商用授權審計。

## 生成提示

Create one original high-end Chinese wuxia mobile game texture asset, portrait 2:3 aspect ratio, orthographic perfectly flat FRONT COVER texture of a refined ancient Chinese thread-bound martial arts manual. Fill the entire image edge-to-edge with the book cover, no perspective, no book thickness, no background, no shadow, no mockup. Desaturated mineral teal/slate green dyed silk, beautifully tactile fine woven cloth fibers, delicately worn edges, faint engraved flowing river and mist mountain brushwork concentrated at bottom half, restrained fine aged gold border with small tasteful corner ornaments, a cream vertical paper title label on the upper right with COMPLETELY BLANK interior, NO lettering, NO symbols that resemble text, NO watermark. Along the left edge four refined ochre thread binding stations, handcrafted fabric and paper material, expensive collector's wuxia manuscript, light ink-wash game art, soft diffuse light, clean readable silhouette. Keep 75 percent of the central surface calm uncluttered silk, extremely fine material detail rather than loud ornamental patterns. This is a usable front-cover material for an articulated 3D book, so rectangular full bleed with no transparent border. No UI, no characters, no weapons.

## 內頁原畫

`pages-source.png`係本次另外生成嘅兩頁山水畫：左頁遠山松枝、右頁江流竹葉，兩邊留白一致。用作裝幀題畫，唔假冒可閱讀武學內容。處理腳本沿正中分成兩頁，縮至512×768後轉WebP，唔重畫／補字。早期純色及灰噪點紙頁已由正式內頁取代。

提示：Create a production texture asset for the INSIDE TWO FACING PAGES of an ancient Chinese wuxia thread-bound martial arts manuscript. A perfectly flat orthographic rectangular 4:3 landscape spread, no perspective, no book thickness, no cast shadow, no background. The whole rectangle is fine warm IVORY rice paper with subtle delicate fibers, NOT dark, NOT grungy. Two equal portrait pages side by side with an invisible exact center division. Original exceptionally refined Chinese light ink wash artwork: the LEFT page has pale misty mountain peaks and a slender pine branch in the lower two thirds, the RIGHT page has a delicate winding river and two bamboo leaves in the lower two thirds, evoking a hidden martial school. Keep the top third and generous margins of both pages clean empty ivory. Mineral grey-green ink, extremely restrained ochre pinpoints, soft diffuse light, fine real paper texture, sophisticated collector manuscript quality, quiet and elegant. No text of any kind, no writing, no pseudo characters, no seal lettering, no people, no martial diagrams, no borders, no center gutter or binding seam. This will be split exactly in half into two usable 3D page materials. Both halves must have matching ivory paper color, independently balanced artwork, straight full bleed rectangular edges.
