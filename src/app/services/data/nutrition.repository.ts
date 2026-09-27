import { DailySummary, Meal, NutritionGoal, WaterLog, WeightLog } from '../../models/nutrition.model';

/**
 * Contrato de acceso a datos nutricionales. Las fechas son días locales 'YYYY-MM-DD' y los rangos son inclusivos.
 * Implementaciones: `SupabaseNutritionRepository` (producción) y `MockNutritionRepository` (sin backend).
 */
export abstract class NutritionRepository {
  abstract getMeals(from: string, to: string): Promise<Meal[]>;
  abstract getDailySummaries(from: string, to: string): Promise<DailySummary[]>;
  /** Historial de metas ordenado por `validFrom` ascendente. */
  abstract getGoalHistory(): Promise<NutritionGoal[]>;
  /** Registros de peso hasta `to`, ordenados por fecha ascendente. */
  abstract getWeightLogs(to: string): Promise<WeightLog[]>;
  abstract getWaterLogs(from: string, to: string): Promise<WaterLog[]>;
  /** Registra una nueva comida. */
  abstract addMeal(meal: Omit<Meal, 'id'>): Promise<Meal>;
}

