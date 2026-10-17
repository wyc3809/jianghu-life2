# 武學／流派遊戲字體原型

玩家要求字體藝術風格更遊戲化。先落實喺六派、武學名、秘笈題簽及主修標籤，保留現行淺色水墨。字體原型未上線，玩家先睇真實手機截圖。

- 題字用 **LXGW WenKai TC Bold（霞鶩文楷TC粗體）**，楷筆起收同粗細自然。固定標題按12–19px層級顯示，選派大字配清晰細字定位。
- 內文、神髓、打法定位、銀兩／玉石／氣血數字沿用統一UI字款；任意玩家姓名亦唔套有限字集，避免缺字混排。貨幣無描邊。
- 唔用生成圖片寫中文，保留真正DOM文字，保留無障礙名稱。無新增SVG或圖畫。
- 原本設定嘅Ma Shan Zheng缺少多個繁體字，唔用作今次題字。現選字款覆蓋103門武學、招式／七卷名、六派及已用UI標題，共654字形。
- 自託管WOFF2約205KiB，Vite打包成帶內容hash嘅檔名，新題字唔靠外部Google Fonts；舊入口已有嘅其他外部字款並未喺今次移除。`font-display: swap`，未載到仍可操作。

## 來源及授權

原作者：[LXGW WenKai TC](https://github.com/lxgw/LxgwWenkaiTC)。來源鏡像：Google Fonts，版本commit與SHA256見 `font-manifest.json`。按 **SIL Open Font License 1.1** 商用及修改；完整授權隨遊戲置於 `public/ink/fonts/OFL-LXGW-WenKai-TC.txt`。

子集係修改版，已用獨立family **Jianghu Wuxia Titles**，字體metadata保留原copyright及授權。實際檔：`src/assets/fonts/wuxia-titles.woff2`。

重建（Python需要fonttools同brotli）：

```bash
python -m pip install fonttools brotli
python scripts/art/build_game_title_font.py
```

腳本固定來源commit及SHA256，先驗全字形再輸出；可用 `--source` 同 `--license` 指定已下載來源作離線重建。改文案時要重建子集及更新manifest，唔用字體名稱存在就假設所有繁字都有。
