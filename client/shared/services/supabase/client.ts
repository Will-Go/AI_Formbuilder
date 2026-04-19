import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabase = createClient();

/**
 * Subscribes to realtime INSERT events on the responses table for a specific form.
 * Ensures the UI counter reflects accurate response counts without requiring page refreshes.
 *
 * @param formId The UUID of the form to listen for.
 * @param onInsert Callback triggered when a new response is inserted.
 * @returns A channel object that must be unsubscribed from on component unmount.
 */
export function subscribeToFormResponses(
  formId: string,
  onInsert: (payload: unknown) => void,
) {
  const channel = supabase
    .channel(`public:responses:form_id=eq.${formId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "responses",
        filter: `form_id=eq.${formId}`,
      },
      onInsert,
    )
    .subscribe((status, err) => {
      if (err) {
        console.error("Supabase Realtime subscription error:", err);
      }
    });

  return channel;
}
