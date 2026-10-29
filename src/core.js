/**
 * Conway's doomsday algorithm — pure functions, no dependencies.
 *
 * Terminology:
 *  - Days are integers 0–6 where 0 = Sunday, 6 = Saturday.
 *  - The "anchor day" is fixed for each century (the day of the week
 *    of the last day of February in any years of that century).
 *  - The "doomsday" for a specific year is derived from the anchor day.
 *  - Every month contains a memorable "doomsday date" that falls on the
 *    year's doomsday; knowing that date lets us compute any other day
 *    in that month by simple modular arithmetic.
 */

const DAYS = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/**
 * Memorable doomsday dates for each month in a non-leap year.
 *
 * Index 0 = January, ... 11 = December.
 * The full-year mnemonic "4/4, 6/6, 8/8, 10/10, 12/12" plus the
 * "9-to-5 at 7-Eleven" pairs are encoded here; January and February
 * vary by leap year so the non-leap values are stored and adjusted
 * in getDoomsdayForMonth.
 *
 * Frozen so callers cannot mutate the table.
 */
const MONTH_DOOMSDAYS = Object.freeze([3, 28, 7, 4, 9, 6, 11, 8, 5, 10, 7, 12]);

/**
 * Returns true if `year` is a leap year under Gregorian rules.
 *
 * Rule: divisible by 4, but centuries (÷100) must also be divisible
 * by 400. We enforce 1583+ because the Gregorian calendar was not
 * in use before 1582; feeding an earlier year produces nonsense.
 *
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  if (!Number.isInteger(year) || year < 1583) {
    throw new RangeError(`year must be an integer >= 1583, got ${year}`);
  }
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the anchor day-of-week (0–6) for the century containing `year`.
 *
 * Conway's mnemonic ("Odd day + 11") is mathematically equivalent to
 * the formula `anchor = (5 * (c mod 4) + 2) mod 7` where c is the
 * century index, but produces the same answer without memorizing.
 * We use the explicit formula because it is shorter and obviously
 * correct for unit testing.
 *
 * The formula maps each Gregorian century onto the correct anchor;
 * c=15 → Wednesday (3), c=16 → Tuesday (2), c=17 → Sunday (0),
 * c=18 → Friday (5), c=19 → Wednesday (3), c=20 → Tuesday (2), etc.
 *
 * @param {number} year
 * @returns {number} integer 0–6, 0 = Sunday
 */
export function getAnchorDayForCentury(year) {
  if (!Number.isInteger(year) || year < 1583) {
    throw new RangeError(`year must be an integer >= 1583, got ${year}`);
  }
  const century = Math.trunc(year / 100);
  // (5 * (century mod 4) + 2) mod 7 with JS % operator.
  return (5 * (century % 4) + 2) % 7;
}

/**
 * Returns the doomsday (day-of-week) for the given Gregorian year.
 *
 * Implementation: Conway's "odd + 11" reduction expressed as a closed
 * formula. For year YY (last two digits):
 *   a = YY / 12 (integer division)
 *   b = YY mod 12
 *   c = floor(b / 4)
 *   doomsday = (anchor + a + b + c) mod 7
 *
 * We take the anchor from getAnchorDayForCentury so century handling
 * is isolated in one place.
 *
 * @param {number} year integer >= 1583
 * @returns {number} integer 0–6, 0 = Sunday
 */
export function getDoomsdayForYear(year) {
  if (!Number.isInteger(year) || year < 1583) {
    throw new RangeError(`year must be an integer >= 1583, got ${year}`);
  }
  const anchor = getAnchorDayForCentury(year);
  const yy = year % 100;
  const a = Math.trunc(yy / 12);
  const b = yy % 12;
  const c = Math.trunc(b / 4);
  return (anchor + a + b + c) % 7;
}

/**
 * Returns the day-of-month of the month's doomsday reference date.
 *
 * For months 3–11 the reference is fixed every year. For January and
 * February it shifts by one day in leap years (4 Jan / 29 Feb instead
 * of 3 Jan / 28 Feb) because the leap day falls between those and the
 * rest of the year's references.
 *
 * @param {number} month 1–12
 * @param {number} year needed only to resolve January/February
 * @returns {number} day-of-month, 1–31
 */
export function getDoomsdayForMonth(month, year) {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new RangeError(`month must be an integer 1–12, got ${month}`);
  }
  if (!Number.isInteger(year) || year < 1583) {
    throw new RangeError(`year must be an integer >= 1583, got ${year}`);
  }
  const base = MONTH_DOOMSDAYS[month - 1];
  if ((month === 1 || month === 2) && isLeapYear(year)) {
    return base + 1;
  }
  return base;
}

/**
 * Returns the number of days in `month` of `year`, accounting for leap years.
 *
 * Needed only so dayOfWeek can reject impossible dates (e.g. 2023-02-30);
 * the algorithm itself would happily return a "day" for such inputs.
 */
export function daysInMonth(year, month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be an integer 1–12, got ${month}`);
  }
  if (!Number.isInteger(year) || year < 1583) {
    throw new RangeError(`year must be an integer >= 1583, got ${year}`);
  }
  // April, June, September, November.
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return 31;
}

/**
 * Returns the day of the week for an (invalidated-then-checked) Gregorian date.
 *
 * Algorithm:
 *   1. Look up the month's doomsday reference date (e.g. 4/4, 6/6, ...).
 *   2. The doomsday reference date is the year's doomsday weekday, so
 *      delta = (day - referenceDate) mod 7 gives the offset.
 *   3. weekday = (doomsday + delta) mod 7.
 *
 * The extra ((delta % 7) + 7) % 7 dance makes delta well-defined for
 * days before the reference date (negative deltas) under JS's
 * sign-of-dividend `%` operator.
 *
 * @param {number} year integer >= 1583
 * @param {number} month integer 1–12
 * @param {number} day integer 1–daysInMonth(year, month)
 * @returns {number} integer 0–6, 0 = Sunday
 */
export function dayOfWeek(year, month, day) {
  if (!Number.isInteger(day)) {
    throw new RangeError(`day must be an integer, got ${day}`);
  }
  // Validate month/year via the helpers below; this also covers
  // the < 1583 / non-integer year cases with the same error class.
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new RangeError(
      `day ${day} out of range for year ${year} month ${month} (1–${maxDay})`,
    );
  }

  const dd = getDoomsdayForYear(year);
  const refDate = getDoomsdayForMonth(month, year);
  const delta = day - refDate;
  const mod = ((delta % 7) + 7) % 7;
  return (dd + mod) % 7;
}

/**
 * Maps a numeric weekday (0–6) to its English name.
 *
 * @param {number} d integer 0–6, where 0 = Sunday
 * @returns {string} capitalized English weekday name
 */
export function weekdayName(d) {
  if (!Number.isInteger(d) || d < 0 || d > 6) {
    throw new RangeError(`weekday must be an integer 0–6, got ${d}`);
  }
  return DAYS[d];
}
