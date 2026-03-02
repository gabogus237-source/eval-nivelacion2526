# Sistema de Evaluación Docente (Vercel + Supabase)

Este repo implementa:
- Login **sin OTP**: correo + cédula (password), validado contra **student_directory** y **docente_directory**.
- Estudiante: selecciona su curso y evalúa a docentes del curso (HETERO)
- Docente: realiza Autoevaluación (AUTO)
- Coordinadores: evalúan a docentes de su asignatura (PAR)
- Coordinación de Nivelación: evalúa docentes (DIRECTIVO) y coordinadores (PAR)

> Importante: el sistema **no necesita** que el docente “se registre” antes de ser evaluado; las evaluaciones se guardan por **evaluated_email/evaluated_name**.

## 1) Requisitos
- Node 18+
- Cuenta Supabase
- (Opcional) Vercel para deploy

## 2) Configurar Supabase
1. Crea un proyecto en Supabase.
2. En SQL Editor ejecuta:
   - `supabase/schema.sql` (base) **o** la migración `supabase/migrations/20260301_bootstrap_login_and_roles.sql` si ya venías con tablas.
   - `supabase/seed.sql` (preguntas)
3. Carga directorios (import en Supabase Table Editor):
   - `supabase/imports/student_directory_import.csv` → tabla `student_directory`
   - `supabase/imports/email_whitelist_import.csv` → tabla `email_whitelist` (solo correos externos)
4. Asegúrate de tener `docente_directory` con **email; cedula; full_name** (al menos para coordinación/docentes que van a ingresar).

## 3) Variables de entorno
Copia `.env.example` a `.env.local` y llena:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_INSTITUTION_DOMAIN` (ej: `uce.edu.ec`)

## 4) Ejecutar local
```bash
npm install
npm run dev
```
Abre http://localhost:3000

## 5) Flujo de uso
- Login: correo + cédula.
  - El endpoint `/api/bootstrap-login` valida contra directorios.
  - Crea/actualiza usuario en Auth (password=cédula) y upsert en `profiles` con el rol.
- Estudiante: `/student` → selecciona curso → evalúa.
- Docente: `/docente` → Autoevaluación.
- Coordinador: `/coordinador` → Autoevaluación + PAR de docentes.
- Coordinación Nivelación: `/nivelacion` →
  - DIRECTIVO docentes: `/nivelacion/evaluar-docentes`
  - PAR coordinadores: `/nivelacion/evaluar-coordinadores`

## 6) Duplicados
La BD usa un índice UNIQUE (`evaluations_unique_email`) para impedir que se envíe 2 veces la misma evaluación (por componente/rol/email/curso).
