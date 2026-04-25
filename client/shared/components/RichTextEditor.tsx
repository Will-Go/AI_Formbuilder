"use client";
import "@/shared/styles/tiptap.css";
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatClearIcon from "@mui/icons-material/FormatClear";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowLists?: boolean;
  fontSize?: number;
  fontWeight?: number;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  allowLists = true,
  fontSize = 14,
  fontWeight = 400,
  readOnly = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        bulletList: allowLists ? {} : false,
        orderedList: allowLists ? {} : false,
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Avoid passing back empty paragraph if there's no real text
      const html = editor.getHTML();
      if (editor.isEmpty) {
        onChange("");
      } else {
        onChange(html);
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Update content if value changes externally (e.g. switching questions)
  useEffect(() => {
    if (!editor || editor.isFocused) return;

    const currentHtml = editor.getHTML();
    const isActuallyEmpty =
      editor.isEmpty && (value === "" || value === "<p></p>");

    if (value !== currentHtml && !isActuallyEmpty) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      <Box
        sx={{
          ".ProseMirror": {
            outline: "none",
            fontSize: fontSize,
            fontWeight: fontWeight,
            minHeight: "1.5em",
            fontFamily: "inherit",
            p: {
              margin: 0,
              fontSize: "inherit",
              fontWeight: "inherit",
            },
            "p.is-editor-empty:first-of-type::before": {
              color: "text.disabled",
              content: "attr(data-placeholder)",
              float: "left",
              height: 0,
              pointerEvents: "none",
            },
            ul: { paddingLeft: "1.5rem", margin: 0, listStyleType: "disc" },
            ol: { paddingLeft: "1.5rem", margin: 0, listStyleType: "decimal" },
            li: {
              p: {
                margin: 0,
              },
            },
            a: {
              color: "primary.main",
              textDecoration: "underline",
              cursor: "pointer",
            },
          },
          borderBottom: isFocused ? "2px solid" : "1px solid",
          borderColor: isFocused ? "primary.main" : "divider",
          pb: 0.5,
          transition: "border-color 0.2s ease",
          "&:hover": {
            borderColor: isFocused ? "primary.main" : "text.primary",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {isFocused && !readOnly && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            pt: 0.5,
            flexWrap: "wrap",
          }}
          onMouseDown={(e) => {
            // Prevent toolbar clicks from blurring the editor
            e.preventDefault();
          }}
        >
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive("bold") ? "primary" : "default"}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive("italic") ? "primary" : "default"}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive("underline") ? "primary" : "default"}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={setLink}
            color={editor.isActive("link") ? "primary" : "default"}
          >
            <InsertLinkIcon fontSize="small" />
          </IconButton>

          {allowLists && (
            <>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                color={editor.isActive("orderedList") ? "primary" : "default"}
              >
                <FormatListNumberedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                color={editor.isActive("bulletList") ? "primary" : "default"}
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            </>
          )}

          <IconButton
            size="small"
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
          >
            <FormatClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
