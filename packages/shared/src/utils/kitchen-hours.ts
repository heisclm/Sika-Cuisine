/**
 * Shared Ghana (GMT / UTC+0) kitchen operating hours parser & status evaluator.
 * Supports automatic scheduled open/close based on Admin-configured hours
 * alongside explicit Admin manual open/close overrides.
 */

export type KitchenScheduleMode = "AUTO" | "MANUAL_OPEN" | "MANUAL_CLOSED";

export interface ParsedHoursRange {
  openMinutes: number;
  closeMinutes: number;
}

export interface KitchenStatusEvaluation {
  isOpen: boolean;
  mode: KitchenScheduleMode;
  isWithinScheduledHours: boolean;
  isSunday: boolean;
  activeHoursLabel: string;
  reason: string;
}

export const DEFAULT_WEEKDAY_HOURS = "10:00 AM - 10:00 PM";
export const DEFAULT_SUNDAY_HOURS = "12:00 PM - 9:00 PM";

/**
 * Parses a 12-hour ("10:00 AM", "9:30 PM") or 24-hour ("10:00", "22:30") time string
 * into minutes since midnight (0..1439).
 */
export function parseTimeToMinutes(raw: string): number | null {
  const value = raw.trim().toUpperCase();
  if (!value) return null;

  const match12 = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hours = Number(match12[1]);
    const minutes = match12[2] ? Number(match12[2]) : 0;
    const meridiem = match12[3];
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
    return hours * 60 + minutes;
  }

  const match24 = value.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = Number(match24[1]);
    const minutes = Number(match24[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Formats minutes since midnight into "10:00 AM" / "9:30 PM".
 */
export function formatMinutesTo12Hour(totalMinutes: number): string {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

/**
 * Formats minutes since midnight into HTML `<input type="time">` format ("HH:MM").
 */
export function formatMinutesTo24Hour(totalMinutes: number): string {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Parses an hours range string such as "10:00 AM - 10:00 PM" or "12:00 PM – 9:00 PM".
 */
export function parseHoursRange(rangeStr?: string | null): ParsedHoursRange | null {
  if (!rangeStr || typeof rangeStr !== "string") return null;
  const parts = rangeStr.split(/\s*(?:-|–|—|\bto\b)\s*/i);
  if (parts.length !== 2) return null;

  const openMinutes = parseTimeToMinutes(parts[0]);
  const closeMinutes = parseTimeToMinutes(parts[1]);
  if (openMinutes === null || closeMinutes === null) return null;

  return { openMinutes, closeMinutes };
}

/**
 * Formats two 24-hour time strings ("10:00", "22:00") into "10:00 AM - 10:00 PM".
 */
export function formatHoursRangeFrom24Hour(open24h: string, close24h: string): string {
  const openMin = parseTimeToMinutes(open24h);
  const closeMin = parseTimeToMinutes(close24h);
  if (openMin === null || closeMin === null) return DEFAULT_WEEKDAY_HOURS;
  return `${formatMinutesTo12Hour(openMin)} - ${formatMinutesTo12Hour(closeMin)}`;
}

/**
 * Normalizes a persisted scheduleMode string into a valid KitchenScheduleMode.
 */
export function normalizeKitchenScheduleMode(
  scheduleMode?: string | null,
  legacyIsAcceptingOrders?: boolean
): KitchenScheduleMode {
  if (
    scheduleMode === "AUTO" ||
    scheduleMode === "MANUAL_OPEN" ||
    scheduleMode === "MANUAL_CLOSED"
  ) {
    return scheduleMode;
  }
  if (legacyIsAcceptingOrders === false) {
    return "MANUAL_CLOSED";
  }
  return "AUTO";
}

/**
 * Evaluates whether Sika Cuisine's kitchen is currently open for online orders
 * using Sunyani / Ghana GMT (UTC+0) time, respecting automatic operating hours
 * and Admin manual open/close overrides.
 */
export function evaluateKitchenOpenStatus(input: {
  scheduleMode?: string | null;
  isAcceptingOrders?: boolean;
  weekdayHours?: string | null;
  sundayHours?: string | null;
  now?: Date;
}): KitchenStatusEvaluation {
  const now = input.now ?? new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 1..6 = Mon..Sat (Ghana is GMT / UTC+0 year-round)
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const isSunday = utcDay === 0;

  const activeHoursLabel = isSunday
    ? (input.sundayHours?.trim() || DEFAULT_SUNDAY_HOURS)
    : (input.weekdayHours?.trim() || DEFAULT_WEEKDAY_HOURS);

  const parsedRange =
    parseHoursRange(activeHoursLabel) ??
    parseHoursRange(isSunday ? DEFAULT_SUNDAY_HOURS : DEFAULT_WEEKDAY_HOURS)!;

  let isWithinScheduledHours: boolean;
  if (parsedRange.openMinutes === parsedRange.closeMinutes) {
    // Same open and close time indicates 24-hour service
    isWithinScheduledHours = true;
  } else if (parsedRange.openMinutes < parsedRange.closeMinutes) {
    // Standard daytime window (e.g., 10:00 AM - 10:00 PM)
    isWithinScheduledHours =
      currentMinutes >= parsedRange.openMinutes &&
      currentMinutes < parsedRange.closeMinutes;
  } else {
    // Overnight window crossing midnight (e.g., 6:00 PM - 2:00 AM)
    isWithinScheduledHours =
      currentMinutes >= parsedRange.openMinutes ||
      currentMinutes < parsedRange.closeMinutes;
  }

  const mode = normalizeKitchenScheduleMode(
    input.scheduleMode,
    input.isAcceptingOrders
  );

  if (mode === "MANUAL_OPEN") {
    return {
      isOpen: true,
      mode,
      isWithinScheduledHours,
      isSunday,
      activeHoursLabel,
      reason: "Kitchen is open (Admin manual override).",
    };
  }

  if (mode === "MANUAL_CLOSED") {
    return {
      isOpen: false,
      mode,
      isWithinScheduledHours,
      isSunday,
      activeHoursLabel,
      reason:
        "Sika Cuisine kitchen is temporarily closed by management. Please check back shortly.",
    };
  }

  return {
    isOpen: isWithinScheduledHours,
    mode: "AUTO",
    isWithinScheduledHours,
    isSunday,
    activeHoursLabel,
    reason: isWithinScheduledHours
      ? `Kitchen is open (${activeHoursLabel} GMT).`
      : `Sika Cuisine kitchen is currently closed. Today's operating hours are ${activeHoursLabel} (GMT).`,
  };
}
