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
        !isRepublican && colIdx > 0
          ? {
              borderLeft: "1px solid rgba(43, 34, 26, 0.25)",
              paddingLeft: `${columnGap * 2}px`,
            }
          : {}
      }
    >
      {/* Visual drop indicator overlay when hovering a palette item */}
      {isOver && (
        <div className="no-print absolute inset-1 bg-[#8b4513]/10 border-2 border-dashed border-[#8b4513] rounded flex items-center justify-center z-30 pointer-events-none animate-pulse">
          <span className="text-xs font-serif font-bold text-[#8b4513] px-2 py-1 bg-[#f5deb3] rounded shadow border border-[#8b4513]/50">
            ⤓ 释放以在此栏创建模块
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
