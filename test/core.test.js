import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isLeapYear,
  getAnchorDayForCentury,
  getDoomsdayForYear,
  getDoomsdayForMonth,
  daysInMonth,
  dayOfWeek,
  weekdayName,
} from "../src/core.js";

// Anchor days verified against historical calendar tables.
// 1500s → Wednesday (3), 1600s → Tuesday (2), 1700s → Sunday (0),
// 1800s → Friday (5), 1900s → Wednesday (3), 2000s → Tuesday (2),
// 2100s → Sunday (0).

test("isLeapYear: Gregorian rule with 1583 boundary", () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2023), false);
  assert.equal(isLeapYear(2000), true); // ÷400
  assert.equal(isLeapYear(1900), false); // ÷100 but not ÷400
  assert.throws(() => isLeapYear(1582), RangeError); // before Gregorian
  assert.throws(() => isLeapYear(2024.5), RangeError);
});

test("getAnchorDayForCentury: known centuries", () => {
  // Anchor is stable across a century.
  assert.equal(getAnchorDayForCentury(1583), 3);
  assert.equal(getAnchorDayForCentury(1601), 2);
  assert.equal(getAnchorDayForCentury(1776), 0);
  assert.equal(getAnchorDayForCentury(1865), 5);
  assert.equal(getAnchorDayForCentury(1969), 3);
  assert.equal(getAnchorDayForCentury(2000), 2);
  assert.equal(getAnchorDayForCentury(2100), 0);
  assert.throws(() => getAnchorDayForCentury(1500), RangeError);
});

test("getDoomsdayForYear: spot-check against known dates", () => {
  // 1969-07-20 (Apollo 11 landing) was a Sunday → doomsday 1900s = Wednesday,
  // July ref = 11; day 20 - 11 = 9 ≡ 2 (mod 7); (3 + 2) = 5 → Friday.
  // But we only verify the year-level doomsday here.
  assert.equal(getDoomsdayForYear(1969), 5); // Friday
  assert.equal(getDoomsdayForYear(2000), 2); // Tuesday
  assert.equal(getDoomsdayForYear(2024), 4); // Thursday
  assert.equal(getDoomsdayForYear(1583), 1); // Monday
  assert.throws(() => getDoomsdayForYear(100), RangeError);
});

test("getDoomsdayForMonth: leap-year adjustment for Jan/Feb only", () => {
  // Non-leap: 4/4, 6/6, 8/8, 10/10, 12/12; 9/5, 5/9, 7/11, 11/7; Jan 3, Feb 28.
  assert.equal(getDoomsdayForMonth(1, 2023), 3);
  assert.equal(getDoomsdayForMonth(2, 2023), 28); // last day of Feb in non-leap year
  assert.equal(getDoomsdayForMonth(4, 2023), 4);
  assert.equal(getDoomsdayForMonth(7, 2023), 11);
  assert.equal(getDoomsdayForMonth(12, 2023), 12);

  // Leap-year shift for Jan/Feb.
  assert.equal(getDoomsdayForMonth(1, 2024), 4);
  assert.equal(getDoomsdayForMonth(2, 2024), 29); // last day of Feb in leap year

  // March onward is unaffected.
  assert.equal(getDoomsdayForMonth(3, 2024), 7);

  assert.throws(() => getDoomsdayForMonth(13, 2024), RangeError);
});

test("daysInMonth: handles February and 30-day months", () => {
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2024, 4), 30);
  assert.equal(daysInMonth(2024, 1), 31);
});

test("dayOfWeek: well-known historical dates", () => {
  // Each date cross-checked against multiple independent calendar sources.
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
  assert.equal(dayOfWeek(1969, 7, 20), 0); // Apollo 11 landing — Sunday
  assert.equal(dayOfWeek(2001, 9, 11), 2); // September 11 attacks — Tuesday
  assert.equal(dayOfWeek(1945, 8, 15), 3); // V-J Day — Wednesday
  assert.equal(dayOfWeek(1776, 7, 4), 4); // Declaration of Independence — Thursday
  assert.equal(dayOfWeek(2000, 1, 1), 6); // Y2K rollover — Saturday
  assert.equal(dayOfWeek(2024, 2, 29), 4); // Leap day 2024 — Thursday
  assert.equal(dayOfWeek(1583, 1, 1), 6); // First valid Gregorian Jan 1 — Saturday
});

test("dayOfWeek: leap-day boundary, dates before the month's reference", () => {
  // 2024's doomsday is Thursday (4); February reference is 29 (leap).
  // Day 28 is one day before → Wednesday (3).
  assert.equal(dayOfWeek(2024, 2, 28), 3);
  // Day 1 is 28 days before reference 29 → -28 ≡ 0 mod 7 → same as doomsday.
  assert.equal(dayOfWeek(2024, 2, 1), 4);
});

test("dayOfWeek: rejects impossible dates", () => {
  assert.throws(() => dayOfWeek(2023, 2, 29), RangeError); // not a leap year
  assert.throws(() => dayOfWeek(2024, 4, 31), RangeError); // April has 30
  assert.throws(() => dayOfWeek(2024, 13, 1), RangeError);
  assert.throws(() => dayOfWeek(1582, 12, 31), RangeError); // pre-Gregorian
  assert.throws(() => dayOfWeek(2024, 1, 0), RangeError); // day 0
});

test("weekdayName: 0–6 → Sunday..Saturday", () => {
  assert.equal(weekdayName(0), "Sunday");
  assert.equal(weekdayName(6), "Saturday");
  assert.throws(() => weekdayName(7), RangeError);
  assert.throws(() => weekdayName(-1), RangeError);
});
