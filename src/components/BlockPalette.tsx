/**
 * BlockPalette.tsx
 * 左侧可拖拽的模板素材库面板。
 * 每张卡片用 @dnd-kit useDraggable 包裹，拖拽到 NewspaperPreview 中的列放置区后
 * 由上层 PaletteDropContext 的 onDragEnd 调用 addBlockToColumn。
 *
 * 注意：Palette DnD 与列内部排序 DnD 是两套独立的 DndContext，互不干扰。
 */
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BlockType, NewspaperTheme } from "../types";

// ── Palette card data ────────────────────────────────────────────────
interface PaletteCardDef {
  type: BlockType;
  emoji: string;
  label: string;
  desc: string;
}

const FANTASY_CARDS: PaletteCardDef[] = [
  { type: "headline", emoji: "✦", label: "大字标题",   desc: "装饰性栏目抬头" },
  { type: "article",  emoji: "✍", label: "文章正文",   desc: "含标题段落全文" },
  { type: "image",    emoji: "🖼", label: "版画插图",   desc: "木刻风格图像块" },
  { type: "divider",  emoji: "◇", label: "装饰分隔",   desc: "羽饰纹样隔线" },
  { type: "ad",       emoji: "🪙", label: "商号告示",   desc: "商铺招牌广告框" },
];

const REPUBLICAN_CARDS: PaletteCardDef[] = [
  { type: "headline", emoji: "■", label: "新闻标题",   desc: "民国排版黑体头条" },
  { type: "article",  emoji: "✍", label: "新闻正文",   desc: "竖排新闻文章" },
  { type: "image",    emoji: "📷", label: "报刊图片",   desc: "新闻照片或插图" },
  { type: "divider",  emoji: "—", label: "版面分隔",   desc: "报栏横切线" },
  { type: "ad",       emoji: "◎", label: "广告版块",   desc: "民国商业告白" },
];

// ── Single draggable palette card ────────────────────────────────────
interface PaletteCardProps {
  card: PaletteCardDef;
  theme: NewspaperTheme;
  key?: React.Key;
}

function PaletteCard({ card, theme }: PaletteCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${card.type}`,
    data: { isPaletteItem: true, blockType: card.type },
  });

  const isRep = theme === "republican";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        select-none cursor-grab active:cursor-grabbing rounded border transition-all duration-150
        p-2.5 text-left group
        ${isDragging ? "opacity-50 scale-95 shadow-inner" : "hover:shadow-md hover:-translate-y-0.5"}
        ${isRep
          ? "bg-[#f4f3ef] border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50 hover:bg-[#eae9e4]"
          : "bg-[#f0e6cc] border-[#8b4513]/20 hover:border-[#8b4513]/50 hover:bg-[#ead9b6]"
        }
      `}
      title={`拖拽到报纸版面上的栏目中`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-base leading-none select-none ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`}>
          {card.emoji}
        </span>
        <div className="min-w-0">
          <div className={`text-[11px] font-bold leading-tight truncate ${isRep ? "text-[#0d0d0d] font-sans" : "text-[#2b221a] font-serif"}`}>
            {card.label}
          </div>
          <div className={`text-[9px] leading-tight mt-0.5 truncate ${isRep ? "text-[#1a1a1a]/50" : "text-[#2b221a]/50"}`}>
            {card.desc}
          </div>
        </div>
        {/* subtle grip indicator */}
        <div className={`ml-auto opacity-0 group-hover:opacity-40 transition-opacity text-[8px] leading-none tracking-widest ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`}>
          ⠿
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────
interface BlockPaletteProps {
  theme: NewspaperTheme;
}

export default function BlockPalette({ theme }: BlockPaletteProps) {
  const isRep = theme === "republican";
  const cards = isRep ? REPUBLICAN_CARDS : FANTASY_CARDS;

  return (
    <div className={`rounded border p-2 ${isRep ? "bg-[#eae9e4] border-[#1a1a1a]/20" : "bg-[#e8dcc4] border-[#8b4513]/20"}`}>
      {/* Panel header */}
      <div className={`text-[10px] font-bold tracking-widest uppercase mb-2 pb-1.5 border-b flex items-center gap-1.5
        ${isRep ? "text-[#1a1a1a]/60 border-[#1a1a1a]/15 font-sans" : "text-[#8b4513]/60 border-[#8b4513]/15 font-serif"}`}
      >
        <span>⠿</span>
        <span>拖拽模板到版面栏目</span>
      </div>

      {/* Hint */}
      <p className={`text-[9px] leading-relaxed mb-2 ${isRep ? "text-[#1a1a1a]/40 font-sans" : "text-[#2b221a]/40 font-serif"}`}>
        将下方模板拖拽至右侧报纸的任意栏目中，自动创建对应内容块。
      </p>

      {/* Cards */}
      <div className="space-y-1.5">
        {cards.map((card) => (
          <PaletteCard key={card.type} card={card} theme={theme} />
        ))}
      </div>
    </div>
  );
}

