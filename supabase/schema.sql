-- Tasks Table
CREATE TYPE task_category AS ENUM ('Career', 'Growth', 'Discipline');
CREATE TYPE task_money_impact AS ENUM ('M_up', 'M_down', 'Neutral');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed');

CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category task_category NOT NULL,
    priority INT CHECK (priority >= 1 AND priority <= 5) NOT NULL,
    money_impact task_money_impact NOT NULL,
    is_routine BOOLEAN DEFAULT false,
    deadline TIMESTAMPTZ,
    status task_status DEFAULT 'todo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance Table
CREATE TYPE finance_type AS ENUM ('income', 'outgoing');
CREATE TYPE finance_strategy_tag AS ENUM ('SIP', 'Extra', 'Strategy');

CREATE TABLE finance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type finance_type NOT NULL,
    strategy_tag finance_strategy_tag NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- People Table
CREATE TABLE people (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    give_take_score INT NOT NULL DEFAULT 0,
    last_interaction TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
