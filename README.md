# doomsday-rule-calculator

Computes the day of the week for any Gregorian date using Conway's doomsday algorithm. No date libraries, no `Date` object, no runtime dependencies.

```js
import { dayOfWeek, weekdayName } from "doomsday-rule-calculator";

// 1969-07-20 was a Sunday.
const dow = dayOfWeek(1969, 7, 20); // 0 (0 = Sunday)
weekdayName(dow); // "Sunday"
```

Exports: `dayOfWeek(year, month, day)`, `weekdayName(d)`, `getDoomsdayForYear(year)`, `getAnchorDayForCentury(year)`, `getDoomsdayForMonth(month, year)`, `isLeapYear(year)`, `daysInMonth(year, month)`. All inputs are integers; days are `0–6` where `0 = Sunday`. Throws `RangeError` for anything outside `year ≥ 1583`, month `1–12`, or the valid day range for that month.

## Why this exists

The Doomsday rule lets a human compute the weekday of any date with a few mental arithmetic steps. This library implements those same steps in code, without leaning on a platform's date library, so the result is portable and the algorithm is auditable. The trade-off: you must pass integers and stay within the Gregorian calendar, so it does not handle pre-1582 dates, timezone shifts, or string parsing.

## Edge you will hit

The library enforces Gregorian-only: any year before 1583 throws, because the Julian calendar was still in effect and the algorithm would return a wrong-looking answer. January and February's doomsday reference date shifts by one day in leap years, which is handled by `getDoomsdayForMonth` but is the one place callers who reach for the lower-level exports need to be aware.
