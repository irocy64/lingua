import { describe, expect, it } from "vitest";
import { scheduleCard } from "./srs";

const now = new Date("2026-10-20T12:00:00Z");

describe("scheduleCard", () => {
  it("新卡 good 后，下次到期时间应晚于当前时间", () => {
    const result = scheduleCard(null, "good", now);
    expect(result.dueAt.getTime()).toBeGreaterThan(now.getTime());
    expect(result.reps).toBe(1);
  });

  it("again 的间隔应短于 easy", () => {
    const again = scheduleCard(null, "again", now);
    const easy = scheduleCard(null, "easy", now);
    expect(again.dueAt.getTime()).toBeLessThan(easy.dueAt.getTime());
  });

  it("FSRS 状态可序列化并在后续调度中继续使用", () => {
    const first = scheduleCard(null, "good", now);
    expect(() => JSON.parse(first.fsrsData)).not.toThrow();

    const later = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const second = scheduleCard(first.fsrsData, "good", later);
    expect(second.reps).toBe(2);
  });
});
