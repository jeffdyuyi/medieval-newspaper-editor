/**
 * SelectionToolbar.tsx
 * 画布选中文本情境浮动工具栏（Bubble Menu，参考 Word / Notion 标准）。
 * 当用户在报纸画布上拉选文本时，就近在选区上方轻盈浮现微型格式条：
 * 支持加粗、斜体、下划线、删除线、五色幻色高亮（朱砂红/琥珀金/玄天青/松石翠/纯玄墨）、清除格式等。
 * 点击即变，不选文字时静默隐藏。
 */
import React, { useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Strikethrough, Eraser } from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";

// 预设五色历史幻色盘
const CHROMA_COLORS = [
  { name: "朱砂红", color: "#b22222", bgClass: "bg-[#b22222]" },
  { name: "琥珀金", color: "#b8860b", bgClass: "bg-[#b8860b]" },
  { name: "玄天青", color: "#1e3a8a", bgClass: "bg-[#1e3a8a]" },
  { name: "松石翠", color: "#166534", bgClass: "bg-[#166534]" },
  { name: "纯玄墨", color: "#111111", bgClass: "bg-[#111111]" },
];

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

      // 计算浮条位置：居中位于选区上方约 42px
      const toolbarWidth = 280;
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      let top = rect.top - 44;

      // 视口边界保护
      if (left < 10) left = 10;
      if (left + toolbarWidth > window.innerWidth - 10) {
        left = window.innerWidth - toolbarWidth - 10;
      }
      if (top < 10) {
        // 如果上方超出屏幕，则翻转显示在选区下方
        top = rect.bottom + 10;
      }

      setPosition({ top, left });
      setIsVisible(true);
    } catch {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      // 动画帧防抖
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
      // 提取文档碎片，保留内部已有的 <b>, <i>, <u> 等节点
      const fragment = range.extractContents();
      const span = document.createElement("span");
      span.style.color = colorHex;
      span.style.textDecorationColor = colorHex;
      span.appendChild(fragment);
      range.insertNode(span);

      // 重新选中包裹后的内容，保持选区可见
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);

      dispatchInput(editable);
      updatePosition();
    } catch {
      // 若出现复杂跨域边界选区，回退至原生带样式的 foreColor
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, colorHex);
      dispatchInput(editable);
      updatePosition();
    }
  };

  // 清除选区格式
  const clearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const editable = findActiveEditable(range);

    document.execCommand("removeFormat", false, undefined);
    dispatchInput(editable);
    updatePosition();
  };

  const isRep = theme === "republican";
  const bg = isRep ? "#231f1d" : "#2a221b";
  const border = isRep ? "#555" : "#8b4513";
  const textColor = "#f5deb3";

  return (
    <div
      className="fixed z-[9999] no-print flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xl border text-xs select-none backdrop-blur-md transition-opacity duration-150 animate-fadeIn"
      style={{
        top: position.top,
        left: position.left,
        backgroundColor: bg,
        borderColor: border,
        color: textColor,
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
        className="p-1 hover:bg-white/15 hover:text-white rounded transition cursor-pointer"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("italic")}
        title="斜体 (Ctrl+I)"
        className="p-1 hover:bg-white/15 hover:text-white rounded transition cursor-pointer"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("underline")}
        title="下划线 (Ctrl+U)"
        className="p-1 hover:bg-white/15 hover:text-white rounded transition cursor-pointer"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => executeCmd("strikeThrough")}
        title="删除线"
        className="p-1 hover:bg-white/15 hover:text-white rounded transition cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <span className="w-[1px] h-3.5 bg-white/20 mx-0.5" />

      {/* 幻色盘 Color Swatches */}
      <div className="flex items-center gap-1.5 px-0.5" title="幻色：古风与时代五色墨彩">
        {CHROMA_COLORS.map((item) => (
          <button
            key={item.color}
            type="button"
            onClick={() => applyColor(item.color)}
            title={`幻色：${item.name}`}
            className="w-4 h-4 rounded-full border border-white/40 hover:scale-125 transition-transform cursor-pointer shadow-xs"
            style={{ backgroundColor: item.color }}
          />
        ))}
      </div>

      <span className="w-[1px] h-3.5 bg-white/20 mx-0.5" />

      <button
        type="button"
        onClick={clearFormatting}
        title="清除格式"
        className="p-1 hover:bg-white/15 hover:text-white rounded transition cursor-pointer opacity-70 hover:opacity-100"
      >
        <Eraser className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
