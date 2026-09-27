import { Injectable, inject } from '@angular/core';
import { Collectible, CollectionItem, RewardStatus } from '../models/collection.model';
import { addDays, startOfWeek, toISODate } from '../utils/date.utils';
import { CollectionRepository } from './data/collection.repository';
import { NutritionRepository } from './data/nutrition.repository';

/** Días con registros necesarios en la semana para abrir la recompensa. Debe coincidir con `open_weekly_reward`. */
export const REWARD_DAYS_REQUIRED = 7;

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private collectionRepo = inject(CollectionRepository);
  private nutritionRepo = inject(NutritionRepository);

  async getCollection(): Promise<CollectionItem[]> {
    const [catalog, owned] = await Promise.all([
      this.collectionRepo.getCatalog(),
      this.collectionRepo.getUserCollectibles(),
    ]);
    const ownedIds = new Set(owned.map((o) => o.collectibleId));
    return [...catalog]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, unlocked: ownedIds.has(c.id) }));
  }

  /** Progreso hacia la recompensa semanal: días de la semana actual con al menos una comida registrada. */
  async getRewardStatus(): Promise<RewardStatus> {
    const weekStart = startOfWeek(new Date());
    const weekStartIso = toISODate(weekStart);
    const [summaries, claimedWeeks] = await Promise.all([
      this.nutritionRepo.getDailySummaries(weekStartIso, toISODate(addDays(weekStart, 6))),
      this.collectionRepo.getClaimedWeeks(),
    ]);
    const daysLogged = summaries.filter((s) => s.mealCount > 0).length;
    const alreadyClaimed = claimedWeeks.includes(weekStartIso);
    return {
      weekStart: weekStartIso,
      daysLogged,
      daysRequired: REWARD_DAYS_REQUIRED,
      progressPct: Math.min(100, Math.round((daysLogged / REWARD_DAYS_REQUIRED) * 100)),
      alreadyClaimed,
      canClaim: daysLogged >= REWARD_DAYS_REQUIRED && !alreadyClaimed,
    };
  }

  openWeeklyReward(weekStart: string): Promise<Collectible> {
    return this.collectionRepo.openWeeklyReward(weekStart);
  }
}
