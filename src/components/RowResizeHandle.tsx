/**
 * RowResizeHandle.tsx
 * 行底部的可拖拽把手，用于直观地向上/向下拉动调整行高 (row.height)。
 */
import React, { useCallback, useRef } from "react";
import { GripHorizontal } from "lucide-react";

interface RowResizeHandleProps {
  rowId: string;
  currentHeight: number;
  onHeightChange: (rowId: string, newHeight: number) => void;
  isRepublican?: boolean;
}

export default function RowResizeHandle({
  rowId,
  currentHeight,
  onHeightChange,
  isRepublican = false,
}: RowResizeHandleProps) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = currentHeight || 480;

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [currentHeight]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const dy = e.clientY - startY.current;
      // Clamp row height between 180px and 1200px
      const newHeight = Math.max(180, Math.min(1200, Math.round(startHeight.current + dy)));
      onHeightChange(rowId, newHeight);
    },
    [rowId, onHeightChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    []
  );

  return (
    <div
      className="no-print absolute -bottom-2 left-0 right-0 h-4 z-20 flex items-center justify-center cursor-row-resize group/row-resize select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title="拖拽拉动调节版面板块高度"
    >
      <div
        className={`
          flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-sans font-medium shadow-sm transition-all duration-150
          opacity-0 group-hover/row-resize:opacity-100
          ${
            isRepublican
              ? "bg-[#1a1a1a] text-[#f4f3ef] border border-black"
              : "bg-[#8b4513] text-[#f5deb3] border border-[#5a2d0c]"
          }
        `}
      >
        <GripHorizontal className="w-3 h-3" />
        <span>拖拉调高 ({currentHeight}px)</span>
      </div>
    </div>
  );
}

