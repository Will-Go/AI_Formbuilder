"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import { Controller, useFormContext } from "react-hook-form";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";
import type { Question } from "@/shared/types/forms";

interface QuestionPreviewProps {
  question: Question;
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
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
      tabIndex={-1}
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
