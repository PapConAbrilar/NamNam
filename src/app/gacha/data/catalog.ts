import { CollectionItemDef } from '../models/gacha.types';

// Común = crudo/ingrediente base. Raro = procesado de un paso.
// Épico/Legendario = plato compuesto — se puede craftear con la receta,
// o conseguir directo por pull (ambas vías activas).
export const CATALOG: CollectionItemDef[] = [
  // Común
  { id: 'tomato', name: 'Tomate', emoji: '🍅', rarity: 'common' },
  { id: 'apple', name: 'Manzana', emoji: '🍎', rarity: 'common' },
  { id: 'egg', name: 'Huevo', emoji: '🥚', rarity: 'common' },
  { id: 'lettuce', name: 'Lechuga', emoji: '🥬', rarity: 'common' },
  { id: 'rice', name: 'Arroz', emoji: '🍚', rarity: 'common' },
  { id: 'carrot', name: 'Zanahoria', emoji: '🥕', rarity: 'common' },
  { id: 'fish', name: 'Pescado', emoji: '🐟', rarity: 'common' },
  { id: 'grape', name: 'Uva', emoji: '🍇', rarity: 'common' },
  // Raro
  { id: 'cheese', name: 'Queso', emoji: '🧀', rarity: 'rare' },
  { id: 'salt', name: 'Sal', emoji: '🧂', rarity: 'rare' },
  { id: 'honey', name: 'Miel', emoji: '🍯', rarity: 'rare' },
  { id: 'bread', name: 'Pan', emoji: '🍞', rarity: 'rare' },
  { id: 'butter', name: 'Mantequilla', emoji: '🧈', rarity: 'rare' },
  { id: 'olive', name: 'Aceituna', emoji: '🫒', rarity: 'rare' },
  // Épico
  {
    id: 'pizza', name: 'Pizza', emoji: '🍕', rarity: 'epic',
    recipe: [{ itemId: 'tomato', quantity: 2 }, { itemId: 'cheese', quantity: 2 }, { itemId: 'bread', quantity: 1 }],
  },
  {
    id: 'sushi', name: 'Sushi', emoji: '🍣', rarity: 'epic',
    recipe: [{ itemId: 'rice', quantity: 2 }, { itemId: 'fish', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
  },
  {
    id: 'taco', name: 'Taco', emoji: '🌮', rarity: 'epic',
    recipe: [{ itemId: 'tomato', quantity: 1 }, { itemId: 'lettuce', quantity: 1 }, { itemId: 'cheese', quantity: 1 }],
  },
  // Legendario
  {
    id: 'golden_cake', name: 'Pastel Dorado', emoji: '🎂', rarity: 'legendary',
    recipe: [{ itemId: 'egg', quantity: 1 }, { itemId: 'honey', quantity: 2 }, { itemId: 'butter', quantity: 1 }],
  },
  {
    id: 'ramen', name: 'Ramen Supremo', emoji: '🍜', rarity: 'legendary',
    recipe: [{ itemId: 'sushi', quantity: 1 }, { itemId: 'fish', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
  },
];

export function getItemDef(itemId: string): CollectionItemDef | undefined {
  return CATALOG.find((c) => c.id === itemId);
}
