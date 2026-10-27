# 全遊戲宣紙框架基準

玩家指定 `../person-screen/selected-third.png` 作「更換武器」及全遊戲框架品質基準。沿用真正文字及真實物品；不是把設計稿當整張介面背景。

- 紙色 `#f8f1e3`，墨色 `#25241f`，朱砂 `#a43c30`。
- 窄、自然磨損的暖灰赭框；明亮紙心、低對比纖維，裝備格配極淡遠山。避免古銅重框、普通網頁卡片及多重硬邊。
- 真毛筆題字、朱砂乾筆底線；正文／數字用清晰繁中，篩選及數值不可縮成裝飾。
- 主要確認為朱砂乾筆，選中為原稿提取的朱砂框，屬性增減為朱砂／灰墨小底。篩選仍採原稿的淺色圓角控制；資料分隔線可保留，毋須每一行套雙重外框。
- 器物牌章保留本身的菱形造型。此標準不代表每一頁均須全屏；演武內容、裝備欄位與遊戲規則不改。

## 素材與映射

| 用途 | Runtime 檔案 | 來源／處理 |
| --- | --- | --- |
| 大小面板磨邊 | `paper-rim.webp` | 新生成的紙框，1024²真alpha，九宮格slice48 |
| 紙心 | `paper-fiber.webp` | 原紙框中央纖維，768² |
| 完整紙材預覽 | `paper-panel.webp` | 同一原圖的完整紙面 |
| 裝備格 | `card-mountain-paper.webp` | 新生成極淡水彩遠山，1024² |
| 確認／選中頁籤 | `brush-confirm.webp` | 新生成朱砂乾筆，1536×227 |
| 題字底線 | `brush-underline.webp` | 同一筆觸圖集，1536×42 |
| 比較小題簽 | `brush-caption.webp` | 同一圖集灰墨，1024×108 |
| 增益數字底 | `brush-delta.webp` | 同一圖集朱砂，384×87 |
| 原稿選取框 | `brush-selected-reference.webp` | 從玩家選定原創稿提取，262×223；九宮格slice13或整框延展 |
| 備用長選取框 | `brush-selected.webp` | 新生成圖集原來的長框 |
| 返回／收起／箭頭／下拉 | `icon-*.webp` | 原稿提取、去背景及保留alpha，腳本記錄裁切座標 |

執行檔在 `public/ink/art/parchment-ui/`。生成提示、原始PNG、雜湊、alpha處理及重建腳本均保留在本目錄；原圖不放public、不隨App打包。框架素材為本專案原創生成稿與其衍生素材，依生成服務適用條款使用，不偽稱第三方圖庫授權。沒有SVG、CSS繪製角色、亂字或假透明。

## 字體

原稿為生成設計，未提供可查證的字型檔，不能宣稱取得原稿同一字體。使用經字形及截圖對照的 **Yuji Boku** 毛筆字款，修改子集 family 為 **Jianghu Brush TC**，實際文字可選取、可讀屏，並非圖上烘字。正文使用既有繁中UI字體，毛筆僅作題字及人物名。

來源Google Fonts；原作者、SIL OFL 1.1及來源SHA256見 `sources/OFL-yujiboku.txt`、`font-source.json`。字體原檔保留在sources，執行子集 `src/assets/fonts/parchment-brush.woff2`；授權隨App放 `public/ink/fonts/OFL-YujiBoku.txt`。原字體未涵蓋的繁字以既有楷筆／繁中文字體接續，不轉換簡體、不更改姓名。`scripts/art/build_parchment_font.py` 可重建。

## 接入位置

- `src/components/ink/parchment-ui.css`：共用token、紙框、按鈕、面板與人物／換裝排版；在main載入，Portal亦可使用。
- 人物底部視窗、裝備格／左右比較、完整屬性、普通／對戰獨立沿用既有核心。
- 主頁任務／快捷區、演武外框、修煉選項、設定／帳戶、秘笈閣／收藏／池規／心願、祖祠／名冊等共同使用紙材。演武畫布及出招數據不改。
- `HighlightFx` 結果卡／資訊框／領取、人物誌模組亦使用共用token；演出時序、稀有度身份及領取結算不改。

手機截圖、同稿對照、真操作與限制見 `production/qa/evidence/redesign/parchment-ui/`。仍為EA0.94.0本機待驗收版，未發布。
