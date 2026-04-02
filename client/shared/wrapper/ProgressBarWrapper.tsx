"use client";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";

export default function ProgressBarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider
      height="4px"
      color="#93A08A"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
