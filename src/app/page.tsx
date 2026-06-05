"use client";
import InputArea from "./components/InputArea";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import useChat from "./hooks/useChat";
import { useState } from "react";

export default function Home() {
  const {
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
    selectModel,
    models,
    setSelectModel,
  } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  function toggleSidebar() {
    console.log("error");
    setIsSidebarOpen((prev) => !prev);
    console.log("error1");
  }
  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        setActiveConvId={setActiveConvId}
        handleNewChat={handleNewChat}
        handleDeleteConv={handleDeleteConv}
        isSidebarOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className="chat">
        <header className="header">
          <div className="avatar">🤖</div>
          <div className="service-name">
            <div>AI Chat</div>
            <div className="status">
              <span className={`status-dot ${isLoading ? "typing" : ""}`} />
              {isLoading ? "Typing..." : "Online"}
            </div>
          </div>
          {messages.length > 0 && (
            <button
              className={`clear-btn ${cleared ? "cleared" : ""}`}
              onClick={handleClear}
              disabled={isLoading}
              title="Clear conversation"
            >
              {cleared ? "✓" : <FontAwesomeIcon icon={faTrashCan} />}
            </button>
          )}
        </header>
        <main className="main">
          {messages.length === 0 ? (
            <section className="welcome">
              <div className="welcome-icon">💬</div>
              <h1 className="welcome-title">Hi, I'm your AI Assistant</h1>
              <p className="welcome-text">
                Ask me anything — I'm here to help.
              </p>
              <div className="suggestions">
                <button
                  className="suggestion-btn"
                  onClick={() => handleSend("Help me write an email")}
                >
                  📝 Help me write an email
                </button>

                <button
                  className="suggestion-btn"
                  onClick={() => handleSend("Recommend a travel destination")}
                >
                  🌍 Recommend a travel destination
                </button>

                <button
                  className="suggestion-btn"
                  onClick={() => handleSend("Give me a startup idea")}
                >
                  💡 Give me a startup idea
                </button>
              </div>
            </section>
          ) : (
            <MessageList
              messages={messages}
              saveEditMessage={saveEditMessage}
              editingId={editingId}
              editingText={editingText}
              setEditingText={setEditingText}
              cancelEditMessage={cancelEditMessage}
              isLoading={isLoading}
              copiedId={copiedId}
              setCopiedId={setCopiedId}
              handleRegenerate={handleRegenerate}
              bottomRef={bottomRef}
              startEditing={startEditing}
              handleReaction={handleReaction}
              reactions={reactions}
            />
          )}
        </main>
        <InputArea
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          handleStop={handleStop}
          selectModel={selectModel}
          models={models}
          setSelectModel={setSelectModel}
        />
      </div>
    </div>
  );
}
