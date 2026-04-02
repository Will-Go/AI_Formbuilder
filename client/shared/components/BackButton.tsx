"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "@bprogress/next";
import { Button, ButtonProps } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export default function BackButton(
  props: ButtonProps & {
    label?: string;
  },
) {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowButton(window.history.length > 2);
  }, []);

  if (!showButton) return null;

  return (
    <Button
      onClick={() => (props.href ? router.push(props.href) : router.back())}
      variant="outlined"
      size="large"
      startIcon={<ArrowBack />}
      {...props}
      className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-3 font-light tracking-wide transition-all duration-300"
    >
      {props.label || "Back"}
    </Button>
  );
}
