import { Collectible, Rarity } from '../../models/collection.model';

/** Peso relativo de cada rareza en el sorteo. Debe coincidir con la función SQL `open_weekly_reward`. */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

export function pickWeightedCollectible(pool: Collectible[]): Collectible {
  const total = pool.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= RARITY_WEIGHTS[item.rarity];
    if (roll < 0) return item;
  }
  return pool[pool.length - 1];
}
