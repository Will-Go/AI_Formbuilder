# Form Builder Database Schema (SQL)

This schema supports a Google Forms--like application with forms,
questions, responses, and answers.

------------------------------------------------------------------------

## Tables Overview

-   forms
-   questions
-   options
-   responses
-   answers

------------------------------------------------------------------------

## forms

``` sql
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## questions

``` sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT FALSE,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

------------------------------------------------------------------------

## options

``` sql
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    "order" INTEGER NOT NULL
);
```

------------------------------------------------------------------------

## responses

``` sql
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## answers

``` sql
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT
);
```

------------------------------------------------------------------------

## Optional JSON support

``` sql
ALTER TABLE answers
ADD COLUMN value_json JSONB;
```

------------------------------------------------------------------------

## Indexes

``` sql
CREATE INDEX idx_questions_form_id ON questions(form_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
```

------------------------------------------------------------------------

## Notes

-   UUIDs improve scalability.
-   Cascades keep data consistent.
-   JSONB allows flexible answers.

------------------------------------------------------------------------

## Future Extensions

-   conditional_logic
-   form_themes
-   users/auth
-   analytics
