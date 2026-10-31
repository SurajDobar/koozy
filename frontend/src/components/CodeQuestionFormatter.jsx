import React from 'react';
import DevIcon, { resolveDevIcon } from './DevIcon';
import { Terminal } from 'lucide-react';

/**
 * Parses and renders question or option text.
 * If code fences (```lang ... ```) or inline code (`code`) are detected,
 * it formats them in a gorgeous developer code terminal card.
 */
export default function CodeQuestionFormatter({ text, isOption = false, className = '' }) {
  if (!text || typeof text !== 'string') return null;

  // Check if text contains fenced code blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const hasFencedCode = codeBlockRegex.test(text);

  if (hasFencedCode) {
    codeBlockRegex.lastIndex = 0; // reset
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'code',
        code: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return (
      <div className={`space-y-3 ${className}`}>
        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <div key={idx} className="leading-snug">
                {renderInlineFormatted(p.content)}
              </div>
            );
          }

          const devicon = resolveDevIcon(p.language);

          return (
            <div
              key={idx}
              className="kz-code-block overflow-hidden my-3 text-left shadow-md border-2 border-zinc-700/80 rounded-xl"
            >
              {/* Code Terminal Top Bar */}
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#18181b] border-b border-zinc-800 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 inline-block"></span>
                </div>

                <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-300 text-[11px]">
                  <DevIcon name={p.language} size="text-sm" />
                  <span className="capitalize">{p.language || 'code'}</span>
                </div>
              </div>

              {/* Code Body */}
              <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-emerald-300 leading-relaxed scrollbar-thin">
                <code>{p.code}</code>
              </pre>
            </div>
          );
        })}
      </div>
    );
  }

  // Check if text has multiple lines and look like code indentation
  const lines = text.split('\n');
  const looksLikeIndentedCode = lines.length > 2 && lines.some((l) => /^\s{2,}/.test(l) || /[{}();=>]/.test(l));

  if (!isOption && looksLikeIndentedCode) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="font-extrabold">{lines[0]}</p>
        <div className="kz-code-block overflow-hidden text-left border border-zinc-800 rounded-xl">
          <pre className="p-3 text-xs sm:text-sm font-mono overflow-x-auto text-emerald-300">
            <code>{lines.slice(1).join('\n')}</code>
          </pre>
        </div>
      </div>
    );
  }

  // Standard inline formatting with backtick highlighting
  return (
    <span className={className}>
      {renderInlineFormatted(text, isOption)}
    </span>
  );
}

/**
 * Handles inline `code` highlights and emphasis.
 */
function renderInlineFormatted(str, isOption = false) {
  if (!str) return null;
  const inlineCodeRegex = /`([^`]+)`/g;
  if (!inlineCodeRegex.test(str)) {
    return str;
  }

  inlineCodeRegex.lastIndex = 0;
  const tokens = [];
  let lastIdx = 0;
  let match;

  while ((match = inlineCodeRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(str.slice(lastIdx, match.index));
    }
    tokens.push(
      <code
        key={match.index}
        className={`font-mono px-1.5 py-0.5 rounded text-[0.88em] font-semibold border ${
          isOption
            ? 'bg-black/10 border-black/20 text-current'
            : 'bg-zinc-800 text-cyan-300 border-zinc-700'
        }`}
      >
        {match[1]}
      </code>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < str.length) {
    tokens.push(str.slice(lastIdx));
  }

  return tokens;
}
