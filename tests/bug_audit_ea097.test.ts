import { createEventSlice } from '../src/store/slices/eventSlice';
import type { LifeStore } from '../src/store/lifeStore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createNewLife } from '../core/life/gameState';
import { performPracticeAction } from '../core/life/actions';
import { foundSect, recruitDisciple, teachDisciple } from '../core/life/foundedSect';
import { tryAdvanceSkill } from '../core/life/flavor';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { loadLifeSave, persistLife } from '../core/life/saveIndexedDb';

function life() { const s=createNewLife({seed:42,skipCoach:true});s.pending=null;s.practiceActionsLeft=3;return s; }
function founder() { const s=life();s.character.martial=300;s.character.reputation=100;s.character.money=1000;s.character.sectId=null;foundSect(s,'青山門');recruitDisciple(s);return s; }
afterEach(()=>vi.unstubAllGlobals());

describe('第53項：無效操作與真存檔重現',()=>{
 it.each(['heal','heal_full','forge_fine'] as const)('test_practice_銀兩不足%s_不扣次數不動RNG或年譜',action=>{
  const s=life();s.character.money=0;const before=structuredClone(s);
  const logs=performPracticeAction(s,action);
  expect(logs.length).toBeGreaterThan(0);expect(s).toEqual(before);
 });
 it('test_practice_重複捐獻_不扣次數',()=>{
  const s=life();s.character.sectId=Object.keys(s.sects)[0]!;s.character.money=10000;performPracticeAction(s,'sect_donate');const before=structuredClone(s);
  performPracticeAction(s,'sect_donate');expect(s).toEqual(before);
 });
 it('test_teach_只扣一次修煉_耗盡後不長進不改RNG',()=>{
  const s=founder(),d=s.foundedSect!.disciples[0]!;s.practiceActionsLeft=1;
  teachDisciple(s,d.id);expect(s.practiceActionsLeft).toBe(0);expect(d.progress).toBeGreaterThan(0);
  const before=structuredClone(s);teachDisciple(s,d.id);expect(s).toEqual(before);
 });
 it.each([null,Number.POSITIVE_INFINITY])('test_save_舊滿階門檻%s_可載入且不再升級',value=>{
  const s=founder(),id=s.character.skills[0]!;const raw=structuredClone(s) as any;
  raw.character.skillRanks[id]=3;raw.character.skillAdvanceNeed={[id]:value};raw.foundedSect.disciples[0].advanceNeed=value;raw.foundedSect.disciples[0].status='graduated';raw.foundedSect.disciples[0].rank=3;
  const parsed=lifeGameStateSchema.parse(raw);expect(parsed.character.skillAdvanceNeed[id]).toBe(Number.MAX_SAFE_INTEGER);expect(parsed.foundedSect?.disciples[0]?.advanceNeed).toBe(Number.MAX_SAFE_INTEGER);
 });
 it('test_event_不存在選項_不扣行動力不寫引導或存檔',()=>{
  const s=life();s.pending={eventId:'family_poverty',year:s.year,month:s.month,kind:'ordinary'};const before=structuredClone(s);
  let current={state:s} as LifeStore;const save=vi.fn();const actions=createEventSlice(patch=>{current={...current,...patch};},()=>current,save);
  actions.choose('no_such_choice');expect(current.state).toEqual(before);expect(save).not.toHaveBeenCalled();
 });
 it('test_practice_舊門派名冊缺失_仍可正常退派',()=>{
  const s=life();s.character.sectId='removed_legacy_sect';performPracticeAction(s,'sect_leave');expect(s.character.sectId).toBeNull();expect(s.practiceActionsLeft).toBe(2);
 });
 it('test_save_自立門派及弟子_驗證後仍保留',()=>{
  const s=founder();const parsed=lifeGameStateSchema.parse(JSON.parse(JSON.stringify(s)));
  expect(parsed.foundedSect).toEqual(s.foundedSect);
 });
 it('test_save_武學練滿_仍可驗證與JSON往返',()=>{
  const s=life(),id=s.character.skills[0]!;s.character.skillRanks[id]=2;s.character.skillAdvanceNeed={[id]:0.01};s.character.skillProgress={[id]:0};tryAdvanceSkill(s,id,'combat');
  expect(s.character.skillRanks[id]).toBe(3);expect(lifeGameStateSchema.safeParse(s).success).toBe(true);expect(lifeGameStateSchema.safeParse(JSON.parse(JSON.stringify(s))).success).toBe(true);
 });
 it.each(['both','idb','local'] as const)('test_save_出師弟子_真儲存層%s重開不失門派',async channel=>{
  const data=new Map<string,string>();vi.stubGlobal('indexedDB',channel==='local'?undefined:new IDBFactory());vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{if(channel==='idb')throw new Error('full');data.set(k,v);},removeItem:(k:string)=>data.delete(k)});
  const s=founder(),d=s.foundedSect!.disciples[0]!;for(let i=0;i<3;i++){d.advanceNeed=0.01;teachDisciple(s,d.id);}expect(d.status).toBe('graduated');await persistLife(s);
  expect((await loadLifeSave())?.state.foundedSect).toEqual(s.foundedSect);
 });
});
