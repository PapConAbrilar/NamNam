import { Injectable, inject } from '@angular/core';
import { DiaryDay, Meal } from '../models/nutrition.model';
import { addDays, formatShortDay, parseISODate, toISODate } from '../utils/date.utils';
import { NutritionRepository } from './data/nutrition.repository';
import { GoalService } from './goal.service';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private repo = inject(NutritionRepository);
  private goals = inject(GoalService);

  /** Comidas de los últimos `days` días agrupadas por fecha (más reciente primero). Hoy siempre aparece. */
  async getDiary(days = 14): Promise<DiaryDay[]> {
    const today = new Date();
    const todayIso = toISODate(today);
    const yesterdayIso = toISODate(addDays(today, -1));
    const from = toISODate(addDays(today, -(days - 1)));

    const [meals, goalFor] = await Promise.all([this.repo.getMeals(from, todayIso), this.goals.getResolver()]);

    const byDate = new Map<string, Meal[]>([[todayIso, []]]);
    for (const meal of meals) {
      byDate.set(meal.logDate, [...(byDate.get(meal.logDate) ?? []), meal]);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayMeals]) => {
        const shortDay = formatShortDay(parseISODate(date));
        const prefix = date === todayIso ? 'Hoy — ' : date === yesterdayIso ? 'Ayer — ' : '';
        return {
          date,
          label: prefix + shortDay,
          consumedKcal: dayMeals.reduce((sum, m) => sum + m.kcal, 0),
          targetKcal: goalFor(date).targetKcal,
          meals: [...dayMeals].sort((a, b) => a.consumedAt.localeCompare(b.consumedAt)),
        };
      });
  }

  /** Registra una comida nueva en el repositorio. */
  async recordMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    return this.repo.addMeal(meal);
  }
}

