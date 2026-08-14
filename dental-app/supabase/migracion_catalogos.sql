-- =============================================================
-- Migración: Catálogos + Cuenta corriente
-- Ejecutar UNA vez en Supabase -> SQL Editor -> Run
-- (No borra nada existente; solo agrega tablas nuevas)
-- =============================================================

-- Catálogo de prestaciones (para el "Concepto" de la cuenta)
create table if not exists public.procedures (
  id          uuid primary key default gen_random_uuid(),
  code        text,
  name        text not null,
  price       numeric(12,2) default 0,
  active      boolean default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

-- Catálogo de obras sociales
create table if not exists public.insurers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  active      boolean default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

-- Cuenta corriente del paciente (prestaciones = debe, pagos = haber)
create table if not exists public.account_entries (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  entry_date    timestamptz not null default now(),
  kind          text not null check (kind in ('prestacion','pago')),
  concept       text,
  procedure_id  uuid references public.procedures(id) on delete set null,
  currency      text not null default 'ARS' check (currency in ('ARS','USD')),
  amount        numeric(12,2) not null,
  invoiced      boolean default false,
  notes         text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);
create index if not exists account_patient_idx
  on public.account_entries (patient_id, entry_date);

-- Seguridad (mismo criterio: usuario autenticado tiene acceso)
alter table public.procedures      enable row level security;
alter table public.insurers        enable row level security;
alter table public.account_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['procedures','insurers','account_entries']
  loop
    execute format('drop policy if exists "authenticated full access" on public.%I;', t);
    execute format(
      'create policy "authenticated full access" on public.%I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;
