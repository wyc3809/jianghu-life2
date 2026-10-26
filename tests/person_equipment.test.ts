import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { getGearDef } from '../data/equipment/catalog';
import { equipmentCandidates, equipmentStatRows } from '../src/ui/personEquipment';

describe('人物換裝清單與比較',()=>{
  it('test_personEquipment_只顯示真持有同類裝備_排除其他欄位及重複',()=>{
    const c=createNewLife({seed:42}).character;
    c.gear=['old-sword','iron-blade','plain-robe','iron-blade','missing'];
    const before=structuredClone(c);
    const list=equipmentCandidates(c,'weapon','all','power');
    expect(list.map(d=>d.id)).toEqual(['iron-blade','old-sword']);
    expect(c).toEqual(before);
    expect(equipmentCandidates(c,'weapon','fine','name').map(d=>d.id)).toEqual(['iron-blade']);
    expect(equipmentCandidates(c,'accessory','all','rarity')).toEqual([]);
  });
  it('test_personEquipment_預覽升降_顯示真實差額且不修改定義',()=>{
    const sword=getGearDef('old-sword')!,blade=getGearDef('iron-blade')!;
    const before=structuredClone(blade);
    expect(equipmentStatRows(sword,blade)).toContainEqual({label:'攻擊',before:4,after:10,delta:6});
    expect(equipmentStatRows(blade,sword)).toContainEqual({label:'武學',before:2,after:0,delta:-2});
    expect(equipmentStatRows(null,null)).toEqual([]);
    expect(blade).toEqual(before);
  });
});
