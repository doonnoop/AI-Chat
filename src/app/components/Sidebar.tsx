import type { Conversation } from "../types/chat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-regular-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { PanelsTopLeft } from "lucide-react";
import AuthButton from "./AuthButton";
import { Dot } from "lucide-react";
import { X } from "lucide-react";

type SidebarProps = {
  conversations: Conversation[];
  activeConvId: string | null;
  setActiveConvId: (id: string) => void;
  handleNewChat: () => void;
  handleDeleteConv: (id: string) => void;
  isSidebarOpen: boolean;
  onToggle: () => void;
};
export default function Sidebar({
  conversations,
  activeConvId,
  handleNewChat,
  setActiveConvId,
  handleDeleteConv,
  isSidebarOpen,
  onToggle,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <aside className={isSidebarOpen ? "sidebar" : "sidebar sidebar-closed"}>
      <div className="sidebar-header">
        <button onClick={onToggle} className="panel-btn">
          <PanelsTopLeft size={16} strokeWidth={1.5} />
        </button>
        {isSidebarOpen && (
          <button onClick={handleNewChat} className="newChat">
            <FontAwesomeIcon icon={faEdit} />
          </button>
        )}
      </div>
      <button className="searchBar">
        <FontAwesomeIcon icon={faSearch} />
        <input
          className="search"
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </button>
      <div className="conv-list">
        <p className="conv-section-label">RECENT </p>
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            className={`conv-item ${conv.id === activeConvId ? "active" : ""}`}
            onClick={() => setActiveConvId(conv.id)}
          >
            <Dot size={24} />
            <span className="conv-title">{conv.title}</span>
            <button
              className="conv-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConv(conv.id);
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="auth-area">
        <AuthButton />
      </div>
    </aside>
  );
}
