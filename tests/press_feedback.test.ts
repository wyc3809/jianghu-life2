import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/audio/inkAudio',()=>({playInkTap:vi.fn()}));
import { installPressFeedback } from '../src/ui/pressFeedback';
class Control extends EventTarget {
 classes=new Set<string>(); blocked=false;
 classList={add:(v:string)=>this.classes.add(v),remove:(v:string)=>this.classes.delete(v)};
 closest(selector:string){return selector.includes('[disabled]')?(this.blocked?this:null):this;}
}
function setup(){
 const doc=new EventTarget(),win=new EventTarget();
 vi.stubGlobal('Element',Control);vi.stubGlobal('HTMLElement',Control);vi.stubGlobal('document',doc);vi.stubGlobal('window',win);
 const button=new Control();let clicks=0;button.addEventListener('click',()=>clicks++);
 const send=(type:string,props:Record<string,unknown>={})=>{const e=new Event(type,{cancelable:true});Object.defineProperty(e,'target',{value:button});Object.assign(e,props);doc.dispatchEvent(e);return e;};
 return {doc,button,send,clicks:()=>clicks,stop:installPressFeedback()};
}
afterEach(()=>vi.unstubAllGlobals());
describe('共用按壓不攔原生操作',()=>{
 it('test_press_拖動或捲動_取消按壓且不發點擊',()=>{
  const {button,send,clicks,stop}=setup();send('pointerdown',{pointerId:1,button:0,clientX:20,clientY:20});expect(button.classes.has('is-pressed')).toBe(true);
  send('pointermove',{pointerId:1,clientX:20,clientY:35});expect(button.classes.size).toBe(0);
  send('pointerdown',{pointerId:1,button:0,clientX:20,clientY:20});send('scroll');expect(button.classes.size).toBe(0);expect(clicks()).toBe(0);stop();
 });
 it('test_press_第二指及非主要按鍵_不打斷原按壓',()=>{
  const {button,send,stop}=setup();send('pointerdown',{pointerId:1,button:0});send('pointerdown',{pointerId:2,button:0,isPrimary:false});send('pointerup',{pointerId:2});expect(button.classes.has('is-pressed')).toBe(true);
  send('pointerup',{pointerId:1});expect(button.classes.size).toBe(0);send('pointerdown',{pointerId:3,button:2});expect(button.classes.size).toBe(0);stop();
 });
 it('test_press_鍵盤保持原生確認_不阻止事件或重發指令',()=>{
  const {button,send,clicks,stop}=setup();const event=send('keydown',{key:'Enter'});expect(button.classes.has('is-pressed')).toBe(true);expect(event.defaultPrevented).toBe(false);expect(clicks()).toBe(0);
  send('keyup',{key:'Enter'});expect(button.classes.size).toBe(0);stop();send('keydown',{key:' '});expect(button.classes.size).toBe(0);
 });
 it('test_press_禁用及慣性離場_沒有殘留按壓',()=>{
  const {button,send,stop}=setup();button.blocked=true;send('pointerdown',{pointerId:1,button:0});expect(button.classes.size).toBe(0);
  button.blocked=false;send('pointerdown',{pointerId:1,button:0});send('visibilitychange');expect(button.classes.size).toBe(0);stop();
 });
});
