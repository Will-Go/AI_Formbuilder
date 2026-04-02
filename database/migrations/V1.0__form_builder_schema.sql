CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_status') THEN
    CREATE TYPE public.form_status AS ENUM ('draft', 'published', 'private', 'closed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.form_status NOT NULL DEFAULT 'draft',
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  /*{
   bg_color?: string,
   accent_color?: string
  }
  */
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  type text NOT NULL,
  label text NOT NULL,
  description text,
  required boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, "order")
);

CREATE TABLE IF NOT EXISTS public.options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  "order" integer NOT NULL,
  UNIQUE (question_id, "order")
);

CREATE TABLE IF NOT EXISTS public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  device text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  value text,
  value_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_forms_owner_id ON public.forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON public.questions(form_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON public.options(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON public.responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_by ON public.responses(submitted_by);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON public.answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
