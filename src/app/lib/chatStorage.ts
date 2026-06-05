import type { Conversation } from "@/app/types/chat";

const KEY = "conversations";

function saveConversations(data: Conversation[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return [];
    return JSON.parse(saved).map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

//debounce
//防止过于频繁地保存聊天记录，尤其是在 AI 回复时，每个字符都更新消息并保存会导致性能问题。
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debounceSaveConversations(data: Conversation[]) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveConversations(data);
  }, 300);
}

export { saveConversations, loadConversations, debounceSaveConversations };
