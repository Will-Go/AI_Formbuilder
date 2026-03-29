"use client";

import SearchIcon from "@mui/icons-material/Search";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Image from "next/image";

export default function DashboardTopBar({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Image
            src="/form_ai_icon.svg"
            alt="Forms AI"
            width={32}
            height={32}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 100 }}>
            Forms AI
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 0.75,
            borderRadius: 999,
            border: "1px solid",
            borderColor: "divider",
            width: { xs: 220, sm: 420 },
            bgcolor: "rgba(0,0,0,0.04)",
            transition: "all 0.2s",
            "&:focus-within": {
              bgcolor: "background.paper",
              boxShadow: 1,
              borderColor: "transparent",
            },
          }}
        >
          <SearchIcon fontSize="small" color="action" />
          <InputBase
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            sx={{ ml: 1, flex: 1, fontSize: "0.9375rem" }}
            inputProps={{ "aria-label": "Search forms" }}
          />
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
