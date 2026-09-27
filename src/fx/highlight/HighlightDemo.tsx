/**
 * 高光時刻示範頁（?fx=highlight）：模式切換三個主體，可揀目標品階；播完自動重來。
 */
import { Suspense, useState } from 'react';
import { HighlightFxLazy } from './index';
import { clampGrade } from './grades';
import type { Grade, HighlightConfig, HighlightSubject } from './types';

const MODES: { value: HighlightSubject; label: string }[] = [
  { value: 'chest', label: '寶箱' },
  { value: 'token', label: '武學' },
  { value: 'cauldron', label: '丹爐' },
];

function demoConfig(subject: HighlightSubject, g: Grade): HighlightConfig {
  const balances = { coin: { label: '銀兩', value: 1280 }, gem: { label: '名望', value: 36 } };
  if (subject === 'chest') {
    return {
      subject,
      targetGrade: g,
      revealTitle: '神兵出世',
      seal: '裝',
      revealSub: '青霜劍 · 入手',
      balances,
      rewards: [
        {
          id: 'w',
          icon: 'sword',
          pattern: 'blade',
          name: '青霜劍',
          grade: g,
          isNew: g >= 2,
          blurb: '劍身如霜，出鞘三寸寒氣逼人。',
          stats: [
            { label: '攻擊', from: 12, to: 12 + 4 * (g + 1) },
            { label: '命中', from: 5, to: 5 + g + 1 },
          ],
        },
        {
          id: 'c',
          icon: 'coin',
          pattern: 'wealth',
          name: '銀兩',
          grade: 1,
          amount: 180,
          flyTo: 'coin',
          blurb: '白花花嘅銀子。',
          stats: [{ label: '銀兩', from: 1280, to: 1460 }],
        },
        {
          id: 'e',
          icon: 'gem',
          pattern: 'charm',
          name: '名望',
          grade: 2,
          amount: 24,
          flyTo: 'gem',
          blurb: '江湖上多咗人識你。',
          stats: [{ label: '名望', from: 36, to: 60 }],
        },
      ],
    };
  }
  if (subject === 'token') {
    return {
      subject,
      targetGrade: g,
      revealTitle: '武學精進',
      seal: '煉',
      revealSub: '驚鴻劍法 · 融會貫通',
      balances,
      rewards: [
        {
          id: 'a',
          icon: 'scroll',
          pattern: 'art',
          name: '驚鴻劍法',
          grade: g,
          isNew: true,
          blurb: '身如驚鴻，一劍既出，連環三式。',
          stats: [
            { label: '武學', from: 40, to: 52 },
            { label: '招式威力', from: 18, to: 26 },
          ],
        },
        {
          id: 'e',
          icon: 'gem',
          pattern: 'charm',
          name: '名望',
          grade: 2,
          amount: 10,
          flyTo: 'gem',
          blurb: '同門對你刮目相看。',
          stats: [{ label: '名望', from: 36, to: 46 }],
        },
      ],
    };
  }
  return {
    subject,
    targetGrade: g,
    revealTitle: '境界突破',
    seal: '破',
    revealSub: '內息初成 → 氣貫周天',
    balances,
    rewards: [
      {
        id: 'p',
        icon: 'pill',
        pattern: 'elixir',
        name: '氣貫周天',
        grade: g,
        isNew: true,
        blurb: '真氣運行大周天，百脈俱通。',
        stats: [
          { label: '氣血上限', from: 298, to: 340 },
          { label: '內力上限', from: 238, to: 280 },
        ],
      },
      {
        id: 'c',
        icon: 'coin',
        pattern: 'wealth',
        name: '銀兩',
        grade: 1,
        amount: 60,
        flyTo: 'coin',
        blurb: '同門賀禮。',
        stats: [{ label: '銀兩', from: 1280, to: 1340 }],
      },
    ],
  };
}

export default function HighlightDemo() {
  const params = new URLSearchParams(window.location.search);
  const [subject, setSubject] = useState<HighlightSubject>((params.get('mode') as HighlightSubject) || 'chest');
  const [grade, setGrade] = useState<Grade>(clampGrade(Number(params.get('grade') ?? 5)));
  const [run, setRun] = useState(0);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1e2033' }}>
      <Suspense fallback={null}>
        <HighlightFxLazy
          key={`${subject}-${grade}-${run}`}
          config={demoConfig(subject, grade)}
          modes={MODES}
          onMode={setSubject}
          onDone={() => setRun((r) => r + 1)}
        />
      </Suspense>
      <div
        style={{
          position: 'fixed',
          left: 12,
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          zIndex: 500,
          display: 'flex',
          gap: 4,
        }}
        aria-label="目標品階"
      >
        {([0, 1, 2, 3, 4, 5] as Grade[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrade(g)}
            aria-pressed={g === grade}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '2px solid #1A1033',
              font: '14px "Lilita One", sans-serif',
              color: g === grade ? '#1A1033' : '#fff',
              background: g === grade ? '#FFC83A' : 'rgba(10,5,25,.55)',
              cursor: 'pointer',
            }}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
