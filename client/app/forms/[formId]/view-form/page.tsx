import ViewFormPage from "@/modules/view-form/page/ViewFormPage";
import { Form } from "@/shared/types/forms";
import { supabaseAdmin } from "@/shared/services/supabase/admin";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  let form: Form | null = null;

  try {
    const { data, error } = await supabaseAdmin.rpc("get_form_details", {
      p_form_id: formId,
    });

    if (!error && data) {
      form = data as Form;
    } else if (error) {
      console.error("Error fetching form:", error);
    }
  } catch (_error) {
    console.error("Error fetching form:", _error);
    form = null;
  }

  return <ViewFormPage initialForm={form} />;
}
