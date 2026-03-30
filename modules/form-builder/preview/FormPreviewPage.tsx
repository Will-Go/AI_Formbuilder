"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useResponsesStore } from "@/modules/form-responses/store/responsesStore";
import type { Answer } from "@/shared/types/responses";
import type { Form, Question } from "@/shared/types/forms";
import { buildResponseSchema } from "./buildResponseSchema";

export default function FormPreviewPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore((s) => s.getFormById(formId));

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Button variant="contained" onClick={() => router.push("/forms")}>
          Back to dashboard
        </Button>
      </Box>
    );
  }

  return <PreviewFormContent formId={formId} form={form} />;
}

function PreviewFormContent({ formId, form }: { formId: string; form: Form }) {
  const router = useRouter();
  const submitResponse = useResponsesStore((s) => s.submitResponse);
  const [submitted, setSubmitted] = React.useState(false);

  const built = buildResponseSchema(form);
  const methods = useForm({
    resolver: zodResolver(built.schema),
    defaultValues: built.defaultValues,
    mode: "onSubmit",
  });

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2 }}
    >
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <FormHeaderPreview form={form} />
        <Box sx={{ height: 16 }} />
        {submitted ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Response recorded.
            </Alert>
            <Button
              variant="contained"
              onClick={() => router.push(`/forms/${formId}/responses`)}
            >
              View responses
            </Button>
            <Button sx={{ ml: 1 }} onClick={() => setSubmitted(false)}>
              Submit another response
            </Button>
          </Paper>
        ) : (
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit((values) => {
                const answers = toAnswers(ordered, values);
                submitResponse(formId, answers);
                methods.reset(built.defaultValues);
                setSubmitted(true);
              })}
            >
              <Stack spacing={2}>
                {ordered.map((q) => (
                  <QuestionPreview key={q.id} question={q} />
                ))}
                <Box sx={{ p: 2 }}>
                  <Button type="submit" variant="contained">
                    Submit
                  </Button>
                </Box>
              </Stack>
            </form>
          </FormProvider>
        )}
      </Box>
    </Box>
  );
}

function FormHeaderPreview({ form }: { form: Form }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {form.title || "Untitled form"}
      </Typography>
      {form.description ? (
        <Typography variant="body1" color="text.secondary">
          {form.description}
        </Typography>
      ) : null}
    </Paper>
  );
}

function QuestionPreview({ question }: { question: Question }) {
  const { control, register, formState } =
    useFormContext<Record<string, unknown>>();
  const error = (formState.errors as Record<string, { message?: string }>)[
    question.id
  ]?.message;

  if (question.type === "section_divider") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {question.label}
        </Typography>
      </Paper>
    );
  }

  if (question.type === "paragraph") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {question.text || question.label}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>
            {question.label} {question.required ? "*" : ""}
          </Typography>
          {question.description ? (
            <Typography variant="body2" color="text.secondary">
              {question.description}
            </Typography>
          ) : null}
        </Box>

        {(question.type === "short_text" ||
          question.type === "long_text" ||
          question.type === "email" ||
          question.type === "phone") && (
          <TextField
            {...register(question.id)}
            placeholder={
              "placeholder" in question ? question.placeholder : undefined
            }
            multiline={question.type === "long_text"}
            minRows={question.type === "long_text" ? 3 : undefined}
            type={
              question.type === "email"
                ? "email"
                : question.type === "phone"
                  ? "tel"
                  : "text"
            }
            error={Boolean(error)}
            helperText={error}
            fullWidth
          />
        )}

        {question.type === "number" && (
          <TextField
            {...register(question.id, { valueAsNumber: true })}
            type="number"
            placeholder={
              "placeholder" in question ? question.placeholder : undefined
            }
            error={Boolean(error)}
            helperText={error}
            fullWidth
          />
        )}

        {question.type === "date" && (
          <TextField
            {...register(question.id)}
            type="date"
            error={Boolean(error)}
            helperText={error}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        )}

        {(question.type === "multiple_choice" ||
          question.type === "yes_no") && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => (
              <FormControl error={Boolean(error)}>
                <RadioGroup {...field}>
                  {question.type === "multiple_choice"
                    ? question.options.map((o) => (
                        <FormControlLabel
                          key={o.id}
                          value={o.label}
                          control={<Radio />}
                          label={o.label}
                        />
                      ))
                    : [
                        <FormControlLabel
                          key="yes"
                          value="yes"
                          control={<Radio />}
                          label={question.yesLabel ?? "Yes"}
                        />,
                        <FormControlLabel
                          key="no"
                          value="no"
                          control={<Radio />}
                          label={question.noLabel ?? "No"}
                        />,
                      ]}
                </RadioGroup>
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        )}

        {question.type === "checkbox" && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => {
              const current = Array.isArray(field.value)
                ? (field.value as string[])
                : [];
              return (
                <FormControl error={Boolean(error)}>
                  <FormLabel sx={{ display: "none" }}>Options</FormLabel>
                  <FormGroup>
                    {question.options.map((o) => (
                      <FormControlLabel
                        key={o.id}
                        control={
                          <Checkbox
                            checked={current.includes(o.label)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...current, o.label]
                                : current.filter((v) => v !== o.label);
                              field.onChange(next);
                            }}
                          />
                        }
                        label={o.label}
                      />
                    ))}
                  </FormGroup>
                  {error ? (
                    <Typography variant="caption" color="error">
                      {error}
                    </Typography>
                  ) : null}
                </FormControl>
              );
            }}
          />
        )}

        {question.type === "dropdown" && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(error)}>
                <Select {...field} displayEmpty>
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {question.options.map((o) => (
                    <MenuItem key={o.id} value={o.label}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        )}

        {question.type === "rating" && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => (
              <Box>
                <Rating
                  max={question.max}
                  value={typeof field.value === "number" ? field.value : null}
                  onChange={(_, value) => field.onChange(value ?? undefined)}
                />
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : null}
              </Box>
            )}
          />
        )}

        {question.type === "linear_scale" && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => (
              <FormControl error={Boolean(error)}>
                <RadioGroup
                  row
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {Array.from(
                    { length: question.max - question.min + 1 },
                    (_, i) => question.min + i,
                  ).map((v) => (
                    <FormControlLabel
                      key={v}
                      value={String(v)}
                      control={<Radio />}
                      label={String(v)}
                    />
                  ))}
                </RadioGroup>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">
                    {question.minLabel ?? ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {question.maxLabel ?? ""}
                  </Typography>
                </Box>
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        )}
      </Stack>
    </Paper>
  );
}

function toAnswers(
  questions: Question[],
  values: Record<string, unknown>,
): Answer[] {
  const answers: Answer[] = [];

  for (const q of questions) {
    if (q.type === "section_divider" || q.type === "paragraph") continue;
    const v = values[q.id];
    if (q.type === "yes_no") {
      if (v === "yes") answers.push({ questionId: q.id, value: true });
      else if (v === "no") answers.push({ questionId: q.id, value: false });
      else answers.push({ questionId: q.id, value: null });
      continue;
    }
    if (q.type === "checkbox") {
      answers.push({
        questionId: q.id,
        value: Array.isArray(v) ? (v as string[]) : [],
      });
      continue;
    }
    if (
      q.type === "number" ||
      q.type === "rating" ||
      q.type === "linear_scale"
    ) {
      answers.push({
        questionId: q.id,
        value: typeof v === "number" ? v : null,
      });
      continue;
    }
    answers.push({ questionId: q.id, value: typeof v === "string" ? v : "" });
  }

  return answers;
}
