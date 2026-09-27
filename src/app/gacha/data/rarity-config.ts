import { Rarity } from '../models/gacha.types';

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; pullWeight: number; mergeFactor: number; maxMergeRank: number }> = {
  common: { label: 'Común', color: '#6b7280', pullWeight: 60, mergeFactor: 2.0, maxMergeRank: 5 },
  rare: { label: 'Raro', color: '#60a5fa', pullWeight: 30, mergeFactor: 1.7, maxMergeRank: 5 },
  epic: { label: 'Épico', color: '#a78bfa', pullWeight: 8, mergeFactor: 1.4, maxMergeRank: 5 },
  legendary: { label: 'Legendario', color: '#fbbf24', pullWeight: 2, mergeFactor: 1.15, maxMergeRank: 5 },
};

/**
 * MERGE_COST[rarity][rank] = copias base adicionales necesarias para
 * alcanzar ese rango. costo(1) = 1, costo(n) = techo(costo(n-1) * factor).
 */
export const MERGE_COST: Record<Rarity, number[]> = (() => {
  const table = {} as Record<Rarity, number[]>;
  (Object.keys(RARITY_CONFIG) as Rarity[]).forEach((rarity) => {
    const costs = [0];
    let prev = 1;
    for (let rank = 1; rank <= RARITY_CONFIG[rarity].maxMergeRank; rank++) {
      const cost = rank === 1 ? 1 : Math.ceil(prev * RARITY_CONFIG[rarity].mergeFactor);
      costs.push(cost);
      prev = cost;
    }
    table[rarity] = costs;
  });
  return table;
})();

export function costFor(type: 'single' | 'bulk5'): number {
  return type === 'single' ? 100 : 500;
}

export function pullCountFor(type: 'single' | 'bulk5'): number {
  return type === 'single' ? 1 : 6; // bulk5 da 6 tiradas (bonus de +1)
}
