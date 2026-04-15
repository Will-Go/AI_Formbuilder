import { apiRequestSS } from "@/shared/utils/apiRequestSS";
import ViewFormPage from "@/modules/view-form/page/ViewFormPage";
import { Form } from "@/shared/types/forms";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  let form: Form | null = null;

  try {
    form = await apiRequestSS<Form>({
      method: "get",
      url: `/api/form/${formId}`,
    });
  } catch (_error) {
    console.error("Error fetching form:", _error);
    // If the API request fails (e.g. 404 or network error), pass null
    form = null;
  }

  return <ViewFormPage initialForm={form} />;
}
