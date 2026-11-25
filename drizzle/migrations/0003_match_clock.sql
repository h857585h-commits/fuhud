ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS "clockPeriod" text NOT NULL DEFAULT '';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS "clockStartedAt" timestamptz;