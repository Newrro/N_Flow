-- Create projects table
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  allowed_employees uuid[] default '{}'::uuid[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- Add RLS policies for projects
create policy "Admins can manage projects."
  on public.projects for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Employees can view projects."
  on public.projects for select
  using ( auth.uid() = any(allowed_employees) or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Update tasks table to add project_id and is_verified columns
alter table public.tasks 
add column if not exists project_id uuid references public.projects(id) on delete cascade,
add column if not exists is_verified boolean default false;
