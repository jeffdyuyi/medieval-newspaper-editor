/**
 * FloatingSealsLayer.tsx
 * 最顶层自由印章图层（Overlay Floating Seals Layer）。
 * 不受限于任何版式行、列或文本框，放置在整张报纸的最上层。
 * 支持：
 * 1. 任意位置自由拖拽（基于报纸容器宽高的百分比定位，自适应各种分辨率与打印）；
 * 2. 悬停/选中操作浮条：旋转角度微调、尺寸缩放、形制切换、一键删除；
 * 3. 印章内部文字支持原位单击直接打字；
 * 4. 打印与矢量 PDF 导出时 100% 真实还原，完美压印在报纸上。
 */
import React, { useState, useRef } from "react";
import { 
  RotateCw, ZoomIn, ZoomOut, Trash2, 
  Move, Palette, CircleDot, ShieldCheck
} from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";
import { FloatingSeal } from "../types";
import EditableText from "./EditableText";

export default function FloatingSealsLayer({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    newspaperData,
    selectedSealId,
    setSelectedSealId,
    updateFloatingSeal,
    deleteFloatingSeal,
    theme,
  } = useNewspaper();

  const seals = newspaperData.floatingSeals || [];
  const [draggingSealId, setDraggingSealId] = useState<string | null>(null);

  // 鼠标拖拽处理
  const handlePointerDown = (seal: FloatingSeal, e: React.PointerEvent) => {
    // 如果点击的是可编辑文本或工具条，不触发移动拖拽
    const target = e.target as HTMLElement;
    if (target.closest(".no-drag") || target.tagName === "INPUT" || target.isContentEditable) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setSelectedSealId(seal.id);
    setDraggingSealId(seal.id);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialSealX = seal.x;
    const initialSealY = seal.y;

    const onPointerMove = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;

      // 转换为相对于报纸宽高的百分比偏移
      const percentDeltaX = (deltaX / rect.width) * 100;
      const percentDeltaY = (deltaY / rect.height) * 100;

      const newX = Math.max(2, Math.min(98, Number((initialSealX + percentDeltaX).toFixed(2))));
      const newY = Math.max(1, Math.min(99, Number((initialSealY + percentDeltaY).toFixed(2))));

      updateFloatingSeal(seal.id, s => ({
        ...s,
        x: newX,
        y: newY,
      }));
    };

    const onPointerUp = () => {
      setDraggingSealId(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {seals.map((seal) => {
        const isSelected = selectedSealId === seal.id;
        const isDragging = draggingSealId === seal.id;
        const rot = seal.rotation ?? -8;
        const scale = seal.scale ?? 1.0;
        const isWax = seal.shape === "wax";

        // 颜色映射
        const colorClasses = {
          crimson: "text-[#8b1e1e] border-[#8b1e1e] bg-[#8b1e1e]/6",
          red: "text-[#b22222] border-[#b22222] bg-[#b22222]/6",
          indigo: "text-[#2a347b] border-[#2a347b] bg-[#2a347b]/6",
          black: "text-[#1a1a1a] border-[#1a1a1a] bg-[#1a1a1a]/6",
          gold: "text-[#b8860b] border-[#b8860b] bg-[#b8860b]/6",
        };
        const activeColor = colorClasses[seal.color] || colorClasses.crimson;

        return (
          <div
            key={seal.id}
            onPointerDown={(e) => handlePointerDown(seal, e)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSealId(seal.id);
            }}
            style={{
              left: `${seal.x}%`,
              top: `${seal.y}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
              opacity: seal.opacity ?? 0.95,
              touchAction: "none",
            }}
            className={`absolute pointer-events-auto select-none group cursor-grab transition-shadow ${
              isDragging ? "cursor-grabbing opacity-80" : ""
            } ${
              isSelected
                ? "ring-2 ring-[#e0a96d] ring-offset-2 ring-offset-transparent rounded-full"
                : "hover:ring-1 hover:ring-[#8b4513]/40 rounded-full"
            }`}
            title="按住鼠标可在整张报纸上任意拖拽移动位置；点击可调节大小与样式"
          >
            {/* Seal Body Visual */}
            <div
              className={`transition-transform duration-75 relative flex flex-col items-center justify-center text-center ${
                isWax
                  ? "w-24 h-24 rounded-full bg-gradient-to-br from-[#a72626] via-[#851818] to-[#540c0c] text-[#fbe3b5] p-2.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_6px_14px_rgba(0,0,0,0.45)] border-2 border-[#450909]"
                  : seal.shape === "oval"
                  ? `px-5 py-2.5 rounded-[50%] border-2 border-double ${activeColor} shadow-xs`
                  : seal.shape === "square"
                  ? `w-20 h-20 border-2 border-double ${activeColor} shadow-xs p-1`
                  : `w-22 h-22 rounded-full border-2 border-double ${activeColor} shadow-xs p-1.5`
              }`}
            >
              {/* Wax Outer Relief Ring Decor */}
              {isWax && (
                <div className="absolute inset-1 rounded-full border border-dashed border-[#fde68a]/40 pointer-events-none" />
              )}

              {/* Main Stamp Text */}
              <div className="no-drag">
                <EditableText
                  tagName="div"
                  value={seal.text}
                  onChange={(val) => updateFloatingSeal(seal.id, s => ({ ...s, text: val }))}
                  className={`font-black tracking-widest leading-tight ${
                    isWax
                      ? "text-xs md:text-sm text-[#fef3c7] font-serif drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                      : "text-xs md:text-sm font-serif font-black"
                  }`}
                  placeholder="印文"
                  title="点击直接修改印章文字"
                />
              </div>

              {/* Sub Stamp Text */}
              <div className="no-drag">
                <EditableText
                  tagName="div"
                  value={seal.subtext || ""}
                  onChange={(val) => updateFloatingSeal(seal.id, s => ({ ...s, subtext: val }))}
                  className={`text-[8.5px] tracking-wider mt-0.5 opacity-90 ${
                    isWax ? "text-[#fde68a] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" : ""
                  }`}
                  placeholder="副标/年份"
                  title="点击直接修改印章副标文案"
                />
              </div>

              {/* Republican Emblem Star Decor */}
              {!isWax && seal.shape !== "square" && (
                <div className="text-[8px] opacity-70 leading-none select-none pointer-events-none mt-0.5">
                  ★ ★ ★
                </div>
              )}
            </div>

            {/* In-situ WYSIWYG Floating Action Toolbar (Only on Selected / Hover in Edit Mode) */}
            <div
              className={`no-print no-drag absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#241c16]/95 border border-[#8b4513] text-[#f5deb3] px-1.5 py-0.5 rounded-full shadow-lg text-[10px] select-none z-50 backdrop-blur-xs transition-opacity duration-150 ${
                isSelected ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 pointer-events-auto"
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFloatingSeal(seal.id, s => ({
                    ...s,
                    rotation: ((s.rotation ?? -8) + 15) % 360,
                  }));
                }}
                className="p-1 hover:text-[#e0a96d] cursor-pointer"
                title="顺时针旋转 15°"
              >
                <RotateCw className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFloatingSeal(seal.id, s => ({
                    ...s,
                    scale: Math.min(2.0, Number(((s.scale ?? 1.0) + 0.1).toFixed(2))),
                  }));
                }}
                className="p-1 hover:text-[#e0a96d] cursor-pointer"
                title="放大印章"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFloatingSeal(seal.id, s => ({
                    ...s,
                    scale: Math.max(0.5, Number(((s.scale ?? 1.0) - 0.1).toFixed(2))),
                  }));
                }}
                className="p-1 hover:text-[#e0a96d] cursor-pointer"
                title="缩小印章"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const shapes: FloatingSeal["shape"][] = ["wax", "oval", "circle", "square"];
                  const nextShape = shapes[(shapes.indexOf(seal.shape) + 1) % shapes.length];
                  updateFloatingSeal(seal.id, s => ({ ...s, shape: nextShape }));
                }}
                className="p-1 hover:text-[#e0a96d] cursor-pointer"
                title="切换印章形制 (火漆蜡印 / 椭圆 / 圆印 / 方章)"
              >
                <CircleDot className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const colors: FloatingSeal["color"][] = ["crimson", "red", "indigo", "black", "gold"];
                  const nextColor = colors[(colors.indexOf(seal.color) + 1) % colors.length];
                  updateFloatingSeal(seal.id, s => ({ ...s, color: nextColor }));
                }}
                className="p-1 hover:text-[#e0a96d] cursor-pointer"
                title="切换印章颜色 (深红 / 朱砂 / 藏青 / 黑墨 / 皇家金)"
              >
                <Palette className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFloatingSeal(seal.id);
                }}
                className="p-1 hover:text-red-400 cursor-pointer ml-0.5 border-l border-[#8b4513]/40 pl-1"
                title="撕除/删除此印章"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
