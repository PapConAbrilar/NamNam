import { Injectable, inject } from '@angular/core';
import { DailySummary, Meal, MealType, NutritionGoal, WaterLog, WeightLog } from '../../models/nutrition.model';
import { SupabaseService } from '../supabase.service';
import { NutritionRepository } from './nutrition.repository';

interface MealRow {
  id: string;
  name: string;
  meal_type: MealType;
  consumed_at: string;
  log_date: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  photo_path: string | null;
}

interface DailySummaryRow {
  log_date: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_count: number;
}

interface GoalRow {
  valid_from: string;
  target_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
}

/**
 * Lee los datos nutricionales desde Supabase. No filtra por `user_id`:
 * las políticas RLS limitan cada consulta al usuario autenticado (`auth.uid()`).
 */
@Injectable()
export class SupabaseNutritionRepository extends NutritionRepository {
  private supabase = inject(SupabaseService);

  async getMeals(from: string, to: string): Promise<Meal[]> {
    const { data, error } = await this.supabase.client
      .from('meals')
      .select('id, name, meal_type, consumed_at, log_date, kcal, protein_g, carbs_g, fat_g, photo_path')
      .gte('log_date', from)
      .lte('log_date', to)
      .order('consumed_at', { ascending: true });
    if (error) throw error;
    return (data as MealRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      mealType: r.meal_type,
      consumedAt: r.consumed_at,
      logDate: r.log_date,
      kcal: Number(r.kcal),
      proteinG: Number(r.protein_g),
      carbsG: Number(r.carbs_g),
      fatG: Number(r.fat_g),
      photoPath: r.photo_path,
    }));
  }

  async getDailySummaries(from: string, to: string): Promise<DailySummary[]> {
    const { data, error } = await this.supabase.client
      .from('daily_nutrition_summary')
      .select('log_date, kcal, protein_g, carbs_g, fat_g, meal_count')
      .gte('log_date', from)
      .lte('log_date', to)
      .order('log_date', { ascending: true });
    if (error) throw error;
    return (data as DailySummaryRow[]).map((r) => ({
      logDate: r.log_date,
      kcal: Number(r.kcal),
      proteinG: Number(r.protein_g),
      carbsG: Number(r.carbs_g),
      fatG: Number(r.fat_g),
      mealCount: Number(r.meal_count),
    }));
  }

  async getGoalHistory(): Promise<NutritionGoal[]> {
    const { data, error } = await this.supabase.client
      .from('nutrition_goals')
      .select('valid_from, target_kcal, protein_g, carbs_g, fat_g, water_ml')
      .order('valid_from', { ascending: true });
    if (error) throw error;
    return (data as GoalRow[]).map((r) => ({
      validFrom: r.valid_from,
      targetKcal: Number(r.target_kcal),
      proteinG: Number(r.protein_g),
      carbsG: Number(r.carbs_g),
      fatG: Number(r.fat_g),
      waterMl: Number(r.water_ml),
    }));
  }

  async getWeightLogs(to: string): Promise<WeightLog[]> {
    const { data, error } = await this.supabase.client
      .from('weight_logs')
      .select('logged_on, weight_kg')
      .lte('logged_on', to)
      .order('logged_on', { ascending: true });
    if (error) throw error;
    return (data as { logged_on: string; weight_kg: number }[]).map((r) => ({
      loggedOn: r.logged_on,
      weightKg: Number(r.weight_kg),
    }));
  }

  async getWaterLogs(from: string, to: string): Promise<WaterLog[]> {
    const { data, error } = await this.supabase.client
      .from('water_logs')
      .select('log_date, ml')
      .gte('log_date', from)
      .lte('log_date', to);
    if (error) throw error;
    return (data as { log_date: string; ml: number }[]).map((r) => ({
      logDate: r.log_date,
      ml: Number(r.ml),
    }));
  }

  async addMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const { data, error } = await this.supabase.client
      .from('meals')
      .insert({
        name: meal.name,
        meal_type: meal.mealType,
        consumed_at: meal.consumedAt,
        log_date: meal.logDate,
        kcal: meal.kcal,
        protein_g: meal.proteinG,
        carbs_g: meal.carbsG,
        fat_g: meal.fatG,
        photo_path: meal.photoPath ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    const r = data as MealRow;
    return {
      id: r.id,
      name: r.name,
      mealType: r.meal_type,
      consumedAt: r.consumed_at,
      logDate: r.log_date,
      kcal: Number(r.kcal),
      proteinG: Number(r.protein_g),
      carbsG: Number(r.carbs_g),
      fatG: Number(r.fat_g),
      photoPath: r.photo_path,
    };
  }
}
