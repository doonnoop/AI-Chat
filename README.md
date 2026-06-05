# 🤖 AI Chat

A production-style AI chat web app built with **Next.js 16**, **React 19**, **Google Gemini 2.5 Flash**, and **OpenAI GPT-4o mini**.  
Designed to simulate the architecture and UX patterns used in real AI products like ChatGPT and Claude.

---

## ✨ Features

### Core Chat

- **Real-time streaming** — Chunk-by-chunk output via SSE (Server-Sent Events), with 40ms throttle on state updates
- **Multi-model support** — Switch between Gemini 2.5 Flash and GPT-4o mini
- **Multi-turn context** — Maintains conversation history with a sliding window (last 10 turns)
- **Stop generation** — Cancel mid-stream with `AbortController`
- **Regenerate** — Re-run the last AI response with one click

### Message UX

- **Edit messages** — Modify any past message and regenerate from that point (conversation branching)
- **Copy** — Copy message content or code blocks to clipboard
- **Reactions** — Like / dislike toggle with count display
- **Auto-scroll** — Always keeps the latest message in view

### Markdown & Code

- Full **GitHub-Flavored Markdown** rendering (tables, lists, bold, inline code)
- **Syntax highlighting** with language detection
- **Colored language badges** — JS, TS, PY, HTML, CSS, etc.
- One-click **copy code** button with copied state feedback

### Persistence

- Chat history saved to **localStorage** after stream ends
- Debounced saves (300ms) to avoid excessive writes
- Conversation restored automatically on page refresh

---

## 🛠 Tech Stack

| Layer               | Tech                                        |
| ------------------- | ------------------------------------------- |
| Framework           | Next.js 16 (App Router)                     |
| Language            | TypeScript                                  |
| AI Models           | Google Gemini 2.5 Flash, OpenAI GPT-4o mini |
| Streaming           | Server-Sent Events (SSE)                    |
| Auth                | NextAuth.js v4 (Google OAuth)               |
| Database            | PostgreSQL + Prisma ORM                     |
| Markdown            | react-markdown + remark-gfm                 |
| Syntax Highlighting | react-syntax-highlighter (oneDark)          |
| Icons               | Font Awesome                                |
| Styling             | Pure CSS with CSS Variables + Tailwind 4    |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- [Google AI Studio](https://aistudio.google.com) API key (for Gemini)
- OpenAI API key (for GPT-4o mini)
- Google OAuth credentials (for authentication)

### Installation

```bash
git clone https://github.com/spencertyy/AI-Chat.git
cd AI-Chat/typescript
npm install
```

### Environment Variables

Create a `.env.local` file in the `typescript/` directory:

```
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://your_connection_string
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   └── chat-stream/route.ts          # SSE streaming endpoint (Gemini + OpenAI)
│   ├── components/
│   │   ├── AuthButton.tsx                # Google login/logout UI
│   │   ├── CodeBlock.tsx                 # Syntax highlighted code blocks
│   │   ├── InputArea.tsx                 # Chat input + model selector
│   │   ├── MarkDownRenderer.tsx          # Markdown rendering
│   │   ├── MessageList.tsx               # Message list + action buttons
│   │   └── Sidebar.tsx                   # Conversation list sidebar
│   ├── hooks/
│   │   └── useChat.ts                    # All chat logic (custom hook)
│   ├── lib/
│   │   └── chatStorage.ts                # localStorage read/write + debounce
│   ├── types/
│   │   └── chat.ts                       # Message, Conversation types
│   ├── globals.css                        # All styles (CSS variables)
│   ├── tokens.css                         # Design tokens (colors, radius, shadows)
│   └── page.tsx                           # Root page
```

---

## 🏗 Architecture

### Streaming Flow

```
User input → POST /api/chat-stream
           → Gemini or OpenAI streaming SDK
           → SSE chunks → TextDecoder → buffer parsing
           → 40ms throttled state updates → UI render
           → [DONE] → finalize message → save to localStorage
```

### Conversation Branching

Editing a past message removes all subsequent responses and rebuilds  
the conversation context from the edited point — the same pattern used in ChatGPT.

---

## 📌 Planned

### Auth & Data

- [✔️] User authentication — login / signup with session management
- [✔️] Database integration — persist conversations server-side (e.g. PostgreSQL + Prisma)

### AI Features

- [ ] RAG (Retrieval-Augmented Generation) — attach documents and query over them
- [ ] Token usage tracking — display input/output token counts per message

### UX & Platform

- [ ] Add demo GIF to README (record streaming + code highlight flow)
- [✔️] Sidebar with multiple conversations
- [ ] Image upload (Gemini multimodal)
- [ ] File upload support
- [✔️] Multi-model support (OpenAI / Gemini switchable)
- [ ] Mobile optimization
- [ ] Theme toggle (light / dark)

---

## 📄 License

MIT
