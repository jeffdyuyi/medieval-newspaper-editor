/**
 * SelectionToolbar.tsx
 * 画布选中文本情境浮动工具栏（Bubble Menu，参考 Word / Notion 标准）。
 * 当用户在报纸画布上拉选文本时，就近在选区上方轻盈浮现微型格式条：
 * 支持加粗、斜体、下划线、删除线、朱砂红字、清除格式等，点击即变，不选文字时静默隐藏。
 */
import React, { useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Strikethrough, Eraser } from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";

export default function SelectionToolbar() {
  const { theme } = useNewspaper();
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

      // 计算浮条位置：居中位于选区上方约 8px
      const toolbarWidth = 190;
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      let top = rect.top - 40;

      // 视口边界保护
      if (left < 8) left = 8;
      if (left + toolbarWidth > window.innerWidth - 8) {
        left = window.innerWidth - toolbarWidth - 8;
      }
      if (top < 8) {
        // 如果上方超出屏幕，则翻转显示在选区下方
        top = rect.bottom + 8;
      }

      setPosition({ top, left });
      setIsVisible(true);
    } catch {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      // 稍微防抖避免微小跳动
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

  const executeCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    updatePosition();
  };

  const applyRedHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    // 创建朱砂红字高亮 span
    const span = document.createElement("span");
    span.className = "text-[#962a1a] font-bold border-b border-[#962a1a]/30 mx-0.5";
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
    setIsVisible(false);
  };

  const isRep = theme === "republican";
  const bg = isRep ? "#231f1d" : "#2a221b";
  const border = isRep ? "#555" : "#8b4513";
  const textColor = "#f5deb3";

  return (
    <div
      className="fixed z-[9999] no-print flex items-center gap-0.5 px-2 py-1 rounded-full shadow-2xl border text-xs select-none backdrop-blur-md transition-opacity duration-150 animate-fadeIn"
      style={{
        top: position.top,
        left: position.left,
        backgroundColor: bg,
        borderColor: border,
        color: textColor,
      }}
      onMouseDown={(e) => {
        // 阻止失焦
        e.preventDefault();
      }}
    >
      <button
        type="button"
        onClick={() => executeCmd("bold")}
        title="加粗 (Ctrl+B)"
        className="p-1 hover:bg-white/10 hover:text-white rounded transition cursor-pointer"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("italic")}
        title="斜体 (Ctrl+I)"
        className="p-1 hover:bg-white/10 hover:text-white rounded transition cursor-pointer"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("underline")}
        title="下划线 (Ctrl+U)"
        className="p-1 hover:bg-white/10 hover:text-white rounded transition cursor-pointer"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("strikeThrough")}
        title="删除线"
        className="p-1 hover:bg-white/10 hover:text-white rounded transition cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-3 bg-white/20 mx-0.5" />

      <button
        type="button"
        onClick={applyRedHighlight}
        title="报刊重点朱砂红字"
        className="px-1.5 py-0.5 text-[10px] font-bold text-[#ff6b6b] hover:bg-white/10 rounded transition cursor-pointer"
      >
        朱砂红
      </button>

      <button
        type="button"
        onClick={() => executeCmd("removeFormat")}
        title="清除格式"
        className="p-1 hover:bg-white/10 hover:text-white rounded transition cursor-pointer opacity-70 hover:opacity-100"
      >
        <Eraser className="w-3 h-3" />
      </button>
    </div>
  );
}
