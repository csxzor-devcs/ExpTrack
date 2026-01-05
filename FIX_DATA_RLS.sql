-- RLS FIX SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Ensure RLS is enabled locally
alter table public.expenses enable row level security;

-- 2. DROP existing policies to prevent conflicts/errors
-- We drop both your specific names and potentially auto-generated names just in case.
drop policy if exists "Users can view their own expenses" on public.expenses;
drop policy if exists "Users can insert their own expenses" on public.expenses;
drop policy if exists "Users can update their own expenses" on public.expenses;
drop policy if exists "Users can delete their own expenses" on public.expenses;

-- 3. RE-CREATE the policies with the correct logic

-- READ: Allow users to see only their own rows
create policy "Users can view their own expenses"
on public.expenses for select
using (auth.uid() = user_id);

-- INSERT: Allow users to add rows only for themselves
create policy "Users can insert their own expenses"
on public.expenses for insert
with check (auth.uid() = user_id);

-- UPDATE: Allow users to edit only their own rows
create policy "Users can update their own expenses"
on public.expenses for update
using (auth.uid() = user_id);

-- DELETE: Allow users to remove only their own rows
create policy "Users can delete their own expenses"
on public.expenses for delete
using (auth.uid() = user_id);

-- 4. CONFIRMATION
-- If this runs successfully, your data persistence issues should be resolved for all FUTURE data.
-- Old data that might have been saved with a wrong user_id (if any) might still be invisible, but new data will stick.
