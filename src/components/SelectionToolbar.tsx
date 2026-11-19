/**
 * SelectionToolbar.tsx
 * 画布选中文本情境浮动工具栏（Bubble Menu，参考 Word / Notion 标准）。
 * 当用户在报纸画布上拉选文本时，就近在选区上方轻盈浮现微型格式条：
 * 支持加粗、斜体、下划线、删除线、五色幻色高亮、清除格式等。
 * 适配 Dark Fantasy 点阵复古设计系统。
 */
import React, { useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Strikethrough, Eraser } from "lucide-react";

// 预设五色历史幻色盘
const CHROMA_COLORS = [
  { name: "朱砂红", color: "#b22222" },
  { name: "琥珀金", color: "#d5b67d" },
  { name: "玄天青", color: "#334d68" },
  { name: "松石翠", color: "#2d6a4f" },
  { name: "纯玄墨", color: "#10141b" },
];

export default function SelectionToolbar() {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setIsVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setIsVisible(false);
      return;
    }

    // 检查选区是否位于报纸画布内
    const anchorNode = selection.anchorNode;
    const parentEl = anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
    const canvas = document.getElementById("printable-newspaper-content");
    if (!canvas || !parentEl || !canvas.contains(parentEl)) {
      setIsVisible(false);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setIsVisible(false);
        return;
      }

      // 计算气泡条位置：位于选区水平中央，选区顶部上方 12px
      const bubbleHeight = 36;
      let top = rect.top - bubbleHeight - 10;
      let left = rect.left + rect.width / 2;

      // 视口边界保护
      if (top < 10) {
        top = rect.bottom + 10;
      }
      if (left < 140) {
        left = 140;
      } else if (left > window.innerWidth - 140) {
        left = window.innerWidth - 140;
      }

      setPosition({ top, left });
      setIsVisible(true);
    } catch {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      requestAnimationFrame(updatePosition);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("resize", handleSelectionChange);
    window.addEventListener("scroll", handleSelectionChange, true);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleSelectionChange);
      window.removeEventListener("scroll", handleSelectionChange, true);
    };
  }, [updatePosition]);

  if (!isVisible || !position) return null;

  // 辅助查找正在编辑的 contenteditable 容器
  const findActiveEditable = (range: Range | null): HTMLElement | null => {
    if (!range) return null;
    let node: Node | null = range.commonAncestorContainer;
    while (node) {
      if (node instanceof HTMLElement && node.getAttribute("contenteditable") === "true") {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  };

  const dispatchInput = (editable: HTMLElement | null) => {
    if (editable) {
      editable.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const executeCmd = (cmd: string, val: string | undefined = undefined) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const editable = findActiveEditable(range);

    document.execCommand(cmd, false, val);
    dispatchInput(editable);
    updatePosition();
  };

  // 幻色应用：使用 DOM range extractContents 无损保留子节点
  const applyColor = (colorHex: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const editable = findActiveEditable(range);

    try {
      const fragment = range.extractContents();
      const span = document.createElement("span");
      span.style.color = colorHex;
      span.appendChild(fragment);
      range.insertNode(span);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);

      dispatchInput(editable);
      updatePosition();
    } catch (e) {
      console.warn("applyColor failed", e);
    }
  };

  const clearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const editable = findActiveEditable(range);

    try {
      document.execCommand("removeFormat", false);
      const text = range.toString();
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNode(textNode);
      selection.addRange(newRange);

      dispatchInput(editable);
      updatePosition();
    } catch (e) {
      console.warn("clearFormatting failed", e);
    }
  };

  return (
    <div
      className="fixed z-[9999] no-print flex items-center gap-1.5 px-3 py-1.5 pixel-panel select-none backdrop-blur-md transition-opacity duration-150 -translate-x-1/2"
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseDown={(e) => {
        // 阻止按钮点击导致编辑器失焦
        e.preventDefault();
      }}
    >
      <button
        type="button"
        onClick={() => executeCmd("bold")}
        title="加粗 (Ctrl+B)"
        className="p-1 hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] hover:text-[var(--color-gold)] transition cursor-pointer"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("italic")}
        title="斜体 (Ctrl+I)"
        className="p-1 hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] hover:text-[var(--color-gold)] transition cursor-pointer"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("underline")}
        title="下划线 (Ctrl+U)"
        className="p-1 hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] hover:text-[var(--color-gold)] transition cursor-pointer"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("strikeThrough")}
        title="删除线"
        className="p-1 hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] hover:text-[var(--color-gold)] transition cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-3.5 bg-[var(--color-line)] mx-0.5" />

      {/* 幻色盘 Color Swatches */}
      <div className="flex items-center gap-1.5 px-0.5" title="幻色：古风与时代五色墨彩">
        {CHROMA_COLORS.map((item) => (
          <button
            key={item.color}
            type="button"
            onClick={() => applyColor(item.color)}
            title={`幻色：${item.name}`}
            className="w-3.5 h-3.5 border border-[var(--color-line)] hover:border-[var(--color-gold)] transition-transform hover:scale-125 cursor-pointer"
            style={{ backgroundColor: item.color }}
          />
        ))}
      </div>

      <span className="w-[1px] h-3.5 bg-[var(--color-line)] mx-0.5" />

      <button
        type="button"
        onClick={clearFormatting}
        title="清除格式"
        className="p-1 hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:text-[var(--color-danger)] transition cursor-pointer"
      >
        <Eraser className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
