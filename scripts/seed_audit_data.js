const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding Tactical Audit Data...');

  // 1. Witch Hunt Task
  const { error: task1Err } = await supabase.from('tasks').insert([{
    title: 'Witch Hunt',
    category: 'Career', // 'Hackathons' relates to Career
    priority: 5,
    money_impact: 'M_up',
    status: 'in_progress',
    deadline: new Date('2026-04-07T00:00:00Z').toISOString(),
    is_routine: false
  }]);
  if (task1Err) console.error('Task 1 Err:', task1Err); else console.log('✅ Witch Hunt Task inserted.');

  // 2. Discipline Routine
  const { error: task2Err } = await supabase.from('tasks').insert([{
    title: 'Wake up early',
    category: 'Discipline',
    priority: 3,
    money_impact: 'M_up',
    status: 'completed',
    is_routine: true
  }]);
  if (task2Err) console.error('Task 2 Err:', task2Err); else console.log('✅ Routine Task inserted.');

  // 3. Finance
  const { error: finErr } = await supabase.from('finance').insert([
    {
      source: 'Keerthi Mam',
      amount: 5000,
      type: 'income',
      strategy_tag: 'Extra',
      date: new Date().toISOString()
    },
    {
      source: 'Outside Food',
      amount: 300,
      type: 'outgoing',
      strategy_tag: 'Extra',
      date: new Date().toISOString()
    }
  ]);
  if (finErr) console.error('Finance Err:', finErr); else console.log('✅ Finance constraints inserted.');

  // 4. People
  const { error: pplErr } = await supabase.from('people').insert([{
    name: 'Nagesh',
    role: 'Connection',
    give_take_score: -15,
    last_interaction: new Date().toISOString()
  }]);
  if (pplErr) console.error('People Err:', pplErr); else console.log('✅ People deficit inserted.');

  console.log('Seed Complete!');
}

seed();
