# 事件抽取模擬報告

模擬 300 條人生 × 最多 840 個月（實際跑了 215062 個 startMonth，共揭示 176000 次事件）。每次事件用隨機一個合資格選項真的 applyChoice，讓旗標／屬性／人物關係跟真實遊玩一樣演變；戰鬥不模擬（直接清空 pendingCombat 略過）。

## 結論摘要（人工複核後）

跑分模擬（`npm run audit:events` / `scripts/auditEventDraws.mts`）後，再手動追蹤程式碼確認每個「疑似抽不到」的項目，區分真正的引擎 bug 跟腳本誤判：

### 確認的真實問題

1. **`secretArts.ts`（13 個秘傳武學事件）+ `jinyongTropes.ts` 的 `JINYONG_SPECIAL_EVENTS`（9 個金庸奇遇事件）＝ 22 個事件，實質上永遠抽不到。**
   根因在 `core/life/eventEngine.ts` 的 `special` 觸發分支：先呼叫 `pickPackEvent(state)`（100 條 pack JSON 事件），只有回傳 `null` 才 fallback 到 `SECRET_ART_EVENTS`/`JINYONG_SPECIAL_EVENTS`。因為 pack 池條件寬鬆、100 條事件幾乎不可能同時全部不合資格，這條 fallback 路徑在 21.5 萬個模擬月份裡一次都沒被觸發過。
   **後果**：9 個金庸限定武學（`jy_ash_manual`、`jy_chun_yang`、`jy_cliff_fist`、`jy_drunk_step`、`jy_ice_fire`、`jy_toad_art`、`jy_tomb_step`、`jy_xuan_yin`、`jy_zither_breath`）以及 `secretArts.ts` 裡沒有備援管道的武學（`art_lake_breath`、`art_silk_hand`、`qg_broken_bridge`、`qg_wall_cat`）在目前引擎下**完全拿不到**——包括 `jianghuHints.ts` 裡明明提示玩家「危牆夜影之中，或可習『壁虎遊牆』」（`qg_wall_cat`），但那個事件永遠不會出現。
   **建議修法**（未動手，等你決定）：把觸發順序倒過來（先試 secret 池，pack 池當備援），或兩池合併成一次加權抽取，而不是「有 A 就完全跳過 B」。

2. **`childhood_play`（童年嬉戲）要求 `minAge:3, maxAge:10`，但 `createNewLife` 開局角色年齡固定是 16 歲** —— 玩家永遠不會經歷 3–10 歲這段，這個事件形同虛設。跟你們自己 `game-pillars.md` 提到的「童年標籤事件是否只是佔目錄門面」疑慮完全對應。
3. **`life_birth`（降生）完全是死碼**：`eventEngine.ts` 明確把它從一般池濾掉（`.filter((e) => e.id !== 'life_birth')`），而且沒有任何別的程式碼路徑會解析它——不是遊戲開局流程的一部分，純粹是目錄裡的孤兒條目。
4. **`art_rain_sword`（聽雨劍意）、`art_bridge_step`（斷橋步）**：`art_rain_sword` 在整個 repo 裡只出現在武學資料定義本身，沒有任何事件/動作會授予；`art_bridge_step` 只被 `huashan.ts` 用來定義論劍 NPC 的招式，玩家自己永遠學不到。
5. **`sect_art_sect_qingyun`／`sect_art_sect_tiandao`／`sect_art_sect_emei`／`sect_art_sect_shaolin`／`sect_art_sect_wudang`**：這 5 個武學 id 只存在於 `content/martial/catalog.json` 定義裡，程式碼（含 `sects.json` 的門派武學表）完全沒有引用，是孤兒資料。門派實際教的入門武學是另一組 id（`qy_cloud_sword`／`td_open_blade`／`em_soft_palm`／`sl_luohan_fist`／`wd_sword_form`／`tm_flying_needle`／`mj_blood_palm`／`hs_pine_sword`，見下方「腳本誤判」）。

### 腳本靜態檢查的誤判（已人工排除，實際可正常取得）

下面「技能總表」章節列出的 62 個「找不到授予來源」是腳本只掃了事件效果 + pack JSON 造成的盲點。人工追蹤後，以下管道也會授予武學，不算 bug：
- 開局起始技能：`基礎吐納`、`art_river_fist`（`core/life/gameState.ts` 造角時直接給）
- 門派地位晉升：`core/life/sectStanding.ts` 的 `teachSectArtForStanding`，依 `content/sects/sects.json` 每門派 4 階武學（`qy_*`／`td_*`／`em_*`／`sl_*`／`wd_*`／`tm_*`／`mj_*`／`hs_*`，各 8 門派 × 4 階＝32 個）
- 修煉「尋訪明師」動作：`core/life/actions.ts` 的 `seek_master` 隨機武學池（`art_cold_palm`、`art_iron_body`、`qg_snow_track` 等約 20 個）
- 首領戰勝利獎勵：`data/events/bossEncounters.ts` 的 `rewardOnWin.skillId`（如 `art_thunder_blade`、`art_shadow_needle`、`art_hook_silk`、`qg_canopy_void`、`art_meteor_palm`）

真正「完全找不到來源」的只有第 4、5 點列出的那 7 個 id，加上被 22 個死事件鎖住的那批。

---

## 原始模擬輸出（未加人工複核）

目錄事件總數：330；模擬期間曾被抽到：324；從未抽到：24

## 從未在模擬中被抽到的事件（24）

- `life_birth`（catalog）降生
- `childhood_play`（catalog）童年嬉戲
- `jy_snake_blood`（jinyongSpecial）蛇谷飲血
- `jy_cliff_cave`（jinyongSpecial）絕壁殘譜
- `jy_cold_pool`（jinyongSpecial）寒潭吐納
- `jy_ancient_tomb`（jinyongSpecial）古墓寒玉
- `jy_nine_yin_scraps`（jinyongSpecial）玄陰殘頁
- `jy_nine_yang`（jinyongSpecial）純陽殘息
- `jy_toad_pool`（jinyongSpecial）蟾池奇功
- `jy_jade_bee`（jinyongSpecial）玉蜂漿
- `jy_ice_fire_remnant`（jinyongSpecial）冰火島餘燼
- `secret_cave_manual`（secretArts）石壁殘篇
- `secret_rain_master`（secretArts）雨夜傳功
- `secret_tomb_blade`（secretArts）古墓劍塚
- `secret_lake_breath`（secretArts）湖心寒息
- `secret_beggar_scroll`（secretArts）丐者殘卷
- `secret_cliff_shadow`（secretArts）斷崖影拳
- `secret_temple_bell`（secretArts）古寺鐘鳴
- `secret_snow_hermit`（secretArts）雪夜隱士
- `secret_market_duel`（secretArts）市井約戰
- `secret_night_thief`（secretArts）夜半盜譜
- `secret_wall_cat`（secretArts）危牆夜影
- `secret_lotus_steps`（secretArts）池邊殘步
- `play_region_sword`（playabilityPack）劍塚夜聲

## 抽取次數最少的 20 個「有抽到」事件

- 4x `poison_test`（catalog）試毒疑雲
- 8x `sect_promotion`（catalog）晉升內門
- 12x `family_poverty`（catalog）家道中落
- 13x `elder_task`（catalog）長老密令
- 17x `sect_training`（catalog）門派演武
- 18x `sect_library`（catalog）藏經閣
- 20x `betray_sect`（catalog）師門猜忌
- 21x `play_sect_namecard`（playabilityPack）名帖往來
- 24x `love_confess`（catalog）表白心跡
- 27x `love_rival`（catalog）情敵出現
- 28x `play_sect_politics`（playabilityPack）山門風波
- 29x `master_wanderer`（catalog）遊方道人
- 54x `find_coin`（catalog）路拾銅錢
- 103x `sect_recruit`（catalog）門派招收弟子
- 106x `lost_in_forest`（catalog）迷失林海
- 117x `jy_lonely_sword_tomb`（jinyongOrdinary）劍塚試鋒
- 121x `love_meet`（catalog）燈會相逢
- 130x `parent_ill`（catalog）父母染恙
- 131x `play_career_tomb`（playabilityPack）廢塚夜色
- 133x `inheritance`（catalog）家族傳承

## 武學技能（共 77），事件效果／pack 原始資料中完全找不到授予來源的（62）

- `基礎吐納` 基礎吐納
- `art_river_fist` 長河拳
- `art_bridge_step` 斷橋步
- `art_rain_sword` 聽雨劍意
- `art_cold_palm` 寒霜掌
- `art_iron_body` 鐵布衫
- `art_moon_sword` 弄月劍法
- `art_wind_chase` 追風腿
- `art_hook_silk` 鐵線鉤法
- `art_meteor_palm` 流星掌
- `art_tiger_breath` 虎嘯內勁
- `art_spring_well` 涌泉訣
- `art_shadow_needle` 無影針訣
- `qg_snow_track` 踏雪無痕
- `qg_swallow_turn` 燕子三轉
- `qg_feiyan` 飛燕功
- `qg_canopy_void` 凌虛步
- `art_spear_cloud` 穿雲槍
- `art_staff_iron` 鐵杖訣
- `art_whip_silk` 柔絲鞭法
- `art_bow_star` 逐星箭意
- `qg_reed_drift` 蘆花身法
- `art_sand_palm` 流沙掌
- `art_mirror_breath` 澄心鏡息
- `art_heavy_halberd` 開山戟意
- `qy_cloud_sword` 青雲初劍
- `qy_mist_step` 雲中步
- `qy_piercing_needle` 破雲刺
- `qy_sky_intent` 青冥劍意
- `td_open_blade` 天刀開山
- `td_wind_slash` 裂風斬
- `td_thunder_combo` 雷鳴連刀
- `td_no_return` 天刀無回
- `em_soft_palm` 峨嵋柔掌
- `em_silk_wrap` 繞指柔
- `em_golden_palm` 金頂綿掌
- `em_heart_breath` 峨嵋心法
- `sl_luohan_fist` 羅漢拳
- `sl_weituo` 韋陀杖意
- `sl_iron_shirt` 鐵布衫功
- `sl_yijin` 易筋吐納
- `wd_sword_form` 武當劍式
- `wd_tai_push` 太極推手
- `wd_pure_yang` 純陽吐納
- `wd_wuji_sword` 無極劍意
- `sect_art_sect_qingyun` 青雲入門劍訣
- `sect_art_sect_tiandao` 天刀門基礎刀式
- `sect_art_sect_emei` 峨嵋柔勁入門
- `sect_art_sect_shaolin` 少林基本樁功
- `sect_art_sect_wudang` 武當吐納入門
- `tm_flying_needle` 唐門飛針
- `tm_shadow_step` 影步
- `tm_poison_dart` 淬毒鏢
- `tm_thousand_mech` 千機手
- `mj_blood_palm` 血影掌
- `mj_devil_breath` 魔息吐納
- `mj_soul_drain` 吸脈指
- `mj_asura_slash` 修羅斬
- `hs_pine_sword` 松風劍
- `hs_cloud_step` 雲臺步
- `hs_split_peak` 劈岳劍
- `hs_yue_breath` 華嶽吐納