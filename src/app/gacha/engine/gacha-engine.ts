import { CATALOG } from '../data/catalog';
import { RARITY_CONFIG } from '../data/rarity-config';
import { CollectionItemDef, Rarity } from '../models/gacha.types';

/**
 * Decide el resultado de UNA tirada. Corre en el cliente (para este MVP).
 * Si más adelante el sorteo se mueve al servidor, esta es la única
 * función que habría que reemplazar.
 */
export function rollPull(): CollectionItemDef {
  const roll = Math.random() * 100;
  let acc = 0;
  let chosenRarity: Rarity = 'common';
  for (const rarity of Object.keys(RARITY_CONFIG) as Rarity[]) {
    acc += RARITY_CONFIG[rarity].pullWeight;
    if (roll <= acc) {
      chosenRarity = rarity;
      break;
    }
  }
  const pool = CATALOG.filter((item) => item.rarity === chosenRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
