import { describe, expect, it } from 'vitest';
import { trackRatingGain } from '../src/hooks/useRatingGain';

const start = { life: 'first', rating: 120, waiting: 0, sequence: 0, notice: null };

describe('頂欄戰力升幅', () => {
  it('test_hud_rating_unchanged_or_lower_does_not_pop', () => {
    expect(trackRatingGain(start, 'first', 120, true)).toBe(start);
    expect(trackRatingGain(start, 'first', 90, true).notice).toBeNull();
  });

  it('test_hud_rating_blocked_increases_show_net_gain_once_after_return', () => {
    const one = trackRatingGain(start, 'first', 150, false);
    const two = trackRatingGain(one, 'first', 190, false);
    const settled = trackRatingGain(two, 'first', 170, false);
    expect(settled.notice).toBeNull();
    const shown = trackRatingGain(settled, 'first', 170, true);
    expect(shown.notice).toEqual({ amount: 50, id: 1 });
    expect(shown.waiting).toBe(0);
    expect(trackRatingGain(shown, 'first', 170, true)).toBe(shown);
  });

  it('test_hud_rating_repeated_gains_restart_motion_and_a_drop_clears_it', () => {
    const first = trackRatingGain(start, 'first', 140, true);
    const second = trackRatingGain(first, 'first', 145, true);
    expect(first.notice).toEqual({ amount: 20, id: 1 });
    expect(second.notice).toEqual({ amount: 5, id: 2 });
    expect(trackRatingGain(second, 'first', 139, true).notice).toBeNull();
  });

  it('test_hud_rating_new_life_discards_prior_pending_gain', () => {
    const hidden = trackRatingGain(start, 'first', 150, false);
    const next = trackRatingGain(hidden, 'second', 400, true);
    expect(next).toMatchObject({ life: 'second', waiting: 0, notice: null, rating: 400 });
  });
});
