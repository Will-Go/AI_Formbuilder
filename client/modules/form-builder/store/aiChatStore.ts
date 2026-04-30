import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import type {
  ChatSession,
} from "@/shared/types/aiChat";

export const StagedChangeSchema = z.object({
  id: z.string(),
  type: z.enum(["add", "update", "delete"]),
  questionId: z.string().optional().nullable(),
  payload: z.record(z.string(), z.any()),
  description: z.string(),
  accepted: z.boolean().nullable(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  stagedChanges: z.array(StagedChangeSchema).optional(),
  createdAt: z.string(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  formId: z.string(),
  userId: z.string(),
  name: z.string(),
  isDeleted: z.boolean(),
  lastUsedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

interface AiChatState {
  isOpen: boolean;
  session: ChatSession | null;
  setIsOpen: (isOpen: boolean) => void;
  setSession: (session: ChatSession | null) => void;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      session: null,
      setIsOpen: (isOpen) => set({ isOpen }),
      setSession: (session) => set({ session }),
    }),
    {
      name: "ai-chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isOpen: state.isOpen }),
    },
  ),
);
