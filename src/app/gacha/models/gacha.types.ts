// ─── Tipos del módulo de Gacha (versión MVP) ───────────────────────────────

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CollectionItemDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  /** Solo presente en ítems compuestos (Épico/Legendario) crafteables. */
  recipe?: { itemId: string; quantity: number }[];
}

export interface OwnedItem {
  itemId: string;
  rank: number; // 0-5
  baseCopiesHeld: number;
  firstObtainedAt: number;
}

export type Inventory = Record<string, OwnedItem>;

export type PullType = 'single' | 'bulk5';
