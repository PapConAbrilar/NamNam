import { Injectable, inject } from '@angular/core';
import { DailySummary, WeekBar, WeeklyProgress } from '../models/nutrition.model';
import { WEEKDAY_LETTERS, addDays, formatWeekRange, parseISODate, startOfWeek, toISODate } from '../utils/date.utils';
import { NutritionRepository } from './data/nutrition.repository';
import { GoalService } from './goal.service';

/** Días hacia atrás que se consideran para calcular la racha récord. */
const STREAK_LOOKBACK_DAYS = 365;

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private repo = inject(NutritionRepository);
  private goals = inject(GoalService);

  async getWeeklyProgress(): Promise<WeeklyProgress> {
    const today = new Date();
    const todayIso = toISODate(today);
    const weekStart = startOfWeek(today);
    const weekEnd = addDays(weekStart, 6);
    const weekStartIso = toISODate(weekStart);
    const weekEndIso = toISODate(weekEnd);

    const [summaries, goalFor, weightLogs, waterLogs] = await Promise.all([
      this.repo.getDailySummaries(toISODate(addDays(today, -STREAK_LOOKBACK_DAYS)), weekEndIso),
      this.goals.getResolver(),
      this.repo.getWeightLogs(weekEndIso),
      this.repo.getWaterLogs(weekStartIso, weekEndIso),
    ]);

    const summaryByDate = new Map(summaries.map((s) => [s.logDate, s]));
    const weekDates = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)));
    const weekSummaries = weekDates
      .map((d) => summaryByDate.get(d))
      .filter((s): s is DailySummary => !!s && s.mealCount > 0 && s.logDate <= todayIso);

    // Barras semanales
    const scale = Math.max(1, ...weekDates.map((d) => Math.max(summaryByDate.get(d)?.kcal ?? 0, goalFor(d).targetKcal)));
    const bars: WeekBar[] = weekDates.map((date, i) => {
      const kcal = summaryByDate.get(date)?.kcal ?? 0;
      const targetKcal = goalFor(date).targetKcal;
      const status = date === todayIso ? 'today' : date > todayIso ? 'future' : kcal > targetKcal ? 'over' : 'under';
      return { date, dayLetter: WEEKDAY_LETTERS[i], kcal, targetKcal, heightPct: Math.round((kcal / scale) * 100), status };
    });

    // Días que cumplieron la meta (registraron comidas sin superar la meta calórica)
    const daysOnTarget = weekSummaries.filter((s) => s.kcal <= goalFor(s.logDate).targetKcal).length;

    // Rachas
    const loggedDates = new Set(summaries.filter((s) => s.mealCount > 0).map((s) => s.logDate));
    const { current, record } = this.computeStreaks(loggedDates, today);

    // Peso: último registro y variación contra el último registro anterior a esta semana
    const latestWeight = weightLogs.at(-1) ?? null;
    const previousWeight = [...weightLogs].reverse().find((w) => w.loggedOn < weekStartIso) ?? null;

    // Agua: promedio diario de los días con registro
    const waterByDate = new Map<string, number>();
    for (const log of waterLogs) {
      waterByDate.set(log.logDate, (waterByDate.get(log.logDate) ?? 0) + log.ml);
    }
    const waterDays = [...waterByDate.values()];
    const avgWaterL = waterDays.length ? waterDays.reduce((a, b) => a + b, 0) / waterDays.length / 1000 : null;

    // Macros: promedio diario de la semana contra la meta vigente hoy
    const todayGoal = goalFor(todayIso);
    const avg = (pick: (s: DailySummary) => number) =>
      weekSummaries.length ? Math.round(weekSummaries.reduce((sum, s) => sum + pick(s), 0) / weekSummaries.length) : 0;

    return {
      rangeLabel: formatWeekRange(weekStart, weekEnd),
      bars,
      daysOnTarget,
      totalDays: 7,
      currentStreak: current,
      recordStreak: record,
      currentWeightKg: latestWeight?.weightKg ?? null,
      weightDeltaKg: latestWeight && previousWeight ? +(latestWeight.weightKg - previousWeight.weightKg).toFixed(1) : null,
      avgWaterL: avgWaterL !== null ? +avgWaterL.toFixed(1) : null,
      waterGoalL: +(todayGoal.waterMl / 1000).toFixed(1),
      macros: {
        protein: { consumedG: avg((s) => s.proteinG), targetG: todayGoal.proteinG },
        carbs: { consumedG: avg((s) => s.carbsG), targetG: todayGoal.carbsG },
        fat: { consumedG: avg((s) => s.fatG), targetG: todayGoal.fatG },
      },
    };
  }

  /** La racha actual cuenta desde hoy, o desde ayer si hoy aún no hay registros. */
  private computeStreaks(loggedDates: Set<string>, today: Date): { current: number; record: number } {
    let cursor = loggedDates.has(toISODate(today)) ? today : addDays(today, -1);
    let current = 0;
    while (loggedDates.has(toISODate(cursor))) {
      current++;
      cursor = addDays(cursor, -1);
    }

    let record = 0;
    let run = 0;
    let previous: string | null = null;
    for (const date of [...loggedDates].sort()) {
      run = previous && toISODate(addDays(parseISODate(previous), 1)) === date ? run + 1 : 1;
      record = Math.max(record, run);
      previous = date;
    }
    return { current, record: Math.max(record, current) };
  }
}
