import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVisualLoop, scheduleVisualPreload, watchVisualActivity } from '../src/ui/visualActivity';
import { holdHighlightVisibility } from '../src/ui/highlightVisibility';
import { HighlightRenderBudget } from '../src/fx/highlight/scene/highlightRenderBudget';
import { createNewLife } from '../core/life/gameState';
import { newbieGuide } from '../core/life/newbieGuide';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { createCharacterSlice } from '../src/store/slices/characterSlice';
import { createProgressionSlice } from '../src/store/slices/progressionSlice';
import type { LifeStore } from '../src/store/lifeStore';

function browser() {
  const doc = Object.assign(new EventTarget(), { hidden: false, documentElement: { dataset: {} as Record<string,string> }, body: {}, querySelector: vi.fn(() => null as object | null) });
  const motion = Object.assign(new EventTarget(), { matches: false });
  const observers: (()=>void)[] = [];
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', { matchMedia: () => motion });
  vi.stubGlobal('MutationObserver', class { constructor(callback: ()=>void) { observers.push(callback); } observe() {} disconnect() {} });
  return { doc, motion, mutate: () => observers.forEach(cb => cb()) };
}
function life() { const state=createNewLife({seed:11});state.pending=null;return state; }
function won() { const state=life();state.character.flags.newbie_trial_won=true;state.character.gear.push('iron-blade');return state; }
afterEach(() => vi.unstubAllGlobals());

describe('App動畫啟停與畫質', () => {
  it('test_motion_停止不留RAF_恢復首幀不補播', () => {
    let id=0; const queued=new Map<number,FrameRequestCallback>();
    const clock={request:(callback:FrameRequestCallback)=>{queued.set(++id,callback);return id;},cancel:(key:number)=>{queued.delete(key);}};
    const draw=vi.fn(),loop=createVisualLoop(draw,clock);
    const tick=(time:number)=>{const [key,cb]=queued.entries().next().value!;queued.delete(key);cb(time);};
    loop.setActive(true);loop.setActive(true);expect(queued.size).toBe(1);
    tick(100);tick(120);expect(draw.mock.calls.map(call=>call[1])).toEqual([0,.02]);
    loop.setActive(false);expect(queued.size).toBe(0);
    loop.setActive(true);tick(900000);expect(draw.mock.calls.at(-1)?.[1]).toBe(0);
    loop.dispose();expect(queued.size).toBe(0);
  });
  it('test_motion_已取消但遲到的回調不繪畫或重開', () => {
    let callback:FrameRequestCallback=()=>{};const draw=vi.fn();
    const loop=createVisualLoop(draw,{request:cb=>{callback=cb;return 1;},cancel:()=>{}});
    loop.setActive(true);loop.dispose();callback(100);expect(draw).not.toHaveBeenCalled();
  });
  it('test_motion_重疊高光背景與減少動態只通知狀態改變', () => {
    const {doc,motion,mutate}=browser(),change=vi.fn();
    const stop=watchVisualActivity(change,{covered:true,reduced:true,dialogs:true});
    const a=holdHighlightVisibility(),b=holdHighlightVisibility();a();expect(change.mock.calls.map(c=>c[0])).toEqual([true,false]);b();
    doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));
    doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));
    motion.matches=true;motion.dispatchEvent(new Event('change'));
    motion.matches=false;motion.dispatchEvent(new Event('change'));
    doc.documentElement.dataset.inkMotion='reduce';mutate();delete doc.documentElement.dataset.inkMotion;mutate();
    doc.querySelector.mockReturnValue({});mutate();doc.querySelector.mockReturnValue(null);mutate();
    expect(change.mock.calls.map(c=>c[0])).toEqual([true,false,true,false,true,false,true,false,true,false,true]);
    stop();doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));expect(change).toHaveBeenCalledTimes(11);
  });
  it('test_motion_閒時預載可取消_回前景只執行一次', () => {
    const {doc}=browser();let id=0;const pending=new Map<number,()=>void>(),load=vi.fn();
    Object.assign(window,{requestIdleCallback:(cb:()=>void)=>{pending.set(++id,cb);return id;},cancelIdleCallback:(key:number)=>pending.delete(key)});
    const stop=scheduleVisualPreload(load);expect(pending.size).toBe(1);
    doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));expect(pending.size).toBe(0);
    doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));const cb=[...pending.values()][0]!;pending.clear();cb();
    doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));
    expect(load).toHaveBeenCalledTimes(1);expect(pending.size).toBe(0);stop();
  });
  it('test_motion_先減粒子_持續慢幀才降主體解像度_結果復原', () => {
    const budget=new HighlightRenderBudget(2);
    for(let i=0;i<3;i++)expect(budget.sample(60)).toBe(2);expect(budget.effects).toBe(.65);
    for(let i=0;i<3;i++)expect(budget.sample(60)).toBe(2);expect(budget.effects).toBe(.4);
    budget.sample(60);budget.sample(60);expect(budget.sample(60)).toBe(1.75);
    for(let i=0;i<100;i++)budget.sample(60);expect(budget.sample(16)).toBeGreaterThanOrEqual(.8);
    expect(budget.settle()).toBe(2);expect(budget.effects).toBe(1);
  });
  it('test_motion_單次慢幀及背景長停頓不降低畫質', () => {
    const budget=new HighlightRenderBudget(2);
    for(let i=0;i<30;i++){budget.sample(60);budget.sample(16);budget.sample(5000);}
    expect(budget.effects).toBe(1);expect(budget.sample(16)).toBe(2);
  });
  it('test_motion_連續超過一秒仍降質_背景明確重設連續計數', () => {
    const budget=new HighlightRenderBudget(2);
    budget.sample(1500);budget.sample(1500);budget.sample(0);
    expect(budget.sample(1500)).toBe(2);expect(budget.effects).toBe(1);
    budget.sample(1500);budget.sample(1500);expect(budget.effects).toBe(.65);
    for(let i=0;i<6;i++)budget.sample(1500);
    expect(budget.sample(16)).toBe(1.75);
  });
});

describe('試煉至真確認換裝引導', () => {
  it('test_guide_比較前修復舊版已得兵器_不換裝不重派_重按不再寫檔', () => {
    const s=won();s.character.gear=s.character.gear.filter(id=>id!=='iron-blade');
    const before=structuredClone(s);let current={state:s} as LifeStore;const save=vi.fn();
    const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,save);
    actions.prepareNewbieEquipment();before.character.gear.push('iron-blade');expect(current.state).toEqual(before);
    expect(newbieGuide(current.state!)?.step).toBe('equip');actions.prepareNewbieEquipment();expect(save).toHaveBeenCalledTimes(1);
  });
  it.each(['未贏試煉','已完成引導'])('test_guide_%s_不補兵器', kind => {
    const s=life();if(kind==='已完成引導'){s.character.flags.newbie_trial_won=true;s.character.flags.newbie_done=true;}
    const before=structuredClone(s);let current={state:s} as LifeStore;const save=vi.fn();
    const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,save);
    actions.prepareNewbieEquipment();expect(current.state).toEqual(before);expect(save).not.toHaveBeenCalled();
  });
  it('test_guide_只讀真進度_沒有試煉不跳換裝_沒有兵器不假稱取得', () => {
    const s=life(),before=structuredClone(s);expect(newbieGuide(s)?.step).toBe('trial');expect(s).toEqual(before);
    s.character.flags.newbie_trial_won=true;expect(newbieGuide(s)).toBeNull();
    s.character.gear.push('iron-blade');expect(newbieGuide(s)?.step).toBe('equip');
  });
  it('test_guide_舊檔後代及略過不強制顯示_不假完成', () => {
    const s=won();s.character.flags.coach_done=true;const before=structuredClone(s);
    expect(newbieGuide(s)).toBeNull();expect(s).toEqual(before);
    const old=createNewLife({seed:42,skipCoach:true});expect(newbieGuide(old)).toBeNull();
  });
  it('test_guide_真換裝才保存攻擊差_重複確認不覆寫前值', () => {
    let current={state:won()} as LifeStore;const save=vi.fn();
    const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,save);
    const money=current.state!.character.money, practice=current.state!.practiceActionsLeft;
    actions.equipOwned('iron-blade');expect(newbieGuide(current.state!)?.body).toContain('4 → 10');
    expect(current.state!.character.equipment.weapon).toBe('iron-blade');expect(current.state!.character.money).toBe(money);expect(current.state!.practiceActionsLeft).toBe(practice);
    actions.equipOwned('iron-blade');expect(current.state!.character.flags.newbie_weapon_attack_before).toBe(4);
    const loaded=lifeGameStateSchema.parse(JSON.parse(JSON.stringify(current.state)));expect(newbieGuide(loaded)?.body).toContain('4 → 10');
  });
  it('test_guide_對戰配搭不完成普通換裝引導', () => {
    let current={state:won()} as LifeStore;const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,vi.fn());
    actions.equipOwned('iron-blade','duel');expect(newbieGuide(current.state!)?.step).toBe('equip');expect(current.state!.character.flags.newbie_weapon_attack_before).toBeUndefined();
  });
  it('test_guide_略過後重開只改提示旗標_不清進度或重派獎', () => {
    let current={state:won()} as LifeStore;const actions=createProgressionSlice(patch=>{current={...current,...patch};},()=>current,vi.fn());
    actions.dismissCoach();const before=structuredClone(current.state!);expect(newbieGuide(current.state!)).toBeNull();
    actions.resumeCoach();before.character.flags.coach_done=false;expect(current.state).toEqual(before);expect(newbieGuide(current.state!)?.step).toBe('equip');
  });
});
