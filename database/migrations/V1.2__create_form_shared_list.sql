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

-- Form owners can manage the share list for their forms
CREATE POLICY "Owners can manage form_shared_list" ON public.form_shared_list
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_shared_list.form_id AND owner_id = auth.uid()
    )
  );

-- Authenticated users can view their own entries in the share list
CREATE POLICY "Users can view their own share list entry" ON public.form_shared_list
  FOR SELECT USING (
    email = auth.jwt()->>'email'
  );
