-- schema_v2.sql
-- Run this directly in your Supabase SQL Editor

-- 1. Add person_id linkage to Tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.people(id) ON DELETE SET NULL;

-- 1b. Add description to Finance
ALTER TABLE public.finance
ADD COLUMN IF NOT EXISTS description TEXT;

-- 1c. Add 'Strategy' to enums
ALTER TYPE task_category ADD VALUE IF NOT EXISTS 'Strategy';
ALTER TYPE finance_strategy_tag ADD VALUE IF NOT EXISTS 'Strategy';

-- 2. Create Strategy Logs table (Pillar 5)
CREATE TABLE IF NOT EXISTS public.strategy_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    content TEXT NOT NULL,
    mood TEXT DEFAULT 'Reflective',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS and setup permissive policies for the single-user dashboard scope
ALTER TABLE public.strategy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_select_strategy_logs" ON public.strategy_logs FOR SELECT USING (true);
CREATE POLICY "allow_public_insert_strategy_logs" ON public.strategy_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update_strategy_logs" ON public.strategy_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_delete_strategy_logs" ON public.strategy_logs FOR DELETE USING (true);
