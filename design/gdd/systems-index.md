# Systems Index — 江湖一生

現行功能／介面／演出對照更新至EA0.104.0，見[全遊戲同步檢查](../audits/game-unification-ea0104.md)。以下保留原系統來源，詳細人物動畫已由玩家要求改回斗笠黑影。

| System | Owner module | Status |
|--------|----------------|--------|
| Unified event runtime | `interfaces/eventRuntime.ts`, `core/life/resolveChoice.ts` | ADR-001 |
| Event engine | `core/life/eventEngine.ts` | stage-weighted + arcs |
| Narrate overrides | `data/events/narrateOverrides.ts` | high-traffic rewrite |
| Short life arcs | `core/life/arcs.ts` | active |
| Town NPCs | `core/life/npcCatalog.ts` + `content/npcs/` | wired |
| Foe AI styles | `core/life/foeAi.ts` | active |
| Combat presentation | `core/life/combatPresentation.ts` | opening / aftermath UI |
| Combat ink FX | `core/life/combatInkFx.ts` · `design/gdd/combat-ink-fx.md` | 旁註／血條墨滲／站位筆勢 |
| Injury (部位傷勢) | `core/life/injuries.ts`· `design/gdd/injury-system.md` | active |
| Ancestral merit (祖蔭) | `core/life/ancestry.ts` · `design/gdd/ancestral-merit.md` | active |
| Spar duel (演武台對打) | `core/life/sparDuel.ts` · `design/gdd/spar-duel.md` | active |
| Foe roster & boss traits (敵人圖鑑／首領特性) | `data/foes/*` · `core/life/foeTraits.ts` · `design/gdd/foe-roster.md` | active |
| Combat visuals (黑影／外功特效) | `src/spar/`、`src/fx/art/*` | 黑影人物；原武學特效保留；細節人體暫停 |
| Ink scene variants | `src/components/ink/sceneVariants.ts` | season + place |
| Legacy / death / coach | `legacy.ts` / `death.ts` / `tutorial.ts` | stable |
| Story chapters | — | **cancelled** |

## Leap packages

1. 統一運行時視圖（不改寫 Pack JSON）
2. 短弧 + 鎮中故人記憶
3. 高頻敘事覆蓋 + `scripts/auditNarrate.mjs`
4. 敵人路數 AI + 餘波提示
5. 季節／地點水墨舞台

見 `docs/architecture/adr-001-unified-event-runtime.md`。
