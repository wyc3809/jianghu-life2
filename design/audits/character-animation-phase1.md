# 人物及戰鬥動畫：階段一審查與骨架方案

審查日期：2026-11-01。範圍只到現況審查及方案，**未實作新骨架、未通過人物動畫驗收、未發布**。

主線基準：EA0.100.0，`9a07caf49b0b05b6d7b39def891a41925391bbed`。獨立工作目錄 `jianghu-rig-audit`／分支 `work/character-rig-audit`。另讀已暫停分支 `work/sect-war-visual-match`（`1a1a3189a2d3a85cdeb9820fcc51b8f4bc513034`）的 AGENTS、scope 59b／59c 及 design-qa，確認 PR #156 保持草稿。以下「現有產品」指主線，沒有將 #156 當成已發布版本。

## 結論

**現有主要人物不是完整骨架或蒙皮角色。** 共用造型是「一張完整身體姿勢圖＋獨立頭部＋頸部補片＋兵器」，走路／出招／倒地直接換圖；舊剪影另有條帶彈簧變形及部件旋轉。會武又有另一套十二張完整姿勢圖。這些實作沒有共享的肩、肘、腕、髖、膝、踝、骨長或角度約束，所以不能用現有測試通過來保證人體連接。

先保留 Canvas，建立一套純資料的 2D 父子骨架、姿勢求解及受限反應；先製作一名真正可組裝、可逐幀驗收的人物。素材須先補畫關節及分層，不能再把帶有手臂的軀幹疊上另一對手。Three.js 需要時只讀同一份已求解姿勢，暫不更換引擎或購買動畫工具。

## 1. 已讀範圍及證據性質

已核對 AGENTS、scope、design-qa、`interfaces/appearance.ts`、`src/appearance/`、`src/spar/`、`src/sectBattle/`、`src/prototypes/sectBattle/`、InkAppearance／InkSparStage／InkAutoBattle／InkSectWar、`src/fx/highlight/duel/`、`visualActivity.ts`、combat／combatCore／martialTurn，以及相關測試和美術處理腳本。目錄已按實際入口搜尋，沒有以舊路徑推斷。

本次證據分三種，不能混為「正式 App 已驗收」：

- **現有 App 實播**：隔離 QA 存檔啟動主線 App，播放演武首領。沒有登入玩家帳戶或發送多人戰請求。
- **現有元件實播**：既有 `?battle-preview=unified&kind=event`，使用核心固定種子戰報及正式 InkAutoBattle／SparStage；另只在該隔離頁替換雙方外觀，記錄詳細敵人的實際計時。不是新骨架原型。
- **繪圖器診斷**：`scripts/qa/characterAudit.html` 直接呼叫現有 drawAppearance／drawWarCharacter；`characterDuelAudit.html` 播舊 Three 元件。這兩個是審查工具，不註冊 App 路由，不代表階段二完成。

[證據索引](../../production/qa/evidence/redesign/character-rig-audit/README.md)包括連續影片、逐時序圖、原始記錄與重現方式。沒有修改後畫面，因此本階段只保留「修改前」基準，沒有製造假的前後對比。

## 2. 系統對照表

| 模式／入口 | 實際繪圖器與素材 | 控制／時鐘 | 人體形式及適用範圍 |
|---|---|---|---|
| 人物、衣櫥、HUD：InkAppearance | Canvas AppearanceCanvas → drawAppearance；八頭、三套八格身體、頸片、四種布色 | effect／ResizeObserver／造型改變時重畫；本身沒有持續骨架更新 | 靜態完整姿勢圖組裝；盤坐不是可連續站起的骨架 |
| 主頁演武：InkSparStage | SparStage；詳細主角優先 drawAppearance；無外觀快照敵人用舊敵人剪影 | 外層 RAF → stage.update；AnimDirector、attackT、artRun、walkT、heroHitT 在該次 update 推進；首領分小步 | 詳細主角沒有手腳骨架；舊 NPC 用全圖／條帶變形；不是同一人體規則 |
| 事件／華山交手：InkAutoBattleView → InkAutoBattle | 同一 SparStage，presentation=battle，正式背景及武學特效 | readonly replay 游標；每幀最多取 .15 秒，再以最多 1/60 秒小步推進；2倍加速加播放預算 | 主角走共用詳細人物；foeAppearance 有值才走詳細敵人，否則剪影 |
| 非同步一對一：InkOnlinePanel | lazy InkAutoBattle，傳伺服器人物／戰報快照 | 同一播放器；伺服器結果是權威 | 外觀快照可共用，但詳細敵人的姿勢計時有問題；本輪沒有呼叫伺服器開戰 |
| 舊 Three 高光交手：DuelFx／DuelDirector | Three PlaneGeometry＋shader；預製 idle／windup／strike 三張詳細主角貼圖；詳細敵人僅 idle 貼圖 | GSAP timeline 移動整塊平面，另有 RAF／setTimeout 打擊停格及特效 | 沒有 SkinnedMesh／Bone；現行產品找不到 DuelFxLazy 使用者，只保留匯出；屬待淘汰／備用程式，不是目前主線主播放器 |
| 舊隔離會武原型：SectBattlePreview | Canvas SectBattleRenderer → drawAppearance | 元件播放游標＋createVisualLoop／watchVisualActivity，讀重播時間 | 共用八格完整身體；本輪僅審查，沒有恢復開發 |
| 已發布會武：InkSectWar | Canvas WarRenderer → drawWarCharacter；三套十二姿勢、獨立兵器及共用頭頸 | useWarPlayback → createVisualLoop；重播游標；Worker 建時間軸 | 另一套完整姿勢圖與錨點、不是骨架；現況只讀對照，不作新多人交付 |
| SparStage 舊後備層 | heroAppearance lifecycle／武學圖集；再後備才是 silhouette＋HERO_LAYERS＋SPAR_CLIPS | 同一 stage.update；StripRig 的三組彈簧供條帶變形 | 名叫 rig 的 socket／track 並不等於人體骨架；詳細主角成功時會提前 return，不能把後備功能當成詳細角色已擁有 |

關鍵入口：`InkAutoBattleView.tsx:10`、`InkAutoBattle.tsx:235`、`spar/engine.ts:1755`／`:2020`、`appearance/model.ts:23`、`sectBattle/character.ts:104`、`duel/director.ts:192`。搜尋 src／interfaces／package.json，沒有找到這些路徑使用 SkinnedMesh、THREE.Bone、完整人體 IK 或剛體關節求解器。

## 3. 接點、比例及更新方式

| 部位／規則 | 現況 | 結果 |
|---|---|---|
| 根／身高 | drawAppearance 以腳底 origin 平移，整體 height/400；每套 pixelsPerUnit 固定，沒有按每格透明框重新 fit | 這項應保留。姿勢比例仍取決於原畫，不能以固定縮放證明骨長一致 |
| 頭、頸 | body pose 的 neck 錨點；頭按八款比例放置，倒地固定旋轉 -1.15 rad；頸片依衣領多邊形裁切 | 同一同步 draw 內畫身、頸、頭，未發現獨立頭部落後一幀的更新來源；但沒有頸椎／胸肩約束，換圖仍會跳位 |
| 軀幹、手腳 | 全部畫在一張 body 圖裡；沒有可查的肩、肘、腕、髖、膝、踝 transform | 不能量度骨長／角度，更不能宣稱通過這些項目 |
| 袖、髮、披風 | 詳細人物已畫在整張姿勢內；StripRig 彈簧主要服務舊剪影 | 不能把既有條帶變形直接加回詳細人物，否則手臂和兵器會一起被扭曲 |
| 握點 | p.grip 來自每格 metadata；兵器先畫，再疊完整 body；角度只按幀名選固定值 | 沒有真正手掌骨、拇指前景層、雙手握持或背負／收招狀態 |
| 轉向 | drawAppearance 同一 ctx.scale(face,1) 作用頭、頸、身、兵器 | 此路徑整體翻面已一致；不應重寫成各部位各自翻面 |
| 戰鬥世界座標 | SparStage 使用 g.k／enemyKe／art offset；詳細人物另以手機寬度×.23×.65 得顯示高度 | 尚未證明主線詳細人物有「雙重縮放」錯誤；真正問題是舊／新人物用不同設計高度及錨點規則。血條仍有估算點而非頭骨 socket |
| 次級更新 | StripRig 半隱式 Euler 彈簧，dt 隨每幀；render offset 有限幅 | 限幅可控制視覺變形，卻不是固定步長人體約束；沒有骨頭質量、地面碰撞或起身恢復 |
| 多時鐘 | 單一 SparStage update 內各計時器不同用途；Three 是 GSAP＋RAF＋真實 setTimeout；會武是另一播放 loop | 沒有證據顯示同一詳細骨架被兩個 solver 搶寫，因為目前沒有該骨架；已確認的是敵人選錯計時來源，不能籠統稱所有 RAF 都互相衝突 |

共用造型處理腳本 `build_appearance_poses.py:59` 以頂部 alpha 推 neck，倒地採寬高比例；grip 以膚色連通區猜手掌。會武另讀人工 landmarks。這解釋為何同一角色可以在不同模式用不同握點，亦說明數值位於圖內並不保證解剖位置正確。

## 4. 實播問題及根因

嚴重程度：P1＝妨礙人物／動作驗收或後續架構；P2＝一致性／效能／生命週期風險。沒有將未重現的掉獎或重扣列成已發生問題。

| 編號 | 嚴重程度／分類 | 實際發現與證據 | 根因及處理方向 |
|---|---|---|---|
| A01 | P1／動作與結構 | 連續影片可見 walk、windup、strike、hurt、down 是整圖切換，沒有接點運動過渡。hurt→down 在 .12 秒一次換成橫躺圖 | 完整姿勢切換；沒有關節、連續重心或接地求解。需要新邏輯骨架與合適分層素材，不能只加淡入或粒子 |
| A02 | P1／程式 | 隔離 1v1 詳細敵人實播 1,137 個 render 取樣；其中 161 個敵人出招取樣，lungeT 由 0 到約 .55，但 e.t 全部是 9，按現行選圖只能得到 idle。見 detailed-opponent-probe.json | `engine.ts:2022` 以 e.t 當 attack time；makeEnemy('hold') 設 t=9，該值不隨 lunge 推進。spawn 後為 0 的情況則可能長停 windup。須改為 actor-local 動作進度，後續加能看見實際 strike 的回歸測試 |
| A03 | P1／程式 | 同次實播有 246 個 hitT<.26 受擊取樣；state 只有 hold／spawn／dead，詳細敵人沒有 hurt 姿勢 | EnemyState 根本沒有 hurt；drawEnemy 卻判 String(e.state)==='hurt'。需由受擊事件／hitT 驅動，不能測「狀態字串存在」就算通過 |
| A04 | P1／動作 | 沒有 run 或 get-up clip。倒地維持橫躺圖，主頁計時到後 resetLane／resetToEnter 直接重入；未見真正起身 | AppearancePose 不含 run／get-up；`engine.ts:804` 的恢復是遊戲／場景重設，並非人物動畫。不得把重設叫作自然起身 |
| A05 | P1／兵器語義 | 原有 family 矩陣中 finger 也畫 hidden 暗器；hook 用 sword、flute 用 staff。拳／掌／腿則沒有額外武器 | model.ts weaponFor 直接映射 family，沒有「實際兵器實例＋持握狀態＋當招需否顯示」契約。指法不可自動當持暗器；替代類型必須明確後備而非假裝真裝備 |
| A06 | P1／素材 | 同一招只有 windup／strike，再回 windup／idle；所有武學共用該完整身體，缺少拳掌、腿、長兵、雙手持握的結構差異 | 共用造型成功後提前 return，原本武學圖集的動作不再用於該身體；特效仍有差別。需要共享骨架上的動作族，不是再畫十套互不一致人物 |
| A07 | P2／模式一致性 | App 演武首領及事件元件實播，詳細主角與黑影敵人同場；詳細敵人只有附外觀快照才出現 | 回放與 NPC 外觀資料不同；舊敵人仍用全圖旋轉／壓縮／StripRig，而詳細角色忽略部分同樣變形。先建立統一 actor view descriptor，保留既有 NPC 身份，不能任意把所有敵人換玩家臉 |
| A08 | P2／接點與動作 | 直接跨 windup→strike，height=280 時 neck 錨點瞬間改約 12–34 px，grip 約 22–45 px；hurt→down neck 約 122–146 px。影片有明顯跳姿勢 | 數值是現有 metadata 的位移，**不是量到「頸部脫離」**；真正缺的是連續過渡及胸肩骨架。腳底 origin 固定亦不等於支撐腳鎖地 |
| A09 | P2／時鐘與生命週期 | 主頁有前後景 watch；InkAutoBattle 沒有相同 activity watcher，另用 45 秒真實計時上限／結束延時。舊 Three 亦以 GSAP／RAF／timeout 分別控制 | 程式確認不一致；瀏覽器原生會如何暫停與恢復、iOS 是否提前跳結果仍須實機。不能先宣稱已重現骨架爆開。未來統一播放時鐘及暫停 owned timers |
| A10 | P2／載入與記憶體 | loadSparImages 即使詳細人物可用，仍載舊剪影、body／hat／arm、lifecycle、共用 wardrobe，還會載武學圖集；完整身體調色在首次選幀做像素讀寫 | 資料與後備載入未依實際呈現器分組；調色有 cache 上限，這項保留。先量測再按需要預熱／分批載入，不把所有姿勢／衣色同時預熱 |

未在本輪樣本見到頭部自由轉一圈、掉手腳或 NaN；這不代表已通過骨架驗收。現有模型沒有關節碰撞與骨長，無法對這些不存在的量直接報 pass。墨色的八頭×三衣×六種姿勢時點×兩方向共 288 次繪圖呼叫沒有 pageerror；那是組合相容性記錄，仍須人工看接點及遮擋。

## 5. 素材適用性

- **保留**：八款身份、三套衣著／四種布色選項、現有原圖／提示／處理腳本／來源條款、詳細水墨質感。現有完整姿勢圖可當動畫 key pose 及比例對照，亦可作舊呈現器回退。
- **頭部要重新標定**：八張圖的頸根、下顎及前後髮遮擋不一致；保留臉，分開後髮／頭／前髮或指定遮罩，逐一標 socket。頸片目前是領口補色，不能當頸骨蒙皮。
- **軀幹要補畫**：舊 outfits 原圖曾因軀幹自帶袖臂造成雙臂，已被停止使用。不能重新啟用舊零件便當新 rig。需要乾淨胸腹／肩／上臂／前臂／手，補出關節被遮的連續畫面與必要的前後層。
- **腿及衣服要分清**：骨盆、大腿、小腿、腳有固定休息長度；長袍／裙襬、披風不能當腿本體。先做 traveller，通過後再做 scholar／cloak，不用長袖掩錯位。
- **武器保留位圖**：另標柄軸、主手握點、副手握點、刀刃／劍尖；手掌須有閉握／張掌等真圖及拇指前景層。徒手、持握、背負、收招分開；長兵雙手不能靠拉長前臂對上。
- **授權**：目前來源 README 記錄為專案生成資產、適用工具使用條款，並沒有可任意重授權的 CC0 聲明；繼續保留原始來源及映射。新素材需補來源、生成提示、加工腳本、人工校正 landmarks／遮罩及驗收圖。

## 6. 方案比較與建議

| 可行方向 | 品質及手機成本 | 維護／授權 | 結論 |
|---|---|---|---|
| 現有 Canvas＋共享 2D FK／雙骨 IK＋有限受擊約束 | 可先解決父子連接、固定骨長及接地；位圖接縫、深度轉身仍依賴素材。無額外 WebGL context；不等於已量得足夠效能 | 自建小而明確的 solver 及純資料 schema；沿用既有套件，沒有新增商用 runtime | **先用這個做一名角色**；先硬接點驗收，再決定關節局部是否要網格蒙皮 |
| 既有 Three 正交 2D mesh／蒙皮 | 可平滑衣袖、關節及權重過渡；須真正切圖／網格／權重，不能將整張 body 貼平面當蒙皮。透明 overdraw、圖集與 GPU 記憶體需實機量 | Three 已在依賴內，MIT；目前 AGENTS 將 Three 限在 highlight，擴大到通用人物需要 ADR。共享邏輯骨架，不另寫人體規則 | Canvas 原型驗收後若接縫或效能證據支持，再提出局部 GPU adapter |
| Spine 等成熟編輯器／runtime | 編輯器、蒙皮及動畫工具較完整，仍需相同的合格分層素材 | 外部編輯器／runtime 條款及費用需按當時版本核實；未採購、未安裝、未宣稱免費。可能改資產管線及整合範圍 | 現階段先不指定；若手工維護成本超出原型範圍，再交具體方案讓玩家決定 |
| 整個角色自由剛體布娃娃 | 易鬆散、失控、失去出招可讀性，手機 solver 與恢復成本較高 | 需碰撞、限制、質量、固定步長、可重現恢復及除錯工具 | 不適合作正常動作的主要驅動 |

### 建議的單一資料流

`既有戰報／核心事件 → CombatPresentationAdapter → AnimationIntent → ActorAnimator → RigSolver → RigFrame → CanvasAdapter／日後 ThreeAdapter + FX sockets`

- `RigDefinition`：版本、rest height=400 設計單位、父索引、rest transform、骨長、關節轉角限制、接地／碰撞形狀、武器 sockets；不進存檔、不改角色能力。
- 層級：root／骨盆 → 腹／胸 → 肩／頸 → 頭；雙肩→上臂→前臂→手；雙髖→大腿→小腿→腳。頭部以頸端為唯一父 transform，不設獨立追逐身體的 RAF 或自由頭剛體。
- `AppearanceBinding`：沿用現有 head／outfit／tone，對應每個 slot 的位圖／遮罩／z-order／socket；兵器描述含實際種類及 grip state。舊存檔只讀現有 ID，不作 schema 遷移。
- `AnimationIntent`：actor ID、event ID、action ID、skill／vol、開始時點、contact 時點、朝向與結果；區分 hit／miss／hurt／control／meditate／exit，不從粒子判斷傷害。
- `ActorAnimator`：idle、walk、run、anticipation、strike、recovery、hit、knockback、fall、grounded、get-up；明確 interrupt priority。倒地／控制取消當前動作時只中斷畫面，不刪掉已確定戰報事件；真正死亡不可自行起身。
- `RigSolver`：唯一寫入最終關節位置的來源。先 sample／blend 姿勢，再 FK，再腳底／手部雙骨 IK，再有限反應及約束投影，最後輸出唯讀 RigFrame。renderer、FX、React 不能改骨頭。
- 朝向只在 actor root 處處理一次；世界座標／角色 local／原圖 pixels 明確分開。身高由 rest rig 衡量，PNG 透明框只供裁切，不重定人物大小。

### 受約束反應，不做甩散的布娃娃

正常動作採關鍵姿勢、FK 及支撐腳 IK。受擊時只對胸、骨盆加入限幅的衝量／阻尼反應；保持肩頸及各骨長連接。倒地用作者控制的重心路徑，逐步增加受限物理權重，落地後穩定，起身沿可控姿勢返回；不能「整張平面轉 90 度」代替。

若原型採 position-based 約束：固定 1/60 秒物理步、帶阻尼／姿勢目標、明確質量及慣性比例、角度限制、地面膠囊／端點碰撞；頭頸不放成自由旋轉。每幀最多 4 個固定子步，掉幀超出預算捨棄積壓，停用前景時計並清 accumulator；回前景第一步 dt=0。每個物理步最後必須重新驗證連接、長度、角度、地面及 finite，失效就回到上一個有效完整姿勢並記錄 actor／action／step，而非只把 NaN 改成 0 繼續播。

物理幀供畫面插值，render 不推 solver。視覺子步上限只限制物理補算，不能丟失戰報事件；播放器的 event cursor 必須按原序各處理一次，跳過直接取既有最終結果並走一次完成回調。音效及特效只讀同一播放時鐘與 RigFrame sockets；不各自用一個 timer 移動手或頭。

## 7. 戰鬥規則與遷移邊界

現有兩種契約必須分開：

1. **事件自動交手**：combatSlice 的 combatAuto 在副本先算出 replay／next；onDone 才由 combatAutoCommit 套用。播放器只消費 replay。這項真正的入帳時機不可藉本次動畫改寫。
2. **主頁演武**：InkSparStage 的 heroStrike／foeStrike 呼叫真 SparDuel，並有 rounds.commitHeroMove／commitFoeMove 守門；不能直接套用「畫面 loop 可以任意重跑」的架構。日後 adapter 必須保留既有一次提交流程，把已提交的事件交給動畫，不能把 solver 接觸事件接回核心扣血。

`martialTurnPlan` 已按真已學卷輸出招式、每門起手只扣一次；不足內力會在核心選調息，控制及回復亦由 combatCore 等決定。新 animator 不重排卷數、不計命中、不決定耗內／回內、不重派獎勵。

建議遷移順序：單角色驗收 → **事件一對一 readonly replay** → 華山同元件 → 主頁演武的即時核心 adapter → 非同步一對一。每次只接一個入口，以開發／內測旗標保留舊 renderer 回退；回退沿用同一份結果，不重算。Three 舊庫先留存，不為清理程式而先刪除。會武／幫會戰保持暫停，最後只可做隔離多角色動畫效能場景。

## 8. 階段二的具體範圍與驗收方法（尚未實作）

第一件成品是**現有 App 內的單角色動畫驗收頁**，開發／內測入口，安全區及字體沿現有 App；正式主導航不出現新功能。沒有戰爭規則、配對、排行榜或獎勵。

拆成三個可檢視步驟：

1. **一套身體先通過**：traveller、一款既有頭、徒手；乾淨部件／關節重疊／前後遮擋。固定骨長及完整父子鏈；中立、抬手、屈膝及倒地先過接點門檻，未過不加武學光效。
2. **完整動作連續播放**：待機、走、跑、蓄勢→出招→收招、受擊、擊退、倒地→伏地→起身。先徒手，再單手劍，再雙手長兵；支撐腳鎖地，武器握點隨手，腳步與實際位移匹配。
3. **外觀相容性**：八頭、三衣、四布色及既有可用兵器逐步映射。未完成的組合在驗收頁明確列出，不能默默換圖或假稱所有組合已可用；原產品既有選擇保持。

頁面提供可點按的動作選擇、連續切換、左右轉向、頭／衣／色／兵器、0.25×／0.5×／1×、暫停、1/60 秒逐步、重播及除錯開關。除錯顯示關節／父子連線／碰撞形狀／socket／幀耗時；正式人物仍必須是詳細位圖，不以骨架線代替。

### 可攔截真問題的門檻

下列是新原型的起始驗收門檻，不是本輪現有系統已達到的結果；容差按 height=400 的設計座標固定，不因某張圖錯位而放寬：

- 親子接點從同一輸出 transform 取值；數值比較誤差≤1e-6 設計單位。FK 骨長應保持浮點誤差級；受限反應後長度相對誤差≤0.1%。
- 關節角度不得超出預先標定限制 0.5°；頭／頸及手／腕不可自由一圈。任何 NaN／Infinity、丟失父節點、負縮放被誤當骨長都直接 fail。
- 地面接觸點穿入不得超過 0.5 設計單位；支撐期腳底相對地面漂移≤1 設計單位，另看片確認沒有可見滑步；服飾不作腳底接觸點。
- 主手／兵器 grip 距離≤0.5 設計單位；雙手武器須同時檢查副手可達距離，超出時修改動作或換握，而非伸長手臂。徒手不得有持武圖；背負不可仍跟攻擊手轉動。
- 8×3×4 外觀組合逐一看 idle／attack contact／hurt／down／get-up 的頭頸及遮擋；左右都測。量度與人工動畫驗收並列，不能互相代替。
- 固定種子連打／反覆受擊／倒地起身及所有允許中斷；不同輸入 dt 分割得到相同固定步姿勢。注入 250ms／2s／背景 30s 時差後，恢復不補巨大步長、不飛散。
- 暫停後 solver 不變；render 任意次不改骨架。離場清理，重入只有一個 update owner。減少動態仍保留可讀結果；素材失敗用同身份舊 renderer 後備，清楚記錄降級。
- 同種子、同核心輸入在播放／跳過／連點／離場／重播／失敗後的 replay、下一狀態、RNG、玉石、內力、卷序、熟練與獎勵相同；採真資料序列快照及 once-only commit 次數，不測幾個變數存在就算通過。

### 播放與效能交付

同場景／鏡頭／角色／素材組合留修改前後影片、慢播接點近鏡、逐幀數值及實際點按操作紀錄。手機 320×568、390×844、430×932；減少動態、失圖、背景恢復均有記錄。

量冷載入、首次動作、warm update／render 的 p50／p95／p99、幀間距、JS heap／解碼位圖估算及長跑，並列環境／DPR／角色數／特效狀態。原型先檢查一名角色，階段三才檢查兩名及真戰報；二十人效能場景留到階段五，不先恢復會武。

**真 iPhone／WKWebView／TestFlight、溫度／耗電、前後景、離線重開及長時間真機記憶體仍待驗收。** Linux Chromium／WebKit 數字只作該環境基準，不能換算成真機穩定 60fps。

## 9. 本輪交付狀態

- 現況表、根因及方案：已交；證據與量測見索引。
- 原有繪圖器／元件實播：已記錄；缺失動作與不可量度項目如實列出。
- 新人物骨架、App RigLab、一對一遷移：尚未實作，屬下一階段。
- 多人戰、PR #156、後端、戰鬥數值、耗內／回內、經濟、裝備及存檔：沒有變更。
- 沒有版本升級、main 合併、Pages 部署或新 TestFlight 上傳。現有美術不判為已獲玩家接受。
