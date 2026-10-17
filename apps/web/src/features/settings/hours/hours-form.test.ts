import { describe, expect, it } from 'vitest';

import {
  copyDayTo,
  isWeekEmpty,
  toWeekSchedule,
  validateWeekSchedule,
  WEEKDAY_ORDER,
} from './hours-form';

describe('hours-form', () => {
  it('treats a schedule with no intervals as empty (always open)', () => {
    const empty = toWeekSchedule([]);
    expect(isWeekEmpty(empty)).toBe(true);
    expect(validateWeekSchedule(empty)).toEqual({ hours: [], issues: {} });
  });

  it('highlights the offending interval when two shifts on Monday overlap', () => {
    const week = toWeekSchedule([
      { weekday: 1, opensAtMin: 8 * 60, closesAtMin: 14 * 60 },
      { weekday: 1, opensAtMin: 13 * 60, closesAtMin: 18 * 60 },
    ]);

    const { issues } = validateWeekSchedule(week);
    expect(issues).toEqual({ '1:1': 'overlap' });
  });

  it('flags an interval whose closing time is not after its opening time', () => {
    const week = toWeekSchedule([]);
    week[2] = [{ id: 's1', opensAt: '18:00', closesAt: '09:00' }];

    const { issues } = validateWeekSchedule(week);
    expect(issues).toEqual({ '2:0': 'order' });
  });

  it('copies a day to other weekdays without mutating the source', () => {
    const week = toWeekSchedule([{ weekday: 1, opensAtMin: 9 * 60, closesAtMin: 17 * 60 }]);
    const copied = copyDayTo(week, 1, WEEKDAY_ORDER);

    for (const day of WEEKDAY_ORDER) {
      expect(copied[day]).toEqual([
        expect.objectContaining({ opensAt: '09:00', closesAt: '17:00' }),
      ]);
    }
  });
});
