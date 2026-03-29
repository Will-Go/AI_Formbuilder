"use client";
import React, { useEffect } from "react";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useParams } from "next/navigation";
export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const form = useFormsStore((s) => s.getFormById(formId));

  useEffect(() => {
    if (!form) {
      return;
    }

    document.title = `${form?.title || "Untitled form"}`;
  }, [form]);
  return children;
}
