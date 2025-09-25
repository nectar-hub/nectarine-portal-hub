-- Test the current RLS policies by creating a simple admin test
-- Check if the current admin can access buy_requests
SELECT 'Testing admin access to buy_requests' as test_description;

-- Let's also check what RLS policies exist on buy_requests
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'buy_requests';