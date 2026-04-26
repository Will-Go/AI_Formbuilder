//NOTE: This component is used to display HTML text with a "see more" button if the text is too long
import React, { useRef, useState, useEffect } from "react";
import { Typography } from "@mui/material";
import DOMPurify from "dompurify";

//UTILS
import { cn } from "../utils/cn";

interface TextHTMLDisplayerProps {
  html: string;
  className?: string;
  textClassName?: string;
  numClamp?: number;
  maxHeight?: number;
}

// Function to detect URLs and convert them to clickable links
function linkifyText(html: string): string {
  // First, check if the text already contains anchor tags to avoid double-processing
  if (html.includes("<a ") || html.includes("<a>")) {
    return html;
  }

  // Simple regex approach that works with both plain text and HTML
  // URL regex pattern that matches http, https, www, and basic domain patterns
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;

  return html.replace(urlRegex, (url) => {
    // Clean up any trailing punctuation that might have been captured
    const cleanUrl = url.replace(/[.,;:!?]+$/, "");

    return `<a href="${cleanUrl}" target='_blank' rel='noopener noreferrer' class="text-accent-500 hover:text-accent-400 underline transition-colors duration-200">${cleanUrl}</a>`;
  });
}

export default function TextHTMLDisplayer({
  html,
  className,
  textClassName,
  numClamp = 20,
  maxHeight,
}: TextHTMLDisplayerProps) {
  // Set config to allow target and rel
  const config = {
    ALLOWED_TAGS: ["a", "p", "strong", "em", "u", "ul", "ol", "li", "br"],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  };

  // Hook to enforce safe `rel` on target="_blank"
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute(
        "class",
        "text-accent-500 hover:text-accent-400 underline transition-colors duration-200",
      );
    }
  });

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowed, setIsOverflowed] = useState(false);

  // Process the HTML to linkify URLs
  const processedHtml = linkifyText(html);
  useEffect(() => {
    const checkOverflow = () => {
      const element = contentRef.current;
      if (element) {
        // Check if the content overflows
        if (maxHeight) {
          setIsOverflowed(element.scrollHeight > maxHeight);
        } else {
          // Using line clamp approach
          const lineHeight =
            parseInt(window.getComputedStyle(element).lineHeight) || 20;
          const estimatedHeight = lineHeight * numClamp;
          setIsOverflowed(element.scrollHeight > estimatedHeight);
        }
      }
    };

    // Check after render and after any window resize
    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [processedHtml, maxHeight, numClamp]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        className={cn("break-words whitespace-normal ", textClassName)}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: expanded ? "visible" : "hidden",
          ...(expanded
            ? {}
            : maxHeight
              ? { maxHeight: `${maxHeight}px` }
              : {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: numClamp,
                }),
        }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(processedHtml, config),
        }}
      />

      {isOverflowed && (
        <Typography
          component="button"
          onClick={() => setExpanded(!expanded)}
          className="text-accent-500! mt-1 cursor-pointer"
          variant="caption"
        >
          {expanded ? "See less" : "See more"}
        </Typography>
      )}
    </div>
  );
}
