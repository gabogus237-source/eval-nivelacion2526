-- === EVALUACIÓN DOCENTE UCE (MVP) ===
-- Versión SIN campo full_name (usamos email)

-- Enum de roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('STUDENT','DOCENTE','COORD_ASIGNATURA','COORD_NIVELACION');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Perfil de usuario (ligado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role public.user_role NOT NULL DEFAULT 'STUDENT',
  selected_course_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Para asignar roles automáticamente por email (solo docentes/coordinadores; estudiantes por defecto)
CREATE TABLE IF NOT EXISTS public.role_registry (
  email text PRIMARY KEY,
  role public.user_role NOT NULL
);

-- Catálogo de cursos
CREATE TABLE IF NOT EXISTS public.courses (
  code text PRIMARY KEY,
  name text NOT NULL
);

-- Materias/Asignaciones por curso
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL REFERENCES public.courses(code) ON DELETE CASCADE,
  asignatura text NOT NULL,
  docente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- Instrumentos y preguntas (ESTUD, AUTO, COORD, DIR)
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument text NOT NULL,
  item int NOT NULL,
  dimension text NOT NULL,
  question text NOT NULL
);

-- Evaluaciones (HET, AUTO, DIR, PAR)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,             -- HET|AUTO|DIR|PAR
  target_role public.user_role NOT NULL,
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluated_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1 evaluación por par (evaluador, evaluado, componente, curso)
CREATE UNIQUE INDEX IF NOT EXISTS uq_eval_once
  ON public.evaluations(component, evaluator_id, evaluated_id, COALESCE(course_code,''));

-- Ítems de cada evaluación
CREATE TABLE IF NOT EXISTS public.evaluation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 4)
);

-- Vista de reporte por docente: % por componente (0-100)
CREATE OR REPLACE VIEW public.report_docente AS
SELECT
  e.evaluated_id AS docente_id,
  e.component,
  ROUND(100.0 * AVG(i.score) / 4.0, 2) AS score_pct
FROM public.evaluations e
JOIN public.evaluation_items i ON i.evaluation_id = e.id
GROUP BY e.evaluated_id, e.component;

