-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create default authenticated user
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'default@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Profile created automatically via create_profile_for_new_user trigger