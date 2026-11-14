import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const native=vi.hoisted(()=>({isNativePlatform:vi.fn(),isPluginAvailable:vi.fn(),impact:vi.fn(),notification:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:native}));
vi.mock('@capacitor/haptics',()=>({Haptics:native,ImpactStyle:{Light:'LIGHT',Medium:'MEDIUM',Heavy:'HEAVY'},NotificationType:{Success:'SUCCESS',Error:'ERROR'}}));
beforeEach(()=>{
 vi.resetModules();native.isNativePlatform.mockReturnValue(true);native.isPluginAvailable.mockReturnValue(true);native.impact.mockReset().mockResolvedValue(undefined);native.notification.mockReset().mockResolvedValue(undefined);
 vi.stubGlobal('navigator',{});vi.stubGlobal('document',{documentElement:{dataset:{}}});vi.stubGlobal('window',{matchMedia:()=>({matches:false})});vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
});
afterEach(()=>vi.unstubAllGlobals());
describe('iPhone原生觸覺與瀏覽器後備',()=>{
 it.each([['light','LIGHT'],['medium','MEDIUM'],['heavy','HEAVY']] as const)('test_haptic_沒有vibrate的原生iPhone仍有對應觸覺_%s',async(kind,style)=>{
  const {haptic,hapticsSupported}=await import('../src/ui/haptics');expect(hapticsSupported()).toBe(true);haptic(kind);expect(native.impact).toHaveBeenCalledWith({style});
 });
 it('test_haptic_勝負提示使用原生通知而非長震',async()=>{
  const {haptic}=await import('../src/ui/haptics');haptic('ritual');haptic('fail');expect(native.notification.mock.calls.map(c=>c[0])).toEqual([{type:'SUCCESS'},{type:'ERROR'}]);expect(native.impact).not.toHaveBeenCalled();
 });
 it('test_haptic_iOSSafari不冒稱有原生觸覺_支援vibrate的瀏覽器沿用後備',async()=>{
  native.isNativePlatform.mockReturnValue(false);const {haptic,hapticsSupported}=await import('../src/ui/haptics');expect(hapticsSupported()).toBe(false);haptic('light');expect(native.impact).not.toHaveBeenCalled();
  const vibrate=vi.fn();vi.stubGlobal('navigator',{vibrate});expect(hapticsSupported()).toBe(true);haptic('light');expect(vibrate).toHaveBeenCalledWith(8);
 });
 it('test_haptic_關閉或減少動態不發原生震動',async()=>{
  const {haptic,setHapticsEnabled}=await import('../src/ui/haptics');setHapticsEnabled(false);haptic('light');setHapticsEnabled(true);
  document.documentElement.dataset.inkMotion='reduce';haptic('medium');delete document.documentElement.dataset.inkMotion;vi.stubGlobal('window',{matchMedia:()=>({matches:true})});haptic('heavy');expect(native.impact).not.toHaveBeenCalled();
 });
 it('test_haptic_原生插件拒絕不令操作拋錯或退回重震',async()=>{
  native.impact.mockRejectedValueOnce(new Error('fixture unavailable'));const {haptic}=await import('../src/ui/haptics');expect(()=>haptic('light')).not.toThrow();await Promise.resolve();
 });
});
