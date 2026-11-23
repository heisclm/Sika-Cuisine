import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateKitchenOpenStatus,
  formatHoursRangeFrom24Hour,
  parseHoursRange,
} from "../src/index";

test("parseHoursRange parses 12-hour and 24-hour ranges accurately", () => {
  assert.deepEqual(parseHoursRange("10:00 AM - 10:00 PM"), {
    openMinutes: 600,
    closeMinutes: 1320,
  });
  assert.deepEqual(parseHoursRange("12:00 PM – 9:30 PM"), {
    openMinutes: 720,
    closeMinutes: 1290,
  });
  assert.equal(formatHoursRangeFrom24Hour("08:30", "21:45"), "8:30 AM - 9:45 PM");
});

test("evaluateKitchenOpenStatus automatically opens and closes on weekday schedule (GMT)", () => {
  // Wednesday 2026-11-25 09:59 UTC -> Closed
  const beforeOpen = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
    now: new Date("2026-11-25T09:59:00Z"),
  });
  assert.equal(beforeOpen.isOpen, false);
  assert.equal(beforeOpen.isWithinScheduledHours, false);

  // Wednesday 2026-11-25 10:00 UTC -> Open
  const atOpen = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
    now: new Date("2026-11-25T10:00:00Z"),
  });
  assert.equal(atOpen.isOpen, true);
  assert.equal(atOpen.isWithinScheduledHours, true);

  // Wednesday 2026-11-25 22:00 UTC -> Closed
  const atClose = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
    now: new Date("2026-11-25T22:00:00Z"),
  });
  assert.equal(atClose.isOpen, false);
  assert.equal(atClose.isWithinScheduledHours, false);
});

test("evaluateKitchenOpenStatus uses Sunday hours on Sunday (GMT)", () => {
  // Sunday 2026-11-22 11:30 UTC -> Closed (Sunday opens 12:00 PM)
  const sundayMorning = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
    now: new Date("2026-11-22T11:30:00Z"),
  });
  assert.equal(sundayMorning.isSunday, true);
  assert.equal(sundayMorning.isOpen, false);

  // Sunday 2026-11-22 14:00 UTC -> Open
  const sundayAfternoon = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
    now: new Date("2026-11-22T14:00:00Z"),
  });
  assert.equal(sundayAfternoon.isSunday, true);
  assert.equal(sundayAfternoon.isOpen, true);
});

test("evaluateKitchenOpenStatus respects Admin MANUAL_OPEN and MANUAL_CLOSED overrides", () => {
  // Outside hours, but Admin forced open
  const forcedOpen = evaluateKitchenOpenStatus({
    scheduleMode: "MANUAL_OPEN",
    weekdayHours: "10:00 AM - 10:00 PM",
    now: new Date("2026-11-25T23:30:00Z"),
  });
  assert.equal(forcedOpen.isWithinScheduledHours, false);
  assert.equal(forcedOpen.isOpen, true);
  assert.equal(forcedOpen.mode, "MANUAL_OPEN");

  // Inside hours, but Admin forced closed
  const forcedClosed = evaluateKitchenOpenStatus({
    scheduleMode: "MANUAL_CLOSED",
    weekdayHours: "10:00 AM - 10:00 PM",
    now: new Date("2026-11-25T15:00:00Z"),
  });
  assert.equal(forcedClosed.isWithinScheduledHours, true);
  assert.equal(forcedClosed.isOpen, false);
  assert.equal(forcedClosed.mode, "MANUAL_CLOSED");
});

test("evaluateKitchenOpenStatus supports custom Admin-changed hours and overnight schedules", () => {
  // Custom late-night schedule 6:00 PM - 2:00 AM
  const lateNightOpen = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "6:00 PM - 2:00 AM",
    now: new Date("2026-11-25T01:30:00Z"),
  });
  assert.equal(lateNightOpen.isOpen, true);

  const lateNightClosed = evaluateKitchenOpenStatus({
    scheduleMode: "AUTO",
    weekdayHours: "6:00 PM - 2:00 AM",
    now: new Date("2026-11-25T02:05:00Z"),
  });
  assert.equal(lateNightClosed.isOpen, false);
});
