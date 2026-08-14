-- =============================================================
-- Historia Clínica Odontológica - Esquema de base de datos
-- Ejecutar en Supabase -> SQL Editor -> New query -> Run
-- =============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- PACIENTES
-- -------------------------------------------------------------
create table if not exists public.patients (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  dni           text,
  birth_date    date,
  sex           text check (sex in ('femenino','masculino','otro')),
  phone         text,
  email         text,
  address       text,
  -- Obra social
  insurance_name    text,
  insurance_plan    text,
  insurance_number  text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);
create index if not exists patients_last_name_idx on public.patients (lower(last_name));
create index if not exists patients_dni_idx on public.patients (dni);

-- -------------------------------------------------------------
-- ANTECEDENTES / FICHA DE SALUD  (1 fila por paciente)
-- Se guarda como JSONB flexible: grupos de condiciones marcadas,
-- medicación, alergias y comentarios.
-- -------------------------------------------------------------
create table if not exists public.medical_histories (
  patient_id    uuid primary key references public.patients(id) on delete cascade,
  data          jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id) default auth.uid()
);

-- -------------------------------------------------------------
-- EVOLUCIÓN (notas fechadas del tratamiento)
-- -------------------------------------------------------------
create table if not exists public.evolution_notes (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  note_date     timestamptz not null default now(),
  body          text not null,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);
create index if not exists evolution_patient_idx on public.evolution_notes (patient_id, note_date desc);

-- -------------------------------------------------------------
-- ODONTOGRAMA (1 fila por paciente, estado de cada pieza en JSONB)
-- Ej: { "11": {"status":"caries","note":"vestibular"}, "21": {...} }
-- -------------------------------------------------------------
create table if not exists public.odontograms (
  patient_id    uuid primary key references public.patients(id) on delete cascade,
  teeth         jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id) default auth.uid()
);

-- -------------------------------------------------------------
-- TURNOS
-- -------------------------------------------------------------
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references public.patients(id) on delete set null,
  title         text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  status        text not null default 'agendado'
                check (status in ('agendado','confirmado','atendido','cancelado','ausente')),
  notes         text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);
create index if not exists appointments_starts_idx on public.appointments (starts_at);

-- -------------------------------------------------------------
-- CAJA / PAGOS
-- -------------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references public.patients(id) on delete set null,
  amount        numeric(12,2) not null,
  method        text not null default 'efectivo'
                check (method in ('efectivo','debito','credito','transferencia','otro')),
  concept       text,
  paid_at       timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);
create index if not exists payments_paid_idx on public.payments (paid_at desc);

-- -------------------------------------------------------------
-- ARCHIVOS (fotos de fichas en papel, radiografías, etc.)
-- El archivo vive en Storage; acá guardamos la referencia.
-- -------------------------------------------------------------
create table if not exists public.attachments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references public.patients(id) on delete cascade,
  storage_path  text not null,
  kind          text default 'ficha',
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) default auth.uid()
);

-- -------------------------------------------------------------
-- Trigger para updated_at
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists patients_touch on public.patients;
create trigger patients_touch before update on public.patients
  for each row execute function public.touch_updated_at();

-- =============================================================
-- SEGURIDAD (RLS)
-- App de un solo usuario: cualquier usuario autenticado tiene acceso.
-- Cuando sumes multiusuario, se refinan estas políticas.
-- =============================================================
alter table public.patients          enable row level security;
alter table public.medical_histories enable row level security;
alter table public.evolution_notes   enable row level security;
alter table public.odontograms        enable row level security;
alter table public.appointments      enable row level security;
alter table public.payments          enable row level security;
alter table public.attachments       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'patients','medical_histories','evolution_notes',
    'odontograms','appointments','payments','attachments'
  ]
  loop
    execute format('drop policy if exists "authenticated full access" on public.%I;', t);
    execute format(
      'create policy "authenticated full access" on public.%I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- =============================================================
-- STORAGE: bucket privado para las fotos de fichas
-- =============================================================
insert into storage.buckets (id, name, public)
values ('fichas', 'fichas', false)
on conflict (id) do nothing;

drop policy if exists "fichas authenticated read"   on storage.objects;
drop policy if exists "fichas authenticated write"  on storage.objects;
drop policy if exists "fichas authenticated delete" on storage.objects;

create policy "fichas authenticated read" on storage.objects
  for select to authenticated using (bucket_id = 'fichas');

create policy "fichas authenticated write" on storage.objects
  for insert to authenticated with check (bucket_id = 'fichas');

-- Permite borrar el scan una vez transcripto (para no ocupar espacio).
create policy "fichas authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'fichas');

-- =============================================================
-- CATÁLOGOS + CUENTA CORRIENTE
-- =============================================================
create table if not exists public.procedures (
  id          uuid primary key default gen_random_uuid(),
  code        text,
  name        text not null,
  price       numeric(12,2) default 0,
  active      boolean default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

create table if not exists public.insurers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  active      boolean default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

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
