# C3-Dashboard: Architecture & Feature Documentation
> [!NOTE]
> This document provides a comprehensive overview of the **C3-Dashboard** feature set, data flows, and AI logic. This can be used as context when prompting Gemini, ChatGPT, or other LLMs for future iterations.

## Executive Summary
The **C3-Dashboard (Clarity, Control, Command)** is a high-performance productivity tool acting as a "Strategic Command Center". It shifts away from standard to-do lists by quantifying tasks with a "Heat Score", aggressively optimizing financial strategies, managing social debt (Give vs. Take), and driving user accountability through an integrated LLM Commander persona.

## Tech Stack
- **Frontend Core**: Next.js 14 (App Router), React 18
- **Styling & UI**: Tailwind CSS (Dark/Glassmorphism Theme), Base UI (`@base-ui/react`), Custom `shadcn` primitives, Lucide React Icons.
- **Backend & Database**: Supabase (PostgreSQL), Next.js API Routes.
- **AI Intelligence**: Groq API SDK (`@ai-sdk/groq`), `llama-3.3-70b-versatile` language model.
- **Data Visualization**: Recharts (for finance tracking) and custom SVGs (Predictive Meter).

---

## Core Feature Flow & Logic

### 1. The Priority Engine (Task Module)
The task engine ranks all tasks dynamically using a mathematical **Heat Score**, prioritizing maximum velocity towards high-impact deliverables.
- **Formula**: `(Priority Weight × Money Impact) ÷ Days until Deadline`
- **Categorization Structure**: 
  - *Career Deadlines*: High-priority professional growth blocks.
  - *Growth Path*: Upskilling and long-term leverage.
  - *Discipline*: Recurring routines and habits.
- **Urgency Mechanism**: If a task deadline falls within the next 48 hours, the UI triggers a real-time countdown timer that pulses (Amber/Red) to signify immediate action required.
- **Daily Battery**: Routine/Habit tasks (`is_routine = true`) fuel a daily visualization battery reflecting the current day's percentage completion.

### 2. Strategy & Wealth Tracking (Finance Module)
A dynamic balance-sheet visualization distinguishing between Active Revenue vs. Passive Capital.
- **KPI Metrics**: Automatically fragments total inputs into *Total Extra Money* (Active) and *Passive Strategy* (SIPs/Stocks).
- **Leakage Tracker**: A grid of instant one-tap buttons designed to track micro-expenses (e.g., "Outside Food"). Logging an expense instantly adds a deduction (e.g., -₹300) and displays an aggressive amber warning banner: "Every rupee counts."
- **Trend Visualization**: Connects to Supabase to plot total incoming vs. outgoing capital weekly directly onto Recharts interactive graphs.

### 3. Network CRM (Relationship/People Module)
A dedicated "social equity" management tool to track mutual value exchange with connections.
- **Score Logic**: Tracks a fundamental "Give / Take" quotient.
- **Visual Triggers**: Uses progress bars tracking positive (Give) and negative (Take) momentum. If the user’s score drops into deep "Take" territory (score `<= -10`), the person's card highlights in **Yellow** explicitly signaling the user to proactively reach out and offer help.

### 4. Commander AI Brain (Groq Integration)
An intelligent background service designed to aggressively hold the user accountable by ingesting daily actions.
- **Data Pipeline Flow**: 
  - `GET /api/brain` fires immediately on dashboard load.
  - Supabase is queried server-side for all newly created/modified Tasks, Routines, and Finance entries over the past 7 days.
  - The raw subset is injected directly into the `llama-3.3` context window.
- **Persona Protocol**: The system prompt explicitly initializes the LLM as the user's "Strategic Commander", prioritizing the maximization of the user's `$M \uparrow` score (money impact actions) and checking on major Hackathon deadlines (like "Witch Hunt").
- **Output Constraint**: Enforced 150-word, 3-point 'Battle Plan' generated on-the-fly.
- **Auto-Aggression Alert**: The `/api/brain` route explicitly parses the 7-day finance logs for the substring *"Outside Food"*. If detected, the API flags a Boolean constraint, forcing the UI to override its standard display and trigger a deep-red *Financial Leakage* alert.

### 5. Predictive Witch Hunt Meter 
A tactical visualizer predicting success for the user's major upcoming deliverable (e.g., April 7 Witch Hunt).
- **Metric Computation**: Dynamically queries Supabase for all completed `$M \uparrow` tasks (money impact `> 1`).
- **Time Dilation**: Calculates exact days remaining until April 7, 2026.
- **Dial Output**: Returns a fluid "Success Probability" `%` using an SVG ring dial. The math relies on completing a threshold baseline of high-impact tasks. The aesthetic dynamically shifts from Red → Amber → Green depending on the calculated probability margin.

---

## Supabase PostgreSQL Schema Overview
*The core tables orchestrating state logic:*

```sql
-- 1. Tasks Table --
id uuid (pk), title text, priority text, category text,
money_impact integer, deadline timestamptz,
status text, is_routine boolean

-- 2. Finance Table --
id uuid (pk), type text (income/outgoing),
amount numeric, source text, date date

-- 3. People Table --
id uuid (pk), name text, role text,
give_score integer, take_score integer
```

> [!TIP]
> **For Reviewing with AI**: You can paste this entire document directly to Gemini/ChatGPT when asking it to *"write unit tests,"* *"suggest new modules,"* or *"help refactor the AIBrain backend to use OpenAI instead of Groq."* It contains everything the LLM needs to understand the project deeply.
