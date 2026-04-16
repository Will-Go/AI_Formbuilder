import { Metadata } from "next";
import ViewFormPage from "@/modules/view-form/page/ViewFormPage";
import { Form } from "@/shared/types/forms";
import { supabaseAdmin } from "@/shared/services/supabase/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formId: string }>;
}): Promise<Metadata> {
  const { formId } = await params;
  try {
    const { data, error } = await supabaseAdmin
      .from("forms")
      .select("title, description")
      .eq("id", formId)
      .single();

    if (!error && data) {
      console.log("data", data);

      return {
        title: data.title,
        description: data.description || "View this form",
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Form Not Found",
    description: "The form you are looking for does not exist.",
  };
}

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
