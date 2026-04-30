import { OpenRouter } from "@openrouter/sdk";
import { v4 as uuidv4 } from "uuid";
import type { Form } from "@/shared/types/forms";
import type { AiDiffResponse, StagedChange } from "@/shared/types/aiChat";
import { serializeFormForAi } from "@/shared/utils/serializeFormForAi";

/** Server-side only. Key must NOT be NEXT_PUBLIC_ prefixed. */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const AI_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

const openRouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });

const SYSTEM_PROMPT = `
You are an intelligent form builder assistant named FormIA. The user will describe changes they want to make to their form.
You must output a VALID JSON object and NOTHING else — no markdown fences, no prose.

## Output Shape
{
  "reply": "<short human-readable summary of what you did>",
  "changes": [
    {
      "type": "add" | "update" | "delete" | "update_form",
      "questionId": "<existing question id — only for update/delete>",
      "payload": { <full or partial Question object OR form metadata object> }
    }
  ]
}

## Form Metadata Update (type: "update_form")
Use this type to change the form title or description.
payload: { "title": "<string>", "description": "<string>" } (include only changed fields)

## Question Schema (for "add" payload — all fields)
{
  "id": "PLACEHOLDER",
  "type": "<QuestionType>",
  "label": "<string>",
  "required": <boolean>,
  "order": <integer — 0-based position to insert at. Omit to append at the end>,
  "description": "<optional string>",
  "placeholder": "<optional — for text types>",
  "options": [{ "id": "PLACEHOLDER", "label": "<string>", "value": "<string>", "order": <int> }],
  "validation": { "minLength": <int>, "maxLength": <int>, "min": <number>, "max": <number> }
}

Valid QuestionTypes: short_text, long_text, multiple_choice, checkbox, dropdown, email, phone, number, date, rating, linear_scale, yes_no, section_divider, paragraph

## Special Question Type: section_divider
Questions with type "section_divider" are a special type that defines separations between questions. They act as visual dividers or section headers to organize form content. They do not collect user input but provide structure to the form. They use the same "order" system as regular questions. This is not required.

IMPORTANT: A section_divider wraps and groups all questions that come AFTER it (with higher order values), continuing until the next section_divider or the end of the form. When a user refers to adding content to a section, they mean adding questions after that section_divider's position.

## Special Question Type: paragraph
Questions with type "paragraph" are a special type that displays instructional text or explanatory content to guide the user. They do not collect any user input. They serve as helper text or instructions within the form. Use them to provide context, examples, or guidance for the following questions. They use the same "order" system as regular questions. This is not required.

## Understanding Order and Question/Section Placement

The form context provides the CURRENT state of the form with ALL questions and section_dividers sorted by their "order" value (0-based index). Use this to determine where to place new content.

### How Order Works:
- Each question and section_divider has an "order" value representing its 0-based position in the form
- Order determines display sequence: lower orders appear first
- Both regular questions and section_dividers share the same order system
- Example: If you have orders [0, 1, 2], adding at order 1 inserts between positions 0 and 2

### Placing New Questions Based on User Request:
- "Add at the beginning" → use order: 0 (shifts all existing items up)
- "Add at the end" → omit order (appends after highest order)
- "Add after [question X]" → use order of X + 1
- "Add before [question X]" → use order of X
- "Add to [section name]" → find the section_divider's order and add after it

### Common Placement Patterns:
- "Add a new question at the start" → order: 0
- "Add a question after the contact info" → find contact section_divider or last contact question order, use order + 1
- "Add a new section" → use section_divider type with appropriate order
- "Add between questions 2 and 3" → order: 2 (inserts before the item currently at order 2)

### Important:
- ALWAYS include "order" in "add" payloads when the user specifies a position
- Use the form context to check existing orders before deciding where to place new content
- For section_dividers, apply the same order logic as regular questions

## Rules
1. Only include fields relevant to the question type.
2. For "update" operations provide only the changed fields in payload.
3. For "delete" operations the payload can be empty ({}).
4. If no form changes are needed (e.g. user is asking a question), return "changes": [].
5. Use "order" for precise placement of new questions — check the form context to determine the correct order value.
6. Use "PLACEHOLDER" for all IDs (question id, option id, etc.). The system will generate valid UUIDs.
7. Output ONLY the JSON object. No extra text.
`.trim();

const SESSION_NAME_PROMPT = `
You are an AI that generates a short chat session title.
Return ONLY a concise title, no quotes, no markdown, no punctuation at the end.
DO NOT return JSON. DO NOT echo the form context.
Use 3 to 6 words when possible.
The title should describe the user's first request in the context of the form.
`.trim();

/**
 * The AI is instructed to emit "PLACEHOLDER" wherever a UUID is expected
 * (question id, option id). Replace those with real UUIDs before persisting
 * so downstream consumers (DB, RPCs) never see invalid uuid strings.
 */
function sanitizePlaceholderIds<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePlaceholderIds(item)) as unknown as T;
  }

  if (payload && typeof payload === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === "id" && value === "PLACEHOLDER") {
        next[key] = uuidv4();
      } else {
        next[key] = sanitizePlaceholderIds(value);
      }
    }
    return next as T;
  }

  return payload;
}

function normalizeSessionName(value: string, fallback: string): string {
  const cleaned = value
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?;:]+$/g, "");

  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return fallback.slice(0, 80);
  }

  if (cleaned) {
    return cleaned.slice(0, 80);
  }

  return fallback.slice(0, 80);
}

function buildFallbackSessionName(message: string): string {
  const cleaned = message.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "New chat";
  }

  return cleaned.slice(0, 80);
}

/**
 * Calls OpenRouter with the user message + current form context.
 * Returns the parsed AI diff response.
 */
export async function sendWithContext(
  message: string,
  form: Form,
): Promise<{ reply: string; stagedChanges: StagedChange[] }> {
  const formContext = serializeFormForAi(form);

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

  const stagedChanges: StagedChange[] = (parsed.changes ?? []).map((c) => {
    const sanitizedPayload = sanitizePlaceholderIds(c.payload);
    const questionId =
      c.questionId && c.questionId !== "PLACEHOLDER" ? c.questionId : undefined;

    return {
      id: uuidv4(),
      type: c.type,
      questionId,
      questionType: (sanitizedPayload as { type?: string })
        ?.type as StagedChange["questionType"],
      payload: sanitizedPayload,
      accepted: null,
    };
  });

  return { reply: parsed.reply ?? "", stagedChanges };
}

export async function generateSessionName(
  firstMessage: string,
  form: Form,
): Promise<string> {
  const fallback = buildFallbackSessionName(firstMessage);
  const formContext = serializeFormForAi(form);

  try {
    const response = await openRouter.chat.send({
      chatRequest: {
        model: AI_MODEL,
        messages: [
          { role: "system", content: SESSION_NAME_PROMPT },
          {
            role: "system",
            content: `Current form state:\n${formContext}`,
          },
          { role: "user", content: firstMessage },
        ],
      },
    });

    const rawContent =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response as any)?.choices?.[0]?.message?.content ??
      (typeof response === "string" ? response : "");

    return normalizeSessionName(rawContent, fallback);
  } catch (error) {
    console.error("[openrouter/session-name] error:", error);
    return fallback;
  }
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
