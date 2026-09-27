import { Injectable, inject } from '@angular/core';
import { DiaryDay, Meal } from '../models/nutrition.model';
import { addDays, formatShortDay, parseISODate, toISODate } from '../utils/date.utils';
import { NutritionRepository } from './data/nutrition.repository';
import { GoalService } from './goal.service';
import { GachaService } from '../gacha/services/gacha.service';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private repo = inject(NutritionRepository);
  private goals = inject(GoalService);
  private gachaService = inject(GachaService);

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

  /** Registra una comida nueva en el repositorio y premia al usuario con monedas en el Gacha. */
  async recordMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const saved = await this.repo.addMeal(meal);
    try {
      this.gachaService.addCurrency(100);
    } catch (err) {
      console.warn('No se pudo otorgar monedas de Gacha:', err);
    }
    return saved;
  }

  /** Resumen de hoy: comidas registradas hoy, totales de calorías y macros consumidos vs meta */
  async getTodaySummary(): Promise<{
    consumedKcal: number;
    targetKcal: number;
    consumedProtein: number;
    targetProtein: number;
    consumedCarbs: number;
    targetCarbs: number;
    consumedFat: number;
    targetFat: number;
    meals: Meal[];
  }> {
    const todayIso = toISODate(new Date());
    const [meals, goalFor] = await Promise.all([
      this.repo.getMeals(todayIso, todayIso),
      this.goals.getResolver(),
    ]);

    const goal = goalFor(todayIso);
    const consumedKcal = meals.reduce((sum, m) => sum + m.kcal, 0);
    const consumedProtein = meals.reduce((sum, m) => sum + m.proteinG, 0);
    const consumedCarbs = meals.reduce((sum, m) => sum + m.carbsG, 0);
    const consumedFat = meals.reduce((sum, m) => sum + m.fatG, 0);

    return {
      consumedKcal,
      targetKcal: goal.targetKcal,
      consumedProtein: Math.round(consumedProtein),
      targetProtein: goal.proteinG || 125,
      consumedCarbs: Math.round(consumedCarbs),
      targetCarbs: goal.carbsG || 250,
      consumedFat: Math.round(consumedFat),
      targetFat: goal.fatG || 55,
      meals: [...meals].sort((a, b) => b.consumedAt.localeCompare(a.consumedAt)),
    };
  }
}

