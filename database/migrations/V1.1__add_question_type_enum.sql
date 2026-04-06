DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE public.question_type AS ENUM (
      'short_text',
      'long_text',
      'multiple_choice',
      'checkbox',
      'dropdown',
      'email',
      'phone',
      'number',
      'date',
      'rating',
      'linear_scale',
      'yes_no',
      'section_divider',
      'paragraph'
    );
  END IF;
END$$;

ALTER TABLE public.questions
ALTER COLUMN type TYPE public.question_type USING type::public.question_type;