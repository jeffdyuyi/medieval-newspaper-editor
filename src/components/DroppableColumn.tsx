/**
 * DroppableColumn.tsx
 * 支持从素材库拖拽投放到本列的容器组件。
 * 当外部拖拽悬停时，呈现高亮虚线框与引导提示。
 */
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Columns, Trash2 } from "lucide-react";

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
  onSplit?: () => void;
  onDelete?: () => void;
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
  onSplit,
  onDelete,
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
      className={`group/col
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
      {/* Column Action Toolbar (WYSIWYG Split & Merge/Delete) - Positioned at column top-right outer edge to avoid overlapping blocks */}
      {(totalCols < 4 || totalCols > 1) && (
        <div className="no-print absolute -top-3 right-2 opacity-0 group-hover/col:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1 z-20 pointer-events-auto bg-[#e8dcc4]/95 backdrop-blur-xs px-1.5 py-0.5 rounded-full border border-[#8b4513]/70 shadow-sm text-[10px] select-none">
          <span className="text-[9px] text-[#8b4513]/70 font-mono pr-1 border-r border-[#8b4513]/30">栏 #{colIdx + 1}</span>
          {totalCols < 4 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSplit?.();
              }}
              title="拆分此栏（在此栏右侧拆分出新栏目）"
              className={`hover:text-[#2c241e] flex items-center gap-0.5 cursor-pointer font-bold px-1 rounded transition-colors ${
                isRepublican ? "text-[#1a1a1a] hover:bg-black/10" : "text-[#8b4513] hover:bg-[#8b4513]/10"
              }`}
            >
              <Columns className="w-2.5 h-2.5" />
              <span>拆分</span>
            </button>
          )}
          {totalCols > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="合并/删除此栏（内容将自动合并至相邻栏）"
              className="hover:text-red-700 text-[#8b4513] hover:bg-red-500/10 flex items-center gap-0.5 cursor-pointer font-bold px-1 border-l border-[#8b4513]/30 rounded transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>合并</span>
            </button>
          )}
        </div>
      )}

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
