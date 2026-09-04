create table if not exists public.hunter_contexts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_aim text not null,
  current_conditions text not null default '',
  constraints text not null default '',
  available_time text not null default '',
  preferred_intensity text not null default 'BALANCED',
  proof_preference text not null default 'TEXT',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.hunter_contexts enable row level security;

create policy "Users can read own hunter context"
  on public.hunter_contexts for select
  using (auth.uid() = user_id);

create policy "Users can insert own hunter context"
  on public.hunter_contexts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hunter context"
  on public.hunter_contexts for update
  using (auth.uid() = user_id);

create or replace function public.touch_hunter_context_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_hunter_context_updated_at on public.hunter_contexts;
create trigger touch_hunter_context_updated_at
  before update on public.hunter_contexts
  for each row execute procedure public.touch_hunter_context_updated_at();
