-- =====================================================================
-- ÑamÑam — Esquema de base de datos para Supabase
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → New query
-- Ver supabase/README.md para la descripción de cada tabla.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Perfil del usuario (datos del onboarding)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  name                     text not null default '',
  avatar_url               text,
  weight_kg                numeric(5,1),
  height_cm                numeric(5,1),
  age                      smallint,
  gender                   text check (gender in ('male', 'female')),
  activity_level           text check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  goal                     text check (goal in ('lose', 'maintain', 'gain')),
  has_completed_onboarding boolean not null default false,
  gacha_currency           integer not null default 1000 check (gacha_currency >= 0),
  pet_item_id              text,
  created_at               timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Metas nutricionales (historial: cada fila rige desde valid_from)
-- ---------------------------------------------------------------------
create table public.nutrition_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valid_from  date not null default current_date,
  target_kcal integer not null check (target_kcal > 0),
  protein_g   integer not null default 0 check (protein_g >= 0),
  carbs_g     integer not null default 0 check (carbs_g >= 0),
  fat_g       integer not null default 0 check (fat_g >= 0),
  water_ml    integer not null default 2500 check (water_ml >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, valid_from)
);

-- ---------------------------------------------------------------------
-- 3. Comidas registradas (calorías consumidas)
-- ---------------------------------------------------------------------
create table public.meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  meal_type   text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  consumed_at timestamptz not null default now(),
  log_date    date not null,               -- día LOCAL del usuario, lo envía la app
  kcal        integer not null check (kcal >= 0),
  protein_g   numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g     numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g       numeric(6,1) not null default 0 check (fat_g >= 0),
  photo_path  text,                        -- ruta en el bucket de Storage `meal-photos`
  source      text not null default 'manual' check (source in ('ai', 'manual')),
  created_at  timestamptz not null default now()
);

create index meals_user_date_idx on public.meals (user_id, log_date);

-- ---------------------------------------------------------------------
-- 4. Actividad física (calorías quemadas, para el dashboard de Inicio)
-- ---------------------------------------------------------------------
create table public.activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date      date not null,
  activity_type text not null,
  duration_min  integer check (duration_min >= 0),
  kcal_burned   integer not null check (kcal_burned >= 0),
  source        text not null default 'manual' check (source in ('manual', 'health_connect', 'healthkit')),
  created_at    timestamptz not null default now()
);

create index activities_user_date_idx on public.activities (user_id, log_date);

-- ---------------------------------------------------------------------
-- 5. Peso corporal e hidratación
-- ---------------------------------------------------------------------
create table public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_on  date not null default current_date,
  weight_kg  numeric(5,1) not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create table public.water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date   date not null,
  ml         integer not null check (ml > 0),
  created_at timestamptz not null default now()
);

create index water_logs_user_date_idx on public.water_logs (user_id, log_date);

-- ---------------------------------------------------------------------
-- 6. Vista: totales nutricionales por día
--    security_invoker = true → respeta las políticas RLS de `meals`.
-- ---------------------------------------------------------------------
create view public.daily_nutrition_summary
with (security_invoker = true) as
select
  user_id,
  log_date,
  sum(kcal)::integer      as kcal,
  sum(protein_g)          as protein_g,
  sum(carbs_g)            as carbs_g,
  sum(fat_g)              as fat_g,
  count(*)::integer       as meal_count
from public.meals
group by user_id, log_date;

-- ---------------------------------------------------------------------
-- 7. Colección y recompensas semanales
-- ---------------------------------------------------------------------
create table public.collectibles (
  id         text primary key,
  name       text not null,
  emoji      text not null,
  rarity     text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  sort_order integer not null default 0
);

create table public.user_collectibles (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collectible_id text not null references public.collectibles (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, collectible_id)
);

create table public.reward_claims (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start     date not null,             -- lunes de la semana reclamada
  collectible_id text not null references public.collectibles (id),
  claimed_at     timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Abre la recompensa semanal: valida los días registrados, sortea por rareza
-- (common 60 / rare 25 / epic 12 / legendary 3) entre lo no desbloqueado y la guarda.
-- Los pesos y los 7 días requeridos deben coincidir con reward-draw.ts y collection.service.ts.
create or replace function public.open_weekly_reward(p_week_start date)
returns public.collectibles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_days  integer;
  v_prize public.collectibles;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if extract(isodow from p_week_start) <> 1 then
    raise exception 'week_start debe ser un lunes.';
  end if;

  -- Margen de un día por diferencias de zona horaria entre el cliente y el servidor (UTC).
  if p_week_start > current_date + 1 or p_week_start + 7 < current_date then
    raise exception 'Solo puedes reclamar la recompensa de la semana actual.';
  end if;

  if exists (select 1 from reward_claims where user_id = v_user and week_start = p_week_start) then
    raise exception 'La recompensa de esta semana ya fue reclamada.';
  end if;

  select count(distinct log_date) into v_days
  from meals
  where user_id = v_user and log_date between p_week_start and p_week_start + 6;

  if v_days < 7 then
    raise exception 'Aún no completas los días requeridos (%/7).', v_days;
  end if;

  -- Sorteo ponderado: el menor -ln(U)/peso gana con probabilidad proporcional al peso.
  select c.* into v_prize
  from collectibles c
  where not exists (
    select 1 from user_collectibles uc where uc.user_id = v_user and uc.collectible_id = c.id
  )
  order by -ln(1 - random()) / case c.rarity
    when 'common' then 60 when 'rare' then 25 when 'epic' then 12 else 3 end
  limit 1;

  -- Si ya desbloqueó todo, sortea entre el catálogo completo (repetido).
  if v_prize.id is null then
    select c.* into v_prize
    from collectibles c
    order by -ln(1 - random()) / case c.rarity
      when 'common' then 60 when 'rare' then 25 when 'epic' then 12 else 3 end
    limit 1;
  end if;

  if v_prize.id is null then
    raise exception 'El catálogo de coleccionables está vacío.';
  end if;

  insert into user_collectibles (user_id, collectible_id)
  values (v_user, v_prize.id)
  on conflict do nothing;

  insert into reward_claims (user_id, week_start, collectible_id)
  values (v_user, p_week_start, v_prize.id);

  return v_prize;
end;
$$;

revoke all on function public.open_weekly_reward(date) from public, anon;
grant execute on function public.open_weekly_reward(date) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Inventario del Gacha y Mascota
-- ---------------------------------------------------------------------
create table public.user_gacha_inventory (
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id           text not null references public.collectibles (id) on delete cascade,
  rank              smallint not null default 0 check (rank >= 0),
  base_copies_held  integer not null default 1 check (base_copies_held >= 0),
  first_obtained_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.nutrition_goals      enable row level security;
alter table public.meals                enable row level security;
alter table public.activities           enable row level security;
alter table public.weight_logs          enable row level security;
alter table public.water_logs           enable row level security;
alter table public.collectibles         enable row level security;
alter table public.user_collectibles    enable row level security;
alter table public.reward_claims        enable row level security;
alter table public.user_gacha_inventory enable row level security;

create policy "profiles: leer propio"       on public.profiles for select using (id = auth.uid());
create policy "profiles: actualizar propio" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "nutrition_goals: propio"      on public.nutrition_goals      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meals: propio"                on public.meals                for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activities: propio"           on public.activities           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weight_logs: propio"          on public.weight_logs          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "water_logs: propio"           on public.water_logs           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_gacha_inventory: propio" on public.user_gacha_inventory for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- El catálogo es público para usuarios autenticados; desbloqueos y reclamos solo se leen
-- (se escriben únicamente mediante open_weekly_reward).
create policy "collectibles: leer catálogo"   on public.collectibles      for select to authenticated using (true);
create policy "user_collectibles: leer propio" on public.user_collectibles for select using (user_id = auth.uid());
create policy "reward_claims: leer propio"     on public.reward_claims     for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 10. Storage para fotos de comidas (carpeta por usuario: <user_id>/<archivo>)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "meal-photos: propio" on storage.objects for all to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 11. Datos iniciales del catálogo (19 Alimentos del Gacha + Anteriores)
-- ---------------------------------------------------------------------
insert into public.collectibles (id, name, emoji, rarity, sort_order) values
  -- Común
  ('tomato',           'Tomate',           '🍅', 'common',    1),
  ('apple',            'Manzana',          '🍎', 'common',    2),
  ('egg',              'Huevo',            '🥚', 'common',    3),
  ('lettuce',          'Lechuga',          '🥬', 'common',    4),
  ('rice',             'Arroz',            '🍚', 'common',    5),
  ('carrot',           'Zanahoria',        '🥕', 'common',    6),
  ('fish',             'Pescado',          '🐟', 'common',    7),
  ('grape',            'Uva',              '🍇', 'common',    8),
  -- Raro
  ('cheese',           'Queso',            '🧀', 'rare',      9),
  ('salt',             'Sal',              '🧂', 'rare',     10),
  ('honey',            'Miel',             '🍯', 'rare',     11),
  ('bread',            'Pan',              '🍞', 'rare',     12),
  ('butter',           'Mantequilla',      '🧈', 'rare',     13),
  ('olive',            'Aceituna',         '🫒', 'rare',     14),
  -- Épico
  ('pizza',            'Pizza',            '🍕', 'epic',     15),
  ('sushi',            'Sushi',            '🍣', 'epic',     16),
  ('taco',             'Taco',             '🌮', 'epic',     17),
  -- Legendario
  ('golden_cake',      'Pastel Dorado',    '🎂', 'legendary', 18),
  ('ramen',            'Ramen Supremo',    '🍜', 'legendary', 19),
  -- Coleccionables clásicos
  ('pizza-clasica',    'Pizza Clásica',    '🍕', 'common',   20),
  ('manzana-roja',     'Manzana Roja',     '🍎', 'common',   21),
  ('aguacate-mistico', 'Aguacate Místico', '🥑', 'rare',     22),
  ('sushi-epico',      'Sushi Épico',      '🍣', 'epic',     23),
  ('taco-galactico',   'Taco Galáctico',   '🌮', 'rare',     24),
  ('pastel-dorado',    'Pastel Dorado',    '🍰', 'legendary', 25),
  ('langosta-real',    'Langosta Real',    '🦞', 'epic',     26),
  ('uvas-arcanas',     'Uvas Arcanas',     '🍇', 'rare',     27),
  ('croissant-magico', 'Croissant Mágico', '🥐', 'common',   28)
on conflict (id) do nothing;
