export type TaskCategory = 'Career' | 'Growth' | 'Discipline' | 'Strategy'
export type TaskMoneyImpact = 'M_up' | 'M_down' | 'Neutral'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export type Task = {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: 1 | 2 | 3 | 4 | 5
  money_impact: TaskMoneyImpact
  is_routine: boolean
  deadline?: string
  status: TaskStatus
  person_id?: string
  people?: { name: string; role: string }
  created_at?: string
  updated_at?: string
}

export type FinanceType = 'income' | 'outgoing'
export type FinanceStrategyTag = 'SIP' | 'Extra' | 'Strategy'

export type Finance = {
  id: string
  source: string
  description?: string
  amount: number
  type: FinanceType
  strategy_tag: FinanceStrategyTag
  date: string
  created_at?: string
  updated_at?: string
}

export type People = {
  id: string
  name: string
  role: string
  give_take_score: number
  last_interaction: string
  created_at?: string
  updated_at?: string
}

export type StrategyLog = {
  id: string
  content: string
  mood: string
  created_at?: string
}
