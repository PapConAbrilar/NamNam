import { Collectible, UserCollectible } from '../../models/collection.model';

/**
 * Contrato de acceso a la colección y recompensas semanales.
 * Implementaciones: `SupabaseCollectionRepository` (producción) y `MockCollectionRepository` (sin backend).
 */
export abstract class CollectionRepository {
  abstract getCatalog(): Promise<Collectible[]>;
  abstract getUserCollectibles(): Promise<UserCollectible[]>;
  /** Semanas (lunes 'YYYY-MM-DD') cuya recompensa ya fue reclamada. */
  abstract getClaimedWeeks(): Promise<string[]>;
  /**
   * Abre la recompensa de la semana indicada y devuelve el coleccionable obtenido.
   * En Supabase lo resuelve la función `open_weekly_reward` para que el sorteo no dependa del cliente.
   */
  abstract openWeeklyReward(weekStart: string): Promise<Collectible>;
}
