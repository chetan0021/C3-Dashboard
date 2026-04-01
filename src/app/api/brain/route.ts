import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function generateAIWithFallback(system: string, prompt: string) {
  try {
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system,
      prompt,
    });
    return { text: res.text, modelUsed: '70b' };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429 || err.message?.includes('Rate limit')) {
      console.warn('Primary AI hit rate limit. Falling back to 8b-instant...');
      const fallbackRes = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system,
        prompt,
      });
      return { text: fallbackRes.text, modelUsed: '8b' };
    }
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'general';

    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString();

    // ── Fetch ALL active (non-completed) tasks ──────────────────────────────
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, category, priority, money_impact, status, deadline, is_routine, person_id')
      .neq('status', 'completed')
      .order('priority', { ascending: false });

    // ── Recently completed tasks (last 7 days, for AI context) ──────────────
    const { data: recentCompleted } = await supabase
      .from('tasks')
      .select('title, category, updated_at')
      .eq('status', 'completed')
      .gte('updated_at', dateString)
      .order('updated_at', { ascending: false })
      .limit(5);

    // ── Finance (last 7 days) ───────────────────────────────────────────────
    const { data: finance } = await supabase
      .from('finance')
      .select('*')
      .gte('date', dateString)
      .order('date', { ascending: false });

    // ── Social CRM: people with negative give-take score ────────────────────
    const { data: people } = await supabase
      .from('people')
      .select('name, give_take_score, last_interaction')
      .lte('give_take_score', -10)
      .order('give_take_score', { ascending: true });

    // ── Strategy logs (last 7 days) ─────────────────────────────────────────
    const { data: logs } = await supabase
      .from('strategy_logs')
      .select('mood, content, created_at')
      .gte('created_at', dateString)
      .order('created_at', { ascending: false });

    // ── Sort tasks by strategic importance: priority × money weight ──────────
    const moneyWeight: Record<string, number> = { M_up: 3, M_down: 2, Neutral: 1 };
    const sortedTasks = (tasks || []).sort((a, b) => {
      const scoreA = a.priority * (moneyWeight[a.money_impact] ?? 1);
      const scoreB = b.priority * (moneyWeight[b.money_impact] ?? 1);
      return scoreB - scoreA;
    });

    // ── Build clean task summary for AI ────────────────────────────────────
    const now = new Date();
    const taskSummary = sortedTasks.map((t) => {
      if (!t.deadline) {
        return `[${t.category}] "${t.title}" | Priority: ${t.priority}/5 | Money: ${t.money_impact} | Status: ${t.status} | No deadline`;
      }
      const deadlineMs = new Date(t.deadline).getTime() - now.getTime();
      const daysLeft = (deadlineMs / (1000 * 60 * 60 * 24)).toFixed(1);
      const urgencyTag = deadlineMs < 0 ? 'OVERDUE' : parseFloat(daysLeft) < 1 ? 'DUE TODAY' : `${daysLeft} days away`;
      return `[${t.category}] "${t.title}" | Priority: ${t.priority}/5 | Money: ${t.money_impact} | Status: ${t.status} | Deadline: ${urgencyTag}`;
    }).join('\n');

    // ── Check outside food leakage ──────────────────────────────────────────
    const outsideFoodEntries = (finance || []).filter(
      (f) =>
        (f.source && f.source.toLowerCase().includes('outside food')) ||
        (f.description && f.description.toLowerCase().includes('outside food'))
    );
    const hasLeakage = outsideFoodEntries.length > 0;

    // ── Build data context string ───────────────────────────────────────────
    const dataContext = `
Current Date & Time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

=== ACTIVE TASKS (ranked by strategic importance = priority × money impact) ===
${taskSummary || 'No active tasks'}

=== RECENTLY COMPLETED (last 7 days) ===
${(recentCompleted || []).map((t) => `"${t.title}" [${t.category}]`).join(', ') || 'None'}

=== RECENT FINANCE LOG (last 7 days) ===
${JSON.stringify(finance || [])}

=== SOCIAL DEBT (people with negative give-take score) ===
${JSON.stringify(people || [])}

=== RECENT STRATEGY REFLECTIONS ===
${JSON.stringify(logs || [])}
    `;

    // ── AI Prompts ─────────────────────────────────────────────────────────
    const generalPrompt = `You are Chetan's Strategic Commander AI. Give him a sharp daily battle plan.

CRITICAL RULES:
1. Tasks are sorted by STRATEGIC IMPORTANCE (Priority × Money Impact) — focus on the TOP items in that list. Do NOT just pick tasks because they are due soon.
2. Only mention a deadline-urgent task if it is ALSO high priority (4-5 stars) OR marked OVERDUE.
3. If any task is OVERDUE, address it in the FIRST bullet point immediately.
4. If he has spent on "outside food" recently, call him out by name.
5. If someone has high social debt (negative give-take score), name them and tell Chetan to reach out.
6. Be SPECIFIC — mention real task names, project names, people names from the data. No generic advice.

Output EXACTLY 3 bullet points starting with "-". No markdown headers. No asterisks. Max 150 words total. Be direct and commanding.`;

    const financePrompt = `You are Chetan's Financial Intelligence Unit. Analyze the Finance Log fields: source, description, amount.
Group recent spending into 4-5 thematic categories (e.g. "Food & Dining", "Transport", "Investments", "Subscriptions", "Health").

Output a JSON object with key "insights" as an array where each item has:
- label: (string) category name
- value: (number) total amount or intensity 0-100
- emoji: (string) relevant emoji
- color: (string) one of: emerald-400, red-400, amber-400, amber-400

Return ONLY the raw JSON object. No extra text, no markdown code blocks.`;

    const { text, modelUsed } = await generateAIWithFallback(
      type === 'finance' ? financePrompt : generalPrompt,
      dataContext
    );

    let insights: object[] = [];
    let battlePlan = '';

    if (type === 'finance') {
      try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        insights = Array.isArray(parsed) ? parsed : (parsed.insights || []);
      } catch (e) {
        console.error('AI Finance Parse Error:', e);
        insights = [{ label: 'Status Core', value: 80, emoji: '🚀', color: 'emerald-400' }];
      }
    } else {
      battlePlan = text;
    }

    return NextResponse.json({ insights, battlePlan, modelUsed, hasLeakage });
  } catch (error: unknown) {
    console.error('Brain API Error:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        error: err.message,
        insights: [],
        battlePlan: 'Neural link unstable. Tactical advice unavailable at this moment.',
        modelUsed: 'none',
        hasLeakage: false,
      },
      { status: 500 }
    );
  }
}
