# 祖蔭傳承（Ancestral Merit）

> 狀態：已定方向（用戶選：帳戶永久；用途＝家傳武學＋天賦加點）　·　模組：`core/life/ancestry.ts`、`src/store/ancestryMeta.ts`、`InkAncestryPanel`

## 1. Overview

每一世完結時按一生成就結算「祖蔭點」，存喺帳戶層（唔跟存檔，重新開始都唔會清）。
祖蔭點喺「祖祠」花：**天賦加點**（五維開局永久加成）同 **家傳武學**（解鎖前世學過嘅武學，開局就識）。
佢係 roguelite 式長線成長：每一世都令下一世起步好少少，但唔會碾壓——上限有封頂。

## 2. Player Fantasy

「呢套驚鴻劍法，係我太爺嗰代傳落嚟。」每次死都唔係白死：一世人嘅名望、武學、壽數都化成祖蔭，
下一世出世就帶住祖宗餘蔭。玩家會想「再嚟一世，今次揀根骨，試吓走外功路線」。

## 3. Detailed Rules

### 3.1 結算（一世一次）
- 人生進入總結（`phase === 'summary'`）時，由 store `awardAncestry()` 結算一次；角色 flag `ancestry_awarded` 防重複。
- 同時記低呢一世學過嘅武學 id 入「武學譜」（`artsSeen`，只記有效武學）。

### 3.2 天賦加點
- 五維（根骨、悟性、福緣、魅力、膽識）各 5 級；每級開局 ＋`TALENT_STEP`（2）。
- 第 n 級（1 起計）成本＝`TALENT_BASE_COST + (n−1) × TALENT_COST_STEP`（3、5、7、9、11；一維滿級 35 點）。
- 開局屬性加完仍受上限 100 夾住。

### 3.3 家傳武學
- 「武學譜」入面嘅武學可以解鎖（每門 `ART_UNLOCK_COST` ＝ 8 點），解鎖咗就永久可選。
- 「家傳」欄位：預設 1 格；第 2 格要 `SECOND_SLOT_COST`（20 點）開。
- 開新一世時，已選嘅家傳武學直接識（階位 0「略有小成」），唔觸發高光時刻。

### 3.4 套用
- 每次開新一世（新角色或轉世）都自動套用當前祖蔭；年譜寫一行「祖蔭：根骨＋4、家傳『驚鴻劍法』」。
- 唔用 RNG，唔影響種子決定性。

## 4. Formulas

```
gain = min(MERIT_CAP_PER_LIFE,
           floor(age / 10)                 // 壽數：每 10 歲 1 點
         + floor(martial / 20)             // 武學
         + floor(max(0, reputation) / 25)  // 名望
         + round(12 × cultivationTier / 14) // 境界（15 境，頂境 12 分）
         + titleCount                      // 稱號數
         + (hadChildren ? 2 : 0))          // 血脈延續
MERIT_CAP_PER_LIFE = 40
```

例：60 歲、武學 80、名望 50、境界 7（脫胎換骨）、稱號 3、有子女 → 6 + 4 + 2 + 6 + 3 + 2 = 23 點。
一維天賦滿級要 35 點（約兩世）；五維全滿 175 點（約 8–10 世），夠長線但唔會無底。

## 5. Edge Cases

- **舊存檔／第一次玩**：冇祖蔭資料 → 0 點、冇解鎖，照舊開局。
- **localStorage 唔用得**（私隱模式）：祖蔭只留喺記憶體，關咗網頁會冇；唔會報錯。
- **資料損壞**：Zod 驗證唔過 → 當冇資料（唔會令遊戲開唔到）。
- **重複結算**：flag 防止；重新載入總結頁唔會再加。
- **家傳武學已唔存在**（資料改咗）：開局時略過。
- **選咗但未解鎖／格數唔夠**：只取前 N 門已解鎖嘅。
- **點數唔夠**：按鈕停用，唔會扣成負數。

## 6. Dependencies

- `core/life/legacy.ts`（血脈傳承，獨立並存：血脈要有子女；祖蔭唔使）
- `core/life/gameState.ts` `createNewLife`（新選項 `ancestry`）
- `core/life/cultivation.ts`、`core/life/titles.ts`（結算讀境界、稱號）
- `data/skills/catalog.ts`（武學名、有效性）
- UI：總結頁（顯示 ＋N、入祖祠）、開局畫面（入祖祠）

## 7. Tuning Knobs

| 參數 | 預設 | 安全範圍 | 影響 |
|------|------|----------|------|
| `MERIT_CAP_PER_LIFE` | 40 | 20–80 | 每世最多拎幾多 |
| `TALENT_STEP` | 2 | 1–4 | 每級天賦加幾多 |
| `TALENT_BASE_COST`／`TALENT_COST_STEP` | 3／2 | — | 天賦價錢曲線 |
| `TALENT_MAX_LEVEL` | 5 | 3–8 | 每維上限 |
| `ART_UNLOCK_COST` | 8 | 4–20 | 解鎖一門家傳武學 |
| `SECOND_SLOT_COST` | 20 | 10–40 | 第二格家傳 |

## 8. Acceptance Criteria

1. `computeMeritGain` 按 §4 計，封頂 40（單元測試）。
2. 同一世結算兩次只加一次。
3. 天賦第 1–5 級成本 3／5／7／9／11；點數唔夠時買唔到、唔扣點。
4. 解鎖武學扣 8 點；只可解鎖武學譜入面嘅；第二格要先開。
5. 開新一世：屬性＝原本＋天賦（≤100）；家傳武學喺 `skills` 入面、階位 0；唔觸發 `learn` 時刻。
6. 同種子＋同祖蔭 → 開局完全一樣（決定性）。
7. 損壞嘅祖蔭資料讀入當空白。
8. 總結頁顯示「祖蔭 ＋N」同明細；祖祠可以加點／解鎖／揀家傳（截圖證據）。
