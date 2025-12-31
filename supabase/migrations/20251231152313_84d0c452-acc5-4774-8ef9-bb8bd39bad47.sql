INSERT INTO public.user_roles (user_id, role)
VALUES ('0f13ecf7-7e89-481c-a737-9aa2625cd431', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;