"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { CodeBlock } from "./code-block";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // Custom components for react-markdown
  const components: Components = {
    // Code blocks
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? "");
      const isInline = !match && !String(children).includes("\n");

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 mx-0.5 text-sm bg-gray-100 text-orange-600 rounded font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock language={match?.[1]}>
          {String(children).replace(/\n$/, "")}
        </CodeBlock>
      );
    },

    // Headings
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-bold mt-2 mb-1 text-gray-900">{children}</h3>
    ),

    // Paragraphs
    p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,

    // Lists
    ul: ({ children }) => (
      <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 hover:underline"
      >
        {children}
      </a>
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="my-2 pl-4 border-l-4 border-orange-400 bg-orange-50 py-2 italic">
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 border border-gray-300 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 border border-gray-300">{children}</td>
    ),

    // Horizontal rule
    hr: () => <hr className="my-4 border-t border-gray-300" />,

    // Strong & emphasis
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
  };

  return (
    <div className={`markdown-content text-sm text-gray-800 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
