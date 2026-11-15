/**
 * ColumnResizeHandle.tsx
 * 列与列之间的可拖拽分割条。
 * 拖动时实时计算列宽比例并通过回调通知父组件更新。
 *
 * 用法：放置在相邻两列之间，提供行的总像素宽度和当前 fractions 数组。
 */
import React, { useCallback, useRef } from "react";

interface ColumnResizeHandleProps {
  /** 该分割条对应的列索引（左侧列的索引） */
  colIndex: number;
  /** 当前各列的 fr 权重数组，如 [1, 2] 表示 1:2 */
  fractions: number[];
  /** 拖动结束后（或拖动中实时）传回新 fractions */
  onFractionsChange: (newFractions: number[]) => void;
  /** 是否为民国竖排主题（调整分割条样式） */
  isRepublican?: boolean;
}

export default function ColumnResizeHandle({
  colIndex,
  fractions,
  onFractionsChange,
  isRepublican = false,
}: ColumnResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startFractions = useRef<number[]>([]);
  const containerWidth = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;
      startX.current = e.clientX;
      startFractions.current = [...fractions];

      // Find the row container element to get total width
      const rowEl = (e.currentTarget as HTMLElement).closest(
        "[data-resize-row]"
      ) as HTMLElement | null;
      containerWidth.current = rowEl ? rowEl.getBoundingClientRect().width : 760;

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [fractions]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const dx = e.clientX - startX.current;
      const totalFr = startFractions.current.reduce((a, b) => a + b, 0);
      const pxPerFr = containerWidth.current / totalFr;

      const dFr = dx / pxPerFr;

      const newFractions = [...startFractions.current];
      // Clamp: left column min 0.2 fr, right column min 0.2 fr
      const minFr = 0.2;
      const leftNew = Math.max(minFr, newFractions[colIndex] + dFr);
      const rightNew = Math.max(
        minFr,
        newFractions[colIndex + 1] - dFr
      );

      // Recalculate to maintain total sum (preserve other columns)
      const leftOld = newFractions[colIndex];
      const rightOld = newFractions[colIndex + 1];
      const excess = leftOld + rightOld - leftNew - rightNew;
      if (Math.abs(excess) > 0.001) {
        // Clamp was hit — distribute remainder fairly
        const usedLeft = leftOld + rightOld - rightNew;
        newFractions[colIndex] = Math.max(minFr, Math.min(usedLeft, leftOld + rightOld - minFr));
        newFractions[colIndex + 1] = leftOld + rightOld - newFractions[colIndex];
      } else {
        newFractions[colIndex] = leftNew;
        newFractions[colIndex + 1] = rightNew;
      }

      onFractionsChange(newFractions);
    },
    [colIndex, onFractionsChange]
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
      className="no-print absolute -right-2 top-0 bottom-0 z-30 flex items-center justify-center group/resizer"
      style={{
        width: 16,
        cursor: "col-resize",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title="拖拽调节列宽比例"
    >
      {/* Visual indicator line */}
      <div
        className={`
          w-[3px] h-[70%] rounded-full transition-all duration-150
          opacity-0 group-hover/resizer:opacity-100
          ${isRepublican
            ? "bg-[#1a1a1a]/30 group-hover/resizer:bg-[#1a1a1a]/60"
            : "bg-[#8b4513]/30 group-hover/resizer:bg-[#8b4513]/60"
          }
        `}
      />
    </div>
  );
}

