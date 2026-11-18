/**
 * BlockPalette.tsx
 * 左侧现代化版式模板素材库。
 * 遵循当前 UITheme (深色奇幻 / 明亮冒险) 调色板与像素边框风格规范。
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
  { type: "bounty",   emoji: "⚔", label: "悬赏通缉",   desc: "WANTED 赏金公文" },
  { type: "briefs",   emoji: "❖", label: "要闻短讯",   desc: "四方杂闻多条辑录" },
  { type: "table",    emoji: "📜", label: "物价行市",   desc: "装备药剂金银价目" },
  { type: "obituary", emoji: "✝", label: "沉痛讣告",   desc: "哀思铭记与奠仪" },
  { type: "ad",       emoji: "🪙", label: "商号告示",   desc: "商铺招牌广告框" },
  { type: "letter",   emoji: "✉", label: "读者投书",   desc: "手迹信笺与启事" },
  { type: "seal",     emoji: "🔏", label: "官方印信",   desc: "顶层图层·任意拖拽" },
  { type: "image",    emoji: "🖼", label: "版画插图",   desc: "木刻风格图像块" },
  { type: "divider",  emoji: "◇", label: "装饰分隔",   desc: "羽饰纹样隔线" },
];

const REPUBLICAN_CARDS: PaletteCardDef[] = [
  { type: "headline", emoji: "■", label: "新闻标题",   desc: "民国排版黑体头条" },
  { type: "article",  emoji: "✍", label: "新闻正文",   desc: "竖排新闻报道文章" },
  { type: "bounty",   emoji: "🔍", label: "通缉悬赏",   desc: "官厅缉拿重酬启事" },
  { type: "briefs",   emoji: "▲", label: "本埠简讯",   desc: "短电杂俎流式栏目" },
  { type: "table",    emoji: "📊", label: "行情班期",   desc: "银元米价轮船班期" },
  { type: "obituary", emoji: "▪", label: "生殁讣告",   desc: "沉肃黑框开吊公祭" },
  { type: "ad",       emoji: "◎", label: "广告版块",   desc: "民国商业牌号告白" },
  { type: "letter",   emoji: "✉", label: "读者来信",   desc: "投书杂感与郑重声明" },
  { type: "seal",     emoji: "印", label: "官厅印戳",   desc: "顶层图层·任意拖拽" },
  { type: "image",    emoji: "📷", label: "报刊图片",   desc: "新闻照片或木刻画" },
  { type: "divider",  emoji: "—", label: "版面分隔",   desc: "报栏横断文武线" },
];

// ── Single draggable & clickable palette card ─────────────────────────
interface PaletteCardProps {
  key?: React.Key;
  card: PaletteCardDef;
  onQuickAdd: (type: BlockType) => void;
}

function PaletteCard({ card, onQuickAdd }: PaletteCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${card.type}`,
    data: { isPaletteItem: true, blockType: card.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onQuickAdd(card.type)}
      className={`
        pixel-card pixel-card-hover select-none cursor-grab active:cursor-grabbing transition-all duration-150
        p-2 text-left group relative flex flex-col justify-between min-h-[52px]
        ${isDragging ? "opacity-40 scale-95" : "hover:-translate-y-0.5"}
      `}
      title={`按住拖拽至报纸任意栏目；或点击卡片/加号直接追加【${card.label}】`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm leading-none select-none shrink-0 text-[var(--color-gold)]">
            {card.emoji}
          </span>
          <span className="text-[11px] font-bold leading-tight truncate text-[var(--color-ink)]">
            {card.label}
          </span>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(card.type);
          }}
          title="点击直接追加到目标栏目"
          className="w-4 h-4 pixel-btn flex items-center justify-center shrink-0 cursor-pointer p-0"
        >
          <Plus className="w-2.5 h-2.5 text-[var(--color-gold)]" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
        <span className="truncate leading-none text-[var(--color-muted)]">
          {card.desc}
        </span>
        <GripVertical className="w-3 h-3 text-[var(--color-muted)] opacity-40 group-hover:opacity-100 shrink-0" />
      </div>
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
    addFloatingSeal,
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
    if (type === "seal") {
      addFloatingSeal();
      return;
    }
    if (activeTargetColId) {
      addBlockToColumn(activeTargetColId, type);
    }
  };

  return (
    <div className="pixel-panel p-2.5">
      {/* Panel header */}
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 pb-1 border-b border-[var(--color-line)] flex items-center justify-between text-[var(--color-gold)]">
        <span className="flex items-center gap-1">
          <span>📦</span>
          <span>版式元件库</span>
        </span>
        <span className="text-[9px] font-normal text-[var(--color-muted)]">可拖拽 · 可点击追加</span>
      </div>

      {/* Target Column Selector for Quick Add */}
      {targetColOptions.length > 0 && (
        <div className="mb-2 p-1.5 pixel-card flex items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold shrink-0 text-[var(--color-gold)]">
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
            className="flex-1 min-w-0 bg-transparent text-[11px] font-bold border-0 focus:outline-none cursor-pointer truncate text-[var(--color-ink)]"
          >
            {targetColOptions.map(opt => (
              <option key={opt.id} value={opt.id} className="bg-[var(--color-paper)] text-[var(--color-ink)]">{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Hint */}
      <p className="text-[9px] leading-relaxed mb-2.5 text-[var(--color-muted)]">
        按住抓手<strong>拖拽到任意栏目</strong>；或点击<strong>【+ 添加】</strong>直接插入目标栏目末尾。
      </p>

      {/* Cards - 双列紧凑布局 */}
      <div className="grid grid-cols-2 gap-1.5">
        {cards.map((card) => (
          <PaletteCard key={card.type} card={card} onQuickAdd={handleQuickAdd} />
        ))}
      </div>
    </div>
  );
}
