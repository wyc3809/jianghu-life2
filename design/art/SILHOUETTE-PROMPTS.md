# 剪影出圖清單 — 江湖一生

> 目的：換走「10 派主角同一個斗笠姿勢」同「4 個有墨霧雜點嘅敵人」，令每個角色剪影一眼認得。
> 出圖後放入指定路徑，跑 `python3 scripts/art/build_silhouettes.py`，遊戲即更新（C 款：純墨＋門派色描邊＋朱砂由腳本加，**出圖唔好自己加顏色**）。

## 通用要求（每張都要）

- **純白背景**（#FFFFFF），唔要地面、影、霧、潑墨、飛濺、落款、文字
- **人物全身**，由頭到腳完整入鏡，四邊留約 5% 空白
- **單一純黑剪影**：人物全黑實心，冇灰階、冇內部線條（我哋只用輪廓）
- 輪廓要清楚：兵器、帽、衣擺、髮要伸出身體外，唔好貼身藏喺輪廓內
- 尺寸：直幅 **1024×1536**（2:3），PNG 或 WebP
- 朝向：**主角面向右**，**敵人面向左**

英文通用前綴（可直接貼）：

```
full-body black silhouette of a Chinese wuxia martial artist, solid pure black shape, no interior detail,
pure white background, no ground, no shadow, no mist, no ink splatter, clean crisp outline,
distinctive readable silhouette, side 3/4 view, entire figure in frame with margin, 2:3 portrait
```

---

## A. 十派主角（面向右）→ `public/ink/spar/hero-v3-{key}-full.webp`

每派要有**唔同輪廓標誌**，唔好全部戴斗笠。

| key | 門派 | 輪廓標誌 | 姿勢 | 追加英文提示 |
|-----|------|----------|------|--------------|
| wudang | 武當 | 道髻＋拂塵／長劍斜指 | 太極起手，重心低 | `Taoist topknot hair bun, long straight sword held diagonally, tai chi opening stance, flowing wide sleeves` |
| shaolin | 少林 | 光頭、禪杖、袈裟斜披 | 企定持杖 | `bald monk, holding a tall monk staff with ring top, kasaya robe draped over one shoulder, firm standing stance` |
| emei | 峨嵋 | 長髮高束、峨嵋刺、窄袖 | 輕盈單腳點地 | `female, high ponytail, pair of short emei piercers, fitted sleeves, light tiptoe stance` |
| huashan | 華山 | 劍背身後、披風揚起 | 拔劍前一刻 | `sword strapped on back hilt over shoulder, short cape blown back by wind, hand reaching for hilt` |
| tangmen | 唐門 | 兜帽、腰間暗器囊、手指夾鏢 | 側身伏低 | `hooded, pouches on belt, darts held between fingers, crouched sideways ready to throw` |
| taohua | 桃花 | 玉簫橫吹、長髮披散 | 從容站立 | `playing a long flute held horizontally, long loose flowing hair, relaxed elegant stance` |
| qingyun | 青雲 | 背負劍匣、高冠 | 御劍姿勢，一指向天 | `tall scholar crown hat, sword case on back, two fingers raised skyward, flying sword gesture` |
| tiandao | 天刀 | 大刀扛肩、闊背 | 扛刀踏步 | `broad shoulders, huge broadsword resting on shoulder, heavy striding step` |
| mojiao | 魔教 | 高領披風、散髮、長鞭 | 張臂 | `high-collared long cloak, wild loose hair, long whip trailing, arms spread menacingly` |
| wugen | 無根（散人） | 斗笠（保留現有風格）、酒葫蘆 | 隨意企 | `conical bamboo hat, wine gourd hanging from waist, casual relaxed stance, plain robe` |

## B. 敵人（面向左）→ `public/ink/spar/sil/enemy-{key}.webp`

用喺首領現身（月下剪影）同切磋來源；戰鬥畫面唔放剪影。

現有可用：daoke 刀客、gouke 雙鉤客、nvcike 女刺客、toutuo 頭陀、tiemian 鐵面。以下補齊／取代：

| key | 角色 | 輪廓標誌 | 追加英文提示 |
|-----|------|----------|--------------|
| laoweng | 白髮老翁 | 駝背、拐杖、長鬚 | `hunched old master, long beard, walking cane, frail but dangerous stance` |
| qiangke | 槍客 | 長槍橫握，槍纓 | `spearman, long spear held horizontally with tassel, wide lunging stance` |
| qigai | 丐幫 | 破衣、竹棒、酒葫蘆 | `beggar sect fighter, ragged clothes, bamboo stick, gourd on back, loose crouch` |
| suoyi | 蓑衣客 | 蓑衣＋斗笠，短刀 | `straw raincoat cape and conical hat, short blade held low, rain wanderer` |
| chifa | 赤髮 | 爆炸長髮、雙斧 | `wild spiky flowing hair, twin axes, aggressive forward lean` （取代與頭陀重複嘅舊圖） |
| shadow | 影子 | 蒙面、披風拖地、雙手藏袖 | `masked assassin, cloak trailing to ground, hands hidden in sleeves, eerie still pose` （取代與鐵面重複嘅舊圖） |

出完 B 表之後，同我講一聲：我會將佢哋加返入 `src/ui/inkSilhouettes.ts` 嘅 `FOE_SILHOUETTE_KEYS` 同腳本嘅 `ENEMY_KEYS`。

## 檢查

放圖後跑：

```bash
pip install pillow numpy scipy
python3 scripts/art/build_silhouettes.py --sheet /tmp/sil.png --font /path/to/LXGWWenKaiTC-Bold.ttf
```

打開 `/tmp/sil.png` 睇總覽：每個剪影應該實心、邊乾淨、冇雜點，朱砂頭帶／標誌位置合理（主角朱砂自動落喺頭部附近；如某派位置唔啱，喺腳本 `HERO_ACCENT` 覆寫）。
