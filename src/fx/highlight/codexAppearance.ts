/** 書封只跟真實江湖／珍本身份；心願、新得同演出品階唔改稀有度。 */
export function codexCoverUrl(premium: boolean): string {
  return `${import.meta.env.BASE_URL}ink/art/gacha/${premium ? 'codex-cover-premium' : 'codex-cover'}.webp`;
}

/** 沿用原有藏卷內頁位圖表示書頁；武功仍按真實江湖／珍本身份用書封。 */
export function gachaRewardImageUrl(card: { rewardKind?: 'art' | 'pages'; isPremium?: boolean }): string {
  return card.rewardKind === 'pages'
    ? `${import.meta.env.BASE_URL}ink/art/gacha/codex-page-right.webp`
    : codexCoverUrl(card.isPremium === true);
}
