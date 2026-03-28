
UPDATE real_time_days 
SET opening_crdb = opening_crdb + 746183.00
WHERE op_date >= '2026-03-22' AND op_date <= '2026-03-28';
