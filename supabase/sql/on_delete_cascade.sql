-- Supabase Postgres: reglas de borrado en cascada para datos relacionados
-- Ajusta los nombres de tabla/columnas si tu esquema difiere.
-- Ejecuta este script en tu proyecto Supabase (SQL editor) una vez.

BEGIN;

-- 1) accounts.user_id → auth.users.id (cascada)
-- Si la tabla ya tiene la columna, añade/actualiza la FK.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'user_id'
  ) THEN
    -- Elimina FK previa si existe con otro comportamiento
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' AND table_name = 'accounts' AND constraint_name = 'accounts_user_id_fkey'
    ) THEN
      ALTER TABLE public.accounts DROP CONSTRAINT accounts_user_id_fkey;
    END IF;

    ALTER TABLE public.accounts
      ADD CONSTRAINT accounts_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) matches.user_id → auth.users.id (cascada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' AND table_name = 'matches' AND constraint_name = 'matches_user_id_fkey'
    ) THEN
      ALTER TABLE public.matches DROP CONSTRAINT matches_user_id_fkey;
    END IF;

    ALTER TABLE public.matches
      ADD CONSTRAINT matches_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3) matches.account_id → accounts.id (cascada) si tu esquema lo usa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'account_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public' AND table_name = 'matches' AND constraint_name = 'matches_account_id_fkey'
    ) THEN
      ALTER TABLE public.matches DROP CONSTRAINT matches_account_id_fkey;
    END IF;

    ALTER TABLE public.matches
      ADD CONSTRAINT matches_account_id_fkey
      FOREIGN KEY (account_id)
      REFERENCES public.accounts(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4) riot_cache.puuid → accounts.puuid (cascada) si la tabla existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'riot_cache' AND column_name = 'puuid'
  ) THEN
    -- Crear índice de soporte en accounts.puuid si no existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'accounts' AND indexname = 'accounts_puuid_idx'
    ) THEN
      CREATE INDEX accounts_puuid_idx ON public.accounts(puuid);
    END IF;

    -- No es común referenciar por varchar, pero se puede.
    -- No se puede crear FK a una columna que no sea UNIQUE o PRIMARY KEY.
    -- Si accounts.puuid es única, añade la restricción y cascada:
    BEGIN
      ALTER TABLE public.accounts ADD CONSTRAINT accounts_puuid_unique UNIQUE (puuid);
    EXCEPTION WHEN duplicate_object THEN
      -- Ya existe
      NULL;
    END;

    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'riot_cache' AND constraint_name = 'riot_cache_puuid_fkey'
    ) THEN
      ALTER TABLE public.riot_cache DROP CONSTRAINT riot_cache_puuid_fkey;
    END IF;

    ALTER TABLE public.riot_cache
      ADD CONSTRAINT riot_cache_puuid_fkey
      FOREIGN KEY (puuid)
      REFERENCES public.accounts(puuid)
      ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;