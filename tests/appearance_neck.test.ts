import {describe,expect,it} from 'vitest';
import {neckSkinOpacity} from '../src/appearance/neck';
import mapping from '../src/appearance/asset-map.json';
import fallback from '../src/appearance/asset-fallback.json';

describe('頭身接位',()=>{
  it('test_appearance_neck_面部與下顎_保持完整不因頸底柔化變透明',()=>{
    for(const y of [-70,-45,-28,-20,-14])expect(neckSkinOpacity(217,188,160,y)).toBe(1);
  });
  it('test_appearance_neck_長髮鬍鬚與銀髮_穿過衣領仍保留原圖',()=>{
    for(const rgb of [[32,28,24],[86,80,69],[203,201,198]])for(const y of [-9,0,16])expect(neckSkinOpacity(...rgb as [number,number,number],y)).toBe(1);
  });
  it('test_appearance_neck_平切膚色底_連續過渡而不是整塊矩形裁走',()=>{
    const values=[-14,-8,-2,4,10].map(y=>neckSkinOpacity(217,188,160,y));
    expect(values[0]).toBe(1);expect(values.at(-1)).toBe(0);
    for(let i=1;i<values.length;i++)expect(values[i]).toBeLessThan(values[i-1]);
  });
  it('test_appearance_neck_所有網絡圖失敗_仍有相同頸部內嵌後備',()=>{
    expect(mapping.neck).toBe('ink/art/appearance/neck-bridge.webp');
    expect((fallback as Record<string,string>)[mapping.neck]).toMatch(/^data:image\/webp;base64,/);
  });
});
