import {writeFileSync,mkdirSync} from 'node:fs';
import {sectBattleFixture} from '../../src/prototypes/sectBattle/fixtures';
const states=sectBattleFixture().map((u,i)=>{u.state.character.name=`組織驗收${String(i+1).padStart(2,'0')}`;u.state.character.flags.newbie_done=true;u.state.pending=null;u.state.character.martial=i===0?5000:i===10?1:u.state.character.martial;return u.state;});
mkdirSync('.local-online/organization-qa',{recursive:true});writeFileSync('.local-online/organization-qa/states.json',JSON.stringify(states));console.log('組織測試人物',states.length);
