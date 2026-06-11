-- Alter Attendance Table to include remarks
alter table public.attendance 
add column if not exists remarks text;
