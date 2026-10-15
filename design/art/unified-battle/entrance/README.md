# 墨暈揭幕B原型

玩家揀B：先全屏宣紙淡入，再由中央墨暈散開露出戰場。2026-10-14，待睇動圖，未發布。

新墨暈由圖像生成工具製作，原創單一墨池：濃黑中心、吸水宣紙嘅不規則瓣形邊同柔化墨紋，透明背景；冇人物／字／圖示／場景／SVG。保存生成結果為1254×1254無損RGBA WebP，執行素材768×768，約116KB。

重跑用repo根目錄`python scripts/art/prepare_unified_battle.py`，只做格式／尺寸轉換，唔用程序畫墨形。原生成PNG留喺執行環境generated_images，repo原圖用無損WebP保留。

紙底用既有`public/ink/ui/splash-paper.webp`；Canvas只合成紙同墨暈位圖，用destination-out揭開畫面，冇自由路徑畫墨。DOM節奏由`src/ui/inkMotion.ts`統一anime.js控制。標準720ms：180ms宣紙淡入與落墨、540ms揭幕；減少動態140ms快速淡入，唔載墨暈。

只改原型框架同播放閘門；唔改正式戰鬥入口／演武數值／傷害。首擊等揭幕完全結束先播，按鈕揭幕時暫停操作，缺圖用快速淡入後備；揭幕圖載入過久有4秒後備，唔用墨暈資料決定遊戲結果。
