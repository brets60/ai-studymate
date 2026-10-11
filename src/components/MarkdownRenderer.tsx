"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 text-[15px] leading-relaxed 
      prose-headings:text-slate-900 prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base 
      prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
      prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-slate-100 prose-code:text-blue-700 prose-code:rounded prose-code:text-sm prose-code:font-mono
      prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4
      prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/60 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-700 prose-blockquote:italic
      ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
