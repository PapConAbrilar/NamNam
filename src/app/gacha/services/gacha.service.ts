import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getItemDef } from '../data/catalog';
import { rollPull } from '../engine/gacha-engine';
import { costFor, MERGE_COST, pullCountFor } from '../data/rarity-config';
import { CollectionItemDef, Inventory, PullType } from '../models/gacha.types';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, isSupabaseConfigured } from '../../services/supabase.service';

export interface GachaState {
  currency: number;
  inventory: Inventory;
  petItemId: string | null;
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

export interface CraftOutcome {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GachaService {
  private readonly CURRENCY_STORAGE_KEY = 'namnam_gacha_currency';
  private readonly INVENTORY_STORAGE_KEY = 'namnam_gacha_inventory';
  private readonly PET_STORAGE_KEY = 'namnam_gacha_pet';
  private readonly DEFAULT_STARTING_CURRENCY = 1000;

  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  private stateSubject = new BehaviorSubject<GachaState>(this.loadInitialState());
  public state$: Observable<GachaState> = this.stateSubject.asObservable();

  constructor() {
    // Sincronizar desde Supabase al autenticarse o cambiar de usuario
    this.authService.currentUser$.subscribe((user) => {
      if (user && isSupabaseConfigured()) {
        this.syncFromSupabase(user.id).catch((err) => {
          console.warn('Error sincronizando Gacha desde Supabase:', err);
        });
      }
    });
  }

  get state(): GachaState {
    return this.stateSubject.value;
  }

  get currency(): number {
    return this.stateSubject.value.currency;
  }

  get inventory(): Inventory {
    return this.stateSubject.value.inventory;
  }

  get petItemId(): string | null {
    return this.stateSubject.value.petItemId;
  }

  /**
   * Otorga moneda al usuario (ej. al registrar una comida, por racha,
   * etc.).
   */
  addCurrency(amount: number): void {
    this.persist({ ...this.state, currency: this.state.currency + amount });
  }

  /**
   * Ejecuta una tirada de forma instantánea.
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

    this.persist({ ...this.state, currency: this.currency - cost, inventory });
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

  /** Ingredientes que faltan para craftear este ítem ahora mismo (vacío si ya se puede craftear). */
  missingIngredientsFor(itemId: string): { itemId: string; name: string; missing: number }[] {
    const def = getItemDef(itemId);
    if (!def?.recipe) return [];
    return def.recipe
      .map((ing) => {
        const held = this.inventory[ing.itemId]?.baseCopiesHeld ?? 0;
        const missing = Math.max(0, ing.quantity - held);
        return { itemId: ing.itemId, name: getItemDef(ing.itemId)?.name ?? ing.itemId, missing };
      })
      .filter((ing) => ing.missing > 0);
  }

  /**
   * Craftea un ítem a partir de su receta (consume copias base de cada
   * ingrediente).
   */
  craft(itemId: string): CraftOutcome {
    const def = getItemDef(itemId);
    if (!def?.recipe) {
      return { success: false, message: 'Este ítem no tiene receta de crafteo.' };
    }

    const missing = this.missingIngredientsFor(itemId);
    if (missing.length > 0) {
      const detail = missing.map((m) => `${m.missing}x ${m.name}`).join(', ');
      return { success: false, message: `Te falta: ${detail}` };
    }

    const inventory: Inventory = { ...this.inventory };
    def.recipe.forEach((ing) => {
      const owned = inventory[ing.itemId];
      if (!owned) return;
      inventory[ing.itemId] = { ...owned, baseCopiesHeld: owned.baseCopiesHeld - ing.quantity };
    });

    const existingResult = inventory[itemId];
    inventory[itemId] = existingResult
      ? { ...existingResult, baseCopiesHeld: existingResult.baseCopiesHeld + 1 }
      : { itemId, rank: 0, baseCopiesHeld: 1, firstObtainedAt: Date.now() };

    this.persist({ ...this.state, inventory });
    return { success: true };
  }

  /** Selecciona qué ítem de la colección se muestra como mascota (overlay). */
  selectPet(itemId: string): void {
    if (!this.inventory[itemId]) return;
    this.persist({ ...this.state, petItemId: itemId });
  }

  /**
   * Botón de "refresh" del MVP: agrega moneda de prueba sin tocar
   * inventario ni mascota.
   */
  addTestCurrency(amount = 1000): void {
    this.persist({ ...this.state, currency: this.state.currency + amount });
  }

  private loadInitialState(): GachaState {
    return {
      currency: this.loadCurrency(),
      inventory: this.loadInventory(),
      petItemId: localStorage.getItem(this.PET_STORAGE_KEY),
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
    if (next.petItemId) {
      localStorage.setItem(this.PET_STORAGE_KEY, next.petItemId);
    } else {
      localStorage.removeItem(this.PET_STORAGE_KEY);
    }
    this.stateSubject.next(next);

    // Si Supabase está conectado y hay usuario autenticado, sincronizar en la nube
    const user = this.authService.currentUser;
    if (isSupabaseConfigured() && user) {
      this.syncToSupabase(user.id, next).catch((err) => {
        console.warn('Error sincronizando Gacha con Supabase:', err);
      });
    }
  }

  /** Sincroniza el inventario y las monedas hacia Supabase */
  private async syncToSupabase(userId: string, state: GachaState): Promise<void> {
    try {
      const client = this.supabaseService.client;

      // 1. Guardar moneda y mascota en el perfil
      await client
        .from('profiles')
        .update({
          gacha_currency: state.currency,
          pet_item_id: state.petItemId,
        })
        .eq('id', userId);

      // 2. Guardar inventario
      const items = Object.values(state.inventory);
      if (items.length > 0) {
        const rows = items.map((item) => ({
          user_id: userId,
          item_id: item.itemId,
          rank: item.rank,
          base_copies_held: item.baseCopiesHeld,
          first_obtained_at: new Date(item.firstObtainedAt).toISOString(),
        }));

        await client
          .from('user_gacha_inventory')
          .upsert(rows, { onConflict: 'user_id,item_id' });
      }
    } catch (err) {
      console.warn('Fallo al persistir estado del Gacha en Supabase:', err);
    }
  }

  /** Descarga el inventario y las monedas desde Supabase */
  private async syncFromSupabase(userId: string): Promise<void> {
    try {
      const client = this.supabaseService.client;

      // 1. Obtener moneda y mascota del perfil
      const { data: profile } = await client
        .from('profiles')
        .select('gacha_currency, pet_item_id')
        .eq('id', userId)
        .maybeSingle();

      // 2. Obtener inventario del usuario
      const { data: rows } = await client
        .from('user_gacha_inventory')
        .select('item_id, rank, base_copies_held, first_obtained_at')
        .eq('user_id', userId);

      let currency = this.state.currency;
      let petItemId = this.state.petItemId;
      const inventory: Inventory = {};

      if (profile) {
        if (typeof profile.gacha_currency === 'number') {
          currency = profile.gacha_currency;
        }
        if (profile.pet_item_id !== undefined) {
          petItemId = profile.pet_item_id;
        }
      }

      if (rows && rows.length > 0) {
        for (const row of rows) {
          inventory[row.item_id] = {
            itemId: row.item_id,
            rank: row.rank,
            baseCopiesHeld: row.base_copies_held,
            firstObtainedAt: new Date(row.first_obtained_at).getTime(),
          };
        }
      } else if (Object.keys(this.state.inventory).length > 0) {
        // Si el usuario tenía inventario local pero nada en Supabase, subimos el inventario local
        Object.assign(inventory, this.state.inventory);
        this.syncToSupabase(userId, { currency, inventory, petItemId }).catch(() => {});
      }

      const nextState: GachaState = {
        currency,
        inventory,
        petItemId,
      };

      localStorage.setItem(this.CURRENCY_STORAGE_KEY, String(nextState.currency));
      localStorage.setItem(this.INVENTORY_STORAGE_KEY, JSON.stringify(nextState.inventory));
      if (nextState.petItemId) {
        localStorage.setItem(this.PET_STORAGE_KEY, nextState.petItemId);
      } else {
        localStorage.removeItem(this.PET_STORAGE_KEY);
      }

      this.stateSubject.next(nextState);
    } catch (err) {
      console.warn('Fallo al obtener estado del Gacha desde Supabase:', err);
    }
  }
}
