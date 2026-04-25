import { ReactNode } from "react";
import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import ChatInput from "./ChatInput";

//UTILS
import { stripHtml } from "../utils/html";

interface ChatInputLayoutProps {
  onSend: (message: string) => Promise<void>;
  children: ReactNode;
}

export default function ChatInputLayout({
  onSend,
  children,
}: ChatInputLayoutProps) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    // Handle sending the message here
    try {
      setIsSending(true);

      await onSend(message);
      setMessage(""); // Clear the input after sending
    } catch {
    } finally {
      setIsSending(false);
    }
  };
  const onChange = (value: string) => {
    if (isSending) return;
    setMessage(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isSending &&
      stripHtml(message).trim()
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="sticky bottom-0 w-full px-4 pb-4 pt-2 bg-white/90 backdrop-blur-md border-t border-primary-200 z-50">
        <div className="flex items-center max-w-4xl mx-auto w-full rounded-xl bg-white border border-accent-200 p-2 shadow-lg">
          <ChatInput
            value={message}
            onChange={onChange}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!stripHtml(message).trim() || isSending}
            className="ml-2"
          >
            {isSending ? (
              <CircularProgress size={18} />
            ) : (
              <SendIcon fontSize="medium" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
