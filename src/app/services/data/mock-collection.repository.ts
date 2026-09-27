import { Injectable } from '@angular/core';
import { Collectible, UserCollectible } from '../../models/collection.model';
import { CollectionRepository } from './collection.repository';
import { pickWeightedCollectible } from './reward-draw';

const CATALOG: Collectible[] = [
  { id: 'pizza-clasica', name: 'Pizza Clásica', emoji: '🍕', rarity: 'common', sortOrder: 1 },
  { id: 'manzana-roja', name: 'Manzana Roja', emoji: '🍎', rarity: 'common', sortOrder: 2 },
  { id: 'aguacate-mistico', name: 'Aguacate Místico', emoji: '🥑', rarity: 'rare', sortOrder: 3 },
  { id: 'sushi-epico', name: 'Sushi Épico', emoji: '🍣', rarity: 'epic', sortOrder: 4 },
  { id: 'taco-galactico', name: 'Taco Galáctico', emoji: '🌮', rarity: 'rare', sortOrder: 5 },
  { id: 'pastel-dorado', name: 'Pastel Dorado', emoji: '🍰', rarity: 'legendary', sortOrder: 6 },
  { id: 'langosta-real', name: 'Langosta Real', emoji: '🦞', rarity: 'epic', sortOrder: 7 },
  { id: 'uvas-arcanas', name: 'Uvas Arcanas', emoji: '🍇', rarity: 'rare', sortOrder: 8 },
  { id: 'croissant-magico', name: 'Croissant Mágico', emoji: '🥐', rarity: 'common', sortOrder: 9 },
];

const STORAGE_KEY = 'namnam_mock_collection';

interface MockCollectionState {
  unlocked: UserCollectible[];
  claimedWeeks: string[];
}

/** Repositorio local de la colección. Persiste los desbloqueos en `localStorage` para la demo. */
@Injectable()
export class MockCollectionRepository extends CollectionRepository {
  async getCatalog(): Promise<Collectible[]> {
    return CATALOG;
  }

  async getUserCollectibles(): Promise<UserCollectible[]> {
    return this.load().unlocked;
  }

  async getClaimedWeeks(): Promise<string[]> {
    return this.load().claimedWeeks;
  }

  async openWeeklyReward(weekStart: string): Promise<Collectible> {
    const state = this.load();
    if (state.claimedWeeks.includes(weekStart)) {
      throw new Error('La recompensa de esta semana ya fue reclamada.');
    }
    const owned = new Set(state.unlocked.map((u) => u.collectibleId));
    const locked = CATALOG.filter((c) => !owned.has(c.id));
    const prize = pickWeightedCollectible(locked.length ? locked : CATALOG);

    if (!owned.has(prize.id)) {
      state.unlocked.push({ collectibleId: prize.id, unlockedAt: new Date().toISOString() });
    }
    state.claimedWeeks.push(weekStart);
    this.save(state);
    return prize;
  }

  private load(): MockCollectionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as MockCollectionState;
    } catch {
      // Estado corrupto: se regenera con los valores iniciales.
    }
    const initial: MockCollectionState = {
      unlocked: ['pizza-clasica', 'manzana-roja', 'aguacate-mistico', 'sushi-epico'].map((id) => ({
        collectibleId: id,
        unlockedAt: new Date().toISOString(),
      })),
      claimedWeeks: [],
    };
    this.save(initial);
    return initial;
  }

  private save(state: MockCollectionState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
