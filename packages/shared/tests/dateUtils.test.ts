import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPastDate,
  isToday,
  parseDateOnly,
  formatDateOnly,
  parseLocalDate,
  formatLocalDate,
  getTodayString,
  addDays,
  extractDateOnly,
} from '../src/utils/dateUtils.ts';

describe('isPastDate', () => {
  let clock: ReturnType<typeof mock.timers>;

  beforeEach(() => {
    // Fix "now" to 2026-06-15T12:00:00 local time
    mock.timers.enable({ apis: ['Date'], now: new Date(2026, 5, 15, 12, 0, 0).getTime() });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it('returns true for a date before today', () => {
    assert.equal(isPastDate('2026-06-14'), true);
  });

  it('returns true for a date far in the past', () => {
    assert.equal(isPastDate('2020-01-01'), true);
  });

  it('returns false for today', () => {
    assert.equal(isPastDate('2026-06-15'), false);
  });

  it('returns false for a date after today', () => {
    assert.equal(isPastDate('2026-06-16'), false);
  });

  it('returns false for a date far in the future', () => {
    assert.equal(isPastDate('2030-12-31'), false);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['Date'], now: new Date(2026, 5, 15, 12, 0, 0).getTime() });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it('returns true for today', () => {
    assert.equal(isToday('2026-06-15'), true);
  });

  it('returns false for yesterday', () => {
    assert.equal(isToday('2026-06-14'), false);
  });

  it('returns false for tomorrow', () => {
    assert.equal(isToday('2026-06-16'), false);
  });
});

describe('parseDateOnly', () => {
  it('parses a valid YYYY-MM-DD string to UTC midnight', () => {
    const date = parseDateOnly('2026-03-15');
    assert.equal(date.getUTCFullYear(), 2026);
    assert.equal(date.getUTCMonth(), 2); // March = 2
    assert.equal(date.getUTCDate(), 15);
    assert.equal(date.getUTCHours(), 0);
  });

  it('throws on invalid format', () => {
    assert.throws(() => parseDateOnly('2026/03/15'), /Invalid date format/);
    assert.throws(() => parseDateOnly('03-15-2026'), /Invalid date format/);
    assert.throws(() => parseDateOnly('not-a-date'), /Invalid date format/);
  });

  it('throws on impossible calendar dates', () => {
    assert.throws(() => parseDateOnly('2026-02-30'), /Invalid calendar date/);
    assert.throws(() => parseDateOnly('2026-13-01'), /Invalid date components/);
    assert.throws(() => parseDateOnly('2026-00-15'), /Invalid date components/);
  });
});

describe('formatDateOnly', () => {
  it('formats a Date as YYYY-MM-DD (UTC)', () => {
    const date = new Date(Date.UTC(2026, 2, 5)); // March 5
    assert.equal(formatDateOnly(date), '2026-03-05');
  });

  it('zero-pads single digit month and day', () => {
    const date = new Date(Date.UTC(2026, 0, 9)); // Jan 9
    assert.equal(formatDateOnly(date), '2026-01-09');
  });
});

describe('addDays', () => {
  it('adds days correctly', () => {
    assert.equal(addDays('2026-06-15', 3), '2026-06-18');
  });

  it('subtracts days with negative value', () => {
    assert.equal(addDays('2026-06-15', -5), '2026-06-10');
  });

  it('crosses month boundary', () => {
    assert.equal(addDays('2026-01-30', 3), '2026-02-02');
  });

  it('crosses year boundary', () => {
    assert.equal(addDays('2026-12-30', 5), '2027-01-04');
  });
});

describe('extractDateOnly', () => {
  it('strips time component from ISO string', () => {
    assert.equal(extractDateOnly('2026-06-15T14:30:00.000Z'), '2026-06-15');
  });

  it('returns date-only string unchanged', () => {
    assert.equal(extractDateOnly('2026-06-15'), '2026-06-15');
  });
});
