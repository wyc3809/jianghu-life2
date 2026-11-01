/** 審查未被現行產品入口引用的舊交手；不註冊正式路由，不寫存檔。 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import DuelFx from '../../src/fx/highlight/duel/DuelFx';
import { makeBattlePreview } from '../../src/prototypes/battleFixtures';
const replay=makeBattlePreview('event');
replay.playerAppearance={head:'silver',outfit:'scholar',tone:'jade'};
replay.foeAppearance={head:'bun',outfit:'traveller',tone:'cinnabar'};
Object.assign(window,{__auditReplay:replay});
createRoot(document.getElementById('root')!).render(<DuelFx replay={replay} onDone={()=>{document.documentElement.dataset.auditDone='true';}} onFail={()=>{document.documentElement.dataset.auditFail='true';}}/>);
