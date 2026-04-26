import { OpenRouter } from "@openrouter/sdk";
import { v4 as uuidv4 } from "uuid";
import type { Form } from "@/shared/types/forms";
import type { AiDiffResponse, StagedChange } from "@/shared/types/aiChat";

/** Server-side only. Key must NOT be NEXT_PUBLIC_ prefixed. */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const AI_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

const openRouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });

const SYSTEM_PROMPT = `
You are an intelligent form builder assistant. The user will describe changes they want to make to their form.
You must output a VALID JSON object and NOTHING else — no markdown fences, no prose.

## Output Shape
{
  "reply": "<short human-readable summary of what you did>",
  "changes": [
    {
      "type": "add" | "update" | "delete",
      "questionId": "<existing question id — only for update/delete>",
      "payload": { <full or partial Question object — see schema below> }
    }
  ]
}

## Question Schema (for "add" payload — all fields)
{
  "id": "PLACEHOLDER",
  "type": "<QuestionType>",
  "label": "<string>",
  "required": <boolean>,
  "index": <integer — 0-based position to insert at. Omit to append at the end>,
  "description": "<optional string>",
  "placeholder": "<optional — for text types>",
  "options": [{ "id": "PLACEHOLDER", "label": "<string>", "value": "<string>", "order": <int> }],
  "validation": { "minLength": <int>, "maxLength": <int>, "min": <number>, "max": <number> }
}

Valid QuestionTypes: short_text, long_text, multiple_choice, checkbox, dropdown, email, phone, number, date, rating, linear_scale, yes_no, section_divider, paragraph

## Rules
1. Only include fields relevant to the question type.
2. For "update" operations provide only the changed fields in payload.
3. For "delete" operations the payload can be empty ({}).
4. If no form changes are needed (e.g. user is asking a question), return "changes": [].
5. Use "index" for precise placement of new questions. Omit it to append to the end.
6. Use "PLACEHOLDER" for all IDs (question id, option id, etc.). The system will generate valid UUIDs.
7. NEVER include "order" in the payload for "add" or "update" operations. The system handles ordering automatically.
8. Output ONLY the JSON object. No extra text.
`.trim();

/**
 * Calls OpenRouter with the user message + current form context.
 * Returns the parsed AI diff response.
 */
export async function sendWithContext(
  message: string,
  form: Form,
): Promise<{ reply: string; stagedChanges: StagedChange[] }> {
  const formContext = JSON.stringify(
    {
      id: form.id,
      title: form.title,
      questions: form.questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          order: q.order,
        })),
    },
    null,
    2,
  );

  const response = await openRouter.chat.send({
    chatRequest: {
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          name: "form_context",
          content: `Current form state:\n${formContext}`,
        },
        { role: "user", content: message },
      ],
    },
  });

  // Extract raw text content from the response
  const rawContent =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (response as any)?.choices?.[0]?.message?.content ??
    (typeof response === "string" ? response : "");

  let parsed: AiDiffResponse;
  try {
    // Strip markdown code fences if model wraps output accidentally
    const cleaned = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(cleaned) as AiDiffResponse;
  } catch {
    // Fall back to a plain text reply with no changes
    parsed = { reply: rawContent || "Done.", changes: [] };
  }

  const stagedChanges: StagedChange[] = (parsed.changes ?? []).map((c) => ({
    id: uuidv4(),
    type: c.type,
    questionId: c.questionId,
    questionType: (c.payload as { type?: string })
      ?.type as StagedChange["questionType"],
    payload: c.payload,
    accepted: null,
  }));

  return { reply: parsed.reply ?? "", stagedChanges };
}

/**
 * Legacy thin wrapper kept for reference / tests.
 * @deprecated Use sendWithContext instead.
 */
export const send = async (message: string) =>
  openRouter.chat.send({
    chatRequest: {
      model: AI_MODEL,
      messages: [{ role: "user", content: message }],
    },
  });
