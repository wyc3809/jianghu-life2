import type { LifeGameState } from '@interfaces/lifeEngine';

export type LifeStage =
  | 'infant'
  | 'child'
  | 'youth'
  | 'adult'
  | 'midlife'
  | 'elder'
  | 'twilight';

export const lifeStageLabels: Record<LifeStage, string> = {
  infant: '襁褓',
  child: '幼年',
  youth: '少年',
  adult: '壯年',
  midlife: '中年',
  elder: '老年',
  twilight: '遲暮',
};

/** @deprecated 年齡階段已取消；舊呼叫統一視作可行走江湖。 */
export function getLifeStage(_age: number): LifeStage {
  return 'adult';
}

/** @deprecated 不再以年齡命名角色階段。 */
export function getLifeStageLabel(_state: LifeGameState): string {
  return '江湖歷練';
}

/** @deprecated 年齡不再改變事件權重，保留舊呼叫相容。 */
export function stageWeightBias(_age: number, _eventTags: string[] | undefined): number {
  return 1;
}
