import{writeFileSync,mkdirSync}from'node:fs';
import{sectBattleFixture}from'../../src/prototypes/sectBattle/fixtures';
const values=sectBattleFixture().map((u,i)=>{u.state.character.name=`會武驗收${String(i+1).padStart(2,'0')}`;return u.state;});
mkdirSync('.local-online/sect-production',{recursive:true});writeFileSync('.local-online/sect-production/states.json',JSON.stringify(values));
console.log('SECT_QA_FIXTURES',values.length);
