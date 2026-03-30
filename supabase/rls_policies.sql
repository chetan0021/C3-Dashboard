-- Run this in your Supabase SQL Editor AFTER schema.sql

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_public_select_tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "allow_public_insert_tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update_tasks" ON tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_delete_tasks" ON tasks FOR DELETE USING (true);

-- Finance RLS
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_public_select_finance" ON finance FOR SELECT USING (true);
CREATE POLICY "allow_public_insert_finance" ON finance FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update_finance" ON finance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_delete_finance" ON finance FOR DELETE USING (true);

-- People RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_public_select_people" ON people FOR SELECT USING (true);
CREATE POLICY "allow_public_insert_people" ON people FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update_people" ON people FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_delete_people" ON people FOR DELETE USING (true);
