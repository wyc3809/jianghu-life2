import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LifeCharacter, NatureState } from '../interfaces/lifeEngine';
import { personNatureMark } from '../src/ui/personNature';
import { InkNatureMark } from '../src/components/ink/InkNatureMark';

describe('人物姓名旁心性', () => {
  it('test_person_nature_四種最高值_各顯對應字與獨立紋樣', () => {
    const cases = [['xia','俠'],['xie','邪'],['kuang','狂'],['e','惡']] as const;
    for (const [key,label] of cases) {
      const character = { nature: { xia: 12, xie: 8, kuang: 10, e: 6, [key]: 72 } };
      const mark = personNatureMark(character);
      expect(mark.key).toBe(key); expect(mark.label).toBe(label);
      expect(mark.art).toContain(`nature-${key}.webp`);
    }
  });
  it('test_person_nature_最高同分_沿既有次序穩定顯一項', () => {
    expect(personNatureMark({nature:{xia:0,xie:0,kuang:0,e:0}}).key).toBe('xia');
    expect(personNatureMark({nature:{xia:2,xie:30,kuang:30,e:30}}).key).toBe('xie');
  });
  it('test_person_nature_舊檔缺項_只讀後備不改原資料', () => {
    const character = Object.freeze({nature:Object.freeze({e:40}) as NatureState});
    expect(personNatureMark(character).key).toBe('e');
    expect(character.nature).toEqual({e:40});
    expect(personNatureMark({nature:undefined as unknown as NatureState}).key).toBe('xia');
  });
  it('test_person_nature_姓名小印_只標最高名稱不列心性點數', () => {
    const character = {nature:{xia:12,xie:8,kuang:63,e:6}} as LifeCharacter;
    const html = renderToStaticMarkup(createElement(InkNatureMark, {character}));
    expect(html).toContain('aria-label="心性：狂"');
    expect(html).toContain('ink-person-nature--kuang');
    expect(html).not.toMatch(/63|12|心性四象/);
  });
});
