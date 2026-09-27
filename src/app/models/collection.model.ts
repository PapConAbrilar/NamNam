export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Coleccionable del catálogo global (tabla `collectibles`). */
export interface Collectible {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  sortOrder: number;
}

/** Coleccionable desbloqueado por el usuario (tabla `user_collectibles`). */
export interface UserCollectible {
  collectibleId: string;
  unlockedAt: string;
}

export interface CollectionItem extends Collectible {
  unlocked: boolean;
}

export interface RewardStatus {
  /** Lunes (YYYY-MM-DD) de la semana evaluada. */
  weekStart: string;
  daysLogged: number;
  daysRequired: number;
  progressPct: number;
  alreadyClaimed: boolean;
  canClaim: boolean;
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};
