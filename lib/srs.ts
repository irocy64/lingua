import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card as FsrsCard,
  type ReviewLog,
} from "ts-fsrs";

export type Grade = "again" | "hard" | "good" | "easy";

type ReviewRating =
  | Rating.Again
  | Rating.Hard
  | Rating.Good
  | Rating.Easy;

const gradeToRating: Record<Grade, ReviewRating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const f = fsrs();

export interface SchedulingResult {
  fsrsData: string;
  dueAt: Date;
  elapsedDays: number;
  reps: number;
}

/**
 * 对一张卡片执行一次 FSRS 调度。
 * @param storedFsrs 数据库中存储的 FSRS JSON（无则视为全新卡）
 * @param grade 用户自评
 * @param now 当前时间
 */
export function scheduleCard(
  storedFsrs: string | null,
  grade: Grade,
  now: Date = new Date()
): SchedulingResult {
  const existing: FsrsCard = storedFsrs
    ? (JSON.parse(storedFsrs) as FsrsCard)
    : createEmptyCard(now);

  const records = f.repeat(existing, now);
  const record = records[gradeToRating[grade]];

  return {
    fsrsData: JSON.stringify(record.card),
    dueAt: record.card.due,
    elapsedDays: record.log.elapsed_days,
    reps: record.card.reps,
  };
}

/** 判断卡片在调度后是否应视为"已掌握"（简单启发式：复习次数 >= 5 且稳定度 >= 30 天） */
export function isMastered(fsrsData: string): boolean {
  const card = JSON.parse(fsrsData) as FsrsCard;
  return card.reps >= 5 && card.stability >= 30;
}

export type { FsrsCard, ReviewLog };
