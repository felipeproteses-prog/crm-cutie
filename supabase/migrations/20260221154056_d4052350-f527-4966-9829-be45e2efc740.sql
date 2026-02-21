
-- 1. ROLES SYSTEM
create type public.app_role as enum ('admin', 'recepcao');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS: users can see their own roles, admins can see all
create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 2. ADD NEW COLUMNS TO PACIENTES
alter table public.pacientes 
  add column tipo_atendimento text default 'Avaliação',
  add column lembrete_ativo boolean default false;

-- 3. PAYMENTS TABLE
create table public.pagamentos (
    id uuid primary key default gen_random_uuid(),
    paciente_id uuid references public.pacientes(id) on delete cascade not null,
    user_id uuid not null,
    valor_total numeric not null default 0,
    valor_pago numeric not null default 0,
    status_pagamento text not null default 'Pendente',
    data_pagamento timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

alter table public.pagamentos enable row level security;

create policy "Users can view own pagamentos"
on public.pagamentos for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own pagamentos"
on public.pagamentos for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own pagamentos"
on public.pagamentos for update
to authenticated
using (auth.uid() = user_id);

create policy "Only admins can delete pagamentos"
on public.pagamentos for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger update_pagamentos_updated_at
before update on public.pagamentos
for each row
execute function public.update_updated_at_column();

-- 4. REAGENDAMENTO HISTORY TABLE
create table public.historico_reagendamentos (
    id uuid primary key default gen_random_uuid(),
    paciente_id uuid references public.pacientes(id) on delete cascade not null,
    user_id uuid not null,
    data_anterior date,
    horario_anterior time without time zone,
    status_anterior text,
    data_nova date,
    horario_novo time without time zone,
    motivo text,
    created_at timestamp with time zone not null default now()
);

alter table public.historico_reagendamentos enable row level security;

create policy "Users can view own historico"
on public.historico_reagendamentos for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own historico"
on public.historico_reagendamentos for insert
to authenticated
with check (auth.uid() = user_id);
