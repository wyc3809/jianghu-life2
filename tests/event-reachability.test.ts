import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { lookupEvent, resolvePendingEvent } from '../core/life/eventEngine';
import { INJURY_CURE_EVENTS } from '../data/events/injuryCures';

describe('injury cure events selected by engine must be resolvable', () => {
  for (const event of INJURY_CURE_EVENTS) {
    it(`${event.id} can resolve when surfaced as pending`, () => {
      const state = createNewLife({ seed: 42 });
      state.pending = { eventId: event.id, year: state.year, month: state.month, kind: 'special' };
      expect(lookupEvent(event.id)?.id).toBe(event.id);
      expect(resolvePendingEvent(state)?.id).toBe(event.id);
    });
  }
});
