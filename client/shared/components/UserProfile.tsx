"use client";

import React from "react";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import Logout from "@mui/icons-material/Logout";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Key from "@mui/icons-material/Key";
import { useAuth } from "@/shared/context/AuthContext";
import Link from "next/link";
import { notifyError } from "@/shared/utils/toastNotify";

export function UserProfile() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const open = Boolean(anchorEl);
  const { user, claims, signOut, needsProfileCompletion } = useAuth();

  const fullName = [
    claims?.app_metadata?.first_name,
    claims?.app_metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const displayName =
    fullName || user?.email?.split("@")[0] || user?.phone || "User";
  const email = user?.email || "user@gmail.com";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      handleClose();
    } catch (error) {
      notifyError((error as Error).message || "Failed to log out.");
    } finally {
      setIsSigningOut(false);
    }
  };
  return (
    <>
      <Badge
        color="warning"
        variant="dot"
        overlap="circular"
        invisible={!needsProfileCompletion}
      >
        <Avatar
          alt={avatarLetter}
          onClick={handleClick}
          sx={{ width: 32, height: 32, cursor: "pointer" }}
          className="bg-accent!"
          src={user?.user_metadata?.avatar_url || undefined}
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Avatar
            alt={avatarLetter}
            sx={{ width: 40, height: 40, mr: 1.5 }}
            className="bg-accent!"
            src={user?.user_metadata?.avatar_url || undefined}
          />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
          </Box>
        </Box>
        {needsProfileCompletion && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Chip
              size="small"
              color="warning"
              label="Profile incomplete"
              variant="outlined"
            />
          </Box>
        )}
        <Divider />
        {needsProfileCompletion && (
          <Link href="/complete-profile">
            <MenuItem>
              <ListItemIcon>
                <Key fontSize="small" />
              </ListItemIcon>
              Complete profile
            </MenuItem>
          </Link>
        )}
        <MenuItem onClick={handleLogout} disabled={isSigningOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
