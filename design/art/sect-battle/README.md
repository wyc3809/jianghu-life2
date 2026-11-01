# 門派會武 · 直版水彩實作

玩家指定橫版二十人水彩群戰改為直版，採用 `selected-portrait.png`。實作為可點選人物的 Canvas 戰報，並非把整幅概念圖鋪作假戰鬥。

## 原始素材與來源

本目錄原圖由本次設計工作以 Image Gen 原創生成，逐字提示存於 `prompts/`；不是外部遊戲截圖或下載素材，不標註不存在的 CC0／第三方開源授權。使用權依生成服務及帳戶條款處理，原圖及來源記錄保留供交接。

| 原圖 | 用途 |
|---|---|
| `selected-portrait.png` | 玩家選定直版方向，來源 exec-38a22821-d9b7-47af-8ac0-b5cae2347a83 |
| `sources/backdrop-original.png` | 暖宣紙、兩側淡墨與單一地線，沒有烘焙操作文字 |
| `sources/traveller-original.png` | 旅人完整身體十二姿勢 |
| `sources/scholar-original.png` | 長衫完整身體十二姿勢；第一稿及重排提示另存 |
| `sources/cloak-original.png` | 披風完整身體十二姿勢；修邊前稿另存 |
| `sources/flags-original.png` | 青玉／朱砂旗幟，自創紋樣 |
| `sources/controls-original.png` | 暫停／播放／跳過／名冊透明操作圖示 |
| `sources/portrait-ring-original.png` | 細乾筆肖像環 |
| `sources/weapons-original.png` | 七類完整兵器，握柄及尖端人工標定 |

頭部、頸材、足影與輕微墨擊沿用遊戲已有原創素材，來源與授權見 `../appearance/README.md` 及既有多人原型素材文件；紙框、返回、乾筆線及字型沿用 `../parchment-ui/README.md`。正文是真文字，標題用已有毛筆字型，並非生成圖中的字。

## 處理與映射

執行 `python3 scripts/art/build_sect_battle.py`，需 Pillow、numpy。以真 alpha 連通區擷取三張圖的各十二個完整身體；不能按等寬格硬切，因為衣袖跨格。只清除極淡邊緣及孤立亮色雜點，沒有重新畫手腳或拉伸四肢。

- `*-landmarks.json`：原圖的頸口與前握手實際座標；兵器另有握點、尖端與包圍盒。
- `src/sectBattle/layout.json`：完整姿勢、固定原圖倍率、腳底、領口、手掌錨點。
- `src/sectBattle/weapon-layout.json`：裁切後兵器的握點及實際方向向量。
- `src/sectBattle/assets.json`：執行 WebP 路徑；原圖不進入 App 套件。
- `src/sectBattle/fallback.json`：同一原畫的小尺寸內嵌後備；載入失敗不換黑影或另一個人。
- `validation.json`：輸出大小及 SHA-256，可核對重建結果。

十二姿勢為 idle、walkA、walkB、windup、strikeA、followA、strikeB、followB、hurt、guard、down、jump。頭部與衣領共用已修好的真頸材，身體姿勢不拆成獨立肢體骨架。三套剪裁、四種布色及八款頭部沿用既有造型資料。調色只作用於可識別布料，不逐幀讀像素；快取有上限，開戰前分批預熱。頭部與頸材另合成最多24種二倍密度透明快取，不逐幀重做頸部裁切，開戰前按真名冊分批準備。

畫面只對擠在一起的站位作展示展開；比例固定、所有地面人物共用一條腳線。騰空只加垂直位移，不改角色身高、傷害、目標或範圍。正式結果及完整播放時間軸從伺服器取得，不由畫面動作決勝。
