import React, { useState } from "react";
import {
  Scissors, Type as FontIcon, Layout, Settings, X, ChevronUp,
  Feather, Save, Undo2, Redo2, Printer, FileText, Image as ImageIcon, Plus, BookOpen
} from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";
import { ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock } from "../types";
import { CoinsIcon } from "./Sidebar";
import { FANTASY_CLIPART } from "../clipart";

export default function MobileNav() {
  const {
    newspaperData,
    activeTab, setActiveTab,
    selectedBlockId, setSelectedBlockId,
    selectedColumnId, setSelectedColumnId,
    selectedRowId,
    blockTabMode, setBlockTabMode,
    globalHeadingScale, setGlobalHeadingScale,
    globalBodyScale, setGlobalBodyScale,
    columnGap, setColumnGap,
    enableParchmentTexture, setEnableParchmentTexture,
    enableCoffeeStains, setEnableCoffeeStains,
    showPrintHelp, setShowPrintHelp,
    showSaveManager, setShowSaveManager,
    isExporting, setIsExporting,
    findSelectedBlock, updateBlock, updateHeader,
    addBlockToColumn, deleteBlock,
    undo, redo, canUndo, canRedo,
  } = useNewspaper();

  const [drawerOpen, setDrawerOpen] = useState<"tabs" | "block" | null>(null);

  const selectedBlock = findSelectedBlock();

  // When a block gets selected in the preview, auto-open the block drawer
  React.useEffect(() => {
    if (selectedBlockId) {
      setDrawerOpen("block");
    }
  }, [selectedBlockId]);

  const handlePrintPDF = () => window.print();

  const handleExportPNG = async () => {
    const element = document.getElementById("printable-newspaper-content");
    if (!element) return;
    setIsExporting(true);
    try {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${new XMLSerializer().serializeToString(element)}</div></foreignObject></svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2; canvas.height = height * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f1e4cb"; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width * 2, height * 2);
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = `${newspaperData.header.title || "newspaper"}.png`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
        URL.revokeObjectURL(blobUrl);
        setIsExporting(false);
      };
      img.onerror = () => { setIsExporting(false); alert("导出失败，请使用打印PDF功能。"); };
      img.src = blobUrl;
    } catch { setIsExporting(false); alert("导出失败，请使用打印PDF功能。"); }
  };

  const targetColOptions = newspaperData.rows.flatMap((row, ri) =>
    row.columns.map((col, ci) => ({
      id: col.id,
      label: `行 ${ri + 1} - 栏 ${ci + 1} (${col.blocks.length} 块)`
    }))
  );
  const activeTargetColId = selectedColumnId || targetColOptions[0]?.id || "";

  const blockTypeName = selectedBlock
    ? selectedBlock.type === "article" ? "文章"
    : selectedBlock.type === "headline" ? "标题"
    : selectedBlock.type === "image" ? "插图"
    : selectedBlock.type === "divider" ? "分隔线"
    : "公告" : "";

  const navTabs = [
    { id: "blocks", icon: <Scissors className="w-5 h-5" />, label: "正文" },
    { id: "header", icon: <FontIcon className="w-5 h-5" />, label: "报头" },
    { id: "layout", icon: <Layout className="w-5 h-5" />, label: "版面" },
    { id: "settings", icon: <Settings className="w-5 h-5" />, label: "印刷" },
  ] as const;

  return (
    <>
      {/* Mobile Top Action Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#dcd0b8] border-b border-[#8b4513] px-3 py-2 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#8b4513] text-[#f5deb3] rounded">
            <Feather className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold font-serif text-[#2c241e]">历史报刊排版模板</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!canUndo} className="p-1.5 border border-[#8b4513]/60 text-[#8b4513] rounded disabled:opacity-30">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-1.5 border border-[#8b4513]/60 text-[#8b4513] rounded disabled:opacity-30">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowSaveManager(true)} className="p-1.5 border border-[#8b4513]/60 text-[#8b4513] rounded">
            <Save className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePrintPDF} className="p-1.5 bg-[#8b4513] text-[#f5deb3] rounded">
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Backdrop for drawers */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => { setDrawerOpen(null); setSelectedBlockId(null); }}
        />
      )}

      {/* Block Edit Bottom Drawer */}
      {drawerOpen === "block" && selectedBlock && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-[#e8dcc4] border-t-2 border-[#8b4513] rounded-t-2xl shadow-2xl max-h-[65vh] flex flex-col no-print animate-fadeIn">
          {/* Drawer Handle */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#dcd0b8] rounded-t-2xl border-b border-[#8b4513]/30">
            <span className="text-sm font-bold text-[#2c241e] font-serif">
              编辑 — {blockTypeName}区块
            </span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => deleteBlock(selectedBlock.id)}
                className="text-xs border border-red-700/50 text-red-800 px-2 py-1 rounded"
              >删除</button>
              <button
                onClick={() => { setDrawerOpen(null); setSelectedBlockId(null); }}
                className="p-1 text-[#8b4513]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-4 flex-1 text-sm">
            {/* ARTICLE EDIT in Drawer */}
            {selectedBlock.type === "article" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">大标题</label>
                  <input
                    type="text"
                    value={(selectedBlock as ArticleBlock).title}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, title: e.target.value } as ArticleBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">副标题</label>
                  <input
                    type="text"
                    value={(selectedBlock as ArticleBlock).subtitle}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, subtitle: e.target.value } as ArticleBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">作者</label>
                  <input
                    type="text"
                    value={(selectedBlock as ArticleBlock).author}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, author: e.target.value } as ArticleBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">字体</label>
                    <select
                      value={(selectedBlock as ArticleBlock).font}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, font: e.target.value } as ArticleBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs text-[#2c241e] focus:outline-none"
                    >
                      <option value="font-serif">宋体</option>
                      <option value="font-kai">楷体</option>
                      <option value="font-xiaowei">小薇</option>
                      <option value="font-mashan">马山</option>
                      <option value="font-sans">黑体</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">对齐</label>
                    <select
                      value={(selectedBlock as ArticleBlock).align}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, align: e.target.value } as ArticleBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs text-[#2c241e] focus:outline-none"
                    >
                      <option value="left">左</option>
                      <option value="justify">两端</option>
                      <option value="center">居中</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">字号</label>
                    <select
                      value={(selectedBlock as ArticleBlock).fontSize}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, fontSize: e.target.value } as ArticleBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs text-[#2c241e] focus:outline-none"
                    >
                      <option value="xs">小</option>
                      <option value="sm">标准</option>
                      <option value="md">中</option>
                      <option value="lg">大</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">行距</label>
                    <select
                      value={(selectedBlock as ArticleBlock).lineHeight || "relaxed"}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, lineHeight: e.target.value } as ArticleBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs text-[#2c241e] focus:outline-none"
                    >
                      <option value="tight">紧凑</option>
                      <option value="normal">普通</option>
                      <option value="relaxed">舒展</option>
                      <option value="loose">宽松</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">字距</label>
                    <select
                      value={(selectedBlock as ArticleBlock).letterSpacing || "normal"}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, letterSpacing: e.target.value } as ArticleBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs text-[#2c241e] focus:outline-none"
                    >
                      <option value="tight">紧缩</option>
                      <option value="normal">标准</option>
                      <option value="wide">宽阔</option>
                      <option value="widest">极宽</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="text-xs font-bold text-[#8b4513] flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(selectedBlock as ArticleBlock).dropCap}
                        onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, dropCap: e.target.checked } as ArticleBlock))}
                        className="accent-[#8b4513]"
                      />
                      首字下沉
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">正文内容</label>
                  <textarea
                    rows={5}
                    value={(selectedBlock as ArticleBlock).paragraphs.join("\n\n")}
                    onChange={e => {
                      const paras = e.target.value.split(/\n+/).filter(p => p.trim() !== "");
                      updateBlock(selectedBlock.id, b => ({ ...b, paragraphs: paras } as ArticleBlock));
                    }}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-[#2c241e] focus:outline-none text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* HEADLINE EDIT in Drawer */}
            {selectedBlock.type === "headline" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">标题文字</label>
                  <input
                    type="text"
                    value={(selectedBlock as HeadlineBlock).text}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, text: e.target.value } as HeadlineBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">副标题</label>
                  <input
                    type="text"
                    value={(selectedBlock as HeadlineBlock).subtitle}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, subtitle: e.target.value } as HeadlineBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">字体</label>
                    <select
                      value={(selectedBlock as HeadlineBlock).font}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, font: e.target.value } as HeadlineBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs focus:outline-none"
                    >
                      <option value="font-xiaowei">小薇</option>
                      <option value="font-mashan">马山</option>
                      <option value="font-serif">宋体</option>
                      <option value="font-sans">黑体</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">规格</label>
                    <select
                      value={(selectedBlock as HeadlineBlock).size}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, size: e.target.value } as HeadlineBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs focus:outline-none"
                    >
                      <option value="normal">中等</option>
                      <option value="large">大型</option>
                      <option value="epic">超大</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">对齐</label>
                    <select
                      value={(selectedBlock as HeadlineBlock).align || "center"}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, align: e.target.value } as HeadlineBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-1 text-xs focus:outline-none"
                    >
                      <option value="left">左</option>
                      <option value="center">中</option>
                      <option value="right">右</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* AD EDIT in Drawer */}
            {selectedBlock.type === "ad" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">公告标题</label>
                  <input type="text" value={(selectedBlock as AdBlock).title}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, title: e.target.value } as AdBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">公告正文</label>
                  <textarea rows={3} value={(selectedBlock as AdBlock).content}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, content: e.target.value } as AdBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-[#2c241e] focus:outline-none text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">商家</label>
                    <input type="text" value={(selectedBlock as AdBlock).merchant}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, merchant: e.target.value } as AdBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">售价</label>
                    <input type="text" value={(selectedBlock as AdBlock).price}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, price: e.target.value } as AdBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* IMAGE EDIT in Drawer */}
            {selectedBlock.type === "image" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">图片来源</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, isClipart: true } as ImageBlock))}
                      className={`py-1.5 px-2 border rounded-sm text-xs transition flex items-center justify-center gap-1 ${(selectedBlock as ImageBlock).isClipart ? "bg-[#8b4513] text-[#f5deb3]" : "bg-[#dcd0b8] border-[#8b4513]/40 text-[#2c241e]"}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>印章图样</span>
                    </button>
                    <button
                      type="button"
                      // Since we are inside MobileNav, we can trigger the hidden file input of NewspaperPreview.tsx
                      // by dispatching a click event or trigger it directly. 
                      // Wait! How do we trigger image upload from MobileNav drawer? 
                      // We can just add a local file input and file upload handler in MobileNav! 
                      // Yes, just like Sidebar.tsx has its own handleImageUpload!
                      onClick={() => {
                        const fileInput = document.getElementById("mobile-file-upload") as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className={`py-1.5 px-2 border rounded-sm text-xs transition flex items-center justify-center gap-1.5 ${!(selectedBlock as ImageBlock).isClipart ? "bg-[#8b4513] text-[#f5deb3]" : "bg-[#dcd0b8] border-[#8b4513]/40 text-[#2c241e]"}`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>上传相册</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    id="mobile-file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateBlock(selectedBlock.id, b => ({
                          ...b,
                          src: event.target?.result as string,
                          isClipart: false,
                          clipartId: undefined
                        } as ImageBlock));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                {/* Clipart Selector if isClipart */}
                {(selectedBlock as ImageBlock).isClipart && (
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">选择印记图样</label>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#dcd0b8] p-1.5 rounded border border-[#8b4513]/40">
                      {FANTASY_CLIPART.map(item => (
                        <button
                          key={item.id}
                          onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, clipartId: item.id, isClipart: true } as ImageBlock))}
                          className={`aspect-square p-1 border rounded flex items-center justify-center transition bg-[#e8dcc4]/50 ${
                            (selectedBlock as ImageBlock).clipartId === item.id 
                              ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3]" 
                              : "border-[#8b4513]/30 text-[#8b4513]"
                          }`}
                        >
                          <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: item.svgPath }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">图片配文/注解</label>
                  <input type="text" value={(selectedBlock as ImageBlock).caption}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, caption: e.target.value } as ImageBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">画面高宽比</label>
                    <select
                      value={(selectedBlock as ImageBlock).aspectRatio || "auto"}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, aspectRatio: e.target.value } as ImageBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1.5 py-1 text-xs focus:outline-none text-[#2c241e]"
                    >
                      <option value="auto">自适应</option>
                      <option value="16-9">长宽 16:9</option>
                      <option value="4-3">长宽 4:3</option>
                      <option value="1-1">正方 1:1</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">缩放填充</label>
                    <select
                      value={(selectedBlock as ImageBlock).objectFit || "cover"}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, objectFit: e.target.value } as ImageBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1.5 py-1 text-xs focus:outline-none text-[#2c241e]"
                    >
                      <option value="cover">裁剪填充</option>
                      <option value="contain">完整包含</option>
                      <option value="fill">强制拉伸</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">显示效果</label>
                    <select value={(selectedBlock as ImageBlock).filter}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, filter: e.target.value } as ImageBlock))}
                      className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1.5 py-1 text-xs focus:outline-none text-[#2c241e]"
                    >
                      <option value="woodblock">木刻版画</option>
                      <option value="sepia">泛黄旧照</option>
                      <option value="high-contrast">黑白印章</option>
                      <option value="none">原图</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8b4513] block mb-1">尺寸 ({ (selectedBlock as ImageBlock).scale }%)</label>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="5"
                      value={(selectedBlock as ImageBlock).scale}
                      onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, scale: parseInt(e.target.value) } as ImageBlock))}
                      className="w-full accent-[#8b4513] mt-1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateBlock(selectedBlock.id, b => ({
                    ...b,
                    src: "",
                    isClipart: true,
                    clipartId: FANTASY_CLIPART[0].id
                  } as ImageBlock))}
                  className="w-full py-1.5 mt-1 border border-red-800/30 text-red-800 bg-transparent rounded text-xs font-bold"
                >
                  重置为默认印花图样
                </button>
              </div>
            )}

            {/* DIVIDER EDIT in Drawer */}
            {selectedBlock.type === "divider" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8b4513] block mb-1">线型</label>
                  <select value={(selectedBlock as DividerBlock).style}
                    onChange={e => updateBlock(selectedBlock.id, b => ({ ...b, style: e.target.value } as DividerBlock))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="ornament">花纹装饰</option>
                    <option value="double">双实线</option>
                    <option value="single">单细线</option>
                    <option value="dotted">虚线</option>
                  </select>
                </div>
              </div>
            )}

            {/* Add new block shortcut */}
            <div className="border-t border-[#8b4513]/20 pt-3">
              <p className="text-xs font-bold text-[#8b4513] mb-2">在当前栏位追加新区块</p>
              <div className="grid grid-cols-3 gap-2">
                {(["article","headline","image","divider","ad"] as const).map(t => (
                  <button key={t} onClick={() => { addBlockToColumn(activeTargetColId, t); }}
                    className="py-1.5 text-[10px] border border-[#8b4513]/40 rounded text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors font-bold"
                  >
                    {t === "article" ? "文章" : t === "headline" ? "大标" : t === "image" ? "插图" : t === "divider" ? "隔线" : "公告"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Drawer */}
      {drawerOpen === "tabs" && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-[#e8dcc4] border-t-2 border-[#8b4513] rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col no-print animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 bg-[#dcd0b8] rounded-t-2xl border-b border-[#8b4513]/30">
            <span className="text-sm font-bold text-[#2c241e] font-serif">编辑工具面板</span>
            <button onClick={() => setDrawerOpen(null)} className="p-1 text-[#8b4513]">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Tab picker */}
          <div className="flex border-b border-[#8b4513]/30">
            {navTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-[11px] font-bold flex flex-col items-center gap-0.5 transition-colors ${activeTab === tab.id ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513]"}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#dcd0b8] border-t-2 border-[#8b4513] flex no-print shadow-2xl">
        <button
          onClick={() => setDrawerOpen(drawerOpen === "tabs" ? null : "tabs")}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${drawerOpen === "tabs" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513]"}`}
        >
          <Scissors className="w-4 h-4" />
          工具
        </button>

        {selectedBlock && (
          <button
            onClick={() => setDrawerOpen(drawerOpen === "block" ? null : "block")}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors border-x border-[#8b4513]/30 ${drawerOpen === "block" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513]"}`}
          >
            <ChevronUp className="w-4 h-4" />
            编辑块
          </button>
        )}

        <button
          onClick={handlePrintPDF}
          className="flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#8b4513] border-l border-[#8b4513]/30"
        >
          <Printer className="w-4 h-4" />
          打印
        </button>

        <button
          onClick={() => setShowSaveManager(true)}
          className="flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#8b4513] border-l border-[#8b4513]/30"
        >
          <Save className="w-4 h-4" />
          存档
        </button>
      </nav>
    </>
  );
}
