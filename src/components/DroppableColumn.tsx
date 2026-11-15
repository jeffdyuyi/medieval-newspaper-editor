/**
 * DroppableColumn.tsx
 * 支持从素材库拖拽投放到本列的容器组件。
 * 当外部拖拽悬停时，呈现高亮虚线框与引导提示。
 */
import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableColumnProps {
  key?: React.Key;
  id: string;
  rowId: string;
  colIdx: number;
  totalCols: number;
  isRepublican: boolean;
  isSelected: boolean;
  columnGap: number;
  flexRatio?: number;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export default function DroppableColumn({
  id,
  rowId,
  colIdx,
  totalCols,
  isRepublican,
  isSelected,
  columnGap,
  flexRatio,
  onClick,
  children,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      isColumn: true,
      colId: id,
      rowId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`
        ${isRepublican
          ? `rep-col-container relative ${
              isSelected ? "bg-[#1a1a1a]/5 outline outline-1 outline-dashed outline-[#1a1a1a]/30" : ""
            }`
          : `space-y-4 relative min-h-[60px] p-1 rounded-sm transition ${
              isSelected ? "bg-[#2b221a]/5 border border-dashed border-[#8b4513]/30" : ""
            }`
        }
        ${isOver ? "ring-2 ring-dashed ring-[#8b4513] bg-[#8b4513]/10" : ""}
      `}
      style={
        isRepublican
          ? { flex: flexRatio !== undefined ? `${flexRatio} 1 0%` : "1 1 0%" }
          : !isRepublican && colIdx > 0
          ? {
              borderLeft: "1px solid rgba(43, 34, 26, 0.25)",
              paddingLeft: `${columnGap * 2}px`,
            }
          : {}
      }
    >
      {/* Visual drop indicator overlay when hovering a palette item */}
      {isOver && (
        <div className={`no-print absolute inset-1 rounded flex items-center justify-center z-30 pointer-events-none animate-pulse border-2 border-dashed ${
          isRepublican
            ? "bg-[#1a1a1a]/10 border-[#1a1a1a]"
            : "bg-[#8b4513]/10 border-[#8b4513]"
        }`}>
          <span className={`text-xs font-bold px-2.5 py-1 rounded shadow border ${
            isRepublican
              ? "font-sans text-[#0d0d0d] bg-[#f4f3ef] border-[#1a1a1a]"
              : "font-serif text-[#8b4513] bg-[#f5deb3] border-[#8b4513]/50"
          }`}>
            ⤓ 释放以在此栏创建模块
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
