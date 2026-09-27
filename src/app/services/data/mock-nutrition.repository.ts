import { Injectable, inject } from '@angular/core';
import { DailySummary, Meal, MealType, NutritionGoal, WaterLog, WeightLog } from '../../models/nutrition.model';
import { addDays, toISODate } from '../../utils/date.utils';
import { AuthService } from '../auth.service';
import { NutritionRepository } from './nutrition.repository';

type MealTemplate = [name: string, time: string, kcal: number, proteinG: number, carbsG: number, fatG: number];

const TEMPLATES: Record<MealType, MealTemplate[]> = {
  breakfast: [
    ['Avena con Frutas', '07:30', 420, 15, 68, 9],
    ['Huevos Revueltos', '08:00', 380, 24, 12, 26],
    ['Yogurt con Granola', '07:45', 350, 18, 48, 10],
    ['Tostadas con Palta', '08:15', 400, 11, 42, 21],
  ],
  lunch: [
    ['Pollo y Arroz', '12:15', 650, 48, 75, 14],
    ['Pizza Margherita', '13:00', 890, 34, 104, 36],
    ['Ensalada César', '13:30', 520, 32, 22, 34],
    ['Salmón con Quinoa', '12:45', 610, 42, 50, 24],
  ],
  dinner: [
    ['Sopa de Verduras', '19:30', 550, 22, 70, 18],
    ['Tacos de Carne', '20:00', 640, 36, 52, 30],
    ['Omelette de Espinaca', '20:15', 430, 30, 8, 30],
  ],
  snack: [
    ['Manzana y Nueces', '16:00', 180, 4, 20, 10],
    ['Barra de Proteína', '17:00', 210, 20, 22, 7],
  ],
};

/**
 * Días con registros relativos a hoy (0 = hoy). Genera una racha actual de 7 días
 * y una racha histórica de 12 días para poblar las vistas mientras no haya backend.
 */
const LOGGED_OFFSETS = [...range(0, 6), ...range(8, 19)];

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Repositorio local con datos de demostración. Se usa cuando Supabase no está configurado. */
@Injectable()
export class MockNutritionRepository extends NutritionRepository {
  private auth = inject(AuthService);
  private meals = this.buildMeals();

  async getMeals(from: string, to: string): Promise<Meal[]> {
    return this.meals.filter((m) => m.logDate >= from && m.logDate <= to);
  }

  async getDailySummaries(from: string, to: string): Promise<DailySummary[]> {
    const byDate = new Map<string, DailySummary>();
    for (const meal of await this.getMeals(from, to)) {
      const day = byDate.get(meal.logDate) ?? {
        logDate: meal.logDate, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, mealCount: 0,
      };
      day.kcal += meal.kcal;
      day.proteinG += meal.proteinG;
      day.carbsG += meal.carbsG;
      day.fatG += meal.fatG;
      day.mealCount += 1;
      byDate.set(meal.logDate, day);
    }
    return [...byDate.values()].sort((a, b) => a.logDate.localeCompare(b.logDate));
  }

  async getGoalHistory(): Promise<NutritionGoal[]> {
    const metrics = this.auth.currentUser?.metrics;
    return [
      {
        validFrom: '2000-01-01',
        targetKcal: metrics?.targetCalories ?? 1850,
        proteinG: metrics?.targetProteinGrams ?? 150,
        carbsG: metrics?.targetCarbsGrams ?? 220,
        fatG: metrics?.targetFatGrams ?? 60,
        waterMl: 2500,
      },
    ];
  }

  async getWeightLogs(to: string): Promise<WeightLog[]> {
    const today = new Date();
    const base = this.auth.currentUser?.metrics?.weightKg ?? 73.4;
    const logs: WeightLog[] = [
      { loggedOn: toISODate(addDays(today, -14)), weightKg: +(base + 0.9).toFixed(1) },
      { loggedOn: toISODate(addDays(today, -8)), weightKg: +(base + 0.6).toFixed(1) },
      { loggedOn: toISODate(addDays(today, -3)), weightKg: +(base + 0.3).toFixed(1) },
      { loggedOn: toISODate(today), weightKg: base },
    ];
    return logs.filter((l) => l.loggedOn <= to);
  }

  async getWaterLogs(from: string, to: string): Promise<WaterLog[]> {
    const today = new Date();
    const pattern = [1800, 2100, 1600, 1900, 1700, 2000, 1500];
    return LOGGED_OFFSETS.map((offset) => ({
      logDate: toISODate(addDays(today, -offset)),
      ml: pattern[offset % pattern.length],
    })).filter((w) => w.logDate >= from && w.logDate <= to);
  }

  async addMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const created: Meal = {
      ...meal,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.meals.unshift(created);
    return created;
  }

  private buildMeals(): Meal[] {
    const today = new Date();
    const meals: Meal[] = [];

    for (const offset of LOGGED_OFFSETS) {
      const date = addDays(today, -offset);
      for (const [mealType, template] of this.pickTemplates(offset)) {
        const [name, time, kcal, proteinG, carbsG, fatG] = template;
        const [h, min] = time.split(':').map(Number);
        const consumedAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min);
        meals.push({
          id: `mock-${offset}-${mealType}`,
          name,
          mealType,
          consumedAt: consumedAt.toISOString(),
          logDate: toISODate(date),
          kcal,
          proteinG,
          carbsG,
          fatG,
        });
      }
    }
    return meals.sort((a, b) => a.consumedAt.localeCompare(b.consumedAt));
  }

  /** Hoy y ayer replican los datos del mockup; el resto rota plantillas de forma determinista. */
  private pickTemplates(offset: number): Array<[MealType, MealTemplate]> {
    if (offset === 0) {
      return [['breakfast', TEMPLATES.breakfast[0]], ['lunch', TEMPLATES.lunch[0]], ['snack', TEMPLATES.snack[0]]];
    }
    if (offset === 1) {
      return [['breakfast', TEMPLATES.breakfast[1]], ['lunch', TEMPLATES.lunch[1]], ['dinner', TEMPLATES.dinner[0]]];
    }
    const pick = (type: MealType, seed: number): [MealType, MealTemplate] =>
      [type, TEMPLATES[type][seed % TEMPLATES[type].length]];
    const result = [pick('breakfast', offset), pick('lunch', offset + 1), pick('dinner', offset * 2)];
    if (offset % 3 === 0) result.push(pick('snack', offset));
    return result;
  }
}
