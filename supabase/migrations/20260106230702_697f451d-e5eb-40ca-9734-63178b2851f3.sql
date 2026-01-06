-- Add new action types to the enum
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'rm_action';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'recursive';

-- Note: We cannot rename enum values in PostgreSQL easily, so we keep 'model_based' as 'Model' display and 'ad_hoc' as 'Ad-Hoc' display
-- The mapping will be:
-- model_based -> Model (AI generated)
-- rm_action -> RM Action (RM generated) 
-- ad_hoc -> Ad-Hoc (uploaded)
-- recursive -> Recursive (scheduled)