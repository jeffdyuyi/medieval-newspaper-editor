import React, { useState, useRef, useMemo } from 'react';
import { 
  RefreshCw, HelpCircle, Scissors, Type as FontIcon, 
  Settings, FileText, Image as ImageIcon, 
  Trash2, Printer, Download, Undo2, Redo2, BookOpen, Save,
  Coins as CoinsIcon, Sparkles, Boxes, SlidersHorizontal,
  Camera, CircleDot, RotateCw, ZoomIn, ZoomOut, Sun, Moon
} from "lucide-react";
import logoUrl from "../assets/logo";
import { useNewspaper } from "../context/NewspaperContext";
import { 
  ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock, 
  BountyBlock, BriefsBlock, TableBlock, SealBlock, LetterBlock, ObituaryBlock,
  PaperTone 
} from "../types";
import { ALL_CLIPART } from "../clipart";
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
    navigateToHome, autoSaveStatus,
    uiTheme, toggleUiTheme,
    selectedSealId, setSelectedSealId,
    updateFloatingSeal, deleteFloatingSeal, addFloatingSeal
  } = useNewspaper();

  const [clipartCategory, setClipartCategory] = useState<string>("all");

  const availableClipart = useMemo(() => {
    return ALL_CLIPART.filter(item =>
      theme === "republican"
        ? item.themeGroup === "republican"
        : item.themeGroup !== "republican"
    );
  }, [theme]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableClipart.map(c => c.category)));
    return ["all", ...cats];
  }, [availableClipart]);

  const filteredClipart = useMemo(() => {
    if (clipartCategory === "all") return availableClipart;
    return availableClipart.filter(c => c.category === clipartCategory);
  }, [availableClipart, clipartCategory]);

  const bountySidebarInputRef = useRef<HTMLInputElement>(null);

  const handleSidebarBountyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlockId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          updateBlock(selectedBlockId, blk => ({
            ...blk,
            avatarType: "image",
            avatarSrc: compressed,
          } as BountyBlock));
        }
      };
      img.src = srcUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
          "ring-1",
          "ring-2",
          "ring-4",
          "ring-[#8b4513]/80",
          "ring-[#8b4513]",
          "ring-[#e0a96d]",
          "ring-offset-2",
          "ring-offset-transparent",
          "bg-[#2b221a]/4",
          "bg-[#2b221a]/5",
          "shadow-md",
          "cursor-pointer",
          "cursor-text",
          "cursor-grab",
          "cursor-grabbing"
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
  const selectedSeal = newspaperData.floatingSeals?.find(s => s.id === selectedSealId);

  return (
    <>
      <aside 
        className="hidden md:flex editor-sidebar-fantasy bg-[#10141b] text-[#edf0f5] border-b-2 md:border-b-0 md:border-r-2 border-[var(--color-line)] flex-col shrink-0 no-print shadow-2xl z-20 relative select-none"
        style={{ width: `${sidebarWidth}px`, minWidth: "280px", maxWidth: "680px" }}
      >
        {/* Drag handle to resize sidebar */}
        <div
          onPointerDown={handleSidebarResizeStart}
          className="hidden md:block absolute top-0 -right-1.5 bottom-0 w-3 cursor-col-resize z-40 group select-none"
          title="按住左右拖拽，自由调节侧边栏与报纸画布比例"
        >
          <div className="w-1 h-full mx-auto group-hover:bg-[var(--color-gold)] group-active:bg-[var(--color-gold)] transition-colors opacity-0 group-hover:opacity-100 group-active:opacity-100" />
        </div>
        
        {/* Editor Title Banner */}
        <div className="px-3 py-2 bg-[var(--color-paper-shade)] border-b border-[var(--color-line)] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={navigateToHome}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer group"
            title="点击回到首页（内容已自动保存）"
          >
            <div className="w-7 h-7 bg-[var(--color-paper-light)] border border-[var(--color-line)] p-1 shadow flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold tracking-wider uppercase text-[var(--color-gold)] leading-tight">
                  不咕鸟小报编辑器
                </h1>
                <span className={`text-[8.5px] px-1 py-0.2 transition-colors ${
                  autoSaveStatus === "saving" 
                    ? "bg-amber-900/60 text-amber-200 border border-amber-700" 
                    : "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                }`}>
                  {autoSaveStatus === "saving" ? "保存中" : "已自动保存"}
                </span>
              </div>
              <p className="text-[9.5px] text-[var(--color-muted)] opacity-80 leading-none mt-0.5 select-text font-mono">
                不咕鸟创想俱乐部群：261751459
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleUiTheme}
              title={`切换工具栏风格：当前为${uiTheme === "fantasy" ? "深色奇幻" : "明亮冒险"}`}
              className="pixel-btn text-xs px-2 py-1"
            >
              {uiTheme === "fantasy" ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </button>
            <div className="w-[1px] h-3.5 bg-[var(--color-line)] mx-0.5"></div>
            <button 
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Undo)"
              className="pixel-btn text-xs px-2 py-1"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Redo)"
              className="pixel-btn text-xs px-2 py-1"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowSaveManager(true)}
              title="存档管理 (多草稿)"
              className="pixel-btn text-xs px-2 py-1"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-[var(--color-line)] mx-0.5"></div>
            <button 
              onClick={handleResetData}
              title="重置到默认模板"
              className="pixel-btn text-xs px-2 py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowAboutModal(true)}
              title="关于作者与排版说明"
              className="pixel-btn text-xs px-2 py-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Row (Plan A: Two Core Modes) */}
        <div className="grid grid-cols-2 text-center bg-[var(--color-paper-shade)] border-b border-[var(--color-line)] text-xs shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
              activeTab === "blocks" 
                ? "bg-[var(--color-paper)] text-[var(--color-gold)] font-bold border-b-2 border-[var(--color-gold)]" 
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]/50"
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
                ? "bg-[var(--color-paper)] text-[var(--color-gold)] font-bold border-b-2 border-[var(--color-gold)]" 
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">
              {selectedBlock ? "🎨 区块排版" : selectedSeal ? "🔏 印章设置" : "🗞️ 整版属性"}
            </span>
          </button>
        </div>

        {/* Tab Contents Scroll */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[var(--color-paper)] text-xs pixel-scroll">
          
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
                        {selectedBlock.type === "bounty" && <span>⚔</span>}
                        {selectedBlock.type === "briefs" && <span>❖</span>}
                        {selectedBlock.type === "table" && <span>📊</span>}
                        {selectedBlock.type === "seal" && <span>🔏</span>}
                        {selectedBlock.type === "letter" && <span>✉</span>}
                        {selectedBlock.type === "obituary" && <span>✝</span>}
                        选中的{
                          selectedBlock.type === "article" ? "文章" :
                          selectedBlock.type === "headline" ? "标题" :
                          selectedBlock.type === "image" ? "插图" :
                          selectedBlock.type === "divider" ? "分隔线" :
                          selectedBlock.type === "ad" ? "公告" :
                          selectedBlock.type === "bounty" ? "悬赏令" :
                          selectedBlock.type === "briefs" ? "要闻短讯" :
                          selectedBlock.type === "table" ? "行情表格" :
                          selectedBlock.type === "seal" ? "官方印信" :
                          selectedBlock.type === "letter" ? "读者投书" : "沉痛讣告"
                        }区块
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
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#8b4513] block">
                                {theme === "republican" ? "选择民国报刊插图" : "选择奇幻印记图样"}
                              </label>
                              <span className="text-[10px] text-[#8b4513]/70 font-mono">
                                共 {filteredClipart.length} 枚
                              </span>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                              {categories.map(cat => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setClipartCategory(cat)}
                                  className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition border ${
                                    clipartCategory === cat
                                      ? "bg-[#8b4513] text-[#f5deb3] border-[#8b4513] font-bold shadow-xs"
                                      : "bg-[#dcd0b8]/60 text-[#5a2d0c] border-[#8b4513]/30 hover:bg-[#dcd0b8]"
                                  }`}
                                >
                                  {cat === "all" ? "全部" : cat}
                                </button>
                              ))}
                            </div>

                            {/* Clipart Grid with scroll */}
                            <div className="grid grid-cols-4 gap-2 bg-[#dcd0b8] p-2 rounded-sm border border-[#8b4513] max-h-60 overflow-y-auto">
                              {filteredClipart.map(item => (
                                <button
                                  key={item.id}
                                  title={`${item.name} [${item.category}]`}
                                  onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, clipartId: item.id, isClipart: true } as ImageBlock))}
                                  className={`aspect-square p-2 border rounded flex flex-col items-center justify-center transition hover:bg-[#e8dcc4] relative group ${
                                    (selectedBlock as ImageBlock).clipartId === item.id
                                      ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3] ring-1 ring-[#5a2d0c]"
                                      : "border-[#8b4513]/40 text-[#8b4513]"
                                  }`}
                                >
                                  <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: item.svgPath }} />
                                  <span className="sr-only">{item.name}</span>
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

                    {/* BOUNTY BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "bounty" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">通缉边框风格</label>
                          <select 
                            value={(selectedBlock as BountyBlock).borderStyle || "wood"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, borderStyle: e.target.value } as BountyBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="wood">粗粝木刻实框 (Rustic Woodblock)</option>
                            <option value="wenwu">民国文武通缉线 (Civil-Military)</option>
                            <option value="metal">铁艺双层外框 (Double Metal)</option>
                            <option value="dashed">醒目虚线警戒 (Dashed Line)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">通缉目标画像来源</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, avatarType: "clipart" } as BountyBlock))}
                              className={`py-1 text-xs font-bold rounded-xs border cursor-pointer ${
                                (selectedBlock as BountyBlock).avatarType !== "image"
                                  ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c]"
                                  : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/40"
                              }`}
                            >
                              古典木刻剪贴画
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(selectedBlock.id, b => ({ ...b, avatarType: "image" } as BountyBlock));
                                bountySidebarInputRef.current?.click();
                              }}
                              className={`py-1 text-xs font-bold rounded-xs border cursor-pointer flex items-center justify-center gap-1 ${
                                (selectedBlock as BountyBlock).avatarType === "image"
                                  ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c]"
                                  : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/40"
                              }`}
                            >
                              <Camera className="w-3 h-3" />
                              <span>上传自定义肖像</span>
                            </button>
                          </div>
                        </div>

                        {/* Local Upload or URL input */}
                        {(selectedBlock as BountyBlock).avatarType === "image" ? (
                          <div className="space-y-2 p-2 bg-[#dcd0b8]/40 border border-[#8b4513]/30 rounded-xs">
                            <button
                              type="button"
                              onClick={() => bountySidebarInputRef.current?.click()}
                              className="w-full py-1.5 px-3 bg-[#8b4513] text-[#f5deb3] rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#73370d] transition-colors cursor-pointer shadow-xs"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>从电脑上传本地肖像照片</span>
                            </button>
                            <input
                              type="file"
                              ref={bountySidebarInputRef}
                              onChange={handleSidebarBountyUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#8b4513]/80 block">或输入嫌犯图片网络链接：</label>
                              <input
                                type="text"
                                value={(selectedBlock as BountyBlock).avatarSrc || ""}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, avatarSrc: e.target.value } as BountyBlock))}
                                placeholder="https://..."
                                className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-[11px] text-[#2c241e] font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">选择特征头像</label>
                            <select
                              value={(selectedBlock as BountyBlock).clipartId || (theme === "republican" ? "revolver" : "skull")}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, clipartId: e.target.value } as BountyBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                            >
                              {categories.filter(c => c !== "all").map(cat => (
                                <optgroup key={cat} label={`── ${cat} ──`}>
                                  {availableClipart.filter(c => c.category === cat).map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Portrait Size Slider */}
                        <div className="space-y-1 pt-1 border-t border-[#8b4513]/20">
                          <div className="flex justify-between text-xs font-bold text-[#8b4513]">
                            <span>画像显示尺寸</span>
                            <span>{(selectedBlock as BountyBlock).avatarSize || 72} px</span>
                          </div>
                          <input
                            type="range"
                            min="48"
                            max="180"
                            step="6"
                            value={(selectedBlock as BountyBlock).avatarSize || 72}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, avatarSize: parseInt(e.target.value) } as BountyBlock))}
                            className="w-full accent-[#8b4513]"
                          />
                        </div>

                        {/* Portrait Filter Tone */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">肖像复古滤镜风格</label>
                          <select
                            value={(selectedBlock as BountyBlock).avatarFilter || "woodblock"}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, avatarFilter: e.target.value as any } as BountyBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="woodblock">粗粝木刻版画 (Woodblock Print)</option>
                            <option value="sepia">泛黄旧照质地 (Sepia Tone)</option>
                            <option value="high-contrast">高对比黑白油墨 (High Contrast)</option>
                            <option value="none">原始彩照相片 (Original Color)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* BRIEFS BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "briefs" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">短讯栏框样式</label>
                          <select 
                            value={(selectedBlock as BriefsBlock).borderStyle || "vintage"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, borderStyle: e.target.value } as BriefsBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="vintage">仿古淡雅底框 (Vintage Tint)</option>
                            <option value="boxed">民国文武边框 (Civil-Military)</option>
                            <option value="simple">极简上下双线 (Simple Lines)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* TABLE BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "table" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">表格装帧样式</label>
                          <select 
                            value={(selectedBlock as TableBlock).style || "classic"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, style: e.target.value } as TableBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="classic">古典上下双粗线 (Classic Rules)</option>
                            <option value="boxed">全封闭格状表 (Full Boxed)</option>
                            <option value="striped">隔行微弱底纹 (Subtle Striped)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* SEAL BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "seal" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">印章印形</label>
                          <select 
                            value={(selectedBlock as SealBlock).sealShape || "wax"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, sealShape: e.target.value } as SealBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="wax">火漆立体蜡印 (Wax Seal)</option>
                            <option value="oval">民国官厅椭圆印 (Oval Bureau)</option>
                            <option value="circle">双圈朱砂圆章 (Double Circle)</option>
                            <option value="square">古拙四方重印 (Square Seal)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">印泥色调</label>
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                            {[
                              { k: "crimson", label: "火漆红", bg: "bg-[#8b1e1e] text-white" },
                              { k: "red", label: "朱砂红", bg: "bg-[#b22222] text-white" },
                              { k: "indigo", label: "蓝靛印", bg: "bg-[#2a347b] text-white" },
                              { k: "black", label: "墨黑印", bg: "bg-[#1a1a1a] text-white" },
                            ].map(c => (
                              <button
                                key={c.k}
                                type="button"
                                onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, color: c.k } as SealBlock))}
                                className={`py-1 rounded-xs border cursor-pointer ${
                                  (selectedBlock as SealBlock).color === c.k
                                    ? `${c.bg} border-amber-300 ring-1 ring-amber-400`
                                    : "bg-[#dcd0b8] border-[#8b4513]/40 text-[#4a3728]"
                                }`}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-[#8b4513]">
                            <span>印章倾斜角度</span>
                            <span className="font-mono">{(selectedBlock as SealBlock).rotation ?? -5}°</span>
                          </div>
                          <input 
                            type="range"
                            min="-20"
                            max="20"
                            step="1"
                            value={(selectedBlock as SealBlock).rotation ?? -5}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, rotation: parseInt(e.target.value) } as SealBlock))}
                            className="w-full accent-[#8b4513]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">水平对齐</label>
                          <div className="grid grid-cols-3 gap-1.5 text-xs text-center font-bold">
                            {["left", "center", "right"].map(al => (
                              <button
                                key={al}
                                type="button"
                                onClick={() => updateBlock(selectedBlock.id, b => ({ ...b, align: al } as SealBlock))}
                                className={`py-1 rounded-xs border cursor-pointer ${
                                  ((selectedBlock as SealBlock).align || "center") === al
                                    ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c]"
                                    : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/40"
                                }`}
                              >
                                {al === "left" ? "靠左" : al === "right" ? "靠右" : "居中"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LETTER BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "letter" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">信笺底框装饰</label>
                          <select 
                            value={(selectedBlock as LetterBlock).borderStyle || "paper"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, borderStyle: e.target.value } as LetterBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="paper">古朴便笺纸框 (Parchment Paper)</option>
                            <option value="quote">左侧重墨引言线 (Quote Accent)</option>
                            <option value="vintage">文武声明框线 (Vintage Frame)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* OBITUARY BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "obituary" && (
                      <div className="space-y-3 font-serif">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">讣告挽框装帧</label>
                          <select 
                            value={(selectedBlock as ObituaryBlock).borderStyle || "black-thick"}
                            onChange={(e: any) => updateBlock(selectedBlock.id, b => ({ ...b, borderStyle: e.target.value } as ObituaryBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                          >
                            <option value="black-thick">沉肃粗黑框 (Solemn Bold Box)</option>
                            <option value="double-black">哀思双黑线 (Double Black Rule)</option>
                            <option value="ornate-black">重墨角花双框 (Antique Memorial)</option>
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
                ) : selectedSeal ? (
                  /* SUB-VIEW B: FLOATING SEAL INSPECTOR */
                  <div className="space-y-4 animate-fadeIn font-serif">
                    <div className="pb-3 border-b border-[#8b4513] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#8b4513] flex items-center gap-1.5">
                          <span>🔏</span>
                          官方自由印信图层
                        </span>
                        <button 
                          type="button"
                          onClick={() => setSelectedSealId(null)}
                          className="text-[10px] text-[#8b4513]/70 hover:text-[#2c241e] underline cursor-pointer"
                        >
                          (切至全局)
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => deleteFloatingSeal(selectedSeal.id)}
                        className="text-xs text-red-800 hover:text-red-900 border border-red-700/50 flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>撕除印章</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-[#dcd0b8]/60 border border-[#8b4513]/30 rounded text-xs leading-relaxed text-[#4a3728]">
                      <p className="font-bold text-[#8b4513] mb-0.5">📌 自由拖拽就位：</p>
                      <p>此印章位于报纸最上层图层。在右侧报纸上直接按住印章，可自由拖拽放置在任意位置（如压盖在标题、落款或通缉令上）。</p>
                    </div>

                    {/* 印章形制 */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#8b4513]">印章形制风格</label>
                      <select
                        value={selectedSeal.shape}
                        onChange={(e) => updateFloatingSeal(selectedSeal.id, s => ({ ...s, shape: e.target.value as any }))}
                        className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] text-xs focus:outline-none"
                      >
                        <option value="wax">立体火漆蜡印 (Wax Seal)</option>
                        <option value="oval">民国官署双椭圆印 (Oval Stamp)</option>
                        <option value="circle">经典圆形印信 (Round Stamp)</option>
                        <option value="square">御敕朱砂大方印 (Square Seal)</option>
                      </select>
                    </div>

                    {/* 印章颜色 */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#8b4513]">印泥印色</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { k: "crimson", l: "深红" },
                          { k: "red",     l: "朱砂" },
                          { k: "black",   l: "黑墨" },
                          { k: "indigo",  l: "藏青" },
                          { k: "gold",    l: "金印" },
                        ].map(c => (
                          <button
                            key={c.k}
                            type="button"
                            onClick={() => updateFloatingSeal(selectedSeal.id, s => ({ ...s, color: c.k as any }))}
                            className={`py-1 text-[11px] font-bold rounded-xs border cursor-pointer ${
                              selectedSeal.color === c.k
                                ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c]"
                                : "bg-[#dcd0b8] text-[#8b4513] border-[#8b4513]/40"
                            }`}
                          >
                            {c.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 倾角旋转 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-[#8b4513]">
                        <span>盖印倾角</span>
                        <span className="font-mono">{selectedSeal.rotation ?? -8}°</span>
                      </div>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        step="1"
                        value={selectedSeal.rotation ?? -8}
                        onChange={(e) => updateFloatingSeal(selectedSeal.id, s => ({ ...s, rotation: parseInt(e.target.value) }))}
                        className="w-full accent-[#8b4513]"
                      />
                    </div>

                    {/* 缩放比例 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-[#8b4513]">
                        <span>尺寸缩放</span>
                        <span className="font-mono">{Math.round((selectedSeal.scale ?? 1.0) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={selectedSeal.scale ?? 1.0}
                        onChange={(e) => updateFloatingSeal(selectedSeal.id, s => ({ ...s, scale: parseFloat(e.target.value) }))}
                        className="w-full accent-[#8b4513]"
                      />
                    </div>

                    {/* 印文文字 */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-bold text-[#8b4513] block mb-1">主印文</label>
                        <input
                          type="text"
                          value={selectedSeal.text}
                          onChange={(e) => updateFloatingSeal(selectedSeal.id, s => ({ ...s, text: e.target.value }))}
                          className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-xs text-[#2c241e]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#8b4513] block mb-1">副印文 / 年份批号</label>
                        <input
                          type="text"
                          value={selectedSeal.subtext || ""}
                          onChange={(e) => updateFloatingSeal(selectedSeal.id, s => ({ ...s, subtext: e.target.value }))}
                          className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-xs text-[#2c241e]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SUB-VIEW C: WHOLE-PAGE & GLOBAL INSPECTOR */
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

                    {/* Top-Level Seal Fast Button */}
                    <div className="p-2 bg-[#dcd0b8]/60 border border-[#8b4513]/40 rounded-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#2c241e] flex items-center gap-1">
                          <span>🔏</span>
                          <span>最上层自由印信图层</span>
                        </div>
                        <div className="text-[10px] text-[#8b4513]/70">可任意拖拽放置在报纸任何角落压盖</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addFloatingSeal()}
                        className="px-2.5 py-1 bg-[#8b4513] hover:bg-[#73370d] text-[#f5deb3] font-bold text-xs rounded transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        + 盖新印章
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
        <div className="p-2.5 bg-[var(--color-paper-shade)] border-t-2 border-[var(--color-line)] space-y-1.5 no-print shrink-0">
          <button 
            type="button"
            onClick={handlePrintPDF}
            className="pixel-btn pixel-btn-selected w-full py-2 font-bold tracking-wider text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>打印 / 导出高分辨率PDF (印刷级)</span>
          </button>
          
          <button 
            type="button"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="pixel-btn w-full py-1.5 text-[11px] font-bold"
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
