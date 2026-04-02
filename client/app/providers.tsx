"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { muiTheme } from "@/config/mui-theme";
import EmotionRegistry from "./EmotionRegistry";
import ReactQueryWrapper from "@/shared/wrapper/ReactQueryWrapper";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <AppRouterCacheProvider>
        <ReactQueryWrapper>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </ReactQueryWrapper>
      </AppRouterCacheProvider>
    </EmotionRegistry>
  );
}
