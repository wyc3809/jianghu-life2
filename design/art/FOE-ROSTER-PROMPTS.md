# 敵人圖鑑出圖清單（第 20 項）

> 每隻敵人一款專屬剪影，每款出四組動作：待機、出招、受擊、倒地。
> 出圖流程同 `design/art/SILHOUETTE-PROMPTS.md` 一樣：純白底、純黑剪影、**唔好自己加顏色**。
> 遊戲會自己加衣帶點綴色、精英金邊、首領朱砂邊、特性光環（`src/spar/engine.ts`、`src/fx/highlight/duel/`）。
> 跑圖：喺雲端環境設定加 `GEMINI_API_KEY`，再用 `scripts/art/gen_nbp_characters.py` 嘅流程出圖；或者自己喺 NBP 網站出圖，放入 `assets/art-source/nbp/raw/`。

## 通用前綴（英文，直接貼）

```
Full-body side-view silhouette of a Chinese wuxia fighter for a 2D ink-wash mobile game. Solid pure black shape (#000000),
NO interior detail, NO grey. Pure white background. No ground, no shadow, no mist, no ink splatter, no text.
Clean crisp edge; weapon, hat, sleeves and hair extend outside the body. Facing LEFT. Entire figure in frame, 5% margin. Portrait 2:3.
```

## 四組動作（每隻敵人都要）

| 檔名後綴 | 動作 | 英文追加 |
|---|---|---|
| `-idle` | 待機 | `relaxed guard stance, weight on back leg` |
| `-atk` | 出招 | `lunging attack at full extension, weapon swung forward` |
| `-hit` | 受擊 | `recoiling backwards from a hit, torso bent back, one foot lifted` |
| `-down` | 倒地 | `falling backwards, knees buckling, weapon dropping` |

## 敵人清單（檔名：`public/ink/spar/sil/foe-{id}{後綴}.webp`）


### 千燈鎮 · 市井潑皮（首領特性：guard）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `town_rascal` | 小兵 | 市井潑皮（街頭混混） | `daoke` | `street thug, rolled sleeves, bare-chested bruiser` — 仗住人多，喺街口收保護費 |
| `town_collector` | 小兵 | 收數打手（追債鉤手） | `gouke` | `street thug, rolled sleeves, bare-chested bruiser` — 收唔到數就落手 |
| `town_guard` | 精英 | 惡霸護院（鐵衫護院） | `toutuo` | `street thug, rolled sleeves, bare-chested bruiser, larger build, ornate armor pieces` — 練過幾年鐵布衫，刀槍難入 |
| `town_bruiser` | 精英 | 鐵衫打手（橫行街坊） | `daoke` | `street thug, rolled sleeves, bare-chested bruiser, larger build, ornate armor pieces` — 惡霸手下嘅頭馬 |
| `town_boss` | 首領 | 鎮上惡霸（鐵肚金剛） | `toutuo` | `street thug, rolled sleeves, bare-chested bruiser, imposing heroic scale, signature boss weapon, cape or banner` — 一身橫練，鎮上冇人敢惹 |

### 山道 · 山道劫匪（首領特性：charge）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `road_bandit` | 小兵 | 攔路刀匪（剪徑小賊） | `daoke` | `mountain bandit, ragged headband, heavy weapon` — 山道上專劫單身客 |
| `road_hooker` | 小兵 | 雙鉤山賊（鉤鐮手） | `gouke` | `mountain bandit, ragged headband, heavy weapon` — 雙鉤鉤馬腳、鉤人頸 |
| `road_brute` | 精英 | 開山力士（劈石手） | `toutuo` | `mountain bandit, ragged headband, heavy weapon, larger build, ornate armor pieces` — 一斧落地，碎石四濺 |
| `road_captain` | 精英 | 寨中刀頭（赤巾刀頭） | `daoke` | `mountain bandit, ragged headband, heavy weapon, larger build, ornate armor pieces` — 寨主親手帶出嚟嘅刀手 |
| `road_boss` | 首領 | 赤髮寨主（開山赤鬼） | `chifa` | `mountain bandit, ragged headband, heavy weapon, imposing heroic scale, signature boss weapon, cape or banner` — 蓄滿一刀，可以劈開山門 |

### 竹林 · 影門殺陣（首領特性：drain）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `bamboo_killer` | 小兵 | 影門殺手（竹影刺） | `shadow` | `shadow-sect assassin, slim, hooded` — 竹影一晃就到你身後 |
| `bamboo_assassin` | 小兵 | 影門女刺（青竹娘） | `nvcike` | `shadow-sect assassin, slim, hooded` — 短刃淬咗血毒 |
| `bamboo_bloodguard` | 精英 | 影門血衛（飲血衛） | `tiemian` | `shadow-sect assassin, slim, hooded, larger build, ornate armor pieces` — 每殺一人就飲一口血 |
| `bamboo_bloodmaid` | 精英 | 影門血姬（紅袖刃） | `nvcike` | `shadow-sect assassin, slim, hooded, larger build, ornate armor pieces` — 紅袖一揚，血就倒流 |
| `bamboo_boss` | 首領 | 影門門主（噬血竹魔） | `tiemian` | `shadow-sect assassin, slim, hooded, imposing heroic scale, signature boss weapon, cape or banner` — 靠飲人血續命嘅邪功 |

### 雨夜客棧 · 夜行刺客（首領特性：combo）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `inn_stalker` | 小兵 | 夜行女刺（雨夜燕） | `nvcike` | `night assassin in rain cloak, twin short blades` — 趁雨聲落手 |
| `inn_shade` | 小兵 | 影衛（簷下影） | `shadow` | `night assassin in rain cloak, twin short blades` — 專守客棧簷角 |
| `inn_twin` | 精英 | 分影刺客（雙影） | `nvcike` | `night assassin in rain cloak, twin short blades, larger build, ornate armor pieces` — 一刀未收，第二刀已到 |
| `inn_blades` | 精英 | 雙刃影衛（對刃） | `gouke` | `night assassin in rain cloak, twin short blades, larger build, ornate armor pieces` — 雙刃交錯，連環出手 |
| `inn_boss` | 首領 | 鐵面影魁（千影） | `tiemian` | `night assassin in rain cloak, twin short blades, imposing heroic scale, signature boss weapon, cape or banner` — 身法快到留低殘影 |

### 山門 · 邪寺頭陀（首領特性：thorns）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `gate_monk` | 小兵 | 護寺頭陀（守門僧） | `toutuo` | `heretic temple monk, prayer beads, iron staff` — 把守邪寺山門 |
| `gate_soldier` | 小兵 | 黑衣僧兵（夜巡僧） | `shadow` | `heretic temple monk, prayer beads, iron staff` — 夜晚巡山嘅僧兵 |
| `gate_vajra` | 精英 | 金剛護法（銅皮羅漢） | `toutuo` | `heretic temple monk, prayer beads, iron staff, larger build, ornate armor pieces` — 打佢一拳，手骨都震痛 |
| `gate_ironbone` | 精英 | 鐵骨僧兵（鐵骨） | `shadow` | `heretic temple monk, prayer beads, iron staff, larger build, ornate armor pieces` — 金剛功練到三成 |
| `gate_boss` | 首領 | 鬼面頭陀（金剛鬼面） | `toutuo` | `heretic temple monk, prayer beads, iron staff, imposing heroic scale, signature boss weapon, cape or banner` — 金剛不壞，反震傷人 |

### 夜山 · 黑風寨（首領特性：enrage）

| id | 層級 | 名（名號） | 參考剪影 | 輪廓重點（英文追加） |
|---|---|---|---|---|
| `peak_blade` | 小兵 | 黑風刀手（風刀） | `daoke` | `black-wind fort raider, fur collar, wild hair` — 黑風寨嘅刀手 |
| `peak_strong` | 小兵 | 黑風力士（扛鼎） | `toutuo` | `black-wind fort raider, fur collar, wild hair` — 一身蠻力 |
| `peak_hook` | 小兵 | 黑風鉤客（鉤魂） | `gouke` | `black-wind fort raider, fur collar, wild hair` — 鉤人入寨 |
| `peak_berserk` | 精英 | 黑風狂刀（血眼刀） | `daoke` | `black-wind fort raider, fur collar, wild hair, larger build, ornate armor pieces` — 受傷越重，出刀越狠 |
| `peak_vanguard` | 精英 | 黑風先鋒（赤狼） | `chifa` | `black-wind fort raider, fur collar, wild hair, larger build, ornate armor pieces` — 寨主帳下先鋒 |
| `peak_boss` | 首領 | 黑風寨主（黑風狂獅） | `chifa` | `black-wind fort raider, fur collar, wild hair, imposing heroic scale, signature boss weapon, cape or banner` — 半血之後狂性大發 |
