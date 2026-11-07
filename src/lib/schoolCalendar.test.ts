import { describe, expect, test } from "vitest";
import { addDays, HOLIDAYS, isoDate, isSchoolDay, KNOWN_UNTIL, lunchSlots } from "./schoolCalendar";

// Region Midden (province of Utrecht), from rijksoverheid.nl, read 2026-11-07.

describe("school days", () => {
  // RFC-2026-006:AC-6
  test.each([
    ["2026-10-17", "2026-10-25"],
    ["2026-12-19", "2027-01-03"],
    ["2027-02-20", "2027-02-28"],
    ["2027-04-24", "2027-05-02"],
    ["2027-07-17", "2027-08-29"],
    ["2027-10-16", "2027-10-24"],
    ["2027-12-25", "2028-01-09"],
    ["2028-02-26", "2028-03-05"],
    ["2028-04-29", "2028-05-07"],
    ["2028-07-08", "2028-08-20"],
  ])("the holiday from %s to %s is in the calendar", (from, to) => {
    expect(HOLIDAYS).toContainEqual(expect.objectContaining({ from, to }));
  });

  // RFC-2026-006:AC-6
  test.each([
    ["2026-12-21", false], // Monday in the Christmas holiday
    ["2027-01-01", false],
    ["2027-01-04", true], // first Monday back
    ["2026-12-18", true], // last Friday before
    ["2027-02-22", false], // Monday in the spring holiday
    ["2026-11-09", true], // a normal Monday
    ["2026-11-11", true], // Wednesday is a school day (morning only)
    ["2026-11-14", false], // Saturday
    ["2026-11-15", false], // Sunday
  ])("%s is a school day: %s", (date, school) => {
    expect(isSchoolDay(date)).toBe(school);
  });

  // RFC-2026-006:AC-7
  test("after the last known school year, weekdays count as school days", () => {
    expect(KNOWN_UNTIL).toBe("2028-08-20");
    expect(isSchoolDay("2028-10-16")).toBe(true); // a Monday, holiday dates unknown
    expect(isSchoolDay("2028-10-21")).toBe(false); // still a Saturday
  });

  test("dates are local calendar days", () => {
    expect(isoDate(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-27", 2)).toBe("2027-03-29"); // across the clock change
  });
});

describe("which meals a day has", () => {
  // RFC-2026-006:AC-8
  test.each(["2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13"])("school %s: snack, lunchbox and adult lunch", (date) => {
    expect(lunchSlots(date, 2)).toEqual(["snack", "lunchbox", "adult"]);
  });

  // RFC-2026-006:AC-9
  test("school Wednesday: snack at school, then family lunch at home", () => {
    expect(lunchSlots("2026-11-11", 2)).toEqual(["snack", "family"]);
  });

  // RFC-2026-006:AC-10
  test.each(["2026-11-14", "2026-11-15", "2026-12-21", "2026-12-23"])("weekend or holiday %s: family lunch only", (date) => {
    expect(lunchSlots(date, 2)).toEqual(["family"]);
  });

  // RFC-2026-006:AC-10
  test("without kids: an adult lunch on school weekdays, a family lunch otherwise", () => {
    expect(lunchSlots("2026-11-09", 0)).toEqual(["adult"]);
    expect(lunchSlots("2026-11-11", 0)).toEqual(["adult"]);
    expect(lunchSlots("2026-11-14", 0)).toEqual(["family"]);
  });
});
