/**
 * BlockPalette.tsx
 * 左侧现代化版式模板素材库。
 * 支持：
 * 1. 抓手拖拽（Drag & Drop）放置到右侧报纸任意栏目；
 * 2. 一键点击追加（Click-to-Add）：点击卡片或“➕”按钮，一秒追加到当前选中栏目末尾；
 * 3. 始终驻留在素材库视图，添加后不强行跳走，支持连续顺畅排版。
 */
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Plus, GripVertical } from "lucide-react";
import { BlockType, NewspaperTheme } from "../types";
import { useNewspaper } from "../context/NewspaperContext";

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

// ── Single draggable & clickable palette card ─────────────────────────
interface PaletteCardProps {
  key?: React.Key;
  card: PaletteCardDef;
  theme: NewspaperTheme;
  onQuickAdd: (type: BlockType) => void;
}

function PaletteCard({ card, theme, onQuickAdd }: PaletteCardProps) {
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
        p-2.5 text-left group flex items-center justify-between
        ${isDragging ? "opacity-50 scale-95 shadow-inner" : "hover:shadow-md hover:-translate-y-0.5"}
        ${isRep
          ? "bg-[#f4f3ef] border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50 hover:bg-[#eae9e4]"
          : "bg-[#f0e6cc] border-[#8b4513]/20 hover:border-[#8b4513]/50 hover:bg-[#ead9b6]"
        }
      `}
      title="按住可拖拽到报纸任意栏目中；或点击右侧➕直接追加"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <GripVertical className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-80 shrink-0 ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`} />
        <span className={`text-base leading-none select-none shrink-0 ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`}>
          {card.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] font-bold leading-tight truncate ${isRep ? "text-[#0d0d0d] font-sans" : "text-[#2b221a] font-serif"}`}>
            {card.label}
          </div>
          <div className={`text-[9px] leading-tight mt-0.5 truncate ${isRep ? "text-[#1a1a1a]/50" : "text-[#2b221a]/50"}`}>
            {card.desc}
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAdd(card.type);
        }}
        title="点击直接追加到当前选中的栏目"
        className={`ml-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer shrink-0 shadow-sm ${
          isRep
            ? "bg-[#1a1a1a] text-[#f4f3ef] hover:bg-[#333]"
            : "bg-[#8b4513] text-[#f5deb3] hover:bg-[#753a10]"
        }`}
      >
        <Plus className="w-3 h-3" />
        <span>添加</span>
      </button>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────
interface BlockPaletteProps {
  theme: NewspaperTheme;
}

export default function BlockPalette({ theme }: BlockPaletteProps) {
  const {
    newspaperData,
    selectedColumnId,
    setSelectedColumnId,
    setSelectedRowId,
    addBlockToColumn,
  } = useNewspaper();
  const isRep = theme === "republican";
  const cards = isRep ? REPUBLICAN_CARDS : FANTASY_CARDS;

  // 收集可放置的栏目列表供一键快捷添加选择
  const targetColOptions: { id: string; label: string }[] = [];
  newspaperData.rows.forEach((row, rowIdx) => {
    row.columns.forEach((col, colIdx) => {
      targetColOptions.push({
        id: col.id,
        label: `行 ${rowIdx + 1} - 栏 ${colIdx + 1} (已有 ${col.blocks.length} 块)`
      });
    });
  });

  const activeTargetColId = selectedColumnId || targetColOptions[0]?.id || "";

  const handleQuickAdd = (type: BlockType) => {
    if (activeTargetColId) {
      addBlockToColumn(activeTargetColId, type);
    }
  };

  return (
    <div className={`rounded border p-2.5 ${isRep ? "bg-[#eae9e4] border-[#1a1a1a]/20" : "bg-[#e8dcc4] border-[#8b4513]/20"}`}>
      {/* Panel header */}
      <div className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 pb-1 border-b flex items-center justify-between
        ${isRep ? "text-[#1a1a1a]/60 border-[#1a1a1a]/15 font-sans" : "text-[#8b4513]/60 border-[#8b4513]/15 font-serif"}`}
      >
        <span className="flex items-center gap-1">
          <span>📦</span>
          <span>版式元件库</span>
        </span>
        <span className="text-[9px] font-normal opacity-75">可拖拽 · 可点击追加</span>
      </div>

      {/* Target Column Selector for Quick Add */}
      {targetColOptions.length > 0 && (
        <div className={`mb-2 p-1.5 rounded flex items-center gap-1.5 text-xs border ${
          isRep ? "bg-[#f4f3ef] border-[#1a1a1a]/20" : "bg-[#dcd0b8]/60 border-[#8b4513]/30"
        }`}>
          <span className={`text-[10px] font-bold shrink-0 ${isRep ? "text-[#1a1a1a]/70 font-sans" : "text-[#8b4513] font-serif"}`}>
            添加至:
          </span>
          <select
            value={activeTargetColId}
            onChange={(e) => {
              const colId = e.target.value;
              setSelectedColumnId(colId);
              for (const r of newspaperData.rows) {
                if (r.columns.some(c => c.id === colId)) {
                  setSelectedRowId(r.id);
                  break;
                }
              }
            }}
            className={`flex-1 min-w-0 bg-transparent text-[11px] font-bold border-0 focus:outline-none cursor-pointer truncate ${
              isRep ? "text-[#0d0d0d] font-sans" : "text-[#2c241e] font-serif"
            }`}
          >
            {targetColOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Hint */}
      <p className={`text-[9px] leading-relaxed mb-2.5 ${isRep ? "text-[#1a1a1a]/60 font-sans" : "text-[#2b221a]/60 font-serif"}`}>
        按住抓手<strong>拖拽到任意栏目</strong>；或点击<strong>【+ 添加】</strong>直接插入目标栏目末尾。
      </p>

      {/* Cards */}
      <div className="space-y-1.5">
        {cards.map((card) => (
          <PaletteCard key={card.type} card={card} theme={theme} onQuickAdd={handleQuickAdd} />
        ))}
      </div>
    </div>
  );
}
