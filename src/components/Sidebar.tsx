import React, { useState } from 'react';
import { 
  Feather, RefreshCw, HelpCircle, Scissors, Type as FontIcon, 
  Layout, Settings, FileText, Image as ImageIcon, Plus, 
  ArrowUp, ArrowDown, Trash2, Printer, Download, Undo2, Redo2, BookOpen, Save,
  Coins as CoinsIcon, Sparkles
} from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";
import { ColumnSplit, ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock, PaperTone } from "../types";
import { ALL_CLIPART } from "../clipart";
import { FONT_OPTIONS } from "../constants";
import { generateArticleAI } from "../utils/aiGenerator";
import BlockPalette from "./BlockPalette";

export default function Sidebar() {
  const {
    newspaperData,
    activeTab, setActiveTab,
    blockTabMode, setBlockTabMode,
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
    isExporting, setIsExporting,
    activeSidebarColId, setActiveSidebarColId,
    findSelectedBlock, updateBlock, updateHeader,
    updateRowSplit, addNewRow, deleteRow, moveRow,
    addBlockToColumn, deleteBlock, moveBlock, handleResetData,
    undo, redo, canUndo, canRedo, setShowSaveManager,
    theme, switchTheme, updateRowHeight, triggerImageUpload,
    geminiApiKey, setGeminiApiKey
  } = useNewspaper();

  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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
      <aside className="hidden md:flex w-full md:w-[420px] bg-[#e8dcc4] text-[#4a3728] border-b-2 md:border-b-0 md:border-r-2 border-[#8b4513] flex-col shrink-0 no-print shadow-2xl z-20">
        
        {/* Editor Title Banner */}
        <div className="p-4 bg-[#dcd0b8] border-b border-[#8b4513] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#8b4513] border-2 border-[#d2b48c] rounded shadow-md text-[#f5deb3]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-serif tracking-widest uppercase text-[#2c241e]">历史报刊排版模板</h1>
              <p className="text-[10px] italic text-[#8b4513] opacity-80">v2.4 - 中世纪奇幻版</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Undo)"
              className="p-1.5 border border-[#8b4513] text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Redo)"
              className="p-1.5 border border-[#8b4513] text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowSaveManager(true)}
              title="存档管理 (多草稿)"
              className="p-1.5 border border-[#8b4513] text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-sm transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <div className="w-[1px] bg-[#8b4513]/30 mx-1 my-1"></div>
            <button 
              onClick={handleResetData}
              title="重置到默认模板"
              className="p-1.5 border border-[#8b4513] text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowPrintHelp(true)}
              title="查看排版印刷指引"
              className="p-1.5 border border-[#8b4513] text-[#8b4513] hover:bg-[#8b4513] hover:text-[#f5deb3] rounded-sm transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-4 text-center bg-[#dcd0b8] border-b border-[#8b4513] text-xs">
          <button 
            onClick={() => setActiveTab("blocks")}
            className={`py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "blocks" ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513]" : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"}`}
          >
            <Scissors className="w-4 h-4" />
            <span>正文</span>
          </button>
          <button 
            onClick={() => setActiveTab("header")}
            className={`py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "header" ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513]" : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"}`}
          >
            <FontIcon className="w-4 h-4" />
            <span>报头</span>
          </button>
          <button 
            onClick={() => setActiveTab("layout")}
            className={`py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "layout" ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513]" : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"}`}
          >
            <Layout className="w-4 h-4" />
            <span>版面</span>
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "settings" ? "bg-[#e8dcc4] text-[#2c241e] font-bold border-b-2 border-[#8b4513]" : "text-[#8b4513]/75 hover:text-[#2c241e] hover:bg-[#e8dcc4]/50"}`}
          >
            <Settings className="w-4 h-4" />
            <span>印刷</span>
          </button>
        </div>

        {/* Tab Contents Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#e8dcc4] text-sm scrollbar-thin">
          
          {/* TAB 1: EDIT BLOCKS (CONTEXT AWARE) */}
          {activeTab === "blocks" && (
            <div className="space-y-4">
              {/* Visual guideline box to teach users about the selection flow */}
              {!selectedBlock && (
                <div className="p-3 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-sm space-y-1.5 text-xs text-[#8b4513] leading-relaxed font-serif">
                  <span className="font-extrabold block">✨ 原位打字与排版指引：</span>
                  <ul className="space-y-1 text-[11px] list-disc pl-4 text-[#4a3728]">
                    <li><strong>点击直接打字</strong>：在右侧报纸上<strong>直接点击文本</strong>即可原地输入，敲回车自然分段。</li>
                    <li><strong>划选文本工具栏</strong>：选中文本立即浮出粗体、斜体、下划线与朱砂标红。</li>
                    <li><strong>版式模板添加</strong>：从下方元件库拖拽至指定栏目，或直接点击【+添加】。</li>
                    <li><strong>悬停区块高级排版</strong>：悬停在区块上方可点击齿轮⚙️打开详细字体样式。</li>
                  </ul>
                </div>
              )}

              {/* Sub-tab switcher if a block is selected */}
              {selectedBlock && (
                <div className="flex border-b border-[#8b4513] mb-4 text-xs bg-[#dcd0b8]/40 rounded p-0.5 no-print">
                  <button
                    type="button"
                    onClick={() => setBlockTabMode("edit")}
                    className={`flex-1 py-1.5 font-bold rounded-sm transition-colors text-center cursor-pointer ${blockTabMode === "edit" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513] hover:bg-[#8b4513]/10"}`}
                  >
                    ✍️ 编辑选中区块
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockTabMode("create")}
                    className={`flex-1 py-1.5 font-bold rounded-sm transition-colors text-center cursor-pointer ${blockTabMode === "create" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513] hover:bg-[#8b4513]/10"}`}
                  >
                    ➕ 版式元件库
                  </button>
                </div>
              )}

              {/* If we are in create mode or no block is selected, show classified creation view */}
              {(blockTabMode === "create" || !selectedBlock) ? (
                <div className="space-y-3 animate-fadeIn">
                  {/* Modern WYSIWYG Drag Palette with Quick Add */}
                  <BlockPalette theme={theme} />

                  {selectedBlock && (
                    <div className="p-2.5 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded text-xs text-[#8b4513] flex items-center justify-between no-print mt-2">
                      <span>正在浏览版式元件库</span>
                      <button onClick={() => setBlockTabMode("edit")} className="font-bold underline hover:text-[#2c241e] cursor-pointer">
                        返回排版当前选中区块 →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Block Header info */}
                    <div className="pb-3 border-b border-[#8b4513] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8b4513] flex items-center gap-1.5">
                        {selectedBlock.type === "article" && <FileText className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "headline" && <FontIcon className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "divider" && <Scissors className="w-3.5 h-3.5" />}
                        {selectedBlock.type === "ad" && <CoinsIcon className="w-3.5 h-3.5" />}
                        选中的{selectedBlock.type === "article" ? "文章" : selectedBlock.type === "headline" ? "标题" : selectedBlock.type === "image" ? "插图" : selectedBlock.type === "divider" ? "分隔线" : "公告"}区块
                      </span>
                      <button 
                        onClick={() => deleteBlock(selectedBlock.id)}
                        className="text-xs text-red-800 hover:text-red-900 hover:bg-red-200/50 border border-red-700/50 flex items-center gap-1 px-2 py-1 rounded transition"
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
                  </div>
                )}
              </div>
            )}

          {/* TAB 3: NEWSPAPER HEADER SETTINGS */}
          {activeTab === "header" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b4513]">报纸大名 (中文字)</label>
                <input 
                  type="text" 
                  value={newspaperData.header.title}
                  onChange={(e) => updateHeader(h => ({ ...h, title: e.target.value }))}
                  className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b4513]">报头大名字体</label>
                <select 
                  value={newspaperData.header.titleFont}
                  onChange={(e) => updateHeader(h => ({ ...h, titleFont: e.target.value }))}
                  className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b4513]">顶部箴言 / 标语</label>
                <input 
                  type="text" 
                  value={newspaperData.header.subtitle}
                  onChange={(e) => updateHeader(h => ({ ...h, subtitle: e.target.value }))}
                  className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">发行刊号</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.issueNo}
                    onChange={(e) => updateHeader(h => ({ ...h, issueNo: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">售价告示</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.price}
                    onChange={(e) => updateHeader(h => ({ ...h, price: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">印制地点 / 地区</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.location}
                    onChange={(e) => updateHeader(h => ({ ...h, location: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">发刊日期</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.date}
                    onChange={(e) => updateHeader(h => ({ ...h, date: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b4513]">报头设计样式</label>
                <select 
                  value={newspaperData.header.headerStyle}
                  onChange={(e: any) => updateHeader(h => ({ ...h, headerStyle: e.target.value }))}
                  className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                >
                  <option value="classic">【经典复古】双层墨线包围</option>
                  <option value="royal">【皇家大典】双鸢尾花印章点缀</option>
                  <option value="minimal">【质朴无华】简洁粗体字版面</option>
                </select>
              </div>

              {newspaperData.header.headerStyle === "royal" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">皇家设计专属副标题</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.royalTitle ?? ""}
                    placeholder="圣塞西尔皇家御览"
                    onChange={(e) => updateHeader(h => ({ ...h, royalTitle: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">页脚发行单位 (左侧)</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.footerLeft ?? ""}
                    placeholder="星辉帝国皇家印刷署特许印制局发行"
                    onChange={(e) => updateHeader(h => ({ ...h, footerLeft: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8b4513]">页脚版权标识 (右侧)</label>
                  <input 
                    type="text" 
                    value={newspaperData.header.footerRight ?? ""}
                    placeholder="帝国要闻报印刷局 © 742年"
                    onChange={(e) => updateHeader(h => ({ ...h, footerRight: e.target.value }))}
                    className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT & GRID ROW MANAGER */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#8b4513] block">版面行數與格位調配</label>
                <button 
                  onClick={addNewRow}
                  className="text-xs bg-[#8b4513] border border-[#d2b48c] hover:bg-[#753a10] text-[#f5deb3] px-2 py-1 rounded-sm font-bold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加全新版面行</span>
                </button>
              </div>

              <div className="space-y-3">
                {newspaperData.rows.map((row, idx) => (
                  <div 
                    key={row.id}
                    onClick={() => {
                      setSelectedRowId(row.id);
                      setSelectedColumnId(row.columns[0]?.id || null);
                    }}
                    className={`p-3 bg-[#dcd0b8]/40 border rounded-sm transition space-y-2 cursor-pointer ${
                      selectedRowId === row.id 
                        ? "border-[#8b4513] bg-[#dcd0b8]/80 ring-1 ring-[#8b4513]" 
                        : "border-[#8b4513]/30 hover:border-[#8b4513]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8b4513]">版面行 #{idx + 1}</span>
                      
                      {/* Row management controls */}
                      <div className="flex items-center gap-1.5 no-print">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveRow(row.id, "up"); }}
                          disabled={idx === 0}
                          title="上移此行"
                          className="p-1 hover:bg-[#8b4513]/10 rounded-sm disabled:opacity-30 text-[#8b4513]"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveRow(row.id, "down"); }}
                          disabled={idx === newspaperData.rows.length - 1}
                          title="下移此行"
                          className="p-1 hover:bg-[#8b4513]/10 rounded-sm disabled:opacity-30 text-[#8b4513]"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                          title="删除此行"
                          className="p-1 hover:bg-red-100 hover:text-red-700 rounded-sm text-[#8b4513] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Column Split Picker */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8b4513]/80">本行栏位排版分配</label>
                      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                        {(["1", "1-1", "1-2", "2-1", "1-1-1"] as ColumnSplit[]).map(split => (
                          <button
                            key={split}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRowSplit(row.id, split);
                            }}
                            className={`py-1.5 border rounded-sm font-bold transition text-xs ${
                              row.split === split 
                                ? "bg-[#8b4513] border-[#8b4513] text-[#f5deb3]" 
                                : "bg-[#e8dcc4] border-[#8b4513]/40 text-[#8b4513]/80 hover:bg-[#8b4513]/10"
                            }`}
                          >
                            {split === "1" && "单栏"}
                            {split === "1-1" && "1:1"}
                            {split === "1-2" && "1:2"}
                            {split === "2-1" && "2:1"}
                            {split === "1-1-1" && "1:1:1"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Republican row height controller */}
                    {theme === "republican" && (
                      <div className="space-y-1 pt-1.5 border-t border-[#8b4513]/20">
                        <div className="flex justify-between text-[11px] font-bold text-[#8b4513]">
                          <span>民国竖排行高</span>
                          <span className="font-mono">{row.height || 480} 像素</span>
                        </div>
                        <input
                          type="range"
                          min="240"
                          max="800"
                          step="20"
                          value={row.height || 480}
                          onChange={(e) => updateRowHeight(row.id, parseInt(e.target.value))}
                          className="w-full accent-[#1a1a1a]"
                        />
                      </div>
                    )}

                    {/* Show Column Blocks Count and Quick Block Insertion */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                      {row.columns.map((col, colIdx) => (
                        <div key={col.id} className="bg-[#e8dcc4] border border-[#8b4513]/40 p-1.5 rounded-sm text-center space-y-1">
                          <p className="font-serif text-[#8b4513] font-bold">栏 {colIdx + 1}</p>
                          <p className="text-[#2c241e] font-bold">{col.blocks.length} 个区块</p>
                          
                          {/* Add Block button */}
                          <div className="relative inline-block">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSidebarColId(activeSidebarColId === col.id ? null : col.id);
                              }}
                              className="text-[10px] text-[#8b4513] font-bold hover:underline flex items-center gap-0.5 mx-auto mt-1 cursor-pointer relative z-50"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>添加区块</span>
                            </button>
                            {activeSidebarColId === col.id && (
                              <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-28 bg-[#e8dcc4] border-2 border-[#8b4513] p-1 rounded-sm shadow-xl z-50 text-left space-y-1 font-serif font-bold text-[#2c241e] animate-fadeIn">
                                <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "article"); setActiveSidebarColId(null); }} className="block w-full text-left py-1 px-1.5 hover:bg-[#8b4513] hover:text-[#f5deb3] text-[#8b4513] rounded-sm text-[10px] transition-colors">书写文章</button>
                                <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "headline"); setActiveSidebarColId(null); }} className="block w-full text-left py-1 px-1.5 hover:bg-[#8b4513] hover:text-[#f5deb3] text-[#8b4513] rounded-sm text-[10px] transition-colors">装饰大标</button>
                                <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "image"); setActiveSidebarColId(null); }} className="block w-full text-left py-1 px-1.5 hover:bg-[#8b4513] hover:text-[#f5deb3] text-[#8b4513] rounded-sm text-[10px] transition-colors">绘制插图</button>
                                <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "divider"); setActiveSidebarColId(null); }} className="block w-full text-left py-1 px-1.5 hover:bg-[#8b4513] hover:text-[#f5deb3] text-[#8b4513] rounded-sm text-[10px] transition-colors">添加隔线</button>
                                <button onClick={(e) => { e.stopPropagation(); addBlockToColumn(col.id, "ad"); setActiveSidebarColId(null); }} className="block w-full text-left py-1 px-1.5 hover:bg-[#8b4513] hover:text-[#f5deb3] text-[#8b4513] rounded-sm text-[10px] transition-colors">行商布告</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PRINT & SIZE SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#8b4513] uppercase tracking-widest pb-1 border-b border-[#8b4513]/30">
                印刷大小與視覺自訂
              </h3>

              <div className="space-y-3">
                {/* Global Heading size slider */}
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

                {/* Global Body size slider */}
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

                {/* Column spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#4a3728]">
                    <span>双栏/三栏间隔密集度</span>
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

              <h3 className="text-xs font-bold text-[#8b4513] uppercase tracking-widest pt-3 pb-1 border-b border-[#8b4513]/30">
                报刊主题风格
              </h3>

              <div className="grid grid-cols-2 gap-2 py-2">
                <button
                  type="button"
                  onClick={() => switchTheme("fantasy")}
                  className={`py-2 px-2 rounded-sm text-xs font-bold border transition-all ${
                    theme === "fantasy"
                      ? "bg-[#8b4513] text-[#f5deb3] border-[#5a2d0c] shadow-inner"
                      : "bg-[#e8dcc4] text-[#4a3728] border-[#8b4513]/40 hover:bg-[#d9ccb0]"
                  }`}
                >
                  ⚔ 中世纪奇幻
                </button>
                <button
                  type="button"
                  onClick={() => switchTheme("republican")}
                  className={`py-2 px-2 rounded-sm text-xs font-bold border transition-all ${
                    theme === "republican"
                      ? "bg-[#1a1a1a] text-[#f4f3ef] border-[#000] shadow-inner"
                      : "bg-[#e8dcc4] text-[#4a3728] border-[#8b4513]/40 hover:bg-[#d9ccb0]"
                  }`}
                >
                  ■ 民国报刊
                </button>
              </div>
              <p className="text-[10px] text-[#4a3728]/70 font-serif leading-relaxed pb-2">
                切换主题时文字内容将被保留，不兼容的样式会重置为目标主题的默认值。
              </p>

              <h3 className="text-xs font-bold text-[#8b4513] uppercase tracking-widest pt-3 pb-1 border-b border-[#8b4513]/30">
                {theme === "republican" ? "纸张与油墨设定" : "古物仿真背景設定"}
              </h3>

              <div className="space-y-3">
                {/* Paper Tone Selector */}
                <div className="space-y-1.5 pt-1">
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
                    <span>啟用羊皮紙古樸纖維質地</span>
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

                <p className="text-[11px] text-[#4a3728]/80 leading-relaxed font-serif">
                  {theme === "republican"
                    ? "提示：如在洁白新闻纸上直接打印，可取消勾选油墨污斑，打印背景将为纯白，更贴合实物纸张效果。"
                    : "提示：如果您打算在真正的泛黄复古美术纸上直接进行打印，可以取消勾选这两项背景仿真效果，这样打印出来的背景会是纯白的，能更完美地贴合实物艺术纸的自带纹理！"
                  }
                </p>
              </div>

              {/* AI Gemini API Key Configuration (Pure Frontend Support) */}
              <h3 className="text-xs font-bold text-[#8b4513] uppercase tracking-widest pt-3 pb-1 border-b border-[#8b4513]/30 flex items-center justify-between">
                <span>AI 智能撰稿配置</span>
                <span className="text-[10px] text-[#8b4513]/70 font-normal">纯前端/本地离线</span>
              </h3>

              <div className="space-y-2 p-2.5 bg-[#dcd0b8]/50 border border-[#8b4513]/30 rounded">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#4a3728]">Gemini API Key (可选)</label>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-[10px] text-[#8b4513] hover:underline"
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
                <p className="text-[10px] text-[#4a3728]/70 leading-relaxed font-serif">
                  <strong>💡 纯前端运行说明</strong>：此密钥仅保存在您本地浏览器的 localStorage 中，不经过任何第三方服务器。配置后，纯前端单文件亦可直接呼叫官方 AI 模型；若未配置或处于离线断网状态，系统将<strong>自动无缝切换至内置的古典离线撰稿语料库</strong>，确保随时可用。
                </p>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR: EXPORT PANEL */}
        <div className="p-4 bg-[#dcd0b8] border-t-2 border-[#8b4513] space-y-2.5 no-print">
          <button 
            type="button"
            onClick={handlePrintPDF}
            className="w-full py-2.5 bg-[#8b4513] hover:bg-[#753a10] text-[#f5deb3] font-extrabold rounded-sm shadow-[0_4px_0_#2c241e] active:translate-y-[2px] active:shadow-[0_2px_0_#2c241e] transition-all border border-[#d2b48c] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>打印 / 导出高分辨率PDF (印刷用)</span>
          </button>
          
          <button 
            type="button"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="w-full py-2 bg-transparent hover:bg-[#8b4513]/10 border border-[#8b4513] text-[#8b4513] text-xs font-extrabold rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? "正在编译高清像素..." : "导出 2 倍印刷规格高清图片"}</span>
          </button>
        </div>

      </aside>
    </>
  );
}
