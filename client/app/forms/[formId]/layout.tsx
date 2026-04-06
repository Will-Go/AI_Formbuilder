"use client";
import React, { useEffect } from "react";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";

import { stripHtml } from "@/shared/utils/html";
export default function Layout({ children }: { children: React.ReactNode }) {
  const form = useFormsStore((s) => s.form);

  useEffect(() => {
    if (!form) {
      return;
    }

    document.title = `${stripHtml(form.title) || "Untitled form"}`;
  }, [form]);
  return children;
}
