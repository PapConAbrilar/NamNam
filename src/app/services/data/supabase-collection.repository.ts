import { Injectable, inject } from '@angular/core';
import { Collectible, Rarity, UserCollectible } from '../../models/collection.model';
import { SupabaseService } from '../supabase.service';
import { CollectionRepository } from './collection.repository';

interface CollectibleRow {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  sort_order: number;
}

function mapCollectible(r: CollectibleRow): Collectible {
  return { id: r.id, name: r.name, emoji: r.emoji, rarity: r.rarity, sortOrder: r.sort_order };
}

@Injectable()
export class SupabaseCollectionRepository extends CollectionRepository {
  private supabase = inject(SupabaseService);

  async getCatalog(): Promise<Collectible[]> {
    const { data, error } = await this.supabase.client
      .from('collectibles')
      .select('id, name, emoji, rarity, sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as CollectibleRow[]).map(mapCollectible);
  }

  async getUserCollectibles(): Promise<UserCollectible[]> {
    const { data, error } = await this.supabase.client
      .from('user_collectibles')
      .select('collectible_id, unlocked_at');
    if (error) throw error;
    return (data as { collectible_id: string; unlocked_at: string }[]).map((r) => ({
      collectibleId: r.collectible_id,
      unlockedAt: r.unlocked_at,
    }));
  }

  async getClaimedWeeks(): Promise<string[]> {
    const { data, error } = await this.supabase.client.from('reward_claims').select('week_start');
    if (error) throw error;
    return (data as { week_start: string }[]).map((r) => r.week_start);
  }

  async openWeeklyReward(weekStart: string): Promise<Collectible> {
    const { data, error } = await this.supabase.client
      .rpc('open_weekly_reward', { p_week_start: weekStart })
      .single();
    if (error) throw error;
    return mapCollectible(data as CollectibleRow);
  }
}
