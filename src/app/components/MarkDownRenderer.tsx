import { CodeBlock } from "./CodeBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");

          if (!match) {
            return <code className="inline-code">{children}</code>;
          }
          return <CodeBlock language={match[1]} code={code} />;
        },
        p({ children }) {
          return <p className="markdown-p">{children}</p>;
        },
        table({ children }) {
          return <table className="markdown-table">{children}</table>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export { MarkdownRenderer };
