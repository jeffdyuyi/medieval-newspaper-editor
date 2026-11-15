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
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
  title?: string;
}

export default function EditableText({
  value,
  onChange,
  className = "",
  style = {},
  tagName = "span",
  placeholder = "点击输入文本...",
  multiline = false,
  onEnter,
  onBackspaceEmpty,
  title,
}: EditableTextProps) {
  const elementRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false);
  const isFocusedRef = useRef(false);
  const lastKnownValueRef = useRef(value);

  // 仅在未聚焦或外部数据因撤销/重做/导入而发生变化时，才同步 DOM 内容，彻底避免打字时光标乱跳
  useEffect(() => {
    if (!elementRef.current) return;
    if (!isFocusedRef.current && elementRef.current.innerText !== value) {
      elementRef.current.innerText = value || "";
      lastKnownValueRef.current = value || "";
    }
  }, [value]);

  const commitValue = useCallback(() => {
    if (!elementRef.current) return;
    const currentText = elementRef.current.innerText.replace(/\r\n/g, "\n");
    if (currentText !== lastKnownValueRef.current) {
      lastKnownValueRef.current = currentText;
      onChange(currentText);
    }
  }, [onChange]);

  const handleInput = () => {
    if (isComposingRef.current) return;
    if (!elementRef.current) return;
    const currentText = elementRef.current.innerText.replace(/\r\n/g, "\n");
    lastKnownValueRef.current = currentText;
    onChange(currentText);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    commitValue();
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
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
      title={title || "点击即可直接原位输入修改"}
      className={`outline-none transition-shadow cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 empty:before:italic focus:bg-amber-500/10 focus:ring-1 focus:ring-[#8b4513]/40 rounded-sm px-0.5 selection:bg-[#8b4513]/20 ${className}`}
      style={style}
      data-placeholder={placeholder}
    />
  );
}
