/** 首局教練文案（鎮居）——語氣與卷面一致 */

export type CoachStep = 'flip' | 'choice' | 'practice' | 'done';

export function coachCopy(step: CoachStep): { title: string; body: string } | null {
  switch (step) {
    case 'flip':
      return {
        title: '開卷第一筆',
        body: '點鎮居下方「過一月」推進月份，查看新事件與修行進度。',
      };
    case 'choice':
      return {
        title: '事來則斷',
        body: '事件出現後，閱讀可選行動及條件，再作選擇。結果可能影響銀兩、名望、武學與人物際遇。',
      };
    case 'practice':
      return {
        title: '閒時可煉',
        body: '進入「修煉」選擇合適項目，每月次數有限。華山論劍可由「江湖」地圖進入。',
      };
    default:
      return null;
  }
}

export function nextCoachStep(flags: Record<string, boolean | number | string>): CoachStep {
  if (flags.coach_done) return 'done';
  if (!flags.coach_flipped) return 'flip';
  if (!flags.coach_chose) return 'choice';
  if (!flags.coach_practiced) return 'practice';
  return 'done';
}
