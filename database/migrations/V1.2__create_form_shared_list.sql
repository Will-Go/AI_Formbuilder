-- Migration to create form_shared_list table
CREATE TABLE IF NOT EXISTS public.form_shared_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, email)
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_form_shared_list_email ON public.form_shared_list(email);
CREATE INDEX IF NOT EXISTS idx_form_shared_list_form_id ON public.form_shared_list(form_id);

-- Enable RLS
ALTER TABLE public.form_shared_list ENABLE ROW LEVEL SECURITY;
