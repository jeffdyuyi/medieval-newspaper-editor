/**
 * InlineEditor.tsx
 * 双击报纸上的 Block 时浮现的就地编辑覆盖层。
 * 支持：标题文字、文章标题 / 副标题 / 段落、图片说明、广告内容。
 * 轻量设计：直接覆盖在原区块位置上，失焦或按 Esc/Enter 关闭。
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Check } from "lucide-react";
import { Block, ArticleBlock, HeadlineBlock, ImageBlock, AdBlock } from "../types";
import { useNewspaper } from "../context/NewspaperContext";

// ── Types ─────────────────────────────────────────────────────────────
export type InlineEditTarget =
  | { blockId: string; field: "headline.text" }
  | { blockId: string; field: "headline.subtitle" }
  | { blockId: string; field: "article.title" }
  | { blockId: string; field: "article.subtitle" }
  | { blockId: string; field: "article.author" }
  | { blockId: string; field: "article.paragraphs"; paragraphIndex: number }
  | { blockId: string; field: "image.caption" }
  | { blockId: string; field: "ad.title" }
  | { blockId: string; field: "ad.content" };

interface InlineEditorProps {
  target: InlineEditTarget | null;
  anchorRect: DOMRect | null; // position of the clicked element
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────
function getInitialValue(block: Block, target: InlineEditTarget): string {
  switch (target.field) {
    case "headline.text":     return (block as HeadlineBlock).text;
    case "headline.subtitle": return (block as HeadlineBlock).subtitle;
    case "article.title":     return (block as ArticleBlock).title;
    case "article.subtitle":  return (block as ArticleBlock).subtitle;
    case "article.author":    return (block as ArticleBlock).author;
    case "article.paragraphs":
      return (block as ArticleBlock).paragraphs[target.paragraphIndex] ?? "";
    case "image.caption":     return (block as ImageBlock).caption;
    case "ad.title":          return (block as AdBlock).title;
    case "ad.content":        return (block as AdBlock).content;
    default:                  return "";
  }
}

function applyEdit(block: Block, target: InlineEditTarget, value: string): Block {
  switch (target.field) {
    case "headline.text":
      return { ...block, text: value } as HeadlineBlock;
    case "headline.subtitle":
      return { ...block, subtitle: value } as HeadlineBlock;
    case "article.title":
      return { ...block, title: value } as ArticleBlock;
    case "article.subtitle":
      return { ...block, subtitle: value } as ArticleBlock;
    case "article.author":
      return { ...block, author: value } as ArticleBlock;
    case "article.paragraphs": {
      const paras = [...(block as ArticleBlock).paragraphs];
      paras[target.paragraphIndex] = value;
      return { ...block, paragraphs: paras } as ArticleBlock;
    }
    case "image.caption":
      return { ...block, caption: value } as ImageBlock;
    case "ad.title":
      return { ...block, title: value } as AdBlock;
    case "ad.content":
      return { ...block, content: value } as AdBlock;
    default:
      return block;
  }
}

function getFieldLabel(field: InlineEditTarget["field"]): string {
  const labels: Record<string, string> = {
    "headline.text": "标题文字",
    "headline.subtitle": "副标题",
    "article.title": "文章标题",
    "article.subtitle": "文章副标题",
    "article.author": "作者署名",
    "article.paragraphs": "段落正文",
    "image.caption": "图片说明",
    "ad.title": "广告标题",
    "ad.content": "广告内容",
  };
  return labels[field] ?? field;
}

const MULTILINE_FIELDS: Array<InlineEditTarget["field"]> = [
  "article.paragraphs",
  "article.subtitle",
  "ad.content",
  "headline.subtitle",
];

// ── Component ─────────────────────────────────────────────────────────
export default function InlineEditor({ target, anchorRect, onClose }: InlineEditorProps) {
  const { findSelectedBlock, updateBlock, theme } = useNewspaper();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const isRep = theme === "republican";
  const isMultiline = target ? MULTILINE_FIELDS.includes(target.field) : false;

  // Load initial value when target changes
  useEffect(() => {
    if (!target) return;
    const block = findSelectedBlock();
    if (!block) return;
    setValue(getInitialValue(block, target));
  }, [target]);

  // Position the editor near the anchor element
  useEffect(() => {
    if (!anchorRect) return;
    const viewportW = window.innerWidth;
    const editorW = Math.min(Math.max(anchorRect.width, 260), 420);
    let left = anchorRect.left;
    if (left + editorW > viewportW - 16) left = viewportW - editorW - 16;
    if (left < 8) left = 8;
    setPosition({ top: anchorRect.top, left, width: editorW });
  }, [anchorRect]);

  // Auto-focus
  useEffect(() => {
    if (!target) return;
    setTimeout(() => {
      (isMultiline ? textareaRef.current : inputRef.current)?.focus();
      (isMultiline ? textareaRef.current : inputRef.current)?.select();
    }, 50);
  }, [target, isMultiline]);

  const commit = useCallback(() => {
    if (!target) return;
    updateBlock(target.blockId, (block) => applyEdit(block, target, value));
    onClose();
  }, [target, value, updateBlock, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (!isMultiline && e.key === "Enter") { e.preventDefault(); commit(); return; }
    if (isMultiline && e.key === "Enter" && (e.ctrlKey || e.metaKey)) { commit(); return; }
  };

  if (!target || !anchorRect) return null;

  const bg = isRep ? "#f4f3ef" : "#fdf6e3";
  const border = isRep ? "#1a1a1a" : "#8b4513";
  const textColor = isRep ? "#0d0d0d" : "#2b221a";
  const labelColor = isRep ? "#1a1a1a99" : "#8b451399";

  return (
    // Full-screen transparent overlay to catch outside clicks
    <div
      className="fixed inset-0 z-[9999]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { commit(); } }}
    >
      {/* Editor popup */}
      <div
        className="absolute shadow-2xl rounded"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          background: bg,
          border: `2px solid ${border}`,
          fontFamily: "serif",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-2.5 py-1.5 border-b text-[11px] font-bold"
          style={{ borderColor: `${border}33`, color: labelColor }}
        >
          <span>✏ 编辑：{getFieldLabel(target.field)}</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] opacity-60">
              {isMultiline ? "Ctrl+Enter 确认" : "Enter 确认 · Esc 取消"}
            </span>
            <button
              onClick={commit}
              className="p-1 rounded hover:bg-black/5 transition"
              title="确认编辑"
            >
              <Check className="w-3.5 h-3.5" style={{ color: border }} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-black/5 transition"
              title="取消"
            >
              <X className="w-3.5 h-3.5" style={{ color: `${textColor}60` }} />
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="p-2">
          {isMultiline ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full text-sm leading-relaxed resize-y outline-none bg-transparent p-1"
              style={{ color: textColor, fontFamily: "serif", minHeight: 80 }}
              placeholder="在此输入内容…"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm outline-none bg-transparent p-1 border-b"
              style={{
                color: textColor,
                fontFamily: "serif",
                borderColor: `${border}33`,
              }}
              placeholder="在此输入内容…"
            />
          )}
        </div>
      </div>
    </div>
  );
}

