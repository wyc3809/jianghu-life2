import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({animate:vi.fn(),watch:vi.fn()}));
vi.mock('animejs',()=>({animate:mocks.animate,splitText:vi.fn(),stagger:vi.fn()}));
vi.mock('../src/ui/visualActivity',()=>({watchVisualActivity:mocks.watch}));
import { inkSurfaceIn } from '../src/ui/inkMotion';

function surface(){
 const classes=new Set<string>();
 return {dataset:{} as Record<string,string>,classList:{add:(v:string)=>classes.add(v),remove:(v:string)=>classes.delete(v)}} as unknown as HTMLElement;
}
beforeEach(()=>{
 vi.stubGlobal('document',{hidden:false,documentElement:{dataset:{}}});
 vi.stubGlobal('window',{matchMedia:()=>({matches:false})});
 mocks.animate.mockReset().mockImplementation(()=>({revert:vi.fn()}));
 mocks.watch.mockReset().mockImplementation(()=>vi.fn());
});
afterEach(()=>vi.unstubAllGlobals());
describe('冊頁動效的生命週期',()=>{
 it('test_surface_換頁中再開_取消前一段且舊回調不清除新動畫',()=>{
  const el=surface();inkSurfaceIn(el);const oldEnd=mocks.animate.mock.calls[0]![1].onComplete;
  const oldAnimation=mocks.animate.mock.results[0]!.value,oldUnwatch=mocks.watch.mock.results[0]!.value;
  const stop=inkSurfaceIn(el,'sheet');expect(oldAnimation.revert).toHaveBeenCalledTimes(1);expect(oldUnwatch).toHaveBeenCalledTimes(1);
  oldEnd();expect(el.dataset.inkEntering).toBe('sheet');stop();expect(el.dataset.inkEntering).toBeUndefined();
 });
 it('test_surface_背景或減少動態_立即還原並停止監聽',()=>{
  const el=surface();const stop=inkSurfaceIn(el,'sheet');const animation=mocks.animate.mock.results[0]!.value;
  mocks.watch.mock.calls[0]![0](false);stop();
  expect(animation.revert).toHaveBeenCalledTimes(1);expect(mocks.watch.mock.results[0]!.value).toHaveBeenCalledTimes(1);expect(el.dataset.inkEntering).toBeUndefined();
 });
 it('test_surface_正常播完及重複清理_還原原樣式一次',()=>{
  const el=surface(),stop=inkSurfaceIn(el);mocks.animate.mock.calls[0]![1].onComplete();stop();
  expect(mocks.animate.mock.results[0]!.value.revert).toHaveBeenCalledTimes(1);expect(el.dataset.inkEntering).toBeUndefined();
 });
 it('test_surface_系統或遊戲減少動態及背景_直接顯示且不排動畫',()=>{
  document.documentElement.dataset.inkMotion='reduce';inkSurfaceIn(surface());
  delete document.documentElement.dataset.inkMotion;vi.stubGlobal('window',{matchMedia:()=>({matches:true})});inkSurfaceIn(surface());
  vi.stubGlobal('window',{matchMedia:()=>({matches:false})});Object.assign(document,{hidden:true});inkSurfaceIn(surface());inkSurfaceIn(null);
  expect(mocks.animate).not.toHaveBeenCalled();expect(mocks.watch).not.toHaveBeenCalled();
 });
});
