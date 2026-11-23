export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface AnalyticsBucketBound {
  key: string;
  label: string;
  shortLabel: string;
  start: Date;
  end: Date;
}

export interface AnalyticsPeriodBounds {
  period: AnalyticsPeriod;
  periodLabel: string;
  comparisonLabel: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  buckets: AnalyticsBucketBound[];
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function parseAnalyticsPeriod(raw: string | null | undefined): AnalyticsPeriod {
  const val = typeof raw === "string" ? raw.trim().toLowerCase() : "daily";
  if (val === "weekly" || val === "monthly" || val === "yearly") {
    return val;
  }
  return "daily";
}

/**
 * Computes deterministic current & comparison windows plus chart X-axis buckets
 * for Daily (hourly), Weekly (7 days), Monthly (30 days), and Yearly (12 months) views.
 */
export function getAnalyticsPeriodBounds(
  period: AnalyticsPeriod,
  now: Date = new Date()
): AnalyticsPeriodBounds {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  if (period === "daily") {
    const previousStart = new Date(startOfToday);
    previousStart.setDate(previousStart.getDate() - 1);

    const buckets: AnalyticsBucketBound[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const bStart = new Date(startOfToday);
      bStart.setHours(hour, 0, 0, 0);
      const bEnd = new Date(startOfToday);
      bEnd.setHours(hour + 1, 0, 0, 0);
      const hh = String(hour).padStart(2, "0");
      buckets.push({
        key: `h-${hh}`,
        label: `${hh}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`,
        shortLabel: `${hh}:00`,
        start: bStart,
        end: bEnd,
      });
    }

    return {
      period: "daily",
      periodLabel: "Today (Hourly)",
      comparisonLabel: "vs. Yesterday",
      currentStart: startOfToday,
      currentEnd: startOfTomorrow,
      previousStart,
      previousEnd: startOfToday,
      buckets,
    };
  }

  if (period === "weekly") {
    const currentStart = new Date(startOfToday);
    currentStart.setDate(currentStart.getDate() - 6);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);

    const buckets: AnalyticsBucketBound[] = [];
    for (let i = 0; i < 7; i += 1) {
      const bStart = new Date(currentStart);
      bStart.setDate(bStart.getDate() + i);
      const bEnd = new Date(bStart);
      bEnd.setDate(bEnd.getDate() + 1);

      const dayName = SHORT_DAYS[bStart.getDay()];
      const monthName = SHORT_MONTHS[bStart.getMonth()];
      const dayNum = bStart.getDate();

      buckets.push({
        key: `d-${bStart.getFullYear()}-${bStart.getMonth() + 1}-${dayNum}`,
        label: `${dayName}, ${dayNum} ${monthName}`,
        shortLabel: `${dayName} ${dayNum}`,
        start: bStart,
        end: bEnd,
      });
    }

    return {
      period: "weekly",
      periodLabel: "Last 7 Days",
      comparisonLabel: "vs. Previous 7 Days",
      currentStart,
      currentEnd: startOfTomorrow,
      previousStart,
      previousEnd: currentStart,
      buckets,
    };
  }

  if (period === "monthly") {
    const currentStart = new Date(startOfToday);
    currentStart.setDate(currentStart.getDate() - 29);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);

    const buckets: AnalyticsBucketBound[] = [];
    for (let i = 0; i < 30; i += 1) {
      const bStart = new Date(currentStart);
      bStart.setDate(bStart.getDate() + i);
      const bEnd = new Date(bStart);
      bEnd.setDate(bEnd.getDate() + 1);

      const monthName = SHORT_MONTHS[bStart.getMonth()];
      const dayNum = bStart.getDate();

      buckets.push({
        key: `d-${bStart.getFullYear()}-${bStart.getMonth() + 1}-${dayNum}`,
        label: `${dayNum} ${monthName} ${bStart.getFullYear()}`,
        shortLabel: `${dayNum} ${monthName}`,
        start: bStart,
        end: bEnd,
      });
    }

    return {
      period: "monthly",
      periodLabel: "Last 30 Days",
      comparisonLabel: "vs. Previous 30 Days",
      currentStart,
      currentEnd: startOfTomorrow,
      previousStart,
      previousEnd: currentStart,
      buckets,
    };
  }

  // Yearly: 12 calendar months ending with the current month
  const currentStart = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 23, 1, 0, 0, 0, 0);

  const buckets: AnalyticsBucketBound[] = [];
  for (let i = 0; i < 12; i += 1) {
    const bStart = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth() + i,
      1,
      0,
      0,
      0,
      0
    );
    const bEnd = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth() + i + 1,
      1,
      0,
      0,
      0,
      0
    );
    const monthName = SHORT_MONTHS[bStart.getMonth()];
    const yy = String(bStart.getFullYear()).slice(-2);

    buckets.push({
      key: `m-${bStart.getFullYear()}-${bStart.getMonth() + 1}`,
      label: `${monthName} ${bStart.getFullYear()}`,
      shortLabel: `${monthName} '${yy}`,
      start: bStart,
      end: bEnd,
    });
  }

  return {
    period: "yearly",
    periodLabel: "Last 12 Months",
    comparisonLabel: "vs. Previous 12 Months",
    currentStart,
    currentEnd,
    previousStart,
    previousEnd: currentStart,
    buckets,
  };
}

/**
 * Computes percentage growth/change between `current` and `previous` values,
 * rounded to 1 decimal place.
 */
export function computePercentageDelta(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Canonicalizes a customer identity across registered (`customerId`) and guest
 * (`guestPhone` / `guestEmail`) orders so repeat guest orders with local (`059...`)
 * or international (`+23359...`) phone numbers unify to the same cohort profile.
 */
export function normalizeCustomerCohortKey(input: {
  customerId?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
}): string {
  if (input.customerId && input.customerId.trim()) {
    return `user:${input.customerId.trim()}`;
  }

  const rawPhone = (input.guestPhone || "").replace(/[\s\-()]/g, "");
  if (rawPhone) {
    let digits = rawPhone.replace(/^\+/, "");
    if (digits.startsWith("0") && digits.length === 10) {
      digits = `233${digits.slice(1)}`;
    }
    if (digits.length >= 9) {
      return `phone:${digits}`;
    }
  }

  const cleanEmail = (input.guestEmail || "").trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes("@")) {
    return `email:${cleanEmail}`;
  }

  return "anonymous";
}
