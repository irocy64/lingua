import { describe, expect, it } from "vitest";
import { addDays, dayKey, startOfDay } from "./date";

describe("date helpers", () => {
  it("startOfDay 归零时分秒与毫秒", () => {
    const d = new Date(2026, 9, 21, 23, 45, 12, 345);
    const s = startOfDay(d);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getSeconds()).toBe(0);
    expect(s.getMilliseconds()).toBe(0);
    expect(dayKey(s)).toBe("2026-10-21");
  });

  it("dayKey 使用本地日期而非 UTC", () => {
    // 本地 00:30 在 UTC 仍是前一天，dayKey 必须返回本地日期
    const local = new Date(2026, 0, 2, 0, 30);
    expect(dayKey(local)).toBe("2026-01-02");
  });

  it("addDays 可跨月并保持时间不变", () => {
    const base = new Date(2026, 0, 31, 8, 0);
    const next = addDays(base, 1);
    expect(dayKey(next)).toBe("2026-02-01");
    expect(next.getHours()).toBe(8);
    expect(dayKey(addDays(base, -31))).toBe("2025-12-31");
  });
});
