"use client";

import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText = ({ text, speed = 10, onComplete }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[prev.length]);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 0);
    }
  }, [displayedText, text, speed, onComplete, isComplete]);

  useEffect(() => {
    setTimeout(() => {
      setDisplayedText("");
      setIsComplete(false);
    }, 0);
  }, [text]);

  return (
    <Typography
      variant={"body2"}
      sx={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.55,
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      {displayedText}
      {!isComplete && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            backgroundColor: "currentColor",
            marginLeft: "2px",
            animation: "blink 1s step-end infinite",
          }}
        />
      )}
    </Typography>
  );
};

export default TypingText;
