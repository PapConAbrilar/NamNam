export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Comida registrada por el usuario (tabla `meals`). */
export interface Meal {
  id: string;
  name: string;
  mealType: MealType;
  /** Fecha y hora ISO en que se consumió. */
  consumedAt: string;
  /** Día local (YYYY-MM-DD) al que pertenece la comida. */
  logDate: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  photoPath?: string | null;
}

/** Totales nutricionales de un día (vista `daily_nutrition_summary`). */
export interface DailySummary {
  logDate: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealCount: number;
}

/** Meta nutricional vigente desde `validFrom` (tabla `nutrition_goals`). */
export interface NutritionGoal {
  validFrom: string;
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}

/** Registro de peso corporal (tabla `weight_logs`). */
export interface WeightLog {
  loggedOn: string;
  weightKg: number;
}

/** Registro de consumo de agua (tabla `water_logs`). */
export interface WaterLog {
  logDate: string;
  ml: number;
}

// ---------- Modelos de vista ----------

export interface DiaryDay {
  date: string;
  label: string;
  consumedKcal: number;
  targetKcal: number;
  meals: Meal[];
}

export type WeekBarStatus = 'under' | 'over' | 'today' | 'future';

export interface WeekBar {
  date: string;
  dayLetter: string;
  kcal: number;
  targetKcal: number;
  /** Altura relativa de la barra (0-100). */
  heightPct: number;
  status: WeekBarStatus;
}

export interface MacroProgress {
  consumedG: number;
  targetG: number;
}

export interface WeeklyProgress {
  rangeLabel: string;
  bars: WeekBar[];
  daysOnTarget: number;
  totalDays: number;
  currentStreak: number;
  recordStreak: number;
  currentWeightKg: number | null;
  weightDeltaKg: number | null;
  avgWaterL: number | null;
  waterGoalL: number;
  macros: {
    protein: MacroProgress;
    carbs: MacroProgress;
    fat: MacroProgress;
  };
}
