-- Bootstrap login + roles (email + cédula)
-- Este script es idempotente (usa IF NOT EXISTS cuando aplica).

-- 1) Directorios
create table if not exists public.student_directory (
  email text primary key,
  cedula text not null,
  course_code text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.docente_directory (
  email text primary key,
  cedula text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_registry (
  email text primary key,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_whitelist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 2) Profiles: guardar email y role
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;

-- 3) Evaluations: permitir evaluación sin que el evaluado tenga cuenta
alter table public.evaluations add column if not exists evaluator_email text;
alter table public.evaluations add column if not exists evaluated_email text;
alter table public.evaluations add column if not exists evaluated_name text;

-- Si tu columna evaluated_id está NOT NULL, descomenta:
-- alter table public.evaluations alter column evaluated_id drop not null;

-- Asegurar target_role (DOCENTE o COORDINADOR)
alter table public.evaluations add column if not exists target_role text;

-- Índice único por email (para evitar duplicados)
create unique index if not exists evaluations_unique_email
  on public.evaluations (component, target_role, evaluator_email, evaluated_email, coalesce(course_code,''));

