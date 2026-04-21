"use client";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean; // 新增：标记这条消息正在流式输出中
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // 给 AI 回复占一个位置，内容先为空，streaming: true 表示还在输出中
    const streamingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: streamingId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        streaming: true,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Network response was not ok");
      }

      // 读取流
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 每条消息以 \n\n 结尾，按这个分割
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? ""; // 最后一段可能不完整，留着等下次

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          const parsed = JSON.parse(data);
          // 每收到一个 chunk，追加到占位消息的内容上
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId
                ? { ...m, content: m.content + parsed.text }
                : m
            )
          );
        }
      }
    } catch (error) {
      // 出错时把占位消息改成错误提示
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                content: "Sorry, something went wrong. Please try again.",
                streaming: false,
              }
            : m
        )
      );
      setIsLoading(false);
      return;
    }

    // 流结束，去掉 streaming 标记（光标消失）
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingId ? { ...m, streaming: false } : m
      )
    );
    setIsLoading(false);
  }

  return (
    <div className="chat">
      <header className="header">
        <div className="avatar">🤖</div>
        <div className="service-name">
          <div>AI Chat</div>
          <div className="status"> • Online</div>
        </div>
      </header>

      <main className="main">
        {messages.length === 0 ? (
          <section className="welcome">
            <div className="welcome-icon">💬</div>
            <h1 className="welcome-title">AI chat Assistant </h1>
            <p className="welcome-text">
              What shall we think through?
              <br />
              share what you think!
            </p>
            <div className="suggestions">
              <button
                className="suggestion-btn"
                onClick={() => handleSend("Hello, Introduce yourself")}
              >
                Hello, Introduce yourself
              </button>
              <button
                className="suggestion-btn"
                onClick={() => handleSend("Plan a trip")}
              >
                Plan a trip
              </button>
              <button
                className="suggestion-btn"
                onClick={() => handleSend("Find the best restaurant")}
              >
                Find the best restaurant
              </button>
            </div>
          </section>
        ) : (
          <div className="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === "user"
                    ? "message-row user-row"
                    : "message-row assistant-row"
                }
              >
                {msg.role === "assistant" && (
                  <div className="ai-avatar">🤖</div>
                )}
                <div className="message-item">
                  <div
                    className={
                      msg.role === "user"
                        ? "message-bubble user-bubble"
                        : "message-bubble assistant-bubble"
                    }
                  >
                    {/* 内容为空且还在 streaming 时，显示三个点 loading */}
                    {msg.content === "" && msg.streaming ? (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <div className="message-content">
                        {msg.content}
                        {/* 有内容且还在 streaming 时，显示闪烁光标 */}
                        {msg.streaming && (
                          <span className="cursor" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {msg.role === "user" && <div className="user-avatar">👤</div>}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="input-area">
        <input
          className="input"
          type="text"
          placeholder="How can I help you today?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={() => handleSend()}
          disabled={isLoading}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
