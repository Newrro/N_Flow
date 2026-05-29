-- Workforce and operational tables required by the application

create table if not exists public.attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'leave', 'holiday')),
  login_time timestamp with time zone,
  logout_time timestamp with time zone,
  total_hours numeric(10, 2),
  verified_by_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

alter table public.attendance enable row level security;

create policy "Admins can manage all attendance."
  on public.attendance for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Users can view their own attendance."
  on public.attendance for select
  using ( user_id = auth.uid() );

create policy "Users can update their own attendance."
  on public.attendance for update
  using ( user_id = auth.uid() );

create policy "Users can insert their own attendance."
  on public.attendance for insert
  with check ( user_id = auth.uid() );

create index if not exists idx_attendance_user_date on public.attendance(user_id, date);

create table if not exists public.leaves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leaves enable row level security;

create policy "Admins can manage all leaves."
  on public.leaves for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Users can view their own leaves."
  on public.leaves for select
  using ( user_id = auth.uid() );

create policy "Users can insert their own leaves."
  on public.leaves for insert
  with check ( user_id = auth.uid() );

create policy "Users can update their own leaves."
  on public.leaves for update
  using ( user_id = auth.uid() );

create index if not exists idx_leaves_user_created_at on public.leaves(user_id, created_at desc);

create table if not exists public.meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  meet_link text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.meetings enable row level security;

create policy "Authenticated users can view meetings."
  on public.meetings for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage meetings."
  on public.meetings for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create index if not exists idx_meetings_start_time on public.meetings(start_time);

create table if not exists public.meeting_attendees (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (meeting_id, user_id)
);

alter table public.meeting_attendees enable row level security;

create policy "Admins can manage meeting attendees."
  on public.meeting_attendees for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Users can view their own meeting attendees."
  on public.meeting_attendees for select
  using ( user_id = auth.uid() );

create index if not exists idx_meeting_attendees_user_id on public.meeting_attendees(user_id);
