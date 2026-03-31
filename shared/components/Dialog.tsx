"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconButton,
  Dialog as MuiDialog,
  DialogContent,
  DialogTitle,
  DialogProps as MuiDialogProps,
} from "@mui/material";

import { cn } from "@/shared/utils/cn";

//ICONS
import CloseIcon from "@mui/icons-material/Close";

interface DialogProps extends MuiDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  header?: string | React.ReactNode;
  children: React.ReactNode;
  // Optional custom portal container (defaults to document.body)
  portalContainer?: HTMLElement | null;
  isError?: boolean;
}

export default function Dialog({
  open,
  setOpen,
  header,
  children,
  portalContainer,
  isError,
  ...MuiDialogProps
}: DialogProps) {
  const [container, setContainer] = useState<HTMLElement | null>(
    typeof window !== "undefined" ? document.body : null,
  );

  const handleClose = () => {
    setOpen(false);
  };

  // Update portal container if custom one is provided
  useEffect(() => {
    if (portalContainer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContainer(portalContainer);
    } else if (typeof window !== "undefined" && !container) {
      setContainer(document.body);
    }
  }, [portalContainer, container]);

  // Don't render if no container available (SSR)
  if (!container) {
    return null;
  }

  return createPortal(
    <MuiDialog
      open={open}
      onClose={handleClose as unknown as MuiDialogProps["onClose"]}
      onMouseDown={(e) => e.stopPropagation()}
      PaperProps={{
        className: cn(
          `shadow-2xl! p-0! w-full m-3! border-t-4!`,
          MuiDialogProps.PaperProps?.className,
          isError ? "border-error!" : "border-accent!",
        ),
        elevation: 0,
        sx: {
          ...MuiDialogProps.PaperProps?.sx,
        },
        ...MuiDialogProps.PaperProps,
      }}
      {...MuiDialogProps}
    >
      <DialogTitle className="border-b border-gray-200">
        <div
          className={`flex w-full grow items-center ${header ? "justify-between" : "justify-end"} relative`}
        >
          {header ?? " "}
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>{" "}
        </div>
      </DialogTitle>
      <DialogContent className="z-10 p-2! lg:p-4!">{children}</DialogContent>
    </MuiDialog>,
    container,
  );
}
