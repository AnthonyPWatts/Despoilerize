import type { ProtectionSchedule, Settings } from "./types";

export type ProtectionWindow = {
  start: Date;
  end: Date;
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function isScheduledProtectionActive(settings: Settings, now = new Date()): boolean {
  const schedule = settings.catchUpMode.schedule;
  if (!schedule) return false;
  if (!settings.catchUpMode.enabled) return false;
  if (schedule.mode === "paused") return false;
  if (schedule.mode === "always") return true;

  return getCurrentProtectionWindow(settings, now) !== null;
}

export function getCurrentProtectionWindow(settings: Settings, now = new Date()): ProtectionWindow | null {
  const schedule = settings.catchUpMode.schedule;
  if (!schedule || !settings.catchUpMode.enabled) return null;
  if (schedule.mode === "paused") return null;
  if (schedule.mode === "always") {
    return { start: now, end: now };
  }

  for (let offset = -1; offset <= 0; offset += 1) {
    const date = addLocalDays(startOfLocalDay(now), offset);
    if (!isScheduledDay(schedule, date.getDay())) continue;

    const window = buildWindow(date, schedule);
    if (window.start <= now && now <= window.end) {
      return window;
    }
  }

  return null;
}

export function getNextProtectionWindow(settings: Settings, now = new Date()): ProtectionWindow | null {
  const schedule = settings.catchUpMode.schedule;
  if (!schedule || !settings.catchUpMode.enabled) return null;
  if (schedule.mode === "paused") return null;
  if (schedule.mode === "always") {
    return { start: now, end: now };
  }

  const current = getCurrentProtectionWindow(settings, now);
  if (current) return current;

  for (let offset = 0; offset <= 14; offset += 1) {
    const date = addLocalDays(startOfLocalDay(now), offset);
    if (!isScheduledDay(schedule, date.getDay())) continue;

    const window = buildWindow(date, schedule);
    if (window.end >= now) return window;
  }

  return null;
}

export function getNextProtectionTransition(settings: Settings, now = new Date()): Date | null {
  const schedule = settings.catchUpMode.schedule;
  if (!schedule || !settings.catchUpMode.enabled) return null;
  if (schedule.mode === "paused" || schedule.mode === "always") return null;

  const current = getCurrentProtectionWindow(settings, now);
  if (current) return current.end;

  return getNextProtectionWindow(settings, now)?.start ?? null;
}

export function describeSchedule(schedule?: ProtectionSchedule): string {
  if (!schedule) return "Manual protection";

  if (schedule.mode === "weekend") return "All day Saturday -> Sunday";
  if (schedule.mode === "daily") return describeTimeRange(schedule);
  if (schedule.mode === "always") return "Protect 24/7 until I turn it off";
  if (schedule.mode === "paused") return "Do not protect automatically";

  const days = schedule.days
    .slice()
    .sort()
    .map(day => dayNames[day]?.slice(0, 3))
    .filter(Boolean)
    .join(", ");

  return `${days || "No days"} ${describeTimeRange(schedule)}`;
}

export function formatScheduleDateTime(date: Date, now = new Date()): string {
  const time = formatTime(date);
  if (isSameLocalDate(date, now)) return `Today at ${time}`;
  if (isSameLocalDate(date, addLocalDays(now, 1))) return `Tomorrow at ${time}`;
  if (date > now && isSameLocalWeek(date, now)) return `This ${dayNames[date.getDay()]} at ${time}`;

  return `${date > now ? "Next" : "Last"} ${dayNames[date.getDay()]} at ${time}`;
}

function isScheduledDay(schedule: ProtectionSchedule, day: number): boolean {
  if (schedule.mode === "daily") return true;
  if (schedule.mode === "weekend") return day === 6;
  return schedule.days.includes(day);
}

function buildWindow(date: Date, schedule: ProtectionSchedule): ProtectionWindow {
  const start = withTime(date, schedule.startTime);
  let end = withTime(date, schedule.endTime);
  end.setSeconds(59, 999);

  if (schedule.mode === "weekend") {
    end = addLocalDays(end, 1);
  }

  if (end <= start) {
    end = addLocalDays(end, 1);
  }

  return { start, end };
}

function describeTimeRange(schedule: ProtectionSchedule): string {
  if (schedule.startTime === "00:00" && schedule.endTime === "23:59") return "All day";
  return `${schedule.startTime} -> ${schedule.endTime}`;
}

function withTime(date: Date, time: string): Date {
  const [hours = "0", minutes = "0"] = time.split(":");
  const next = new Date(date);
  next.setHours(Number(hours), Number(minutes), 0, 0);
  return next;
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isSameLocalWeek(left: Date, right: Date): boolean {
  const leftWeekStart = addLocalDays(startOfLocalDay(left), -left.getDay());
  const rightWeekStart = addLocalDays(startOfLocalDay(right), -right.getDay());
  return isSameLocalDate(leftWeekStart, rightWeekStart);
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
