import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getItemDef } from '../data/catalog';
import { rollPull } from '../engine/gacha-engine';
import { costFor, MERGE_COST, pullCountFor } from '../data/rarity-config';
import { CollectionItemDef, Inventory, PullType } from '../models/gacha.types';

export interface GachaState {
  currency: number;
  inventory: Inventory;
}

export interface PullOutcome {
  success: boolean;
  message?: string;
  results?: CollectionItemDef[];
}

export interface MergeOutcome {
  success: boolean;
  message?: string;
  newRank?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GachaService {
  private readonly CURRENCY_STORAGE_KEY = 'namnam_gacha_currency';
  private readonly INVENTORY_STORAGE_KEY = 'namnam_gacha_inventory';
  private readonly DEFAULT_STARTING_CURRENCY = 1000;

  private stateSubject = new BehaviorSubject<GachaState>(this.loadInitialState());
  public state$: Observable<GachaState> = this.stateSubject.asObservable();

  get state(): GachaState {
    return this.stateSubject.value;
  }

  get currency(): number {
    return this.stateSubject.value.currency;
  }

  get inventory(): Inventory {
    return this.stateSubject.value.inventory;
  }

  /**
   * Otorga moneda al usuario (ej. al registrar una comida, por racha,
   * etc.). Punto de integración futuro: cuando exista esa lógica en el
   * resto de la app, debería llamar a este método en vez de manipular el
   * balance directamente.
   */
  addCurrency(amount: number): void {
    this.persist({ ...this.state, currency: this.state.currency + amount });
  }

  /**
   * Ejecuta una tirada de forma instantánea. Sin llamada a backend por
   * ahora — el resultado se decide y se aplica en el mismo tick. Ver
   * MANUAL.md para cómo migrar esto a una API real más adelante.
   */
  pull(type: PullType): PullOutcome {
    const cost = costFor(type);
    if (this.currency < cost) {
      return { success: false, message: 'No tienes suficiente moneda para esta tirada.' };
    }

    const count = pullCountFor(type);
    const wonItems = Array.from({ length: count }, () => rollPull());

    const inventory: Inventory = { ...this.inventory };
    wonItems.forEach((item) => {
      const existing = inventory[item.id];
      inventory[item.id] = existing
        ? { ...existing, baseCopiesHeld: existing.baseCopiesHeld + 1 }
        : { itemId: item.id, rank: 0, baseCopiesHeld: 1, firstObtainedAt: Date.now() };
    });

    this.persist({ currency: this.currency - cost, inventory });
    return { success: true, results: wonItems };
  }

  /** Cuántas copias base hacen falta para subir de rango este ítem ahora mismo (null si no aplica). */
  mergeCostFor(itemId: string): number | null {
    const owned = this.inventory[itemId];
    const def = getItemDef(itemId);
    if (!owned || !def) return null;
    const nextRank = owned.rank + 1;
    if (nextRank > 5) return null;
    return MERGE_COST[def.rarity][nextRank];
  }

  /** Fusiona copias base para subir de rango. Aplica el cambio directo, sin animación. */
  mergeItem(itemId: string): MergeOutcome {
    const owned = this.inventory[itemId];
    const def = getItemDef(itemId);
    if (!owned || !def) {
      return { success: false, message: 'No posees este ítem.' };
    }

    const nextRank = owned.rank + 1;
    if (nextRank > 5) {
      return { success: false, message: 'Este ítem ya alcanzó el rango máximo (+5).' };
    }

    const cost = MERGE_COST[def.rarity][nextRank];
    if (owned.baseCopiesHeld < cost) {
      return { success: false, message: `Necesitas ${cost} copias base para subir a +${nextRank}.` };
    }

    const inventory: Inventory = {
      ...this.inventory,
      [itemId]: { ...owned, rank: nextRank, baseCopiesHeld: owned.baseCopiesHeld - cost },
    };
    this.persist({ ...this.state, inventory });
    return { success: true, newRank: nextRank };
  }

  private loadInitialState(): GachaState {
    return {
      currency: this.loadCurrency(),
      inventory: this.loadInventory(),
    };
  }

  private loadCurrency(): number {
    const saved = localStorage.getItem(this.CURRENCY_STORAGE_KEY);
    if (saved === null) return this.DEFAULT_STARTING_CURRENCY;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? parsed : this.DEFAULT_STARTING_CURRENCY;
  }

  private loadInventory(): Inventory {
    try {
      const saved = localStorage.getItem(this.INVENTORY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Inventory) : {};
    } catch {
      return {};
    }
  }

  private persist(next: GachaState): void {
    localStorage.setItem(this.CURRENCY_STORAGE_KEY, String(next.currency));
    localStorage.setItem(this.INVENTORY_STORAGE_KEY, JSON.stringify(next.inventory));
    this.stateSubject.next(next);
  }
}
