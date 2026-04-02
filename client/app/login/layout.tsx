import React from "react";
import { createClient } from "@/shared/services/supabase/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is already signed in, redirect to "/forms"
  if (user) {
    redirect("/forms");
  }

  return children;
}
