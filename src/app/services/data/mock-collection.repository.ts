import { Injectable } from '@angular/core';
import { Collectible, UserCollectible } from '../../models/collection.model';
import { CollectionRepository } from './collection.repository';
import { pickWeightedCollectible } from './reward-draw';

const CATALOG: Collectible[] = [
  // Gacha catálogo (19 alimentos)
  { id: 'tomato', name: 'Tomate', emoji: '🍅', rarity: 'common', sortOrder: 1 },
  { id: 'apple', name: 'Manzana', emoji: '🍎', rarity: 'common', sortOrder: 2 },
  { id: 'egg', name: 'Huevo', emoji: '🥚', rarity: 'common', sortOrder: 3 },
  { id: 'lettuce', name: 'Lechuga', emoji: '🥬', rarity: 'common', sortOrder: 4 },
  { id: 'rice', name: 'Arroz', emoji: '🍚', rarity: 'common', sortOrder: 5 },
  { id: 'carrot', name: 'Zanahoria', emoji: '🥕', rarity: 'common', sortOrder: 6 },
  { id: 'fish', name: 'Pescado', emoji: '🐟', rarity: 'common', sortOrder: 7 },
  { id: 'grape', name: 'Uva', emoji: '🍇', rarity: 'common', sortOrder: 8 },
  { id: 'cheese', name: 'Queso', emoji: '🧀', rarity: 'rare', sortOrder: 9 },
  { id: 'salt', name: 'Sal', emoji: '🧂', rarity: 'rare', sortOrder: 10 },
  { id: 'honey', name: 'Miel', emoji: '🍯', rarity: 'rare', sortOrder: 11 },
  { id: 'bread', name: 'Pan', emoji: '🍞', rarity: 'rare', sortOrder: 12 },
  { id: 'butter', name: 'Mantequilla', emoji: '🧈', rarity: 'rare', sortOrder: 13 },
  { id: 'olive', name: 'Aceituna', emoji: '🫒', rarity: 'rare', sortOrder: 14 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', rarity: 'epic', sortOrder: 15 },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', rarity: 'epic', sortOrder: 16 },
  { id: 'taco', name: 'Taco', emoji: '🌮', rarity: 'epic', sortOrder: 17 },
  { id: 'golden_cake', name: 'Pastel Dorado', emoji: '🎂', rarity: 'legendary', sortOrder: 18 },
  { id: 'ramen', name: 'Ramen Supremo', emoji: '🍜', rarity: 'legendary', sortOrder: 19 },
  // Coleccionables clásicos
  { id: 'pizza-clasica', name: 'Pizza Clásica', emoji: '🍕', rarity: 'common', sortOrder: 20 },
  { id: 'manzana-roja', name: 'Manzana Roja', emoji: '🍎', rarity: 'common', sortOrder: 21 },
  { id: 'aguacate-mistico', name: 'Aguacate Místico', emoji: '🥑', rarity: 'rare', sortOrder: 22 },
  { id: 'sushi-epico', name: 'Sushi Épico', emoji: '🍣', rarity: 'epic', sortOrder: 23 },
  { id: 'taco-galactico', name: 'Taco Galáctico', emoji: '🌮', rarity: 'rare', sortOrder: 24 },
  { id: 'pastel-dorado', name: 'Pastel Dorado', emoji: '🍰', rarity: 'legendary', sortOrder: 25 },
  { id: 'langosta-real', name: 'Langosta Real', emoji: '🦞', rarity: 'epic', sortOrder: 26 },
  { id: 'uvas-arcanas', name: 'Uvas Arcanas', emoji: '🍇', rarity: 'rare', sortOrder: 27 },
  { id: 'croissant-magico', name: 'Croissant Mágico', emoji: '🥐', rarity: 'common', sortOrder: 28 },
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
