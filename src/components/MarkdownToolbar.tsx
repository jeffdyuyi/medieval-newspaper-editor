/**
 * MarkdownToolbar.tsx
 * 聚合、精致、复古现代风格的富文本/Markdown 快捷工具栏（参考图6设计）。
 * 贴合在文章正文、大字标题、广告宣传等详细内容编辑器顶部。
 * 支持：撤销/重做、粗体、斜体、下划线、删除线、上标、朱砂红字、引用、无序列表、有序列表、标题、分隔线、古典章记等。
 */
import React from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Quote,
  List,
  ListOrdered,
  Heading,
  Undo2,
  Redo2,
  Sparkles,
  Bookmark,
  Minus
} from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  compact?: boolean;
}

export default function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  compact = false,
}: MarkdownToolbarProps) {
  // 包裹选中文本或插入模板
  const applyWrap = (prefix: string, suffix: string = "", placeholder: string = "文本") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end);

    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`;
    const nextText = currentText.substring(0, start) + replacement + currentText.substring(end);

    onChange(nextText);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 10);
  };

  // 在当前行行首插入前缀（如引用、列表、标题）
  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;
    const lastNewline = currentText.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const nextText = currentText.substring(0, lineStart) + prefix + currentText.substring(lineStart);
    onChange(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  // 插入单点特殊标记
  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const nextText = currentText.substring(0, start) + token + currentText.substring(end);
    onChange(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  // 浏览器原生撤销 / 重做尝试
  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      return;
    }
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      document.execCommand("undo");
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      onRedo();
      return;
    }
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      document.execCommand("redo");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 bg-[#231d18]/90 text-[#dcd0b8] border border-[#8b4513]/40 rounded-t-md shadow-inner text-xs select-none backdrop-blur-sm">
      {/* 撤销 / 重做 */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={canUndo === false}
        title="撤销 (Ctrl+Z)"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={handleRedo}
        disabled={canRedo === false}
        title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      {/* 分隔竖线 */}
      <span className="w-[1px] h-3.5 bg-[#8b4513]/40 mx-0.5" />

      {/* 核心行内样式 */}
      <button
        type="button"
        onClick={() => applyWrap("**", "**", "加粗内容")}
        title="加粗 **加粗**"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition font-bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyWrap("*", "*", "斜体内容")}
        title="斜体 *斜体*"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyWrap("__", "__", "下划线内容")}
        title="下划线 __下划线__"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyWrap("~~", "~~", "删除线内容")}
        title="删除线 ~~删除线~~"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition line-through"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyWrap("^", "^", "上标")}
        title="上标 ^上标^"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition font-sans text-[11px]"
      >
        <Superscript className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyWrap("[[", "]]", "重点红字")}
        title="报刊重点红字 [[朱砂红字]]"
        className="px-1 py-0.5 rounded hover:bg-[#8b4513]/40 text-[#d9534f] hover:text-[#ff6b6b] font-bold text-[10px] cursor-pointer transition border border-[#d9534f]/30"
      >
        [[红]]
      </button>

      {/* 分隔竖线 */}
      <span className="w-[1px] h-3.5 bg-[#8b4513]/40 mx-0.5" />

      {/* 块级排版 */}
      <button
        type="button"
        onClick={() => applyLinePrefix("## ")}
        title="分级小标题 (## )"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition"
      >
        <Heading className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyLinePrefix("> ")}
        title="引用文段 (> )"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyLinePrefix("- ")}
        title="无序列表 (- )"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition"
      >
        <List className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyLinePrefix("1. ")}
        title="有序列表 (1. )"
        className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] cursor-pointer transition"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      {/* 特殊古典印记快捷插入 */}
      {!compact && (
        <>
          <span className="w-[1px] h-3.5 bg-[#8b4513]/40 mx-0.5" />
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertToken("\n\n◇ ◇ ◇\n\n")}
              title="插入古典菱花隔断 (◇ ◇ ◇)"
              className="px-1 py-0.5 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] text-[10px] cursor-pointer transition"
            >
              ◇ 分隔
            </button>
            <button
              type="button"
              onClick={() => insertToken("⚜ ")}
              title="插入鸢尾花记号 ⚜"
              className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] text-[11px] cursor-pointer transition"
            >
              ⚜
            </button>
            <button
              type="button"
              onClick={() => insertToken("⚔ ")}
              title="插入骑士利剑记号 ⚔"
              className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] text-[11px] cursor-pointer transition"
            >
              ⚔
            </button>
            <button
              type="button"
              onClick={() => insertToken("✥ ")}
              title="插入占星十字记号 ✥"
              className="p-1 rounded hover:bg-[#8b4513]/40 hover:text-[#f5deb3] text-[11px] cursor-pointer transition"
            >
              ✥
            </button>
          </div>
        </>
      )}
    </div>
  );
}
