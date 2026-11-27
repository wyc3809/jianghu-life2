import { useEffect, useState } from 'react';
import { watchVisualActivity } from '../ui/visualActivity';

type Notice = { amount: number; id: number };
type Feedback = {
  life: string;
  rating: number;
  waiting: number;
  sequence: number;
  notice: Notice | null;
};

export function trackRatingGain(previous: Feedback, life: string, rating: number, visible: boolean): Feedback {
  if (previous.life !== life) return { ...previous, life, rating, waiting: 0, notice: null };

  const change = rating - previous.rating;
  const waiting = Math.max(0, previous.waiting + change);
  if (visible && waiting > 0) {
    const id = previous.sequence + 1;
    return { life, rating, waiting: 0, sequence: id, notice: { amount: waiting, id } };
  }

  const notice = visible && change >= 0 ? previous.notice : null;
  if (!change && notice === previous.notice) return previous;
  return { ...previous, rating, waiting, notice };
}

/** 等頂欄再度可見先顯示升幅，避免結果匣、戰報或換頁蓋過回饋。 */
export function useRatingGain(life: string, rating: number, hudVisible: boolean): Notice | null {
  const [active, setActive] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(() => ({
    life, rating, waiting: 0, sequence: 0, notice: null,
  }));
  const visible = hudVisible && active;

  useEffect(() => watchVisualActivity(setActive, { covered: true, dialogs: true }), []);
  useEffect(() => {
    setFeedback(previous => trackRatingGain(previous, life, rating, visible));
  }, [life, rating, visible]);

  const notice = feedback.notice;
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setFeedback(previous => previous.notice === notice ? { ...previous, notice: null } : previous);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return visible && feedback.life === life ? notice : null;
}
