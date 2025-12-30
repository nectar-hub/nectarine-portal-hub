-- Add revenue and route fields to production_costs table
ALTER TABLE public.production_costs 
ADD COLUMN IF NOT EXISTS revenue_total numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS route text DEFAULT 'ZNZ Airport → Ferry → Dar → Office';

-- Create index on route for filtering
CREATE INDEX IF NOT EXISTS idx_production_costs_route ON public.production_costs(route);

-- Create index on cost_date for monthly reporting
CREATE INDEX IF NOT EXISTS idx_production_costs_cost_date ON public.production_costs(cost_date);