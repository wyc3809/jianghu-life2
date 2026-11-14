import type { LifeCharacter } from '@interfaces/lifeEngine';
import { personNatureMark } from '../../ui/personNature';

/** 姓名旁只顯最高心性，用字與位圖紋樣辨識，不列點數。 */
export function InkNatureMark({ character }: { character: LifeCharacter }) {
  const mark = personNatureMark(character);
  return <span className={`ink-person-nature ink-person-nature--${mark.key}`} role="img" aria-label={`心性：${mark.label}`}>
    <img src={mark.art} alt="" draggable={false}/><span aria-hidden="true">{mark.label}</span>
  </span>;
}
