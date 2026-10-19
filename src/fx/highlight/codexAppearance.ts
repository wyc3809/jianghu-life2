/** 書封只跟真實江湖／珍本身份；心願、新得同演出品階唔改稀有度。 */
export function codexCoverUrl(premium: boolean): string {
  return `${import.meta.env.BASE_URL}ink/art/gacha/${premium ? 'codex-cover-premium' : 'codex-cover'}.webp`;
}
