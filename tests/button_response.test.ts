import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({animate:vi.fn(),watch:vi.fn()}));
vi.mock('animejs',()=>({animate:mock.animate,splitText:vi.fn(),stagger:vi.fn()}));
vi.mock('../src/ui/visualActivity',()=>({watchVisualActivity:mock.watch}));
import { inkControlPress } from '../src/ui/inkMotion';
function button(){
 const props=new Map<string,string>();props.set('--ink-key-scale','.99');const classes=new Set<string>();
 return {querySelector:()=>null,appendChild:vi.fn(),dataset:{} as Record<string,string>,style:{getPropertyValue:(n:string)=>props.get(n)??'',getPropertyPriority:()=>'',setProperty:(n:string,v:string)=>props.set(n,v),removeProperty:(n:string)=>props.delete(n)},classList:{add:(n:string)=>classes.add(n),remove:(n:string)=>classes.delete(n),contains:(n:string)=>classes.has(n)}} as unknown as HTMLElement;
}
beforeEach(()=>{vi.stubGlobal('document',{hidden:false,documentElement:{dataset:{}},createElement:()=>({setAttribute:vi.fn(),remove:vi.fn()})});vi.stubGlobal('getComputedStyle',()=>({position:'static'}));vi.stubGlobal('window',{matchMedia:()=>({matches:false})});mock.animate.mockReset().mockImplementation(()=>({cancel:vi.fn(),revert:vi.fn()}));mock.watch.mockReset().mockImplementation(()=>vi.fn());});
afterEach(()=>vi.unstubAllGlobals());
describe('按壓回彈的重入及清理',()=>{
 it('test_key_短按放手會回彈_完成還原原樣式且不留動畫',()=>{
  const el=button(),finish=vi.fn(),key=inkControlPress(el,finish);expect(el.dataset.inkPress).toBe('down');key.release();key.release();expect(mock.animate).toHaveBeenCalledTimes(2);expect(mock.animate.mock.results[0]!.value.cancel).toHaveBeenCalledTimes(1);
  mock.animate.mock.calls[1]![1].onComplete();expect(el.style.getPropertyValue('--ink-key-scale')).toBe('.99');expect(el.style.getPropertyValue('--ink-key-y')).toBe('');expect(el.classList.contains('ink-key-response')).toBe(false);expect(finish).toHaveBeenCalledTimes(1);
 });
 it('test_key_連點取消上一段_舊回調不清除新按壓',()=>{
  const el=button(),old=inkControlPress(el);old.release();const oldEnd=mock.animate.mock.calls[1]![1].onComplete;const next=inkControlPress(el);oldEnd();expect(el.dataset.inkPress).toBe('down');next.cancel();expect(el.dataset.inkPress).toBeUndefined();
 });
 it('test_key_拖動取消或背景及偏好變化_不播回彈且解除監聽',()=>{
  const el=button(),key=inkControlPress(el);mock.watch.mock.calls[0]![0](false);key.release();key.cancel();expect(mock.animate).toHaveBeenCalledTimes(1);expect(mock.watch.mock.results[0]!.value).toHaveBeenCalledTimes(1);expect(el.dataset.inkPress).toBeUndefined();
 });
 it('test_key_減少動態直接完成且只清理一次',()=>{
  document.documentElement.dataset.inkMotion='reduce';const finish=vi.fn(),key=inkControlPress(button(),finish);key.release();key.cancel();expect(finish).toHaveBeenCalledTimes(1);expect(mock.animate).not.toHaveBeenCalled();
 });
});
