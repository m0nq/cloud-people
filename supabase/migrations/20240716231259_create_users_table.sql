
create table
users (
id bigint primary key generated always as identity,
name text,
email text,
password text,
subscription_plan text,
created_at timestamptz default now(),
updated_at timestamptz default now()
);
