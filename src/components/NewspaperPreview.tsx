import React from 'react';
import { Eye, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Image as ImageIcon } from "lucide-react";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from "./SortableBlock";
import { useNewspaper } from "../context/NewspaperContext";
import { ALL_CLIPART } from "../clipart";
import { CoinsIcon } from "./Sidebar";
import { ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock } from "../types";

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|__.*?__)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold font-sans">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <u key={idx} className="underline decoration-[#2b221a]/50 underline-offset-2">{part.slice(2, -2)}</u>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic font-kai">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={idx} className="line-through decoration-[#2b221a]/70">{part.slice(2, -2)}</del>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

export default function NewspaperPreview() {
  const {
    newspaperData, setNewspaperData,
    selectedBlockId, setSelectedBlockId,
    selectedRowId, setSelectedRowId,
    selectedColumnId, setSelectedColumnId,
    globalHeadingScale, setGlobalHeadingScale,
    globalBodyScale, setGlobalBodyScale,
    columnGap, setColumnGap,
    enableParchmentTexture, setEnableParchmentTexture,
    enableCoffeeStains, setEnableCoffeeStains,
    activeAddBlockColId, setActiveAddBlockColId,
    selectBlockAndContext, updateBlock,
    addBlockToColumn, deleteBlock, moveBlock, moveBlockHorizontally,
    theme, switchTheme, updateRowHeight
  } = useNewspaper();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlockId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateBlock(selectedBlockId, b => ({
        ...b,
        type: "image",
        src: base64,
        isClipart: false,
        clipartId: undefined
      }) as ImageBlock);
    };
    reader.readAsDataURL(file);
  };


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const findContainer = (id: string) => {
    for (const row of newspaperData.rows) {
      for (const col of row.columns) {
        if (col.id === id) return col.id;
        if (col.blocks.find(b => b.id === id)) return col.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setNewspaperData((prev: any) => {
      const newRows = [...prev.rows];
      let activeItem: any;
      
      newRows.forEach(row => {
        row.columns.forEach(col => {
          if (col.id === activeContainer) {
            const idx = col.blocks.findIndex((b: any) => b.id === active.id);
            if (idx !== -1) {
              activeItem = { ...col.blocks[idx] };
              col.blocks.splice(idx, 1);
            }
          }
        });
      });

      newRows.forEach(row => {
        row.columns.forEach(col => {
          if (col.id === overContainer) {
            const overIndex = col.blocks.findIndex((b: any) => b.id === over.id);
            const insertIndex = overIndex >= 0 ? overIndex : col.blocks.length;
            col.blocks.splice(insertIndex, 0, activeItem);
          }
        });
      });

      return { ...prev, rows: newRows };
    });
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    if (active.id !== over.id) {
      setNewspaperData((prev: any) => {
        const newRows = [...prev.rows];
        newRows.forEach(row => {
          row.columns.forEach(col => {
            if (col.id === activeContainer) {
              const oldIndex = col.blocks.findIndex((b: any) => b.id === active.id);
              const newIndex = col.blocks.findIndex((b: any) => b.id === over.id);
              const [movedItem] = col.blocks.splice(oldIndex, 1);
              col.blocks.splice(newIndex, 0, movedItem);
            }
          });
        });
        return { ...prev, rows: newRows };
      });
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-[#2c241e] bg-[radial-gradient(#3e3227_1px,transparent_1px)] [background-size:16px_16px] p-4 md:p-8 flex justify-center scrollbar-thin pt-16 md:pt-8 pb-20 md:pb-8">
        
        {/* Printable Canvas Box wrapper */}
        <div className="w-full max-w-[800px] select-text relative">
          
          {/* Top-Level Theme Switcher Entry */}
          <div className="no-print mb-4 bg-[#e8dcc4] border-2 border-[#8b4513] p-2 rounded flex items-center justify-between shadow-md">
            <span className="text-xs font-serif font-bold text-[#8b4513] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#8b4513]" />
              <span>报纸风格实时切换：</span>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => switchTheme("fantasy")}
                className={`px-3 py-1 text-xs font-serif font-bold rounded-sm border transition-all cursor-pointer ${
                  theme === "fantasy"
                    ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c] shadow-inner"
                    : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/30 hover:bg-[#8b4513]/10"
                }`}
              >
                ⚔ 中世纪奇幻
              </button>
              <button
                type="button"
                onClick={() => switchTheme("republican")}
                className={`px-3 py-1 text-xs font-serif font-bold rounded-sm border transition-all cursor-pointer ${
                  theme === "republican"
                    ? "bg-[#1a1a1a] text-[#f4f3ef] border-black shadow-inner"
                    : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/30 hover:bg-[#8b4513]/10"
                }`}
              >
                ■ 民国报刊
              </button>
            </div>
          </div>

          {/* Editor Quick overlay for mobile viewport */}
          <div className="no-print bg-[#e8dcc4] border-2 border-[#8b4513] px-3 py-1.5 rounded-sm text-xs font-serif font-bold text-[#8b4513] flex items-center justify-between mb-4 shadow-md md:hidden">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-[#8b4513]" /> 手机预览模式</span>
            <span className="text-[10px] text-[#4a3728]/80">点击左栏工具进行编辑</span>
          </div>

          {/* THE ACTUAL NEWSPAPER */}
          <div 
            id="printable-newspaper-content"
            className={`printable-newspaper w-full p-6 md:p-10 transition-all duration-300 shadow-2xl relative select-text ${
              theme === "republican"
                ? "newsprint-bg text-[#0d0d0d] republican-double-border"
                : `text-[#2b221a] border-4 newspaper-double-border ${enableParchmentTexture ? "parchment-bg" : "bg-[#fcf8ee] text-black"}`
            }`}
          >
            {/* Fantasy: Coffee Stains */}
            {theme === "fantasy" && enableParchmentTexture && enableCoffeeStains && (
              <div className="absolute top-[15%] left-[5%] w-[120px] h-[100px] bg-[#8b5a2b] opacity-5 rounded-full blur-2xl pointer-events-none rotate-12" />
            )}
            {theme === "fantasy" && enableParchmentTexture && enableCoffeeStains && (
              <div className="absolute bottom-[25%] right-[10%] w-[180px] h-[150px] bg-[#6f4e37] opacity-6 rounded-full blur-3xl pointer-events-none -rotate-45" />
            )}
            {/* Republican: Oil Ink Smudges */}
            {theme === "republican" && enableCoffeeStains && <div className="ink-smudge-1" />}
            {theme === "republican" && enableCoffeeStains && <div className="ink-smudge-2" />}


            {/* NEWSPAPER MAIN HEADER — theme-aware */}
            {theme === "republican" ? (
              /* REPUBLICAN MASTHEAD */
              newspaperData.header.republicanHeaderStyle === "horizontal-rtl" ? (
                /* Horizontal RTL banner style */
                <header className="mb-3 border-t-[3px] border-b border-[#1a1a1a]">
                  <div className="text-[9px] font-serif border-b border-[#1a1a1a]/50 pb-0.5 mb-1 tracking-widest flex justify-between px-1 text-[#1a1a1a]/70">
                    <span>{newspaperData.header.issueNo}</span>
                    <span>{newspaperData.header.date}</span>
                    <span>{newspaperData.header.location}</span>
                  </div>
                  <h1
                    style={{ fontSize: `calc(3rem * ${globalHeadingScale / 100})` }}
                    className="font-bold text-center leading-tight text-[#0d0d0d] font-serif tracking-[0.2em] py-1"
                    dir="rtl"
                  >
                    {newspaperData.header.title}
                  </h1>
                  <div className="flex justify-between text-[9px] font-serif border-t border-[#1a1a1a]/50 pt-0.5 mt-1 px-1 text-[#1a1a1a]/70">
                    <span>{newspaperData.header.publisherEn || "THE CHINA TIMES"}</span>
                    <span>{newspaperData.header.subtitle}</span>
                    <span>{newspaperData.header.price}</span>
                  </div>
                </header>
              ) : (
                /* Vertical box masthead (default republican) */
                <header className="mb-3">
                  <div className="text-[9px] font-serif text-center border-b border-[#1a1a1a]/40 pb-0.5 mb-1 tracking-widest text-[#1a1a1a]/60">
                    {newspaperData.header.subtitle}
                  </div>
                  <div className="rep-masthead-vertical">
                    {/* Right side: Large title box */}
                    <div className="rep-masthead-title-box min-w-[80px]">
                      <h1
                        style={{ fontSize: `calc(2.8rem * ${globalHeadingScale / 100})` }}
                        className="font-bold text-[#0d0d0d] font-serif leading-none tracking-wider"
                      >
                        {newspaperData.header.title}
                      </h1>
                      <span className="text-[8px] font-sans tracking-widest text-[#1a1a1a]/60 border-t border-[#1a1a1a]/30 pt-1 mt-1">
                        {newspaperData.header.publisherEn || "THE CHINA TIMES"}
                      </span>
                    </div>
                    {/* Left side: Issue info columns */}
                    <div className="rep-masthead-info-box">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[11px]">{newspaperData.header.issueNo}</span>
                        <span>{newspaperData.header.date}</span>
                        <span>{newspaperData.header.location}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-r border-[#1a1a1a]/30 pr-2 mr-1">
                        <span>{newspaperData.header.price}</span>
                        <span className="text-[9px] text-[#1a1a1a]/60">{newspaperData.header.publisherOffice || ""}</span>
                      </div>
                    </div>
                  </div>
                </header>
              )
            ) : (
              /* FANTASY MASTHEAD */
              <header className="border-b-[4px] border-[#2b221a] pb-2 mb-4 text-center">
                {/* Motto or Top Issue Headline */}
                <div className="text-[10px] md:text-xs font-mono font-medium border-b border-[#2b221a]/60 pb-1 mb-2 tracking-widest uppercase flex items-center justify-between px-2 text-[#2b221a]/80">
                  <span>{newspaperData.header.subtitle}</span>
                </div>

                {/* Big Title Name */}
                <h1
                  style={{ fontSize: `calc(3.5rem * ${globalHeadingScale / 100})` }}
                  className={`font-semibold text-center leading-tight transition-all duration-200 text-[#1c1510] ${newspaperData.header.titleFont}`}
                >
                  {newspaperData.header.title}
                </h1>

                {/* Sub-header Royal Double Emblem Ornament */}
                {newspaperData.header.headerStyle === "royal" && (
                  <div className="flex items-center justify-center gap-6 text-[#2b221a]/80 py-1.5">
                    <span className="text-sm">⚜</span>
                    <span className="w-16 h-[1px] bg-[#2b221a]/30" />
                    <span className="text-xs font-serif uppercase tracking-widest">
                      {newspaperData.header.royalTitle || "圣 塞 西 尔 皇 家 御 览"}
                    </span>
                    <span className="w-16 h-[1px] bg-[#2b221a]/30" />
                    <span className="text-sm">⚜</span>
                  </div>
                )}

                {/* Metadata Columns Under Double Lines */}
                <div className="border-t-[3px] border-b border-[#2b221a] py-1 mt-2 grid grid-cols-4 text-[10px] md:text-xs font-medium font-serif tracking-tight text-[#2b221a]/90">
                  <div className="text-left pl-1">
                    <span>{newspaperData.header.issueNo}</span>
                  </div>
                  <div className="text-center col-span-2 flex justify-center gap-2">
                    <span>{newspaperData.header.location}</span>
                    <span>•</span>
                    <span>{newspaperData.header.date}</span>
                  </div>
                  <div className="text-right pr-1">
                    <span>{newspaperData.header.price}</span>
                  </div>
                </div>
              </header>
            )}


             {/* NEWSPAPER CONTENT GRID (ROWS & COLUMNS) */}
             <div className="space-y-4">
               {newspaperData.rows.map((row) => {
                 const isRepublican = theme === "republican";
                 // Determine column grid template depending on split (fantasy only)
                 let gridClass = "grid-cols-1";
                 if (row.split === "1-1") gridClass = "split-1-1";
                 if (row.split === "1-2") gridClass = "split-1-2";
                 if (row.split === "2-1") gridClass = "split-2-1";
                 if (row.split === "1-1-1") gridClass = "split-1-1-1";
                 const rowHeight = row.height || 480;

                 return (
                   <div
                     key={row.id}
                     className={`${isRepublican ? "rep-row-container border-b border-[#1a1a1a]/30 last:border-b-0" : `grid ${gridClass} border-b border-[#2b221a]/30 pb-6 last:border-b-0 last:pb-0`} relative group/row`}
                     style={isRepublican ? { height: `${rowHeight}px`, columnGap: 0 } : { columnGap: `${columnGap * 4}px` }}
                   >
                     {/* Visual Row Highlight when editing in layout mode */}
                     {selectedRowId === row.id && (
                       <div className={`absolute -inset-2 border border-dashed rounded pointer-events-none no-print ${isRepublican ? "border-[#1a1a1a]/40" : "border-[#8b4513]/50"}`} />
                     )}

                     {row.columns.map((col, colIdx) => (
                       <div
                         key={col.id}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedRowId(row.id);
                           setSelectedColumnId(col.id);
                         }}
                         className={`${isRepublican ? `rep-col-container ${selectedColumnId === col.id ? "bg-[#1a1a1a]/5 outline outline-1 outline-dashed outline-[#1a1a1a]/30" : ""}` : `space-y-4 relative min-h-[50px] p-1 rounded-sm transition ${selectedColumnId === col.id ? "bg-[#2b221a]/5 border border-dashed border-[#8b4513]/30" : ""}`}`}
                         style={!isRepublican && colIdx > 0 ? { borderLeft: '1px solid rgba(43, 34, 26, 0.25)', paddingLeft: `${columnGap * 2}px` } : {}}
                       >
                       {(() => {
                          const colContent = (
                            <SortableContext items={col.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                              {col.blocks.map((block) => {
                                const isSelected = selectedBlockId === block.id;

                                return (
                                  <SortableBlock
                                    key={block.id}
                                    id={block.id}
                                    isSelected={isSelected}
                                    onSelect={(e) => {
                                      e.stopPropagation();
                                      selectBlockAndContext(block.id, col.id, row.id);
                                    }}
                                  >
                                    {/* Block Level Quick Ink buttons overlay */}
                                    <div className="no-print absolute top-1 right-1 opacity-0 group-hover/block:opacity-100 flex items-center gap-1 bg-[#e8dcc4] p-1 rounded-sm border border-[#8b4513] shadow-lg transition z-10">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, col.id, "up"); }}
                                        title="上移此模块"
                                        className="p-1 hover:bg-[#8b4513]/15 rounded-sm text-[#8b4513] hover:text-[#2c241e]"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, col.id, "down"); }}
                                        title="下移此模块"
                                        className="p-1 hover:bg-[#8b4513]/15 rounded-sm text-[#8b4513] hover:text-[#2c241e]"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      {row.columns.length > 1 && (
                                        <>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); moveBlockHorizontally(block.id, col.id, row.id, "left"); }}
                                            disabled={colIdx === 0}
                                            title="移入左侧栏位"
                                            className="p-1 hover:bg-[#8b4513]/15 rounded-sm text-[#8b4513] hover:text-[#2c241e] disabled:opacity-30"
                                          >
                                            <ArrowLeft className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); moveBlockHorizontally(block.id, col.id, row.id, "right"); }}
                                            disabled={colIdx === row.columns.length - 1}
                                            title="移入右侧栏位"
                                            className="p-1 hover:bg-[#8b4513]/15 rounded-sm text-[#8b4513] hover:text-[#2c241e] disabled:opacity-30"
                                          >
                                            <ArrowRight className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        title="删除模块"
                                        className="p-1 hover:bg-red-100 rounded-sm text-[#8b4513] hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* BLOCK RENDERING: ARTICLE */}
                                    {block.type === "article" && (
                                      <article className="space-y-2">
                                        {/* Article Header info */}
                                        <div className="space-y-1">
                                          <h2 
                                            style={{ 
                                              fontSize: `calc(${(block as ArticleBlock).titleFontSize === "sm" ? "1.05rem" : (block as ArticleBlock).titleFontSize === "md" ? "1.2rem" : (block as ArticleBlock).titleFontSize === "lg" ? "1.35rem" : (block as ArticleBlock).titleFontSize === "xl" ? "1.5rem" : (block as ArticleBlock).titleFontSize === "2xl" ? "1.8rem" : "1.35rem"} * ${globalHeadingScale / 100})` 
                                            }}
                                            className={`font-bold text-[#1c1510] leading-snug tracking-tight ${(block as ArticleBlock).titleFont || "font-serif"} ${(block as ArticleBlock).titleAlign === "center" ? "text-center" : (block as ArticleBlock).titleAlign === "right" ? "text-right" : (block as ArticleBlock).titleAlign === "justify" ? "text-justify" : "text-left"} flex items-center gap-1`}
                                          >
                                            {(block as ArticleBlock).titleMarker && (block as ArticleBlock).titleMarker !== "none" && (
                                              <span className="text-[0.7em] select-none opacity-80">
                                                {(block as ArticleBlock).titleMarker === "square" && "■"}
                                                {(block as ArticleBlock).titleMarker === "triangle" && "▲"}
                                                {(block as ArticleBlock).titleMarker === "circle" && "●"}
                                              </span>
                                            )}
                                            <span>{(block as ArticleBlock).title}</span>
                                          </h2>
                                          
                                          {(block as ArticleBlock).subtitle && (
                                            <p 
                                              className={`font-semibold italic text-[#2b221a]/80 leading-normal border-b border-[#2b221a]/20 pb-1 ${(block as ArticleBlock).subtitleFont || "font-serif"} ${(block as ArticleBlock).subtitleAlign === "center" ? "text-center" : (block as ArticleBlock).subtitleAlign === "right" ? "text-right" : (block as ArticleBlock).subtitleAlign === "justify" ? "text-justify" : "text-left"}`}
                                              style={{
                                                fontSize: (block as ArticleBlock).subtitleFontSize === "xs" ? "11px" : (block as ArticleBlock).subtitleFontSize === "sm" ? "12px" : (block as ArticleBlock).subtitleFontSize === "md" ? "14px" : (block as ArticleBlock).subtitleFontSize === "lg" ? "16px" : "12px"
                                              }}
                                            >
                                              {(block as ArticleBlock).subtitle}
                                            </p>
                                          )}
                                        </div>

                                        {/* Author stamp line */}
                                        <div className="flex items-center gap-1.5 text-[10px] text-stone-600 font-serif italic justify-between">
                                          <span>作者：{(block as ArticleBlock).author || "佚名学者"}</span>
                                          <span>{(block as ArticleBlock).publishOffice || "圣塞西尔记录署印"}</span>
                                        </div>

                                        {/* Article paragraphs */}
                                        <div 
                                          className={`tracking-wide space-y-3 transition-all duration-200 ${(block as ArticleBlock).font} ${
                                            (block as ArticleBlock).align === "justify" ? "text-justify" : (block as ArticleBlock).align === "center" ? "text-center" : "text-left"
                                          } ${
                                            (block as ArticleBlock).lineHeight === "tight" ? "leading-tight" :
                                            (block as ArticleBlock).lineHeight === "relaxed" ? "leading-relaxed" :
                                            (block as ArticleBlock).lineHeight === "loose" ? "leading-loose" : "leading-relaxed"
                                          } ${
                                            (block as ArticleBlock).letterSpacing === "tight" ? "tracking-tighter" :
                                            (block as ArticleBlock).letterSpacing === "wide" ? "tracking-wide" :
                                            (block as ArticleBlock).letterSpacing === "widest" ? "tracking-widest" : "tracking-normal"
                                          }`}
                                          style={{ 
                                            fontSize: `calc(${
                                              (block as ArticleBlock).fontSize === "xs" ? "11px" :
                                              (block as ArticleBlock).fontSize === "sm" ? "13px" :
                                              (block as ArticleBlock).fontSize === "md" ? "15px" : "18px"
                                            } * ${globalBodyScale / 100})`
                                          }}
                                        >
                                          {(block as ArticleBlock).paragraphs.map((p, pIdx) => (
                                            <p 
                                              key={pIdx} 
                                              className={pIdx === 0 && (block as ArticleBlock).dropCap ? (theme === "republican" ? "char-drop-large" : "drop-cap") : ""}
                                            >
                                              {renderMarkdown(p)}
                                            </p>
                                          ))}
                                        </div>
                                      </article>
                                    )}

                                    {/* BLOCK RENDERING: HEADLINE */}
                                    {block.type === "headline" && (
                                      <div className="py-2 space-y-1">
                                        <h2 
                                          style={{ fontSize: `calc(${
                                            (block as HeadlineBlock).size === "normal" ? "1.5rem" :
                                            (block as HeadlineBlock).size === "large" ? "2.2rem" : "3rem"
                                          } * ${globalHeadingScale / 100})` }}
                                          className={`font-bold leading-tight tracking-normal text-[#1c1510] border-t-2 border-b-2 border-[#2b221a] py-1.5 ${(block as HeadlineBlock).font} ${(block as HeadlineBlock).align === "left" ? "text-left" : (block as HeadlineBlock).align === "right" ? "text-right" : (block as HeadlineBlock).align === "justify" ? "text-justify" : "text-center"} flex items-center justify-center gap-1.5`}
                                        >
                                          {(block as HeadlineBlock).titleMarker && (block as HeadlineBlock).titleMarker !== "none" && (
                                            <span className="text-[0.7em] select-none opacity-80">
                                              {(block as HeadlineBlock).titleMarker === "square" && "■"}
                                              {(block as HeadlineBlock).titleMarker === "triangle" && "▲"}
                                              {(block as HeadlineBlock).titleMarker === "circle" && "●"}
                                            </span>
                                          )}
                                          <span>{(block as HeadlineBlock).text}</span>
                                        </h2>
                                        {(block as HeadlineBlock).subtitle && (
                                          <p 
                                            className={`tracking-widest ${(block as HeadlineBlock).subtitleFont || "font-serif"} text-[#2b221a]/80 italic ${(block as HeadlineBlock).subtitleAlign === "left" ? "text-left" : (block as HeadlineBlock).subtitleAlign === "right" ? "text-right" : (block as HeadlineBlock).subtitleAlign === "justify" ? "text-justify" : "text-center"}`}
                                            style={{
                                              fontSize: (block as HeadlineBlock).subtitleFontSize === "xs" ? "9px" : (block as HeadlineBlock).subtitleFontSize === "sm" ? "11px" : (block as HeadlineBlock).subtitleFontSize === "md" ? "13px" : (block as HeadlineBlock).subtitleFontSize === "lg" ? "15px" : "10px"
                                            }}
                                          >
                                            {(block as HeadlineBlock).subtitle}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* BLOCK RENDERING: IMAGE */}
                                    {block.type === "image" && (
                                      <div className="space-y-2 text-center py-1">
                                        {/* Outer stamp outline frame */}
                                        <div className="flex justify-center">
                                          <div 
                                            style={{ width: `${(block as ImageBlock).scale}%` }}
                                            className="border-2 border-[#2b221a] p-1 bg-[#fcf8ee]/20 relative overflow-hidden"
                                          >
                                            {/* Woodcut Stamp rendering */}
                                            {(block as ImageBlock).isClipart ? (
                                              (() => {
                                                const clipart = ALL_CLIPART.find(c => c.id === (block as ImageBlock).clipartId) || ALL_CLIPART[0];
                                                return (
                                                  <div 
                                                    className={`w-full aspect-[4/3] flex items-center justify-center p-4 transition-all ${
                                                      (block as ImageBlock).filter === "woodblock" ? "woodcut-filter scale-[1.05]" :
                                                      (block as ImageBlock).filter === "sepia" ? "text-[#5e412f] opacity-80" :
                                                      (block as ImageBlock).filter === "high-contrast" ? "text-black brightness-50" :
                                                      "text-[#2b221a]"
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: clipart.svgPath }}
                                                  />
                                                );
                                              })()
                                            ) : (
                                              // Uploaded picture with woodcut halftone / sepia print dither filter
                                              (block as ImageBlock).src ? (
                                                <img 
                                                  src={(block as ImageBlock).src} 
                                                  alt={(block as ImageBlock).caption}
                                                  referrerPolicy="no-referrer"
                                                  className={`w-full block border border-stone-400 ${
                                                    (block as ImageBlock).filter === "woodblock" ? "woodcut-filter" :
                                                    (block as ImageBlock).filter === "sepia" ? "sepia contrast-125 brightness-95 text-[#5e412f]" :
                                                    (block as ImageBlock).filter === "high-contrast" ? "contrast-200 grayscale" :
                                                    ""
                                                  }`}
                                                  style={{
                                                    aspectRatio: (block as ImageBlock).aspectRatio === "16-9" ? "16/9" :
                                                                 (block as ImageBlock).aspectRatio === "4-3" ? "4/3" :
                                                                 (block as ImageBlock).aspectRatio === "1-1" ? "1/1" : "auto",
                                                    objectFit: (block as ImageBlock).objectFit || "cover",
                                                    maxHeight: (block as ImageBlock).aspectRatio && (block as ImageBlock).aspectRatio !== "auto" ? "none" : "300px"
                                                  }}
                                                />
                                              ) : (
                                                // Placeholder click target to trigger upload
                                                <div 
                                                  onClick={(e) => { e.stopPropagation(); triggerImageUpload(); }}
                                                  className="w-full aspect-[16/10] bg-stone-300/30 flex flex-col items-center justify-center border border-dashed border-[#2b221a]/40 text-[#2b221a]/80"
                                                >
                                                  <ImageIcon className="w-8 h-8 mb-1" />
                                                  <span className="text-[11px] font-semibold">点击在此上传自定义图片</span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>

                                        {/* Caption below image */}
                                        {(block as ImageBlock).caption && (
                                          <p className="text-[10px] md:text-xs font-serif text-stone-600 italic tracking-wide max-w-[80%] mx-auto leading-normal">
                                            {(block as ImageBlock).caption}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* BLOCK RENDERING: DIVIDER */}
                                    {block.type === "divider" && (
                                      <div className={`py-2 flex items-center justify-center ${theme === "republican" ? "h-full w-4 px-1" : "w-full py-2"}`}>
                                        {theme === "republican" ? (
                                          /* Vertical divider for Republican */
                                          (block as DividerBlock).style === "double" || (block as DividerBlock).style === "wenwu" ? (
                                            <div className="h-full border-r-[3px] border-l border-[#1a1a1a] w-1.5" />
                                          ) : (block as DividerBlock).style === "dotted" ? (
                                            <div className="h-full border-r border-dashed border-[#1a1a1a]/60" />
                                          ) : (
                                            <div className="h-full border-r border-[#1a1a1a]/40" />
                                          )
                                        ) : (
                                          /* Horizontal divider for Fantasy */
                                          (block as DividerBlock).style === "double" ? (
                                            <div className="w-full border-t-[3px] border-b border-[#2b221a] h-1" />
                                          ) : (block as DividerBlock).style === "dotted" ? (
                                            <div className="w-full border-t border-dashed border-[#2b221a]/60 border-spacing-2" />
                                          ) : (block as DividerBlock).style === "ornament" ? (
                                            <div className="w-full flex items-center justify-center gap-4 text-[#2b221a]/70">
                                              <div className="w-full border-t border-[#2b221a]/30" />
                                              <span className="text-base select-none leading-none pt-0.5">
                                                {(block as DividerBlock).ornamentType === "fleur-de-lis" && "⚜"}
                                                {(block as DividerBlock).ornamentType === "floral" && "❦"}
                                                {(block as DividerBlock).ornamentType === "star" && "✥"}
                                                {(block as DividerBlock).ornamentType === "sword" && "⚔"}
                                              </span>
                                              <div className="w-full border-t border-[#2b221a]/30" />
                                            </div>
                                          ) : (
                                            <div className="w-full border-t border-[#2b221a]/40" />
                                          )
                                        )}
                                      </div>
                                    )}

                                    {/* BLOCK RENDERING: AD */}
                                    {block.type === "ad" && (
                                      <div 
                                        className={`p-3 text-center tracking-wide leading-relaxed space-y-1.5 ${
                                          (block as AdBlock).borderStyle === "dashed" ? "border border-dashed border-[#2b221a]/60" :
                                          (block as AdBlock).borderStyle === "solid" ? "border-2 border-[#2b221a]" :
                                          (block as AdBlock).borderStyle === "wenwu" ? "border-wenwu" :
                                          (block as AdBlock).borderStyle === "yunwen" ? "border-yunwen" :
                                          "border-4 border-double border-[#2b221a]/80 p-2.5"
                                        }`}
                                      >
                                        <h4 
                                          style={{ fontSize: (block as AdBlock).titleFontSize === "xs" ? "10px" : (block as AdBlock).titleFontSize === "sm" ? "11px" : (block as AdBlock).titleFontSize === "md" ? "12px" : (block as AdBlock).titleFontSize === "lg" ? "14px" : "12px" }}
                                          className={`font-bold uppercase tracking-widest text-[#1c1510] border-b border-[#2b221a]/20 pb-0.5 mb-1 ${(block as AdBlock).titleFont || "font-serif"} ${(block as AdBlock).titleAlign === "left" ? "text-left" : (block as AdBlock).titleAlign === "right" ? "text-right" : (block as AdBlock).titleAlign === "justify" ? "text-justify" : "text-center"}`}
                                        >
                                          ✥ {(block as AdBlock).title} ✥
                                        </h4>
                                        <p 
                                          style={{ fontSize: (block as AdBlock).contentFontSize === "xs" ? "10px" : (block as AdBlock).contentFontSize === "sm" ? "11px" : (block as AdBlock).contentFontSize === "md" ? "12px" : (block as AdBlock).contentFontSize === "lg" ? "14px" : "11px" }}
                                          className={`text-[#2b221a]/90 leading-normal ${(block as AdBlock).contentFont || "font-kai"} ${(block as AdBlock).contentAlign === "left" ? "text-left" : (block as AdBlock).contentAlign === "right" ? "text-right" : (block as AdBlock).contentAlign === "justify" ? "text-justify" : "text-center"}`}
                                        >
                                          {(block as AdBlock).content}
                                        </p>
                                        <div className="flex justify-between items-center text-[9px] pt-1 border-t border-[#2b221a]/10 text-stone-600 font-serif">
                                          <span>{(block as AdBlock).merchant}</span>
                                          <span className="font-semibold text-[#1c1510]">{(block as AdBlock).price}</span>
                                        </div>
                                      </div>
                                    )}
                                  </SortableBlock>
                                );
                              })}
                            </SortableContext>
                          );

                          return isRepublican ? (
                            <div className="rep-col-inner">{colContent}</div>
                          ) : (
                            colContent
                          );
                        })()}

                         {/* Inline column block-adder */}
                         <div className={`no-print h-6 flex items-center justify-center transition duration-150 relative z-10 ${activeAddBlockColId === col.id ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                           <div className="w-full border-t border-dashed border-[#5a4b3d]/30 absolute" />
                           <div className="relative inline-block">
                             <button type="button" onClick={(e) => { e.stopPropagation(); setActiveAddBlockColId(activeAddBlockColId === col.id ? null : col.id); }}
                               className="bg-[#231d18] hover:bg-[#342a20] text-[#e0a96d] border border-[#5a4b3d] rounded-full p-1 shadow-lg flex items-center gap-1 text-[10px] px-2 cursor-pointer relative z-50">
                               <Plus className="w-3 h-3" /><span>在此增添文章或圖片</span>
                             </button>
                             {activeAddBlockColId === col.id && (
                               <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-36 bg-[#1a1511] border-2 border-[#e0a96d] p-1.5 rounded shadow-2xl space-y-1 text-left z-50 animate-fadeIn">
                                 <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "article"); setActiveAddBlockColId(null); }} className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold">✍ 书写文字文章</button>
                                 <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "headline"); setActiveAddBlockColId(null); }} className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold">✦ 装饰大字标题</button>
                                 <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "image"); setActiveAddBlockColId(null); }} className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold">🖼 绘制插图木印</button>
                                 <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "divider"); setActiveAddBlockColId(null); }} className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold">◇ 插入中饰隔线</button>
                                 <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "ad"); setActiveAddBlockColId(null); }} className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold">🪙 刊登告示商售</button>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                    ))}

                  </div>
                );
              })}
            </div>

            {/* Bottom footer mark — theme-aware */}
            <div className={`mt-6 pt-2 text-center text-[10px] font-serif tracking-widest flex justify-between px-1 ${theme === "republican" ? "border-t-[3px] border-[#1a1a1a] text-[#1a1a1a]/60 uppercase" : "border-t-2 border-[#2b221a] text-stone-600 uppercase"}`}>
              <span>{newspaperData.header.footerLeft || (theme === "republican" ? "時事新報社印刷部承印" : "星辉帝国皇家印刷署特许印制局发行")}</span>
              <span>{newspaperData.header.footerRight || (theme === "republican" ? "版權所有 民國十二年" : "帝国时报印刷馆特许发行 © 圣历742年")}</span>
            </div>

          </div>

        </div>

      </main>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
    </>
  );
}
