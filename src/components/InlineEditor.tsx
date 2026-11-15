/**
 * InlineEditor.tsx
 * 双击报纸上的任何文本元素时浮现的所见即所得轻量就地编辑覆盖层（参考图3设计）。
 * 支持：报刊大标题、副标题标语、期号、日期、售价、出版地、页脚文案，以及所有文章/大标题/图片/告示模块。
 * 纯粹快速修改文本内容，失焦、按 Enter（单行）或 Ctrl+Enter（多行）直接保存，Esc 取消。
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Check } from "lucide-react";
import { Block, ArticleBlock, HeadlineBlock, ImageBlock, AdBlock, NewspaperHeader } from "../types";
import { useNewspaper } from "../context/NewspaperContext";

// ── Types ─────────────────────────────────────────────────────────────
export type InlineEditTarget =
  | {
      type: "block";
      blockId: string;
      field:
        | "headline.text"
        | "headline.subtitle"
        | "article.title"
        | "article.subtitle"
        | "article.author"
        | "article.publishOffice"
        | "article.paragraphs"
        | "image.caption"
        | "ad.title"
        | "ad.content"
        | "ad.price"
        | "ad.merchant";
      paragraphIndex?: number;
    }
  | {
      type: "header";
      field:
        | "title"
        | "subtitle"
        | "issueNo"
        | "date"
        | "location"
        | "price"
        | "publisherEn"
        | "publisherOffice"
        | "royalTitle"
        | "footerLeft"
        | "footerRight";
    };

interface InlineEditorProps {
  target: InlineEditTarget | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────
function getInitialBlockValue(block: Block, target: Extract<InlineEditTarget, { type: "block" }>): string {
  switch (target.field) {
    case "headline.text":
      return (block as HeadlineBlock).text || "";
    case "headline.subtitle":
      return (block as HeadlineBlock).subtitle || "";
    case "article.title":
      return (block as ArticleBlock).title || "";
    case "article.subtitle":
      return (block as ArticleBlock).subtitle || "";
    case "article.author":
      return (block as ArticleBlock).author || "";
    case "article.publishOffice":
      return (block as ArticleBlock).publishOffice || "";
    case "article.paragraphs":
      return (block as ArticleBlock).paragraphs[target.paragraphIndex ?? 0] ?? "";
    case "image.caption":
      return (block as ImageBlock).caption || "";
    case "ad.title":
      return (block as AdBlock).title || "";
    case "ad.content":
      return (block as AdBlock).content || "";
    case "ad.price":
      return (block as AdBlock).price || "";
    case "ad.merchant":
      return (block as AdBlock).merchant || "";
    default:
      return "";
  }
}

function applyBlockEdit(block: Block, target: Extract<InlineEditTarget, { type: "block" }>, value: string): Block {
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
    case "article.publishOffice":
      return { ...block, publishOffice: value } as ArticleBlock;
    case "article.paragraphs": {
      const idx = target.paragraphIndex ?? 0;
      const paras = [...(block as ArticleBlock).paragraphs];
      paras[idx] = value;
      return { ...block, paragraphs: paras } as ArticleBlock;
    }
    case "image.caption":
      return { ...block, caption: value } as ImageBlock;
    case "ad.title":
      return { ...block, title: value } as AdBlock;
    case "ad.content":
      return { ...block, content: value } as AdBlock;
    case "ad.price":
      return { ...block, price: value } as AdBlock;
    case "ad.merchant":
      return { ...block, merchant: value } as AdBlock;
    default:
      return block;
  }
}

function getFieldLabel(target: InlineEditTarget): string {
  if (target.type === "header") {
    const headerLabels: Record<string, string> = {
      title: "报刊大标题",
      subtitle: "报刊副标题 / 标语",
      issueNo: "报刊期号",
      date: "出版日期",
      location: "发行地点",
      price: "报刊售价",
      publisherEn: "外文报头 / 英文名",
      publisherOffice: "承印印务署",
      royalTitle: "皇家双徽题注",
      footerLeft: "页脚左侧发行文案",
      footerRight: "页脚右侧版权文案",
    };
    return headerLabels[target.field] || target.field;
  }

  const blockLabels: Record<string, string> = {
    "headline.text": "大字标题",
    "headline.subtitle": "标题副题",
    "article.title": "文章主标题",
    "article.subtitle": "文章副标题",
    "article.author": "作者署名",
    "article.publishOffice": "记录印务署",
    "article.paragraphs": "正文段落",
    "image.caption": "插图配文",
    "ad.title": "告示商号主题",
    "ad.content": "告示宣传内容",
    "ad.price": "标价 / 酬金",
    "ad.merchant": "商号发布人",
  };
  return blockLabels[target.field] || target.field;
}

function checkIsMultiline(target: InlineEditTarget | null): boolean {
  if (!target) return false;
  if (target.type === "header") {
    return false;
  }
  return (
    target.field === "article.paragraphs" ||
    target.field === "article.subtitle" ||
    target.field === "ad.content" ||
    target.field === "headline.subtitle"
  );
}

// ── Component ─────────────────────────────────────────────────────────
export default function InlineEditor({ target, anchorRect, onClose }: InlineEditorProps) {
  const { newspaperData, updateBlock, updateHeader, theme } = useNewspaper();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const isRep = theme === "republican";
  const isMultiline = checkIsMultiline(target);

  // Load initial value
  useEffect(() => {
    if (!target) return;

    if (target.type === "header") {
      const headerVal = newspaperData.header[target.field] || "";
      setValue(headerVal);
      return;
    }

    // Target is block
    let foundBlock: Block | null = null;
    for (const r of newspaperData.rows) {
      for (const c of r.columns) {
        const found = c.blocks.find((b) => b.id === target.blockId);
        if (found) {
          foundBlock = found;
          break;
        }
      }
      if (foundBlock) break;
    }

    if (!foundBlock) return;
    setValue(getInitialBlockValue(foundBlock, target));
  }, [target, newspaperData]);

  // Position the editor near the anchor element with boundary protection
  useEffect(() => {
    if (!anchorRect) return;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const editorW = Math.min(Math.max(anchorRect.width, 280), 480);
    let left = anchorRect.left;
    if (left + editorW > viewportW - 16) left = viewportW - editorW - 16;
    if (left < 8) left = 8;

    let top = anchorRect.top;
    const estimatedH = isMultiline ? 220 : 110;
    if (top + estimatedH > viewportH - 16) {
      top = Math.max(16, viewportH - estimatedH - 16);
    }

    setPosition({ top, left, width: editorW });
  }, [anchorRect, isMultiline]);

  // Auto-focus
  useEffect(() => {
    if (!target) return;
    const timer = setTimeout(() => {
      const el = isMultiline ? textareaRef.current : inputRef.current;
      el?.focus();
      el?.select();
    }, 60);
    return () => clearTimeout(timer);
  }, [target, isMultiline]);

  const commit = useCallback(() => {
    if (!target) return;
    if (target.type === "header") {
      updateHeader((prev: NewspaperHeader) => ({
        ...prev,
        [target.field]: value,
      }));
    } else {
      updateBlock(target.blockId, (block) => applyBlockEdit(block, target, value));
    }
    onClose();
  }, [target, value, updateHeader, updateBlock, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (!isMultiline && e.key === "Enter") {
      e.preventDefault();
      commit();
      return;
    }
    if (isMultiline && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commit();
      return;
    }
  };

  if (!target || !anchorRect) return null;

  const bg = isRep ? "#f4f3ef" : "#fdf6e3";
  const border = isRep ? "#1a1a1a" : "#8b4513";
  const textColor = isRep ? "#0d0d0d" : "#2b221a";
  const labelColor = isRep ? "#1a1a1a" : "#8b4513";

  return (
    // Full-screen transparent overlay to catch outside clicks
    <div
      className="fixed inset-0 z-[9999] no-print"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          commit();
        }
      }}
    >
      {/* Editor popup card styled exactly like reference image 3 */}
      <div
        className="absolute shadow-2xl rounded border-2 p-0.5 animate-fadeIn"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          backgroundColor: bg,
          borderColor: border,
          fontFamily: "serif",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div
          className="flex items-center justify-between px-3 py-1.5 border-b text-[12px] font-bold select-none"
          style={{ borderColor: `${border}33`, color: labelColor }}
        >
          <span className="flex items-center gap-1">
            <span className="opacity-70">✏ 编辑：</span>
            <span>{getFieldLabel(target)}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-60 font-sans font-normal">
              {isMultiline ? "Ctrl+Enter 确认" : "Enter 确认 · Esc 取消"}
            </span>
            <button
              type="button"
              onClick={commit}
              className="p-1 rounded hover:bg-black/10 transition cursor-pointer"
              title="确认保存并应用修改"
            >
              <Check className="w-4 h-4" style={{ color: border }} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-black/10 transition cursor-pointer"
              title="取消本次编辑"
            >
              <X className="w-4 h-4" style={{ color: `${textColor}99` }} />
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="p-2.5">
          {isMultiline ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              className="w-full text-sm leading-relaxed resize-y outline-none bg-transparent p-1 border rounded"
              style={{
                color: textColor,
                fontFamily: "serif",
                borderColor: `${border}33`,
                minHeight: 90,
              }}
              placeholder="在此输入文本内容…"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm outline-none bg-transparent p-1.5 border rounded"
              style={{
                color: textColor,
                fontFamily: "serif",
                borderColor: `${border}33`,
              }}
              placeholder="在此输入文本内容…"
            />
          )}
        </div>
      </div>
    </div>
  );
}
