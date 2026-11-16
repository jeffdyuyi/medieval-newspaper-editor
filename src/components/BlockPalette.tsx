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
  { type: "bounty",   emoji: "⚔", label: "悬赏通缉",   desc: "WANTED 赏金公文" },
  { type: "briefs",   emoji: "❖", label: "要闻短讯",   desc: "四方杂闻多条辑录" },
  { type: "table",    emoji: "📜", label: "物价行市",   desc: "装备药剂金银价目" },
  { type: "obituary", emoji: "✝", label: "沉痛讣告",   desc: "哀思铭记与奠仪" },
  { type: "ad",       emoji: "🪙", label: "商号告示",   desc: "商铺招牌广告框" },
  { type: "letter",   emoji: "✉", label: "读者投书",   desc: "手迹信笺与启事" },
  { type: "seal",     emoji: "🔏", label: "官方印信",   desc: "火漆蜡印与特许章" },
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
  { type: "seal",     emoji: "印", label: "官厅印戳",   desc: "朱砂椭圆审核验讫章" },
  { type: "image",    emoji: "📷", label: "报刊图片",   desc: "新闻照片或木刻画" },
  { type: "divider",  emoji: "—", label: "版面分隔",   desc: "报栏横断文武线" },
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
      onClick={() => onQuickAdd(card.type)}
      className={`
        select-none cursor-grab active:cursor-grabbing rounded border transition-all duration-150
        p-1.5 text-left group relative flex flex-col justify-between min-h-[50px]
        ${isDragging ? "opacity-50 scale-95 shadow-inner" : "hover:shadow-md hover:-translate-y-0.5"}
        ${isRep
          ? "bg-[#f4f3ef] border-[#1a1a1a]/20 hover:border-[#1a1a1a]/60 hover:bg-[#eae9e4]"
          : "bg-[#f0e6cc] border-[#8b4513]/25 hover:border-[#8b4513]/60 hover:bg-[#ead9b6]"
        }
      `}
      title={`按住拖拽至报纸任意栏目；或点击卡片/加号直接追加【${card.label}】`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`text-sm leading-none select-none shrink-0 ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`}>
            {card.emoji}
          </span>
          <span className={`text-[11px] font-bold leading-tight truncate ${isRep ? "text-[#0d0d0d] font-sans" : "text-[#2b221a] font-serif"}`}>
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
          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs ${
            isRep
              ? "bg-[#1a1a1a]/15 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f4f3ef]"
              : "bg-[#8b4513]/15 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3]"
          }`}
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
        <span className={`truncate leading-none ${isRep ? "text-[#1a1a1a]/60 font-sans" : "text-[#2b221a]/60 font-serif"}`}>
          {card.desc}
        </span>
        <GripVertical className={`w-3 h-3 opacity-30 group-hover:opacity-80 shrink-0 ${isRep ? "text-[#1a1a1a]" : "text-[#8b4513]"}`} />
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

      {/* Cards - 双列紧凑布局，节省垂直空间 */}
      <div className="grid grid-cols-2 gap-1.5">
        {cards.map((card) => (
          <PaletteCard key={card.type} card={card} theme={theme} onQuickAdd={handleQuickAdd} />
        ))}
      </div>
    </div>
  );
}
