import { afterEach, expect, it, vi } from 'vitest';
const feedback=vi.hoisted(()=>({haptic:vi.fn()}));
vi.mock('../src/ui/haptics',()=>feedback);
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
it('test_tap_同次click共用與局部回饋只響一次_靜音不重開聲音',async()=>{
 vi.resetModules();let now=100;vi.stubGlobal('performance',{now:()=>now});vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
 vi.stubGlobal('window',{matchMedia:()=>({matches:false})});
 const audio=await import('../src/audio/inkAudio');audio.setAudioMix({musicOn:false,sfxOn:false});audio.playInkTap('firm');audio.playInkTap();
 expect(feedback.haptic).toHaveBeenCalledTimes(1);expect(feedback.haptic).toHaveBeenCalledWith('medium');now+=70;audio.playInkTap();expect(feedback.haptic).toHaveBeenCalledTimes(2);expect(audio.isInkAudioMuted()).toBe(true);
});
