import type { LifeGameState } from '@interfaces/lifeEngine';
import { createRng } from '@core/random';
import { tryAdvanceSkill } from './flavor';
import { supportMartialSlots } from './martialLoadout';

/** 真正擊敗一名對手才記一次；獨立隨機流不推進人生事件序列。 */
export function settleSparTraining(state:LifeGameState,usedArts:readonly string[]):string[] {
  const c=state.character;
  c.flags.spar_foes_total=Number(c.flags.spar_foes_total??0)+1;
  const rng=createRng(state.seed ^ Math.imul(Number(c.flags.spar_foes_total),0x40503));
  const support=supportMartialSlots(c),lines:string[]=[];
  for(const id of new Set([...usedArts,support.internal,support.qinggong])) {
    if(!id||!c.skills.includes(id))continue;
    const line=tryAdvanceSkill(state,id,'combat',rng);
    if(line)lines.push(line);
  }
  return lines;
}
