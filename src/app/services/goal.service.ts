import { Injectable, inject } from '@angular/core';
import { NutritionGoal } from '../models/nutrition.model';
import { AuthService } from './auth.service';
import { NutritionRepository } from './data/nutrition.repository';

export type GoalResolver = (date: string) => NutritionGoal;

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  private repo = inject(NutritionRepository);
  private auth = inject(AuthService);

  /**
   * Devuelve una función que entrega la meta vigente para un día.
   * Si no hay metas registradas usa las métricas del onboarding como respaldo.
   */
  async getResolver(): Promise<GoalResolver> {
    const history = await this.repo.getGoalHistory();
    const fallback = this.fallbackGoal();
    return (date: string) => {
      let current: NutritionGoal | undefined;
      for (const goal of history) {
        if (goal.validFrom <= date) current = goal;
      }
      return current ?? history[0] ?? fallback;
    };
  }

  private fallbackGoal(): NutritionGoal {
    const metrics = this.auth.currentUser?.metrics;
    return {
      validFrom: '2000-01-01',
      targetKcal: metrics?.targetCalories ?? 2000,
      proteinG: metrics?.targetProteinGrams ?? 125,
      carbsG: metrics?.targetCarbsGrams ?? 250,
      fatG: metrics?.targetFatGrams ?? 55,
      waterMl: 2500,
    };
  }
}
