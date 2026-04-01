"use client";

import React from "react";
import Box from "@mui/material/Box";

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
import { Controller, useFormContext } from "react-hook-form";
import type { Form, Question } from "@/shared/types/forms";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";

export function FormHeader({ form }: { form: Form }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}
    >
      <Box sx={{ mb: 1 }}>
        <TextHTMLDisplayer
          html={form.title || "Untitled form"}
          textClassName="text-3xl "
        />
      </Box>
      {form.description ? (
        <Box sx={{ color: "text.secondary" }}>
          <TextHTMLDisplayer html={form.description} />
        </Box>
      ) : null}
    </Paper>
  );
}

export function QuestionRenderer({ question }: { question: Question }) {
  const { control, register, formState } =
    useFormContext<Record<string, unknown>>();
  const error = (formState.errors as Record<string, { message?: string }>)[
    question.id
  ]?.message;

  if (question.type === "section_divider") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} id={`question-${question.id}`}>
        <TextHTMLDisplayer
          html={question.label}
          textClassName="text-xl font-extrabold"
        />
      </Paper>
    );
  }

  if (question.type === "paragraph") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} id={`question-${question.id}`}>
        <Box sx={{ color: "text.secondary" }}>
          <TextHTMLDisplayer html={question.text || question.label} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        ...(error && {
          borderColor: "error.main",
          borderWidth: 1,
        }),
      }}
      id={`question-${question.id}`}
      tabIndex={-1} // Allow programmatic focus for accessibility
    >
      <Stack spacing={1.5}>
        <Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
            <TextHTMLDisplayer
              html={question.label}
              textClassName="text-[1.1rem] font-bold"
            />
            {question.required && (
              <Typography color="error" sx={{ mt: 0.5 }}>
                *
              </Typography>
            )}
          </Box>
          {question.description ? (
            <Box sx={{ mt: 0.5, color: "text.secondary" }}>
              <TextHTMLDisplayer
                html={question.description}
                textClassName="text-sm"
              />
            </Box>
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
              <FormControl error={Boolean(error)}>
                <Rating
                  value={field.value as number}
                  max={question.max}
                  onChange={(e, value) => field.onChange(value)}
                />
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        )}

        {question.type === "linear_scale" && (
          <Controller
            name={question.id}
            control={control}
            render={({ field }) => (
              <FormControl error={Boolean(error)}>
                <Stack spacing={2} direction="row" alignItems="center">
                  <Typography>{question.minLabel ?? question.min}</Typography>
                  <RadioGroup row {...field}>
                    {Array.from(
                      { length: question.max - question.min + 1 },
                      (_, i) => i + question.min,
                    ).map((value) => (
                      <FormControlLabel
                        key={value}
                        value={value}
                        control={<Radio />}
                        label={value.toString()}
                        labelPlacement="top"
                      />
                    ))}
                  </RadioGroup>
                  <Typography>{question.maxLabel ?? question.max}</Typography>
                </Stack>
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
