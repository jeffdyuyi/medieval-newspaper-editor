/**
 * EditableText.tsx
 * 画布原位光标编辑核心组件（WYSIWYG In-situ Caret Editing）。
 * 遵循 Word / Notion / Typora 标准：
 * 1. 单击任意文字直接原地闪烁光标，原生键盘输入，实时渲染；
 * 2. 样式 100% 保持所在父级的字形、字号、颜色、对齐与字间距；
 * 3. 节流与失焦双重提交，打字流畅不跳光标，零闪烁；
 * 4. 打印与导出时保持纯净排版（去掉 focus 轮廓）。
 */
import React, { useRef, useEffect, useCallback } from "react";

interface EditableTextProps {
  key?: React.Key;
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tagName?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  placeholder?: string;
  multiline?: boolean;
  allowHtml?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
  title?: string;
}

function cleanHtml(html: string): string {
  if (!html) return "";
  const trimmed = html.trim();
  if (trimmed === "<br>" || trimmed === "<div><br></div>" || trimmed === "<p><br></p>") {
    return "";
  }
  return html;
}

export default function EditableText({
  value,
  onChange,
  className = "",
  style = {},
  tagName = "span",
  placeholder = "点击输入文本...",
  multiline = false,
  allowHtml = false,
  autoFocus = false,
  onEnter,
  onBackspaceEmpty,
  title,
}: EditableTextProps) {
  const elementRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false);
  const isFocusedRef = useRef(false);
  const lastKnownValueRef = useRef(value);

  // 辅助获取当前输入框最新内容
  const getCurrentValue = useCallback(() => {
    if (!elementRef.current) return "";
    if (allowHtml) {
      return cleanHtml(elementRef.current.innerHTML);
    }
    return elementRef.current.innerText.replace(/\r\n/g, "\n");
  }, [allowHtml]);

  // 同步外部传入数据：仅在未聚焦或内容外部发生实质变化时同步，避免打字光标跳动
  useEffect(() => {
    if (!elementRef.current) return;
    if (allowHtml) {
      if (!isFocusedRef.current && elementRef.current.innerHTML !== (value || "")) {
        elementRef.current.innerHTML = value || "";
        lastKnownValueRef.current = value || "";
      }
    } else {
      if (!isFocusedRef.current && elementRef.current.innerText !== (value || "")) {
        elementRef.current.innerText = value || "";
        lastKnownValueRef.current = value || "";
      }
    }
  }, [value, allowHtml]);

  // 自动聚焦支持（用于新段落自动流转）
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(elementRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [autoFocus]);

  const commitValue = useCallback(() => {
    const currentVal = getCurrentValue();
    if (currentVal !== lastKnownValueRef.current) {
      lastKnownValueRef.current = currentVal;
      onChange(currentVal);
    }
  }, [getCurrentValue, onChange]);

  const handleInput = () => {
    if (isComposingRef.current) return;
    const currentVal = getCurrentValue();
    lastKnownValueRef.current = currentVal;
    onChange(currentVal);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    commitValue();
  };

  // 纯净粘贴拦截：过滤外来带样式的脏 HTML，严格保持报纸古典字形风格
  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    if (!multiline) {
      const singleLine = text.replace(/[\r\n]+/g, " ").trim();
      document.execCommand("insertText", false, singleLine);
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // 处理单行回车
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      elementRef.current?.blur();
      onEnter?.();
      return;
    }

    // 多行模式下的特殊回车（如段落分割）
    if (multiline && e.key === "Enter" && !e.shiftKey && onEnter) {
      e.preventDefault();
      commitValue();
      onEnter();
      return;
    }

    // 在空内容时按退格键
    if (e.key === "Backspace" && onBackspaceEmpty) {
      const text = elementRef.current?.innerText || "";
      if (text === "" || text === "\n") {
        e.preventDefault();
        onBackspaceEmpty();
      }
    }
  };

  const Component = tagName as any;

  return (
    <Component
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
      title={title || "点击即可直接原位输入修改"}
      className={`outline-none transition-shadow cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 empty:before:italic focus:bg-amber-500/10 focus:ring-1 focus:ring-[#8b4513]/40 rounded-sm px-0.5 selection:bg-[#8b4513]/20 ${className}`}
      style={style}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: value || "" }}
    />
  );
}
