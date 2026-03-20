-- Delete all entries for days in the imported statement range (Dec 19, 2025 to Mar 19, 2026)
DELETE FROM real_time_entries 
WHERE day_id IN (
  SELECT id FROM real_time_days 
  WHERE op_date >= '2025-12-19' AND op_date <= '2026-03-19'
);

-- Delete all days in the imported statement range
DELETE FROM real_time_days 
WHERE op_date >= '2025-12-19' AND op_date <= '2026-03-19';