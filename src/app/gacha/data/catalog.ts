import { CollectionItemDef } from '../models/gacha.types';

// Común = crudo/ingrediente base. Raro = procesado de un paso.
// Épico/Legendario = plato compuesto (el crafting vía receta queda fuera
// de este MVP — por ahora también se consiguen por pull, igual que el resto).
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
  { id: 'pizza', name: 'Pizza', emoji: '🍕', rarity: 'epic' },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', rarity: 'epic' },
  { id: 'taco', name: 'Taco', emoji: '🌮', rarity: 'epic' },
  // Legendario
  { id: 'golden_cake', name: 'Pastel Dorado', emoji: '🎂', rarity: 'legendary' },
  { id: 'ramen', name: 'Ramen Supremo', emoji: '🍜', rarity: 'legendary' },
];

export function getItemDef(itemId: string): CollectionItemDef | undefined {
  return CATALOG.find((c) => c.id === itemId);
}
