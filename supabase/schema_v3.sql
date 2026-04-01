-- schema_v3.sql
-- Run this directly in your Supabase SQL Editor
-- This script creates a trigger to automatically update a Person's Give/Take score when tasks linked to them are created, completed, or deleted.

CREATE OR REPLACE FUNCTION update_person_give_take_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Scenario 1: A task is updated
    IF (TG_OP = 'UPDATE') THEN
        -- Task moves to 'completed': Increase the score (you gave energy/time to them)
        IF (NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.person_id IS NOT NULL) THEN
            UPDATE public.people
            SET give_take_score = give_take_score + NEW.priority
            WHERE id = NEW.person_id;
        END IF;

        -- Task is 'un-completed' (reverted to todo/in_progress): Decrease the score
        IF (NEW.status != 'completed' AND OLD.status = 'completed' AND NEW.person_id IS NOT NULL) THEN
            UPDATE public.people
            SET give_take_score = give_take_score - NEW.priority
            WHERE id = NEW.person_id;
        END IF;

        -- Person ID changed while task is completed? (Edge case handling missing for simplicity, assuming person_id doesn't shift when completed)
    END IF;

    -- Scenario 2: A task is directly inserted as completed
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'completed' AND NEW.person_id IS NOT NULL) THEN
            UPDATE public.people
            SET give_take_score = give_take_score + NEW.priority
            WHERE id = NEW.person_id;
        END IF;
    END IF;

    -- Scenario 3: A completed task is deleted
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'completed' AND OLD.person_id IS NOT NULL) THEN
            UPDATE public.people
            SET give_take_score = give_take_score - OLD.priority
            WHERE id = OLD.person_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists so we can safely re-run this script
DROP TRIGGER IF EXISTS task_completion_give_take_trigger ON public.tasks;

-- Attach the trigger to the tasks table (running AFTER the row changes)
CREATE TRIGGER task_completion_give_take_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_person_give_take_score();
