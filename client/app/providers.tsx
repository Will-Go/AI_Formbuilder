"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { Toaster } from "sonner";
import { muiTheme } from "@/shared/config/mui-theme";
import EmotionRegistry from "./EmotionRegistry";
import ReactQueryWrapper from "@/shared/wrapper/ReactQueryWrapper";
import AuthProvider from "@/shared/context/AuthContext";
import ProgressBarWrapper from "@/shared/wrapper/ProgressBarWrapper";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <AppRouterCacheProvider>
        <ProgressBarWrapper>
          <ReactQueryWrapper>
            <AuthProvider>
              <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
                <Toaster closeButton richColors position="top-right" />
              </ThemeProvider>
            </AuthProvider>
          </ReactQueryWrapper>
        </ProgressBarWrapper>
      </AppRouterCacheProvider>
    </EmotionRegistry>
  );
}
