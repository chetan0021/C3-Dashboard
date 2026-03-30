-- Seed demo tasks — run in Supabase SQL Editor
-- Deadlines are relative to execution time using NOW()

INSERT INTO tasks (title, description, category, priority, money_impact, is_routine, deadline, status) VALUES
  ('Witch Hunt Campaign Deadline', 'Final push on April campaign deliverables', 'Career', 5, 'M_up', false, NOW() + INTERVAL '6 hours', 'in_progress'),
  ('React Native Interview Prep', 'Revise hooks, navigation, state management', 'Career', 4, 'M_up', false, NOW() + INTERVAL '47 hours', 'todo'),
  ('Weekly Content Planning', 'Plan posts and reels for next week', 'Growth', 3, 'M_up', true, NOW() + INTERVAL '30 minutes', 'todo'),
  ('Morning Workout', 'Chest + shoulders, 45 mins', 'Discipline', 4, 'Neutral', true, null, 'completed'),
  ('Read 30 Pages', 'Continue Atomic Habits', 'Growth', 3, 'M_up', true, null, 'todo'),
  ('Cold Outreach — 5 leads', 'Send personalized connection requests', 'Career', 5, 'M_up', true, null, 'todo'),
  ('Portfolio Case Study', 'Add C3 Dashboard project to portfolio', 'Career', 4, 'M_up', false, NOW() + INTERVAL '7 days', 'todo'),
  ('Meditation — 10 min', 'Morning mindfulness practice', 'Discipline', 2, 'Neutral', true, null, 'todo'),
  ('SIP Investment Review', 'Check mutual fund performance this month', 'Growth', 3, 'M_up', false, NOW() + INTERVAL '30 days', 'todo'),
  ('No-sugar Day', 'Discipline check — avoid sugar all day', 'Discipline', 3, 'M_down', true, null, 'todo');
