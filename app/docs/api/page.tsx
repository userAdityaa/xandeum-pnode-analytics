"use client"
import { useSidebar } from "@/components/ui/sidebar";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import rehypeRaw from "rehype-raw";

export default function ApiDocsPage() {
  const { state } = useSidebar();
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/docs/api.md")
      .then((res) => res.text())
      .then(setContent);
  }, []);

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      <div
        className="max-w-3xl mx-auto px-6 py-16 prose prose-invert prose-pre:bg-[#18181b] prose-pre:text-[#d1d5db] prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-[#23272e] prose-code:before:hidden prose-code:after:hidden"
        style={{
          /* Custom style for code blocks to mimic GitHub's look */
          /* Remove white border, use a subtle dark border */
        }}
      >
        <ReactMarkdown
          components={{
            pre: ({ node, ...props }) => (
              <pre
                style={{
                  background: '#18181b',
                  color: '#d1d5db',
                  borderRadius: '0.75rem',
                  border: '1px solid #23272e',
                  padding: '1rem',
                  overflowX: 'auto',
                  margin: '1.5rem 0',
                  fontSize: '0.97rem',
                  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
                {...props}
              />
            ),
            code: ({ node, className, ...props }) => (
              <code
                className={className}
                style={{
                  background: className?.includes('language-json') ? '#18181b' : undefined,
                  color: className?.includes('language-json') ? '#d1d5db' : undefined,
                  borderRadius: '0.4rem',
                  padding: className?.includes('language-json') ? '0.2rem 0.4rem' : undefined,
                  border: className?.includes('language-json') ? '1px solid #23272e' : undefined,
                  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
                {...props}
              />
            ),
          }}
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
