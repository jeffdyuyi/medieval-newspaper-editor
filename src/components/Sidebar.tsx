import React, { useState, useRef } from 'react';
import { 
  RefreshCw, HelpCircle, Scissors, Type as FontIcon, 
  Layout, Settings, FileText, Image as ImageIcon, 
  Trash2, Printer, Download, Undo2, Redo2, BookOpen, Save,
  Coins as CoinsIcon, Sparkles, Boxes, SlidersHorizontal
} from "lucide-react";
import logoUrl from "../assets/logo";
import { useNewspaper } from "../context/NewspaperContext";
import { ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock, PaperTone } from "../types";
import { ALL_CLIPART } from "../clipart";
import { FONT_OPTIONS } from "../constants";
import { generateArticleAI } from "../utils/aiGenerator";
import BlockPalette from "./BlockPalette";

export default function Sidebar() {
  const {
    newspaperData,
    activeTab, setActiveTab,
    selectedBlockId, setSelectedBlockId,
    selectedRowId, setSelectedRowId,
    selectedColumnId, setSelectedColumnId,
    globalHeadingScale, setGlobalHeadingScale,
    globalBodyScale, setGlobalBodyScale,
    columnGap, setColumnGap,
    enableParchmentTexture, setEnableParchmentTexture,
    enableCoffeeStains, setEnableCoffeeStains,
    paperTone, setPaperTone,
    setShowPrintHelp,
    showAboutModal, setShowAboutModal,
    sidebarWidth, setSidebarWidth,
    isExporting, setIsExporting,
    findSelectedBlock, updateBlock, updateHeader,
    addBlockToColumn, deleteBlock, moveBlock, handleResetData,
    undo, redo, canUndo, canRedo, setShowSaveManager,
    theme, triggerImageUpload,
    geminiApiKey, setGeminiApiKey,
    navigateToHome, autoSaveStatus
  } = useNewspaper();

  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Drag resizer for sidebar width
  const isDraggingSidebarRef = useRef(false);

  const handleSidebarResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingSidebarRef.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingSidebarRef.current) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.min(Math.max(startW + delta, 280), 680);
      setSidebarWidth(newWidth);
    };

    const onPointerUp = () => {
      isDraggingSidebarRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim() || !selectedBlockId) return;
    setIsGenerating(true);
    try {
      const data = await generateArticleAI({
        prompt: aiTopic,
        theme,
        apiKey: geminiApiKey
      });
      if (data && data.title && data.paragraphs) {
        updateBlock(selectedBlockId, b => ({
          ...b,
          type: "article",
          title: data.title,
          subtitle: data.subtitle || "",
          author: data.author || (theme === "republican" ? "本报特派记者" : "帝国记录官"),
          paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [data.paragraphs]
        }) as ArticleBlock);
        setAiTopic("");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      alert("AI 生成遇到网络或接口问题，已为您自动切换到纯本地离线写作生成。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPNG = async () => {
    const element = document.getElementById("printable-newspaper-content");
    if (!element) return;
    try {
      setIsExporting(true);
      const width = element.offsetWidth;
      const height = element.offsetHeight;

      // Clone node to strip editing controls and handles cleanly
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".no-print").forEach((el) => el.remove());
      // Strip active selection rings and outlines
      clone.querySelectorAll("*").forEach((el) => {
        el.classList.remove(
          "ring-2",
          "ring-[#8b4513]/80",
          "ring-[#8b4513]",
          "bg-[#2b221a]/4",
          "bg-[#2b221a]/5",
          "shadow-md",
          "cursor-pointer",
          "cursor-text"
        );
      });

      const serializedHtml = new XMLSerializer().serializeToString(clone);
      const fontStyles = `
        @import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@300;400;700&family=Ma+Shan+Zheng&family=Zhi+Mang+Xing&family=LXGW+WenKai&family=Grenze+Gotisch:wght@400;700&family=Cinzel:wght@400;700&display=swap');
        .no-print { display: none !important; }
        .font-serif { font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif !important; }
        .font-sans { font-family: 'Inter', 'Microsoft YaHei', 'SimHei', sans-serif !important; }
        .font-kai { font-family: 'LXGW WenKai', 'KaiTi', 'STKaiti', serif !important; }
        .font-xiaowei { font-family: 'ZCOOL XiaoWei', serif !important; }
        .font-mashan { font-family: 'Ma Shan Zheng', cursive !important; }
        .font-zhimang { font-family: 'Zhi Mang Xing', cursive !important; }
        .font-gothic { font-family: 'Grenze Gotisch', serif !important; }
        .font-cinzel { font-family: 'Cinzel', serif !important; }
        .font-fangsong { font-family: 'FangSong', 'STFangsong', serif !important; }
        .font-lishu { font-family: 'LiSu', 'STLiti', serif !important; }
      `;
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              <style>${fontStyles}</style>
              ${serializedHtml}
            </div>
          </foreignObject>
        </svg>
      `;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = window.URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width * 2;
          canvas.height = height * 2;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const defaultBg = theme === "republican" 
              ? (paperTone === "aged" ? "#eae6db" : paperTone === "antique" ? "#e0dacb" : paperTone === "bright" ? "#faf9f5" : "#f4f3ef")
              : (paperTone === "aged" ? "#e8d7b7" : paperTone === "antique" ? "#dcc49c" : paperTone === "bright" ? "#fbf5e6" : "#f1e4cb");
            ctx.fillStyle = defaultBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width * 2, height * 2);
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${newspaperData.header.title || "medieval-newspaper"}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
        } finally {
          window.URL.revokeObjectURL(blobUrl);
          setIsExporting(false);
        }
      };
      img.onerror = () => {
        window.URL.revokeObjectURL(blobUrl);
        setIsExporting(false);
        alert("由于预览沙箱的安全限制或跨域资源，部分内容在导出为PNG时遇到阻碍。\n\n强烈推荐点击左下角【打印 / 导出高分辨率PDF】按钮，可无损保存为矢量文件！");
      };
      img.src = blobUrl;
    } catch (err) {
      console.error("PNG export failure:", err);
      setIsExporting(false);
      alert("导出图片时发生意外，建议点击左下角【打印 / 导出高分辨率PDF】！");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const selectedBlock = findSelectedBlock();

  return (
    <>
      <aside 
        className="hidden md:flex bg-[#e8dcc4] text-[#4a3728] border-b-2 md:border-b-0 md:border-r-2 border-[#8b4513] flex-col shrink-0 no-print shadow-2xl z-20 relative select-none"
        style={{ width: `${sidebarWidth}px`, minWidth: "280px", maxWidth: "680px" }}
      >
        {/* Drag handle to resize sidebar */}
        <div
          onPointerDown={handleSidebarResizeStart}
          className="hidden md:block absolute top-0 -right-1.5 bottom-0 w-3 cursor-col-resize z-40 group select-none"
          title="按住左右拖拽，自由调节侧边栏与报纸画布比例"
        >
          <div className="w-1 h-full mx-auto group-hover:bg-[#8b4513] group-active:bg-[#8b4513] transition-colors rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100" />
        </div>
        
        {/* Editor Title Banner */}
        <div className="px-3 py-2 bg-[#dcd0b8] border-b border-[#8b4513] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={navigateToHome}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer group"
            title="点击回到首页（内容已自动保存）"
          >
            <div className="w-7 h-7 rounded bg-[#2c221a] border border-[#8b4513] p-1 shadow flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold font-serif tracking-wider uppercase text-[#2c241e] leading-tight">
                  不咕鸟小报编辑器
                </h1>
                <span className={`text-[8.5px] font-sans px-1 py-0.2 rounded transition-colors ${
                  autoSaveStatus === "saving" 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-emerald-100/80 text-emerald-800"
                }`}>
                  {autoSaveStatus === "saving" ? "保存中" : "已自动保存"}
                </span>
              </div>
              <p className="text-[9.5px] text-[#8b4513] opacity-80 leading-none mt-0.5 select-text font-mono">
                不咕鸟创想俱乐部群：261751459
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Undo)"
              className="p-1 border border-[#8b4513]/60 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Redo)"
              className="p-1 border border-[#8b4513]/60 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowSaveManager(true)}
              title="存档管理 (多草稿)"
              className="p-1 border border-[#8b4513]/60 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-[#8b4513]/30 mx-0.5"></div>
            <button 
              onClick={handleResetData}
              title="重置到默认模板"
              className="p-1 border border-[#8b4513]/60 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowAboutModal(true)}
              title="关于作者与排版说明"
              className="p-1 border border-[#8b4513]/60 text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-xs transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Row (Plan A: Two Core Modes) */}
        <div className="grid grid-cols-2 text-center bg-[#dcd0b8] border-b border-[#8b4513] text-xs font-serif shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
              activeTab === "blocks" 
                ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513] shadow-xs" 
                : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">📦 版式素材库</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("inspector")}
            className={`py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
              activeTab !== "blocks" 
                ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513] shadow-xs" 
                : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">
              {selectedBlock ? "🎨 区块排版" : "🗞️ 整版属性"}
            </span>
          </button>
        </div>

        {/* Tab Contents Scroll */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#e8dcc4] text-xs scrollbar-thin">
          
          {/* MODE 1: COMPONENT & BLOCK PALETTE */}
          {activeTab === "blocks" && (
            <div className="space-y-3 animate-fadeIn">
              {/* Modern WYSIWYG Drag Palette with Quick Add */}
              <BlockPalette theme={theme} />

              {selectedBlock && (
                <div className="p-2.5 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded text-xs text-[#8b4513] flex items-center justify-between no-print mt-2">
                  <span className="truncate">当前画布已选中区块</span>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("inspector")} 
                    className="font-bold underline hover:text-[#2c241e] cursor-pointer shrink-0 ml-2"
                  >
                    配置该区块详细排版 →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CONTEXT-AWARE INSPECTOR */}
          {activeTab !== "blocks" && (
            <div className="space-y-4 animate-fadeIn">
              {selectedBlock ? (
                /* SUB-VIEW A: SELECTED BLOCK INSPECTOR */
                <div className="space-y-4 animate-fadeIn">
                  {/* Block Header info */}
                  <div className="pb-3 border-b border-[#8b4513] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8b4513] flex items-center gap-1.5">
                        {selectedBlock.type === "article" && <FileText className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "headline" && <FontIcon className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "divider" && <Scissors className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "ad" && <CoinsIcon className="w-3.5 h-3.5" />}
                        选中的{selectedBlock.type === "article" ? "文章" : selectedBlock.type === "headline" ? "标题" : selectedBlock.type === "image" ? "插图" : selectedBlock.type === "divider" ? "分隔线" : "公告"}区块
                      </span>
                      <button 
                        type="button"
                        onClick={() => setSelectedBlockId(null)}
                        className="text-[10px] text-[#8b4513]/70 hover:text-[#2c241e] underline cursor-pointer"
                        title="取消选中，查看整版全局设置"
                      >
                        (切至整版全局)
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => deleteBlock(selectedBlock.id)}
                      className="text-xs text-red-800 hover:text-red-900 hover:bg-red-200/50 border border-red-700/50 flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>删除</span>
                    </button>
                  </div>

                    {/* ARTICLE BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "article" && (
                      <div className="space-y-4">
                        {/* AI Writing Inspiration */}
                        <div className="p-2.5 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#8b4513] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#8b4513]" />
                              <span>{theme === "republican" ? "民国笔法·AI 撰写报道" : "帝国史官·AI 撰写奇闻"}</span>
                            </span>
                            {isGenerating && (
                              <span className="text-[10px] text-[#8b4513] font-bold animate-pulse">正在提笔撰稿中...</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder={theme === "republican" ? "输入要闻话题，如：电车通车/洋行开市..." : "输入异闻话题，如：巨龙重现/炼金药水..."}
                              className="flex-1 bg-[#dcd0b8] border border-[#8b4513] rounded px-2.5 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                              onKeyDown={(e) => { if (e.key === "Enter") handleAiGenerate(); }}
                            />
                            <button
                              type="button"
                              onClick={handleAiGenerate}
                              disabled={isGenerating || !aiTopic.trim()}
                              className="px-3 py-1 bg-[#8b4513] hover:bg-[#753a10] disabled:opacity-40 text-[#f5deb3] text-xs font-bold rounded transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>生成</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-[#4a3728]/70 leading-tight">
                            输入关键词即可由 AI 一键生成标题、副标题、署名及多段地道古风正文。
                          </p>
                        </div>

                        {/* 所见即所得原地打字提示 */}
                        <div className="bg-[#8b4513]/10 border border-[#8b4513]/30 rounded p-2.5 text-xs text-[#4a3728] flex items-start gap-2 leading-relaxed">
                          <span className="text-base select-none shrink-0">✍</span>
                          <div>
                            <span className="font-bold block text-[#2b221a]">所见即所得原生排版</span>
                            <span className="text-[11px] text-[#4a3728]/80">标题、副标、署名与正文已全面支持在右侧报纸上单击直接打字；敲回车自动分段，选中文本直接浮出格式条。</span>
                          </div>
                        </div>

                        {/* 大标题排版配置 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5 animate-fadeIn">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">大标题排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).titleFont || "font-serif"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleFont: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-serif">宋体</option>
                                <option value="font-kai">楷体</option>
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字号</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).titleFontSize || "lg"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleFontSize: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="sm">小号</option>
                                <option value="md">中号</option>
                                <option value="lg">大号</option>
                                <option value="xl">特大号</option>
                                <option value="2xl">超大号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).titleAlign || "left"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleAlign: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 副标题排版配置 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5 animate-fadeIn">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">副标题排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).subtitleFont || "font-serif"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleFont: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-serif">宋体</option>
                                <option value="font-kai">楷体</option>
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字号</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).subtitleFontSize || "xs"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleFontSize: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="xs">极小号</option>
                                <option value="sm">小号</option>
                                <option value="md">中号</option>
                                <option value="lg">大号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as ArticleBlock).subtitleAlign || "left"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleAlign: e.target.value } as ArticleBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 正文全局版式 */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">正文字体基准</label>
                          <select 
                            value={(selectedBlock as ArticleBlock).font}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, font: e.target.value } as ArticleBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          >
                              <option value="font-serif">思源宋体 (宋体-刻本古籍)</option>
                              <option value="font-kai">霞鹜文楷 (楷体-流畅手抄)</option>
                              <option value="font-xiaowei">站酷小薇体 (艺术碑刻)</option>
                              <option value="font-mashan">马山正体 (狂草墨意)</option>
                              <option value="font-zhimang">志芒行书 (古风行草)</option>
                              <option value="font-sans">经典黑体 (黑体-现代报刊)</option>
                              <option value="font-fangsong">典雅仿宋 (仿宋-文雅典致)</option>
                              <option value="font-lishu">汉仪隶书 (隶书-古汉碑风)</option>
                            </select>
                          </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-[#8b4513] block mb-1">文字大小</label>
                            <select 
                              value={(selectedBlock as ArticleBlock).fontSize}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, fontSize: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="xs">极小号 (11像素)</option>
                              <option value="sm">标准号 (13像素)</option>
                              <option value="md">中等号 (15像素)</option>
                              <option value="lg">大字号 (18像素)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#8b4513] block mb-1">对齐方式</label>
                            <select 
                              value={(selectedBlock as ArticleBlock).align}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, align: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="left">靠左对齐</option>
                              <option value="justify">两端对齐 (推荐)</option>
                              <option value="center">居中对齐</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#8b4513] block mb-1">段落行距</label>
                            <select 
                              value={(selectedBlock as ArticleBlock).lineHeight || "relaxed"}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, lineHeight: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="tight">紧凑 (Tight)</option>
                              <option value="normal">普通 (Normal)</option>
                              <option value="relaxed">舒展 (Relaxed)</option>
                              <option value="loose">宽松 (Loose)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#8b4513] block mb-1">文字字距</label>
                            <select 
                              value={(selectedBlock as ArticleBlock).letterSpacing || "normal"}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, letterSpacing: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="tight">紧缩 (Tight)</option>
                              <option value="normal">标准 (Normal)</option>
                              <option value="wide">宽阔 (Wide)</option>
                              <option value="widest">极宽 (Widest)</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label className="text-xs font-bold text-[#8b4513] flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={(selectedBlock as ArticleBlock).dropCap}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, dropCap: e.target.checked } as ArticleBlock))}
                              className="accent-[#8b4513]"
                            />
                            首字下沉 (开启此项可在首段显示精美雕花大写字母)
                          </label>
                        </div>
                      </div>
                    )}

                    {/* HEADLINE BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "headline" && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* 所见即所得原地打字提示 */}
                        <div className="bg-[#8b4513]/10 border border-[#8b4513]/30 rounded p-2.5 text-xs text-[#4a3728] flex items-start gap-2 leading-relaxed">
                          <span className="text-base select-none shrink-0">✍</span>
                          <div>
                            <span className="font-bold block text-[#2b221a]">画布直接编辑</span>
                            <span className="text-[11px] text-[#4a3728]/80">大字主标题及副标题已全面支持在右侧报纸上单击直接打字修改；此处专注调整大字规格、字体与对齐。</span>
                          </div>
                        </div>

                        {/* 标题文字排版 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">标题排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).font}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, font: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-serif">宋体</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                                <option value="font-kai">楷体</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">规格</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).size}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, size: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="normal">中等字号</option>
                                <option value="large">大型字号</option>
                                <option value="epic">超大字号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).align || "center"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, align: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 副标题排版 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">副标题排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).subtitleFont || "font-serif"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleFont: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-serif">宋体</option>
                                <option value="font-kai">楷体</option>
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字号</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).subtitleFontSize || "sm"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleFontSize: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="xs">极小号</option>
                                <option value="sm">小号</option>
                                <option value="md">中号</option>
                                <option value="lg">大号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as HeadlineBlock).subtitleAlign || "center"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitleAlign: e.target.value } as HeadlineBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* IMAGE / WOODCUT BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "image" && (
                      <div className="space-y-4">
                        {/* Image Source Selection */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#8b4513] block">图片来源</label>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, isClipart: true } as ImageBlock))}
                              className={`py-2 px-3 border rounded-sm text-xs transition flex items-center justify-center gap-1.5 ${
                                (selectedBlock as ImageBlock).isClipart 
                                  ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3] font-bold" 
                                  : "bg-[#dcd0b8] border-[#8b4513] text-[#2c241e] hover:bg-[#dcd0b8]/80"
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>羊皮纸插画印章</span>
                            </button>

                            <button 
                              type="button"
                              onClick={triggerImageUpload}
                              className={`py-2 px-3 border rounded-sm text-xs transition flex items-center justify-center gap-1.5 ${
                                !(selectedBlock as ImageBlock).isClipart 
                                  ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3] font-bold" 
                                  : "bg-[#dcd0b8] border-[#8b4513] text-[#2c241e] hover:bg-[#dcd0b8]/80"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>上传自定义图片</span>
                            </button>
                          </div>
                        </div>

                        {/* Clipart Library Selector if isClipart */}
                        {(selectedBlock as ImageBlock).isClipart && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#8b4513] block">
                              {theme === "republican" ? "选择民国风格插图" : "选择中世纪奇幻印记"}
                            </label>
                            <div className="grid grid-cols-4 gap-2 bg-[#dcd0b8] p-2 rounded-sm border border-[#8b4513]">
                              {ALL_CLIPART.filter(item =>
                                theme === "republican"
                                  ? item.themeGroup === "republican"
                                  : item.themeGroup !== "republican"
                              ).map(item => (
                                <button
                                  key={item.id}
                                  title={item.name}
                                  onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, clipartId: item.id, isClipart: true } as ImageBlock))}
                                  className={`aspect-square p-2 border rounded flex items-center justify-center transition hover:bg-[#e8dcc4] ${
                                    (selectedBlock as ImageBlock).clipartId === item.id
                                      ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3]"
                                      : "border-[#8b4513]/50 text-[#8b4513]"
                                  }`}
                                >
                                  <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: item.svgPath }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Custom uploaded image info */}
                        {!(selectedBlock as ImageBlock).isClipart && (
                          <div className="p-3 bg-[#dcd0b8]/40 border border-[#8b4513] rounded text-xs text-[#4a3728] flex items-center justify-between">
                            <span className="truncate max-w-[200px]">
                              {(selectedBlock as ImageBlock).src ? "✓ 已上传自定义图像" : "⚠ 尚未上传图像文件"}
                            </span>
                            <button 
                              onClick={triggerImageUpload}
                              className="text-[#8b4513] hover:underline font-bold"
                            >
                              更换图片
                            </button>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">插图配字/注解</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as ImageBlock).caption}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, caption: e.target.value } as ImageBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">复古印刷滤镜</label>
                            <select 
                              value={(selectedBlock as ImageBlock).filter}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, filter: e.target.value } as ImageBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="woodblock">木刻雕刻版画 (单色)</option>
                              <option value="high-contrast">高对比粗墨迹</option>
                              <option value="sepia">复古老墨色 (木刻风)</option>
                              <option value="none">原始无滤镜 (不推荐)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513] flex justify-between">
                              <span>插图尺寸比例</span>
                              <span>{(selectedBlock as ImageBlock).scale}%</span>
                            </label>
                            <input 
                              type="range"
                              min="30"
                              max="100"
                              step="5"
                              value={(selectedBlock as ImageBlock).scale}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, scale: parseInt(e.target.value) } as ImageBlock))}
                              className="w-full accent-[#8b4513] mt-2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">画面高宽比</label>
                            <select 
                              value={(selectedBlock as ImageBlock).aspectRatio || "auto"}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, aspectRatio: e.target.value } as ImageBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="auto">自适应 (Auto)</option>
                              <option value="16-9">长宽 16:9</option>
                              <option value="4-3">长宽 4:3</option>
                              <option value="1-1">正方 1:1</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">缩放填充模式</label>
                            <select 
                              value={(selectedBlock as ImageBlock).objectFit || "cover"}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, objectFit: e.target.value } as ImageBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="cover">裁剪填充 (Cover)</option>
                              <option value="contain">完整包含 (Contain)</option>
                              <option value="fill">强制拉伸 (Fill)</option>
                            </select>
                          </div>
                        </div>

                        {/* Reset / Clear Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => updateBlock(selectedBlock.id, b => ({ 
                              ...b, 
                              src: "", 
                              isClipart: true, 
                              clipartId: (theme === "republican" ? ALL_CLIPART.find(c => c.themeGroup === "republican") : ALL_CLIPART.find(c => c.themeGroup !== "republican"))?.id || ALL_CLIPART[0].id
                            } as ImageBlock))}
                            className="w-full py-1.5 bg-transparent hover:bg-red-800/10 border border-red-800/40 text-red-850 text-xs font-bold rounded-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>重置为默认印花图样</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DIVIDER BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "divider" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">分隔线装饰风格</label>
                          <select 
                            value={(selectedBlock as DividerBlock).style}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, style: e.target.value } as DividerBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          >
                            <option value="ornament">古老双面神圣章记</option>
                            <option value="double">经典厚重复古双线</option>
                            <option value="single">细致淡墨单实线</option>
                            <option value="dotted">古代粗斑点虚线</option>
                          </select>
                        </div>

                        {(selectedBlock as DividerBlock).style === "ornament" && (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">中间饰徽章记</label>
                            <select 
                              value={(selectedBlock as DividerBlock).ornamentType}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, ornamentType: e.target.value } as DividerBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                            >
                              <option value="fleur-de-lis">⚜ 皇家鸢尾花章记</option>
                              <option value="floral">❦ 古雅卷草花纹</option>
                              <option value="star">✥ 占星家秘能星徽</option>
                              <option value="sword">⚔ 骑士公会交叉利剑</option>
                              <option value="diamond">❖ 古典秘境菱纹</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADVERTISEMENT BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "ad" && (
                      <div className="space-y-4">
                        {/* 所见即所得原地打字提示 */}
                        <div className="bg-[#8b4513]/10 border border-[#8b4513]/30 rounded p-2.5 text-xs text-[#4a3728] flex items-start gap-2 leading-relaxed">
                          <span className="text-base select-none shrink-0">✍</span>
                          <div>
                            <span className="font-bold block text-[#2b221a]">画布直接编辑</span>
                            <span className="text-[11px] text-[#4a3728]/80">告示主题、宣传内容、商号发布人与标价均已支持在右侧报纸上单击打字；此处专注配置古风边框与字形排版。</span>
                          </div>
                        </div>

                        {/* 告示主题排版 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5 animate-fadeIn">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">主题排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as AdBlock).titleFont || "font-serif"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleFont: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-serif">宋体</option>
                                <option value="font-kai">楷体</option>
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字号</label>
                              <select 
                                value={(selectedBlock as AdBlock).titleFontSize || "md"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleFontSize: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="xs">极小号</option>
                                <option value="sm">小号</option>
                                <option value="md">中号</option>
                                <option value="lg">大号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as AdBlock).titleAlign || "center"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, titleAlign: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 宣传内容排版 */}
                        <div className="p-2 border border-[#8b4513]/20 bg-[#8b4513]/5 rounded space-y-1.5 animate-fadeIn">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b4513] block">内容排版</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字体</label>
                              <select 
                                value={(selectedBlock as AdBlock).contentFont || "font-kai"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, contentFont: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="font-serif">宋体</option>
                                <option value="font-kai">楷体</option>
                                <option value="font-xiaowei">小薇体</option>
                                <option value="font-mashan">马山体</option>
                                <option value="font-zhimang">行书</option>
                                <option value="font-sans">黑体</option>
                                <option value="font-fangsong">仿宋</option>
                                <option value="font-lishu">隶书</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">字号</label>
                              <select 
                                value={(selectedBlock as AdBlock).contentFontSize || "sm"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, contentFontSize: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="xs">极小号</option>
                                <option value="sm">小号</option>
                                <option value="md">中号</option>
                                <option value="lg">大号</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-[#8b4513] block mb-0.5">对齐</label>
                              <select 
                                value={(selectedBlock as AdBlock).contentAlign || "center"}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, contentAlign: e.target.value } as AdBlock))}
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-1 py-0.5 text-[10px] text-[#2c241e] focus:outline-none"
                              >
                                <option value="left">靠左</option>
                                <option value="center">居中</option>
                                <option value="right">靠右</option>
                                <option value="justify">两端</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">公告边框装饰</label>
                          <select 
                            value={(selectedBlock as AdBlock).borderStyle}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, borderStyle: e.target.value } as AdBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          >
                            <option value="dashed">古旧虚线印 (Dashed Outline)</option>
                            <option value="solid">朴素粗实墨 (Solid Outline)</option>
                            <option value="ornate">皇家花饰刻线 (Double Antique)</option>
                            <option value="wenwu">民国文武线框 (Civil-Military)</option>
                            <option value="yunwen">民国云纹边框 (Cloud Pattern)</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#8b4513]/20 flex items-center justify-between text-xs text-[#8b4513]">
                      <button 
                        type="button"
                        onClick={() => setSelectedBlockId(null)}
                        className="text-[11px] underline hover:text-[#2c241e] cursor-pointer"
                      >
                        ← 返回整版全局属性
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveTab("blocks")}
                        className="text-[11px] underline hover:text-[#2c241e] cursor-pointer"
                      >
                        前往素材库添加更多区块 →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SUB-VIEW B: WHOLE-PAGE & GLOBAL INSPECTOR */
                  <div className="space-y-5 animate-fadeIn">
                    <div className="pb-2 border-b border-[#8b4513] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8b4513] flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>整版排版与全局属性</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("blocks")}
                        className="text-[10px] text-[#8b4513] font-bold underline hover:text-[#2c241e] cursor-pointer"
                      >
                        + 打开素材库
                      </button>
                    </div>

                    {/* Section 1: Header Ornaments & Typography */}
                    <div className="space-y-3 font-serif">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                        <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">一、 报头装帧与大名字体</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#8b4513]">报头设计样式</label>
                        <select 
                          value={newspaperData.header.headerStyle}
                          onChange={(e: any) => updateHeader(h => ({ ...h, headerStyle: e.target.value }))}
                          className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs cursor-pointer"
                        >
                          <option value="classic">【经典复古】双层墨线包围</option>
                          <option value="royal">【皇家大典】双鸢尾花印章点缀</option>
                          <option value="minimal">【质朴无华】简洁粗体字版面</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#8b4513]">报头大名字体风格</label>
                        <select 
                          value={newspaperData.header.titleFont}
                          onChange={(e) => updateHeader(h => ({ ...h, titleFont: e.target.value }))}
                          className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs cursor-pointer"
                        >
                          <option value="font-mashan">马山正体 (狂草笔墨，极力推荐)</option>
                          <option value="font-xiaowei">站酷小薇体 (雕花碑版)</option>
                          <option value="font-zhimang">志芒行书 (古法行流)</option>
                          <option value="font-serif">思源宋体 (端正大气)</option>
                          <option value="font-sans">经典黑体 (庄重醒目)</option>
                          <option value="font-fangsong">典雅仿宋 (秀气书风)</option>
                          <option value="font-lishu">汉仪隶书 (厚重古意)</option>
                          <option value="font-kai">霞鹜文楷 (手抄人文)</option>
                          <option value="font-gothic">西方中世纪黑体</option>
                        </select>
                      </div>

                      {newspaperData.header.headerStyle === "royal" && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">皇家大典专属顶标副题</label>
                          <input 
                            type="text" 
                            value={newspaperData.header.royalTitle ?? ""}
                            placeholder="圣塞西尔皇家御览"
                            onChange={(e) => updateHeader(h => ({ ...h, royalTitle: e.target.value }))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 2: Paper Tone & Texture */}
                    <div className="space-y-3 font-serif">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                        <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">
                          二、 {theme === "republican" ? "纸张油墨与做旧" : "羊皮纸做旧与古物仿真"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#4a3728] block">纸张色调微调 (泛黄做旧度)</label>
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                          {[
                            { key: "default", label: "标准" },
                            { key: "aged", label: "微黄" },
                            { key: "antique", label: "古卷" },
                            { key: "bright", label: "素白" },
                          ].map(tone => (
                            <button
                              key={tone.key}
                              type="button"
                              onClick={() => setPaperTone(tone.key as PaperTone)}
                              className={`py-1.5 border rounded-sm font-bold transition text-xs cursor-pointer ${
                                paperTone === tone.key
                                  ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3] shadow-inner"
                                  : "bg-[#dcd0b8] border-[#8b4513]/40 text-[#4a3728] hover:bg-[#8b4513]/10"
                              }`}
                            >
                              {tone.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {theme === "fantasy" && (
                        <label className="flex items-center gap-2 text-xs font-bold text-[#4a3728] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableParchmentTexture}
                            onChange={(e) => setEnableParchmentTexture(e.target.checked)}
                            className="accent-[#8b4513]"
                          />
                          <span>启用羊皮纸古朴纤维质地</span>
                        </label>
                      )}

                      <label className="flex items-center gap-2 text-xs font-bold text-[#4a3728] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableCoffeeStains}
                          onChange={(e) => setEnableCoffeeStains(e.target.checked)}
                          className="accent-[#8b4513]"
                        />
                        <span>{theme === "republican" ? "启用油墨晕渍污斑效果" : "启用微黄茶渍/古物晕染污渍"}</span>
                      </label>
                    </div>

                    {/* Section 3: Typography Scale & Spacing */}
                    <div className="space-y-3 font-serif">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                        <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">三、 全局文字大小与栏距</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#4a3728]">
                          <span>全局标题尺寸缩放</span>
                          <span className="font-mono">{globalHeadingScale}%</span>
                        </div>
                        <input 
                          type="range"
                          min="75"
                          max="150"
                          step="5"
                          value={globalHeadingScale}
                          onChange={(e) => setGlobalHeadingScale(parseInt(e.target.value))}
                          className="w-full accent-[#8b4513]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#4a3728]">
                          <span>全局正文文字大小缩放</span>
                          <span className="font-mono">{globalBodyScale}%</span>
                        </div>
                        <input 
                          type="range"
                          min="80"
                          max="140"
                          step="5"
                          value={globalBodyScale}
                          onChange={(e) => setGlobalBodyScale(parseInt(e.target.value))}
                          className="w-full accent-[#8b4513]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#4a3728]">
                          <span>双栏/多栏间隔密集度</span>
                          <span className="font-mono">{(columnGap / 4).toFixed(1)} 比例</span>
                        </div>
                        <input 
                          type="range"
                          min="2"
                          max="12"
                          step="1"
                          value={columnGap}
                          onChange={(e) => setColumnGap(parseInt(e.target.value))}
                          className="w-full accent-[#8b4513]"
                        />
                      </div>
                    </div>

                    {/* Section 4: AI Configuration */}
                    <div className="space-y-2 font-serif">
                      <div className="flex items-center justify-between pb-1 border-b border-[#8b4513]/30">
                        <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">四、 AI 智能撰稿配置</span>
                        <span className="text-[10px] text-[#8b4513]/70 font-normal">纯前端/本地离线</span>
                      </div>

                      <div className="space-y-2 p-2.5 bg-[#dcd0b8]/50 border border-[#8b4513]/30 rounded">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#4a3728]">Gemini API Key (可选)</label>
                          <button
                            type="button"
                            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                            className="text-[10px] text-[#8b4513] hover:underline cursor-pointer"
                          >
                            {showApiKeyInput ? "隐藏" : "显示明文"}
                          </button>
                        </div>
                        <input
                          type={showApiKeyInput ? "text" : "password"}
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder="在此输入您的 API Key（以 AIzaSy 开头）"
                          className="w-full bg-[#e8dcc4] border border-[#8b4513] rounded px-2.5 py-1 text-xs text-[#2c241e] font-mono focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                        />
                        <p className="text-[10px] text-[#4a3728]/70 leading-relaxed">
                          <strong>💡 纯前端运行说明</strong>：此密钥仅保存在您本地浏览器的 localStorage 中，不经过任何第三方服务器。未配置或断网时，系统将<strong>自动无缝切换至内置古典离线撰稿语料库</strong>。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR: EXPORT PANEL */}
        <div className="p-2.5 bg-[#dcd0b8] border-t-2 border-[#8b4513] space-y-1.5 no-print shrink-0">
          <button 
            type="button"
            onClick={handlePrintPDF}
            className="w-full py-2 bg-[#8b4513] hover:bg-[#753a10] text-[#f5deb3] font-bold rounded-xs shadow-[0_2px_0_#2c241e] active:translate-y-[1px] active:shadow-none transition-all border border-[#d2b48c] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>打印 / 导出高分辨率PDF (印刷级)</span>
          </button>
          
          <button 
            type="button"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="w-full py-1.5 bg-transparent hover:bg-[#8b4513]/10 border border-[#8b4513] text-[#8b4513] text-[11px] font-bold rounded-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
          >
            {isExporting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span>{isExporting ? "正在编译高清像素..." : "导出 2 倍印刷规格高清图片"}</span>
          </button>
        </div>

      </aside>
    </>
  );
}
