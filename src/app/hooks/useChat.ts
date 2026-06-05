import { useState, useEffect, useRef } from "react";
import type { Message, Conversation } from "../types/chat";
import {
  loadConversations,
  debounceSaveConversations,
} from "../lib/chatStorage";

export default function useChat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null); //用于取消正在进行的请求

  const [editingId, setEditingID] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const messages = activeConversation?.messages ?? [];
  const models = [
    { label: "Gemini 2.5 Flash", id: "gemini-2.5-flash", provider: "gemini" },
    { label: "GPT-4o mini", id: "gpt-4o-mini", provider: "openai" },
  ];
  const [selectModel, setSelectModel] = useState(models[0]);
  const [reactions, setReactions] = useState<
    Record<
      string,
      { likes: number; dislikes: number; userVote: "likes" | "dislikes" | null }
    >
  >({});

  function handleReaction(msgId: string, type: "likes" | "dislikes") {
    setReactions((prev) => {
      const current = prev[msgId] ?? { likes: 0, dislikes: 0, userVote: null };
      if (current.userVote === type) {
        return {
          ...prev,
          [msgId]: { ...current, [type]: current[type] - 1, userVote: null },
        };
      } else {
        const opposite = type === "likes" ? "dislikes" : "likes";
        return {
          ...prev,
          [msgId]: {
            ...current,
            [type]: current[type] + 1,
            [opposite]:
              current.userVote === opposite
                ? current[opposite] - 1
                : current[opposite],
            userVote: type,
          },
        };
      }
    });
  }
  function handleNewChat() {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  }
  function handleDeleteConv(convId: string) {
    setConversations((prev) => prev.filter((conv) => conv.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
    }
  }

  function setMessages(
    updater: Message[] | ((prev: Message[]) => Message[]),
    targetId: string | null = activeConvId
  ) {
    setConversations((prevConvs) =>
      prevConvs.map((conv) => {
        if (conv.id !== targetId) return conv;
        const newMessages =
          typeof updater === "function" ? updater(conv.messages) : updater;
        return { ...conv, messages: newMessages, updatedAt: new Date() };
      })
    );
  }

  function startEditing(msg: Message) {
    if (isLoading) return;
    setEditingID(msg.id);
    setEditingText(msg.content);
  }
  function cancelEditMessage() {
    setEditingID(null);
    setEditingText("");
  }
  function saveEditMessage(messageId: string) {
    const newText = editingText.trim();
    if (!newText) return;
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;
    const editedMessage: Message = {
      ...messages[messageIndex],
      content: newText,
      timestamp: new Date(),
    };
    const messageBeforeEdited = messages.slice(0, messageIndex);
    const updatedMessages = [...messageBeforeEdited, editedMessage];
    setEditingID(null);
    setEditingText("");
    setMessages(updatedMessages);
    handleSend(newText, [...messageBeforeEdited, editedMessage], false);
  }
  function handleClear() {
    if (!activeConvId) return;
    setMessages([]);
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  }
  function handleStop() {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }
  function handleRegenerate() {
    if (isLoading) return;
    const lastAssostantIndex = messages
      .map((msg) => msg.role)
      .lastIndexOf("assistant");

    if (lastAssostantIndex === -1) return;

    const messagesWhithoutLastAssistant = messages.slice(0, lastAssostantIndex);
    const lastUserMessage = [...messagesWhithoutLastAssistant]
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;
    setMessages(messagesWhithoutLastAssistant);
    handleSend(lastUserMessage.content, messagesWhithoutLastAssistant, false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setConversations(loadConversations());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      debounceSaveConversations(conversations);
    }
  }, [conversations]);

  async function handleSend(
    text?: string,
    baseMessages = messages,
    shouldAddUserMessage = true
  ) {
    if (isLoading) return;
    const messageText = (text ?? input).trim();
    if (!messageText) return;

    const convId =
      activeConvId ??
      (() => {
        const newId = crypto.randomUUID();
        const newConv: Conversation = {
          id: newId,
          title: "New Conversation",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        return newId;
      })();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    const streamingId = crypto.randomUUID();

    const streamingMessage: Message = {
      id: streamingId,
      role: "assistant",
      content: "",
      streaming: true,
      timestamp: new Date(),
    };

    //Throttle
    //在流式过程中，AI 可能会频繁地更新消息内容（每个字符或每几个字符）。如果我们每次更新都调用 setMessages 并保存聊天记录，会导致性能问题。为了解决这个问题，我们可以实现一个节流机制，限制更新消息的频率，例如每 40ms 更新一次。
    let assistantContent = "";
    let lastFlushTime = 0;
    function flushAssistantMessage(force = false) {
      const now = Date.now();
      if (!force && now - lastFlushTime < 40) return; //节流，避免过于频繁地更新消息
      lastFlushTime = now;
      setMessages(
        (prev) =>
          prev.map((msg) =>
            msg.id === streamingId ? { ...msg, content: assistantContent } : msg
          ),
        convId
      );
    }

    const updatedMessages = shouldAddUserMessage
      ? [...baseMessages, userMessage]
      : [...baseMessages];
    const title =
      messageText.slice(0, 24) + (messageText.length > 24 ? "..." : "");

    setMessages([...updatedMessages, streamingMessage], convId);
    if (activeConversation?.messages.length === 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConvId ? { ...conv, title } : conv
        )
      );
    }

    setInput("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat-stream", {
        method: "POST",
        signal: controller.signal, //允许我们在需要时取消请求。
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectModel.id,
          provider: selectModel.provider,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error("Streaming request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        //console.log("raw buffer:", buffer);

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        // console.log("events:", events);

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;

          const data = event.replace("data: ", "").trim();

          if (data === "[DONE]") {
            flushAssistantMessage(true); //强制刷新剩余内容
            const finalMessages: Message[] = [
              ...updatedMessages,
              {
                ...streamingMessage,
                content: assistantContent,
                streaming: false,
              },
            ];
            setMessages(finalMessages, convId);
            return;
          }
          const parsed = JSON.parse(data);

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          const delta = parsed.text ?? "";
          //console.log("delta:", delta);

          for (let i = 0; i < delta.length; i++) {
            assistantContent += delta[i];
            flushAssistantMessage();
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        const stopedMessages: Message[] = [
          ...updatedMessages,
          {
            ...streamingMessage,
            content:
              assistantContent + "\n\n*--- Response stopped by user ---*",
            streaming: false,
          },
        ];
        setMessages(stopedMessages, convId);
        return;
      }
      setMessages(
        (prev) =>
          prev.map((msg) =>
            msg.id === streamingId
              ? {
                  ...msg,
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: "Sorry, something went wrong. Please try again.",
                  streaming: false,
                }
              : msg
          ),
        convId
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }
  return {
    input,
    setInput,
    messages,
    conversations,
    activeConvId,
    setActiveConvId,
    isLoading,
    cleared,
    editingId,
    editingText,
    setEditingText,
    copiedId,
    setCopiedId,
    reactions,
    bottomRef,
    handleSend,
    handleReaction,
    handleNewChat,
    handleDeleteConv,
    handleClear,
    handleStop,
    handleRegenerate,
    startEditing,
    cancelEditMessage,
    saveEditMessage,
    models,
    selectModel,
    setSelectModel,
  };
}
