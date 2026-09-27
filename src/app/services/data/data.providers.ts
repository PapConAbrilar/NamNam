import { Provider } from '@angular/core';
import { isSupabaseConfigured } from '../supabase.service';
import { CollectionRepository } from './collection.repository';
import { MockCollectionRepository } from './mock-collection.repository';
import { MockNutritionRepository } from './mock-nutrition.repository';
import { NutritionRepository } from './nutrition.repository';
import { SupabaseCollectionRepository } from './supabase-collection.repository';
import { SupabaseNutritionRepository } from './supabase-nutrition.repository';

/**
 * Registra los repositorios de datos. Con credenciales en `environment.supabase` usa Supabase;
 * sin ellas usa los repositorios mock locales.
 */
export function provideDataLayer(): Provider[] {
  const useSupabase = isSupabaseConfigured();
  return [
    { provide: NutritionRepository, useClass: useSupabase ? SupabaseNutritionRepository : MockNutritionRepository },
    { provide: CollectionRepository, useClass: useSupabase ? SupabaseCollectionRepository : MockCollectionRepository },
  ];
}
