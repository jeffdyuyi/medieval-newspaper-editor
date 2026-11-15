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
      {/* Column Action Toolbar (WYSIWYG Split & Merge/Delete) */}
      <div className="no-print absolute top-1 right-1 opacity-0 group-hover/col:opacity-100 transition-opacity flex items-center gap-1 z-20 pointer-events-auto">
        {totalCols < 4 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSplit?.();
            }}
            title="拆分此栏（在此栏右侧拆分出新栏目）"
            className={`p-1 rounded-sm shadow-md transition-colors flex items-center gap-0.5 text-[9px] font-sans font-bold cursor-pointer ${
              isRepublican
                ? "bg-[#f4f3ef] text-[#1a1a1a] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f4f3ef]"
                : "bg-[#e8dcc4] text-[#8b4513] border border-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3]"
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>拆分栏</span>
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
            className="p-1 rounded-sm shadow-md transition-colors flex items-center gap-0.5 text-[9px] font-sans font-bold cursor-pointer bg-[#e8dcc4] text-[#8b4513] border border-[#8b4513] hover:bg-red-700 hover:text-white hover:border-red-800"
          >
            <Trash2 className="w-3 h-3" />
            <span>合并删除</span>
          </button>
        )}
      </div>

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
