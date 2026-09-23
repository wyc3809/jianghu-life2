/** 定鏡模式（?still=1）下，將動畫元素切去「已完成」嘅樣式 class */
export function stillClassName(base: string, stillCls: string | undefined, still: boolean): string {
  return `${base}${still && stillCls ? ` ${stillCls}` : ''}`;
}
