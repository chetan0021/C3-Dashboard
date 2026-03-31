import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

async function generateAIWithFallback(system: string, prompt: string) {
  try {
    // Try Primary Model (70b)
    const res = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system,
      prompt,
    });
    return { text: res.text, modelUsed: '70b' };
  } catch (error: unknown) {
    // If 429 (Rate Limit), fall back to 8b
    const err = error as { status?: number, message?: string }
    if (err.status === 429 || err.message?.includes('Rate limit')) {
      console.warn("Primary AI hit rate limit. Falling back to 8b-instant...");
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString();

    // Fetch tasks (including routines) modified or created in last 7 days
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`created_at.gte.${dateString},updated_at.gte.${dateString}`)
      .order('created_at', { ascending: false });

    // Fetch finance in last 7 days
    const { data: finance } = await supabase
      .from('finance')
      .select('*')
      .gte('date', dateString)
      .order('date', { ascending: false });

    // Fetch Social CRM metrics (People with negative balance)
    const { data: people } = await supabase
      .from('people')
      .select('name, give_take_score, last_interaction')
      .lte('give_take_score', -10)
      .order('give_take_score', { ascending: true });

    // Fetch Strategy Logs from last 7 days
    const { data: logs } = await supabase
      .from('strategy_logs')
      .select('mood, content, created_at')
      .gte('created_at', dateString)
      .order('created_at', { ascending: false });

    const outsideFoodEntries = finance?.filter(f => 
      (f.source && f.source.toLowerCase().includes('outside food')) ||
      (f.description && f.description.toLowerCase().includes('outside food'))
    ) || [];

    const hasLeakage = outsideFoodEntries.length > 0;

    const dataContext = `
      Current Date: ${new Date().toISOString()}
      Recent Tasks & Routines: ${JSON.stringify(tasks || [])}
      Recent Finance Log: ${JSON.stringify(finance || [])}
      Social Debt (People who gave more to you): ${JSON.stringify(people || [])}
      Recent Strategic Reflections: ${JSON.stringify(logs || [])}
    `;

    const generalPrompt = `You are Chetan’s Strategic Commander. Your job is to analyze his VLSI projects, hackathons, discipline routine, Social CRM, and Strategic Reflections. 
    Output EXACTLY a 3-point 'Battle Plan' for today. Nothing else. Keep it under 150 words. Do NOT use markdown headers, just 3 bullet points starting with "-".
    If he has spent on "Outside Food" recently (check source/description), call him out. If he has high social debt, tell him to reach out to specific people. Check if tasks are linked to people with negative scores. If his strategy logs show him struggling, give him tough love.`;

    const financePrompt = `You are Chetan’s Financial Intelligence Unit. Analyze the provided Finance Log (specifically the 'source', 'description', and 'amount' fields).
    Group recent spending into 4-5 thematic categories (e.g., "Food & Dining", "Rent & Utilities", "Transport", "Investments", "Health", "Subscriptions").
    
    Output a JSON object with 'insights':
    - label: (string) The category name.
    - value: (number) Total amount or intensity score (0-100).
    - emoji: (string) An automatic, relevant emoji chosen by you.
    - color: (string) fuchsia-400 for strategy, emerald-400 for income, red-400 for leakage/spending, amber-400 for general.

    Return ONLY the JSON object. No extra text.`;

    const { text, modelUsed } = await generateAIWithFallback(
      type === 'finance' ? financePrompt : generalPrompt,
      dataContext
    );

    let insights = [];
    let battlePlan = "";

    if (type === 'finance') {
      try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        insights = Array.isArray(parsed) ? parsed : (parsed.insights || []);
      } catch (e) {
        console.error("AI Finance Parse Error:", e);
        insights = [{ label: "Status Core", value: 80, emoji: "🚀", color: "emerald-400" }];
      }
    } else {
      battlePlan = text;
    }

    return NextResponse.json({
      insights,
      battlePlan,
      modelUsed,
      hasLeakage
    });

  } catch (error: unknown) {
    console.error('Brain API Error:', error);
    const err = error as Error;
    return NextResponse.json({ 
      error: err.message,
      insights: [],
      battlePlan: "Neural link unstable. Tactical advice unavailable at this moment.",
      modelUsed: 'none',
      hasLeakage: false
    }, { status: 500 });
  }
}
