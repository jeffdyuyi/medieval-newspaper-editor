import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { 
  Sparkles, Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  FileText, Image as ImageIcon, Printer, Download, HelpCircle, 
  Check, RefreshCw, Feather, BookOpen, Settings, Layout, 
  Type as FontIcon, Columns, Scissors, ZoomIn, ZoomOut, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  NewspaperData, Row, Column, Block, BlockType, 
  HeadlineBlock, ArticleBlock, ImageBlock, DividerBlock, AdBlock,
  ColumnSplit, NewspaperHeader
} from "./types";
import { FANTASY_CLIPART } from "./clipart";
import { INITIAL_NEWSPAPER_DATA } from "./defaultData";

function sanitizeNewspaperData(data: NewspaperData): NewspaperData {
  if (!data || !Array.isArray(data.rows)) return INITIAL_NEWSPAPER_DATA;
  
  const seenBlockIds = new Set<string>();
  const seenColIds = new Set<string>();
  const seenRowIds = new Set<string>();

  const sanitizedRows = data.rows.map((row, rowIdx) => {
    let rowId = row.id;
    if (!rowId || seenRowIds.has(rowId)) {
      rowId = `row_${Date.now()}_${rowIdx}_${Math.random().toString(36).substring(2, 7)}`;
    }
    seenRowIds.add(rowId);

    const sanitizedColumns = (row.columns || []).map((col, colIdx) => {
      let colId = col.id;
      if (!colId || seenColIds.has(colId)) {
        colId = `col_${rowId}_${colIdx}_${Math.random().toString(36).substring(2, 7)}`;
      }
      seenColIds.add(colId);

      const sanitizedBlocks = (col.blocks || []).map((block, blockIdx) => {
        let blockId = block.id;
        if (!blockId || seenBlockIds.has(blockId)) {
          blockId = `block_${Date.now()}_${blockIdx}_${Math.random().toString(36).substring(2, 7)}`;
        }
        seenBlockIds.add(blockId);

        return {
          ...block,
          id: blockId
        };
      });

      return {
        ...col,
        id: colId,
        blocks: sanitizedBlocks
      };
    });

    return {
      ...row,
      id: rowId,
      columns: sanitizedColumns
    };
  });

  return {
    ...data,
    rows: sanitizedRows
  };
}

export default function App() {
  // State for whole Newspaper layout
  const [newspaperData, setNewspaperData] = useState<NewspaperData>(() => {
    // Attempt local storage restore, otherwise default
    const saved = localStorage.getItem("medieval_newspaper_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeNewspaperData(parsed);
      } catch (e) {
        return sanitizeNewspaperData(INITIAL_NEWSPAPER_DATA);
      }
    }
    return sanitizeNewspaperData(INITIAL_NEWSPAPER_DATA);
  });

  // Editor states
  const [activeTab, setActiveTab] = useState<"header" | "layout" | "blocks" | "settings">("blocks");
  const [blockTabMode, setBlockTabMode] = useState<"edit" | "create">("edit");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>("block_art_1");
  const [selectedRowId, setSelectedRowId] = useState<string | null>("row_1");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>("col_1_2");

  // Global styling states
  const [globalHeadingScale, setGlobalHeadingScale] = useState<number>(100);
  const [globalBodyScale, setGlobalBodyScale] = useState<number>(100);
  const [columnGap, setColumnGap] = useState<number>(6); // px/rem spacer
  const [enableParchmentTexture, setEnableParchmentTexture] = useState<boolean>(true);
  const [enableCoffeeStains, setEnableCoffeeStains] = useState<boolean>(true);

  // Print/Help guide state
  const [showPrintHelp, setShowPrintHelp] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active click-to-toggle block-adder dropdown columns
  const [activeAddBlockColId, setActiveAddBlockColId] = useState<string | null>(null);
  const [activeSidebarColId, setActiveSidebarColId] = useState<string | null>(null);

  // Hidden file input ref for custom image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save changes to local storage
  useEffect(() => {
    localStorage.setItem("medieval_newspaper_data", JSON.stringify(newspaperData));
  }, [newspaperData]);

  // Helper: Find Block in newspaperData
  const findSelectedBlock = (): Block | null => {
    if (!selectedBlockId) return null;
    for (const row of newspaperData.rows) {
      for (const col of row.columns) {
        const block = col.blocks.find(b => b.id === selectedBlockId);
        if (block) return block;
      }
    }
    return null;
  };

  // Helper: Find Parent Column and Row of selected block
  const selectBlockAndContext = (blockId: string, colId: string, rowId: string) => {
    setSelectedBlockId(blockId);
    setSelectedColumnId(colId);
    setSelectedRowId(rowId);
    setBlockTabMode("edit");
    setActiveTab("blocks");
  };

  // Core block actions: Update a block
  const updateBlock = (blockId: string, updater: (block: Block) => Block) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        columns: row.columns.map(col => ({
          ...col,
          blocks: col.blocks.map(block => block.id === blockId ? updater(block) : block)
        }))
      }))
    }));
  };

  // Layout action: Update header info
  const updateHeader = (updater: (header: NewspaperHeader) => NewspaperHeader) => {
    setNewspaperData(prev => ({
      ...prev,
      header: updater(prev.header)
    }));
  };

  // Layout action: Update a row split
  const updateRowSplit = (rowId: string, newSplit: ColumnSplit) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id !== rowId) return row;

        // Map split to column count
        let colCount = 1;
        if (newSplit === "1-1" || newSplit === "1-2" || newSplit === "2-1") colCount = 2;
        if (newSplit === "1-1-1") colCount = 3;

        // Preserve existing columns up to colCount, create empty ones if needed
        const newColumns: Column[] = [];
        for (let i = 0; i < colCount; i++) {
          if (row.columns[i]) {
            newColumns.push(row.columns[i]);
          } else {
            newColumns.push({
              id: `col_${rowId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
              blocks: []
            });
          }
        }

        // If reducing columns, distribute blocks from deleted columns into the last column
        if (row.columns.length > colCount) {
          const targetCol = newColumns[newColumns.length - 1];
          for (let i = colCount; i < row.columns.length; i++) {
            targetCol.blocks = [...targetCol.blocks, ...row.columns[i].blocks];
          }
        }

        return {
          ...row,
          split: newSplit,
          columns: newColumns
        };
      })
    }));
  };

  // Add new horizontal row
  const addNewRow = () => {
    const newRowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRow: Row = {
      id: newRowId,
      split: "1",
      columns: [
        {
          id: `col_${newRowId}_0`,
          blocks: []
        }
      ]
    };
    setNewspaperData(prev => ({
      ...prev,
      rows: [...prev.rows, newRow]
    }));
    setSelectedRowId(newRowId);
    setSelectedColumnId(`col_${newRowId}_0`);
    setSelectedBlockId(null);
  };

  // Delete a Row
  const deleteRow = (rowId: string) => {
    if (newspaperData.rows.length <= 1) {
      alert("报纸必须至少包含一个版面板块（行）！");
      return;
    }
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r.id !== rowId)
    }));
    if (selectedRowId === rowId) {
      setSelectedRowId(null);
      setSelectedColumnId(null);
      setSelectedBlockId(null);
    }
  };

  // Move Row Up/Down
  const moveRow = (rowId: string, direction: "up" | "down") => {
    const index = newspaperData.rows.findIndex(r => r.id === rowId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === newspaperData.rows.length - 1) return;

    const newRows = [...newspaperData.rows];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newRows[index];
    newRows[index] = newRows[targetIndex];
    newRows[targetIndex] = temp;

    setNewspaperData(prev => ({ ...prev, rows: newRows }));
  };

  // Add Content Block to a specific column
  const addBlockToColumn = (colId: string, type: BlockType, afterBlockId?: string) => {
    const newBlockId = `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let newBlock: Block;

    if (type === "headline") {
      newBlock = {
        id: newBlockId,
        type: "headline",
        text: "新栏目大标题",
        subtitle: "在此输入吸引人眼球的副标题",
        font: "font-xiaowei",
        size: "normal"
      };
    } else if (type === "article") {
      newBlock = {
        id: newBlockId,
        type: "article",
        title: "新记事文章标题",
        subtitle: "皇家学者关于此事件的简短叙述",
        author: "帝国记录官",
        paragraphs: ["在遥远的行省，风雨交加的夜里，一件奇妙的逸闻悄然发生。据当地守卫描述，那是个不可思议的开端...", "学者们在羊皮纸上写下了这段记录，供王都的臣民们阅览。"],
        dropCap: true,
        fontSize: "sm",
        font: "font-serif",
        align: "justify"
      };
    } else if (type === "image") {
      newBlock = {
        id: newBlockId,
        type: "image",
        src: "", // empty means fallback to clipart
        filter: "woodblock",
        caption: "古老手抄本插图摹印",
        isClipart: true,
        clipartId: "castle",
        scale: 75
      };
    } else if (type === "divider") {
      newBlock = {
        id: newBlockId,
        type: "divider",
        style: "ornament",
        ornamentType: "fleur-de-lis"
      };
    } else {
      newBlock = {
        id: newBlockId,
        type: "ad",
        title: "大炼金商行告示",
        content: "出售上等秘银盾牌、精制魔法卷轴。保证正品，拒绝赝品！",
        price: "售价：面议",
        merchant: "北街红狮子铁匠铺",
        borderStyle: "dashed"
      };
    }

    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          
          let newBlocks = [...col.blocks];
          if (afterBlockId) {
            const idx = newBlocks.findIndex(b => b.id === afterBlockId);
            if (idx !== -1) {
              newBlocks.splice(idx + 1, 0, newBlock);
            } else {
              newBlocks.push(newBlock);
            }
          } else {
            newBlocks.push(newBlock);
          }
          return {
            ...col,
            blocks: newBlocks
          };
        })
      }))
    }));

    setSelectedBlockId(newBlockId);
    setSelectedColumnId(colId);
    setBlockTabMode("edit");
    setActiveTab("blocks");
  };

  // Delete Block
  const deleteBlock = (blockId: string) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        columns: row.columns.map(col => ({
          ...col,
          blocks: col.blocks.filter(b => b.id !== blockId)
        }))
      }))
    }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Move Block Up/Down within column
  const moveBlock = (blockId: string, colId: string, direction: "up" | "down") => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          const idx = col.blocks.findIndex(b => b.id === blockId);
          if (idx === -1) return col;
          if (direction === "up" && idx === 0) return col;
          if (direction === "down" && idx === col.blocks.length - 1) return col;

          const newBlocks = [...col.blocks];
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          const temp = newBlocks[idx];
          newBlocks[idx] = newBlocks[targetIdx];
          newBlocks[targetIdx] = temp;

          return { ...col, blocks: newBlocks };
        })
      }))
    }));
  };

  // Move Block horizontally to adjacent column in the same row
  const moveBlockHorizontally = (blockId: string, fromColId: string, rowId: string, direction: "left" | "right") => {
    const row = newspaperData.rows.find(r => r.id === rowId);
    if (!row) return;
    const fromColIdx = row.columns.findIndex(c => c.id === fromColId);
    if (fromColIdx === -1) return;
    
    if (direction === "left" && fromColIdx === 0) return;
    if (direction === "right" && fromColIdx === row.columns.length - 1) return;

    const toColIdx = direction === "left" ? fromColIdx - 1 : fromColIdx + 1;
    const toCol = row.columns[toColIdx];
    const blockToMove = row.columns[fromColIdx].blocks.find(b => b.id === blockId);
    if (!blockToMove) return;

    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(r => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          columns: r.columns.map((c, idx) => {
            if (idx === fromColIdx) {
              return { ...c, blocks: c.blocks.filter(b => b.id !== blockId) };
            }
            if (idx === toColIdx) {
              return { ...c, blocks: [...c.blocks, blockToMove] };
            }
            return c;
          })
        };
      })
    }));

    setSelectedColumnId(toCol.id);
  };

  // Floyd-Steinberg dithering for woodblock engravings on canvas
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlockId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // We directly store the high-res uploaded original,
      // and when the user picks the "woodblock" filter, we can render it dithered!
      updateBlock(selectedBlockId, b => {
        const imgBlock = b as ImageBlock;
        return {
          ...imgBlock,
          type: "image",
          src: base64,
          isClipart: false,
          clipartId: undefined
        };
      });
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input dialog
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Export as high-res PNG image using SVG ForeignObject serializer (scaled x2)
  const handleExportPNG = async () => {
    const element = document.getElementById("printable-newspaper-content");
    if (!element) return;
    try {
      setIsExporting(true);
      
      // Calculate scaled sizes
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      // Create a cloned copy of newspaper HTML without UI indicators
      const serializedHtml = new XMLSerializer().serializeToString(element);
      
      // Inline styles & load required fonts so foreignObject renders them perfectly
      const fontStyles = `
        @import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@300;400;700&family=Ma+Shan+Zheng&family=Zhi+Mang+Xing&family=LXGW+WenKai&family=Grenze+Gotisch:wght@400;700&family=Cinzel:wght@400;700&display=swap');
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
        .parchment-bg {
          background-color: #f1e4cb !important;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(0, 0, 0, 0.05) 100%),
            radial-gradient(circle at 10% 20%, rgba(139, 90, 43, 0.09) 0%, transparent 18%),
            radial-gradient(circle at 85% 80%, rgba(111, 78, 55, 0.08) 0%, transparent 22%),
            radial-gradient(circle at 35% 65%, rgba(139, 90, 43, 0.06) 0%, transparent 15%),
            radial-gradient(circle at 70% 25%, rgba(111, 78, 55, 0.08) 0%, transparent 20%) !important;
        }
        .newspaper-double-border {
          border: 4px double #2b221a !important;
          outline: 1px solid #2b221a !important;
          outline-offset: -8px !important;
        }
        .drop-cap::first-letter {
          font-family: 'Grenze Gotisch', 'ZCOOL XiaoWei', serif !important;
          float: left !important;
          font-size: 3.5rem !important;
          line-height: 3rem !important;
          padding-top: 4px !important;
          padding-right: 8px !important;
          padding-left: 3px !important;
          margin-right: 4px !important;
          color: #1c1510 !important;
          font-weight: bold !important;
        }
      `;

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}" viewBox="0 0 ${width} ${height}">
        <defs>
          <style type="text/css">${fontStyles}</style>
        </defs>
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="transform: scale(1); transform-origin: top left; width: 100%; height: 100%;">
            ${serializedHtml}
          </div>
        </foreignObject>
      </svg>`;
      
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = window.URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f1e4cb";
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
        window.URL.revokeObjectURL(blobUrl);
        setIsExporting(false);
      };
      img.onerror = () => {
        throw new Error("Render load error");
      };
      img.src = blobUrl;
    } catch (err) {
      console.error("PNG export failure, falling back:", err);
      setIsExporting(false);
      // Fallback message showing printing tips since SVG compilation is sandbox-sensitive
      alert("由于预览沙箱的安全限制，部分外链字体或大尺寸图片在导出为PNG时可能受到限制。\n\n强烈推荐点击左下角的【打印与高分辨率PDF】按钮！在系统打印窗口中选择【保存为PDF】，即可导出完美保真、无限缩放的高分辨率 vector 印刷格式文件！");
    }
  };

  // Trigger system native printing window
  const handlePrintPDF = () => {
    window.print();
  };

  // Reset to initial beautiful fantasy newspaper
  const handleResetData = () => {
    if (confirm("您确定要重置所有编辑内容，恢复到预设的「星辉帝国要闻报」吗？")) {
      setNewspaperData(INITIAL_NEWSPAPER_DATA);
      setSelectedBlockId("block_art_1");
    }
  };

  const selectedBlock = findSelectedBlock();

  return (
    <div className="min-h-screen bg-[#2c241e] text-[#4a3728] flex flex-col md:flex-row font-serif overflow-x-hidden select-none selection:bg-[#8b4513] selection:text-[#f5deb3]">
      
      {/* Click-outside backdrop overlay to close active dropdowns */}
      {(activeAddBlockColId !== null || activeSidebarColId !== null) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={() => {
            setActiveAddBlockColId(null);
            setActiveSidebarColId(null);
          }}
        />
      )}
      
      {/* LEFT SIDEBAR: Vintage Control Desk & Tools */}
      <aside className="w-full md:w-[420px] bg-[#e8dcc4] text-[#4a3728] border-b-2 md:border-b-0 md:border-r-2 border-[#8b4513] flex flex-col shrink-0 no-print shadow-2xl z-20">
        
        {/* Editor Title Banner */}
        <div className="p-4 bg-[#dcd0b8] border-b border-[#8b4513] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#8b4513] border-2 border-[#d2b48c] rounded shadow-md text-[#f5deb3]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-serif tracking-widest uppercase text-[#2c241e]">吟游诗人编辑台</h1>
              <p className="text-[10px] italic text-[#8b4513] opacity-80">v2.4 - 中世纪奇幻版</p>
            </div>
          </div>
          
          <div className="flex gap-2">
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
          {activeTab === "blocks" && (() => {
            // Helper options for target column
            const targetColOptions: { id: string, label: string }[] = [];
            newspaperData.rows.forEach((row, rowIdx) => {
              row.columns.forEach((col, colIdx) => {
                targetColOptions.push({
                  id: col.id,
                  label: `行 ${rowIdx + 1} - 栏 ${colIdx + 1} (已有 ${col.blocks.length} 个区块)`
                });
              });
            });

            const activeTargetColId = selectedColumnId || targetColOptions[0]?.id || "";

            return (
              <div className="space-y-4">
                {/* Visual guideline box to teach users about the selection flow */}
                {!selectedBlock && (
                  <div className="p-3 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-sm space-y-1 text-xs text-[#8b4513] leading-relaxed font-serif animate-pulse">
                    <span className="font-extrabold block">💡 创作提示：</span>
                    <span>您可在右侧报纸内直接<strong>点击选中任意区块</strong>，即可在此处实时编辑其内容、字号与字体！下方则为您展示了向选定位置插入全新内容区块的工具。</span>
                  </div>
                )}

                {/* Sub-tab switcher if a block is selected */}
                {selectedBlock && (
                  <div className="flex border-b border-[#8b4513] mb-4 text-xs bg-[#dcd0b8]/40 rounded p-0.5 no-print">
                    <button
                      type="button"
                      onClick={() => setBlockTabMode("edit")}
                      className={`flex-1 py-1.5 font-bold rounded-sm transition-colors text-center ${blockTabMode === "edit" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513] hover:bg-[#8b4513]/10"}`}
                    >
                      ✍️ 编辑选中区块
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockTabMode("create")}
                      className={`flex-1 py-1.5 font-bold rounded-sm transition-colors text-center ${blockTabMode === "create" ? "bg-[#8b4513] text-[#f5deb3]" : "text-[#8b4513] hover:bg-[#8b4513]/10"}`}
                    >
                      ➕ 创建全新区块
                    </button>
                  </div>
                )}

                {/* If we are in create mode or no block is selected, show classified creation view */}
                {(blockTabMode === "create" || !selectedBlock) ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-3 bg-[#dcd0b8]/40 border border-[#8b4513]/40 rounded-sm space-y-1.5">
                      <label className="text-xs font-bold text-[#8b4513] block">📥 选择新区块插入位置</label>
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
                        className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs font-serif font-bold"
                      >
                        {targetColOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-[#8b4513]/70">提示：新区块将被追加到所选栏位的末尾，您也可以在右侧面板内自由拖拽或调整排序。</p>
                    </div>

                    <div className="space-y-4 font-serif">
                      {/* Category 1: Text & News */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                          <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">一、 文字与舆论 (文本区块)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              addBlockToColumn(activeTargetColId, "article");
                            }}
                            className="flex items-start gap-3 p-3 bg-[#dcd0b8]/20 border border-[#8b4513]/30 hover:border-[#8b4513] hover:bg-[#8b4513]/5 rounded transition text-left cursor-pointer group"
                          >
                            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] group-hover:bg-[#8b4513] group-hover:text-[#f5deb3] transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-[#2c241e] text-xs flex items-center gap-1.5">
                                见闻文章 (Article) <span className="text-[9px] bg-[#8b4513] text-[#f5deb3] px-1 py-0.5 rounded-sm">主打内容</span>
                              </p>
                              <p className="text-[11px] text-[#4a3728]/80 mt-0.5 leading-relaxed">撰写详细纪实、帝国大事件、战报或奇幻异闻。</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              addBlockToColumn(activeTargetColId, "headline");
                            }}
                            className="flex items-start gap-3 p-3 bg-[#dcd0b8]/20 border border-[#8b4513]/30 hover:border-[#8b4513] hover:bg-[#8b4513]/5 rounded transition text-left cursor-pointer group"
                          >
                            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] group-hover:bg-[#8b4513] group-hover:text-[#f5deb3] transition-colors">
                              <FontIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-[#2c241e] text-xs">装饰大标 (Headline)</p>
                              <p className="text-[11px] text-[#4a3728]/80 mt-0.5 leading-relaxed">添加醒目的通栏大标题、版块头或震撼大字标语。</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Category 2: Graphics & Decor */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                          <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">二、 图像与装点 (视觉区块)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              addBlockToColumn(activeTargetColId, "image");
                            }}
                            className="flex items-start gap-3 p-3 bg-[#dcd0b8]/20 border border-[#8b4513]/30 hover:border-[#8b4513] hover:bg-[#8b4513]/5 rounded transition text-left cursor-pointer group"
                          >
                            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] group-hover:bg-[#8b4513] group-hover:text-[#f5deb3] transition-colors">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-[#2c241e] text-xs">版画插图 (Image)</p>
                              <p className="text-[11px] text-[#4a3728]/80 mt-0.5 leading-relaxed">绘制巨龙、法书等羊皮纸木雕印章，或上传自定义图片。</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              addBlockToColumn(activeTargetColId, "divider");
                            }}
                            className="flex items-start gap-3 p-3 bg-[#dcd0b8]/20 border border-[#8b4513]/30 hover:border-[#8b4513] hover:bg-[#8b4513]/5 rounded transition text-left cursor-pointer group"
                          >
                            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] group-hover:bg-[#8b4513] group-hover:text-[#f5deb3] transition-colors">
                              <Scissors className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-[#2c241e] text-xs">花式隔线 (Divider)</p>
                              <p className="text-[11px] text-[#4a3728]/80 mt-0.5 leading-relaxed">使用皇家鸢尾花、利剑等徽章，或双实线、虚线进行视觉分割。</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Category 3: Marketplace & Ads */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-[#8b4513]/30">
                          <span className="text-xs font-bold text-[#8b4513] uppercase tracking-wider">三、 市井与行商 (便民区块)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              addBlockToColumn(activeTargetColId, "ad");
                            }}
                            className="flex items-start gap-3 p-3 bg-[#dcd0b8]/20 border border-[#8b4513]/30 hover:border-[#8b4513] hover:bg-[#8b4513]/5 rounded transition text-left cursor-pointer group"
                          >
                            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] group-hover:bg-[#8b4513] group-hover:text-[#f5deb3] transition-colors">
                              <CoinsIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-[#2c241e] text-xs">行商布告 (Advertisement)</p>
                              <p className="text-[11px] text-[#4a3728]/80 mt-0.5 leading-relaxed">刊登酒馆雇佣、药水促募、铁匠铺神兵交易等公告。</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {selectedBlock && (
                      <div className="p-3 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded text-xs text-[#8b4513] flex items-center justify-between no-print mt-2">
                        <span>正在浏览创建新区块</span>
                        <button onClick={() => setBlockTabMode("edit")} className="font-bold underline hover:text-[#2c241e]">
                          返回编辑当前选中区块
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
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">文章大标题</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as ArticleBlock).title}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, title: e.target.value } as ArticleBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
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
                                <option value="sm">小 (sm)</option>
                                <option value="md">中 (md)</option>
                                <option value="lg">大 (lg)</option>
                                <option value="xl">特大 (xl)</option>
                                <option value="2xl">巨型 (2xl)</option>
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

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">副标题</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as ArticleBlock).subtitle}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitle: e.target.value } as ArticleBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
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
                                <option value="xs">极小 (xs)</option>
                                <option value="sm">小 (sm)</option>
                                <option value="md">中 (md)</option>
                                <option value="lg">大 (lg)</option>
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">作者/官职</label>
                            <input 
                              type="text" 
                              value={(selectedBlock as ArticleBlock).author}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, author: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">署名单位/记录署印</label>
                            <input 
                              type="text" 
                              value={(selectedBlock as ArticleBlock).publishOffice ?? ""}
                              placeholder="聖塞西爾記錄署印"
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, publishOffice: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">复古中文字体</label>
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

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs font-bold text-[#8b4513] block mb-1">文字大小</label>
                            <select 
                              value={(selectedBlock as ArticleBlock).fontSize}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, fontSize: e.target.value } as ArticleBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-2 py-1 text-xs text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            >
                              <option value="xs">极小 (11px)</option>
                              <option value="sm">标准 (13px)</option>
                              <option value="md">中等 (15px)</option>
                              <option value="lg">大字 (18px)</option>
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

                          <div className="flex flex-col justify-end">
                            <label className="text-xs font-bold text-[#8b4513] mb-1.5 flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={(selectedBlock as ArticleBlock).dropCap}
                                onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, dropCap: e.target.checked } as ArticleBlock))}
                                className="accent-[#8b4513]"
                              />
                              首字下沉
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513] flex justify-between">
                            <span>文章正文 (换行自动分割段落)</span>
                            <span className="text-[10px] text-[#8b4513] opacity-70">段落数: {(selectedBlock as ArticleBlock).paragraphs.length}</span>
                          </label>
                          <textarea 
                            rows={8}
                            value={(selectedBlock as ArticleBlock).paragraphs.join("\n\n")}
                            onChange={(e) => {
                              const paras = e.target.value.split(/\n+/).filter(p => p.trim() !== "");
                              updateBlock(selectedBlock.id, b => ({ ...b, paragraphs: paras } as ArticleBlock));
                            }}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-serif text-xs leading-relaxed"
                            placeholder="在此输入正文，换行将会自动生成下一个段落..."
                          />
                        </div>
                      </div>
                    )}

                    {/* HEADLINE BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "headline" && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">标题文字</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as HeadlineBlock).text}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, text: e.target.value } as HeadlineBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
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
                                <option value="normal">中 (2xl)</option>
                                <option value="large">大 (4xl)</option>
                                <option value="epic">特大 (6xl)</option>
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

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">辅助副标题</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as HeadlineBlock).subtitle}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, subtitle: e.target.value } as HeadlineBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
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
                                <option value="xs">极小 (xs)</option>
                                <option value="sm">小 (sm)</option>
                                <option value="md">中 (md)</option>
                                <option value="lg">大 (lg)</option>
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

                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>

                        {/* Clipart Library Selector if isClipart */}
                        {(selectedBlock as ImageBlock).isClipart && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#8b4513] block">选择中世纪奇幻印记</label>
                            <div className="grid grid-cols-4 gap-2 bg-[#dcd0b8] p-2 rounded-sm border border-[#8b4513]">
                              {FANTASY_CLIPART.map(item => (
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
                              <option value="woodblock">Dither 雕刻版画 (1-Bit)</option>
                              <option value="high-contrast">高对比粗墨迹</option>
                              <option value="sepia">复古老墨色 (木刻)</option>
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
                            <option value="ornament">古老双面神圣章记 (Ornament)</option>
                            <option value="double">经典厚重复古双线 (Double Line)</option>
                            <option value="single">细致淡墨单实线 (Single Line)</option>
                            <option value="dotted">古代粗斑点虚线 (Dotted Line)</option>
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
                              <option value="fleur-de-lis">⚜ 皇家鸢尾花章记 (Fleur-de-lis)</option>
                              <option value="floral">❦ 古雅卷草花纹 (Floral Heart)</option>
                              <option value="star">✥ 占星家秘能星徽 (Arcane Star)</option>
                              <option value="sword">⚔ 骑士公会交叉利剑 (Combat Swords)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADVERTISEMENT BLOCK EDIT CONTROLS */}
                    {selectedBlock.type === "ad" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">商号告示主题</label>
                          <input 
                            type="text" 
                            value={(selectedBlock as AdBlock).title}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, title: e.target.value } as AdBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                          />
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
                                <option value="xs">极小 (xs)</option>
                                <option value="sm">小 (sm)</option>
                                <option value="md">中 (md)</option>
                                <option value="lg">大 (lg)</option>
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

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#8b4513]">告示宣传内容</label>
                          <textarea 
                            rows={4}
                            value={(selectedBlock as AdBlock).content}
                            onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, content: e.target.value } as AdBlock))}
                            className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-2 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs leading-relaxed font-serif"
                            placeholder="写入大酒馆、铁匠铺、魔法行会的招募或促销告示..."
                          />
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
                                <option value="xs">极小 (xs)</option>
                                <option value="sm">小 (sm)</option>
                                <option value="md">中 (md)</option>
                                <option value="lg">大 (lg)</option>
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">标价/酬金</label>
                            <input 
                              type="text" 
                              value={(selectedBlock as AdBlock).price}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, price: e.target.value } as AdBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#8b4513]">商号店址/发布人</label>
                            <input 
                              type="text" 
                              value={(selectedBlock as AdBlock).merchant}
                              onChange={(e) => updateBlock(selectedBlock.id, b => ({ ...b, merchant: e.target.value } as AdBlock))}
                              className="w-full bg-[#dcd0b8] border border-[#8b4513] rounded px-3 py-1.5 text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-xs"
                            />
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
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

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
                  <option value="font-gothic">Grenze Gotisch (西方中世纪黑体)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8b4513]">顶部箴言 / 标语 (Motto)</label>
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
                    placeholder="Imperial Chronicle Press Office © Year 742"
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
                      <label className="text-[11px] font-bold text-[#8b4513]/80">本行栏位排版分配 (Columns Split)</label>
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
                    <span>全局標題尺寸縮放</span>
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
                    <span>全局正文文字大小縮放</span>
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
                    <span>雙欄/三欄間隔密集度</span>
                    <span className="font-mono">{(columnGap / 4).toFixed(1)} rem</span>
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
                古物仿真背景設定
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#4a3728] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableParchmentTexture}
                    onChange={(e) => setEnableParchmentTexture(e.target.checked)}
                    className="accent-[#8b4513]"
                  />
                  <span>啟用羊皮紙古樸纖維質地</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#4a3728] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableCoffeeStains}
                    onChange={(e) => setEnableCoffeeStains(e.target.checked)}
                    className="accent-[#8b4513]"
                  />
                  <span>启用微黄茶渍/古物晕染污渍</span>
                </label>

                <p className="text-[11px] text-[#4a3728]/80 leading-relaxed font-serif">
                  提示：如果您打算在真正的泛黄复古美术纸上直接进行打印，可以取消勾选这两项背景仿真效果，这样打印出来的背景会是纯白的，能更完美地贴合实物艺术纸的自带纹理！
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
            <span>{isExporting ? "正在编译高清像素..." : "导出 2X 印刷规格高清图片"}</span>
          </button>
        </div>

      </aside>

      {/* RIGHT WORKSPACE: The Authentic Aged Newspaper Preview */}
      <main className="flex-1 overflow-y-auto bg-[#2c241e] bg-[radial-gradient(#3e3227_1px,transparent_1px)] [background-size:16px_16px] p-4 md:p-8 flex justify-center scrollbar-thin">
        
        {/* Printable Canvas Box wrapper */}
        <div className="w-full max-w-[800px] select-text relative">
          
          {/* Editor Quick overlay for mobile viewport */}
          <div className="no-print bg-[#e8dcc4] border-2 border-[#8b4513] px-3 py-1.5 rounded-sm text-xs font-serif font-bold text-[#8b4513] flex items-center justify-between mb-4 shadow-md md:hidden">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-[#8b4513]" /> 手机预览模式</span>
            <span className="text-[10px] text-[#4a3728]/80">点击左栏工具进行编辑</span>
          </div>

          {/* THE ACTUAL NEWSPAPER */}
          <div 
            id="printable-newspaper-content"
            className={`printable-newspaper w-full p-6 md:p-10 text-[#2b221a] border-4 newspaper-double-border transition-all duration-300 shadow-2xl relative select-text ${
              enableParchmentTexture ? "parchment-bg" : "bg-[#fcf8ee] text-black"
            }`}
          >
            {/* Overlay Coffee Stain 1 */}
            {enableParchmentTexture && enableCoffeeStains && (
              <div className="absolute top-[15%] left-[5%] w-[120px] h-[100px] bg-[#8b5a2b] opacity-5 rounded-full blur-2xl pointer-events-none rotate-12" />
            )}
            {/* Overlay Coffee Stain 2 */}
            {enableParchmentTexture && enableCoffeeStains && (
              <div className="absolute bottom-[25%] right-[10%] w-[180px] h-[150px] bg-[#6f4e37] opacity-6 rounded-full blur-3xl pointer-events-none -rotate-45" />
            )}

            {/* NEWSPAPER MAIN HEADER */}
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
                    {newspaperData.header.royalTitle || "聖 塞 西 爾 皇 家 御 覽"}
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

             {/* NEWSPAPER CONTENT GRID (ROWS & COLUMNS) */}
             <div className="space-y-6">
               {newspaperData.rows.map((row) => {
                 // Determine column grid template depending on split
                 let gridClass = "grid-cols-1";
                 if (row.split === "1-1") gridClass = "split-1-1";
                 if (row.split === "1-2") gridClass = "split-1-2";
                 if (row.split === "2-1") gridClass = "split-2-1";
                 if (row.split === "1-1-1") gridClass = "split-1-1-1";
 
                 return (
                   <div 
                     key={row.id}
                     className={`grid ${gridClass} border-b border-[#2b221a]/30 pb-6 last:border-b-0 last:pb-0 relative group/row`}
                     style={{ columnGap: `${columnGap * 4}px` }}
                   >
                     
                     {/* Visual Row Highlight when editing in layout mode */}
                     {selectedRowId === row.id && (
                       <div className="absolute -inset-2 border border-dashed border-[#8b4513]/50 rounded pointer-events-none no-print" />
                     )}
 
                     {row.columns.map((col, colIdx) => (
                       <div 
                         key={col.id} 
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedRowId(row.id);
                           setSelectedColumnId(col.id);
                         }}
                         className={`space-y-4 relative min-h-[50px] p-1 rounded-sm transition ${
                           selectedColumnId === col.id 
                             ? "bg-[#2b221a]/5 border border-dashed border-[#8b4513]/30" 
                             : ""
                         }`}
                         style={colIdx > 0 ? { borderLeft: '1px solid rgba(43, 34, 26, 0.25)', paddingLeft: `${columnGap * 2}px` } : {}}
                       >
                        {col.blocks.map((block) => {
                          const isSelected = selectedBlockId === block.id;

                          return (
                            <div
                              key={block.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectBlockAndContext(block.id, col.id, row.id);
                              }}
                              className={`group/block relative p-2.5 rounded transition duration-200 cursor-pointer ${
                                isSelected 
                                  ? "ring-2 ring-[#8b4513]/80 bg-[#2b221a]/4 shadow-md" 
                                  : "hover:bg-[#2b221a]/2"
                              }`}
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
                                      className={`font-bold text-[#1c1510] leading-snug tracking-tight ${(block as ArticleBlock).titleFont || "font-serif"} ${(block as ArticleBlock).titleAlign === "center" ? "text-center" : (block as ArticleBlock).titleAlign === "right" ? "text-right" : (block as ArticleBlock).titleAlign === "justify" ? "text-justify" : "text-left"}`}
                                    >
                                      {(block as ArticleBlock).title}
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
                                    className={`leading-relaxed tracking-wide space-y-3 transition-all duration-200 ${(block as ArticleBlock).font} ${
                                      (block as ArticleBlock).align === "justify" ? "text-justify" : (block as ArticleBlock).align === "center" ? "text-center" : "text-left"
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
                                        className={pIdx === 0 && (block as ArticleBlock).dropCap ? "drop-cap" : ""}
                                      >
                                        {p}
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
                                     className={`font-bold leading-tight tracking-normal text-[#1c1510] border-t-2 border-b-2 border-[#2b221a] py-1.5 ${(block as HeadlineBlock).font} ${(block as HeadlineBlock).align === "left" ? "text-left" : (block as HeadlineBlock).align === "right" ? "text-right" : (block as HeadlineBlock).align === "justify" ? "text-justify" : "text-center"}`}
                                   >
                                     {(block as HeadlineBlock).text}
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
                                          const clipart = FANTASY_CLIPART.find(c => c.id === (block as ImageBlock).clipartId) || FANTASY_CLIPART[0];
                                          return (
                                            <div 
                                              className={`w-full aspect-[4/3] flex items-center justify-center p-4 transition-all ${
                                                (block as ImageBlock).filter === "woodblock" ? "text-stone-900 woodcut-filter scale-[1.05]" :
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
                                            className={`w-full aspect-auto block object-cover max-h-[300px] border border-stone-400 ${
                                              (block as ImageBlock).filter === "woodblock" ? "woodcut-filter" :
                                              (block as ImageBlock).filter === "sepia" ? "sepia contrast-125 brightness-95 text-[#5e412f]" :
                                              (block as ImageBlock).filter === "high-contrast" ? "contrast-200 grayscale" :
                                              ""
                                            }`}
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
                                <div className="py-2 flex items-center justify-center">
                                  {(block as DividerBlock).style === "double" && (
                                    <div className="w-full border-t-[3px] border-b border-[#2b221a] h-1" />
                                  )}
                                  {(block as DividerBlock).style === "single" && (
                                    <div className="w-full border-t border-[#2b221a]/40" />
                                  )}
                                  {(block as DividerBlock).style === "dotted" && (
                                    <div className="w-full border-t border-dashed border-[#2b221a]/60 border-spacing-2" />
                                  )}
                                  {(block as DividerBlock).style === "ornament" && (
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
                                  )}
                                </div>
                              )}

                              {/* BLOCK RENDERING: AD */}
                              {block.type === "ad" && (
                                <div 
                                  className={`p-3 text-center tracking-wide leading-relaxed space-y-1.5 ${
                                    (block as AdBlock).borderStyle === "dashed" ? "border border-dashed border-[#2b221a]/60" :
                                    (block as AdBlock).borderStyle === "solid" ? "border-2 border-[#2b221a]" :
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

                            </div>
                          );
                        })}

                        {/* Inline column block-adder spacer to create new blocks easily */}
                        <div className={`no-print h-6 flex items-center justify-center transition duration-150 relative z-10 ${activeAddBlockColId === col.id ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                          <div className="w-full border-t border-dashed border-[#5a4b3d]/30 absolute" />
                          <div className="relative inline-block">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAddBlockColId(activeAddBlockColId === col.id ? null : col.id);
                              }}
                              className="bg-[#231d18] hover:bg-[#342a20] text-[#e0a96d] border border-[#5a4b3d] rounded-full p-1 shadow-lg flex items-center gap-1 text-[10px] px-2 cursor-pointer relative z-50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>在此增添文章或圖片</span>
                            </button>
                            {activeAddBlockColId === col.id && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-36 bg-[#1a1511] border-2 border-[#e0a96d] p-1.5 rounded shadow-2xl space-y-1 text-left z-50 animate-fadeIn">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addBlockToColumn(col.id, "article"); 
                                    setActiveAddBlockColId(null); 
                                  }} 
                                  className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold transition-colors"
                                >
                                  ✍ 书写文字文章
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addBlockToColumn(col.id, "headline"); 
                                    setActiveAddBlockColId(null); 
                                  }} 
                                  className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold transition-colors"
                                >
                                  ✦ 装饰大字标题
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addBlockToColumn(col.id, "image"); 
                                    setActiveAddBlockColId(null); 
                                  }} 
                                  className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold transition-colors"
                                >
                                  🖼 绘制插图木印
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addBlockToColumn(col.id, "divider"); 
                                    setActiveAddBlockColId(null); 
                                  }} 
                                  className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold transition-colors"
                                >
                                  ◇ 插入中饰隔线
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    addBlockToColumn(col.id, "ad"); 
                                    setActiveAddBlockColId(null); 
                                  }} 
                                  className="block w-full text-left py-1 px-2 hover:bg-[#342a20] text-stone-300 hover:text-[#e0a96d] rounded text-[10px] font-semibold transition-colors"
                                >
                                  🪙 刊登告示商售
                                </button>
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

            {/* Bottom Scribe footer mark for high fidelity */}
            <div className="border-t-2 border-[#2b221a] mt-8 pt-2.5 text-center text-[10px] font-serif uppercase tracking-widest text-stone-600 flex justify-between px-1">
              <span>{newspaperData.header.footerLeft || "星辉帝国皇家印刷署特许印制局发行"}</span>
              <span>{newspaperData.header.footerRight || "Imperial Chronicle Press Office © Year 742"}</span>
            </div>

          </div>

        </div>

      </main>

      {/* PRINT DIALOG PRE-PRINT HELP MODAL */}
      <AnimatePresence>
        {showPrintHelp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1511] border border-[#5a4b3d] p-6 rounded-lg max-w-md w-full shadow-2xl text-sm text-[#dfd0bd] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#e0a96d] font-bold text-base pb-2 border-b border-[#2b221a]">
                <Printer className="w-5 h-5" />
                <span>超高解析度 vector 印刷格式指南</span>
              </div>
              
              <p className="text-xs text-stone-300 leading-relaxed">
                本编辑器采用先进的 <strong>Vector PDF 排版系统</strong>，支持完美保存矢量字体，保证 300 ~ 1200 DPI 印刷级无损放大！在打印时，请遵循以下步骤操作：
              </p>

              <ol className="list-decimal pl-5 text-xs text-stone-300 space-y-2 leading-relaxed">
                <li>点击左下角的 <strong>【打印 / 导出高分辨率PDF】</strong> 按钮，这会拉起您操作系统的打印窗口。</li>
                <li>在目标打印机中选择 <strong>【另存为 PDF】</strong> (Save as PDF)。</li>
                <li>在 <strong>【更多设置】</strong> 中，务必勾选 <strong>【背景图形】</strong> (Background graphics)，以便完美印出复古黄斑纸质底色！</li>
                <li>纸张大小推荐选择 <strong>A4</strong>，页边距选择 <strong>无</strong> (None) 或 <strong>默认</strong>，缩放比例选择 <strong>100%</strong>。</li>
                <li>若需实物美术黄纸印刷，您可以在左侧“印刷”标签中关闭“背景质地与茶渍”，直接在实物泛黄羊皮纸上印制！</li>
              </ol>

              <div className="pt-2 border-t border-[#2b221a] flex justify-end">
                <button 
                  onClick={() => setShowPrintHelp(false)}
                  className="px-4 py-2 bg-[#e0a96d] hover:bg-[#efbe8c] text-[#1c1510] font-bold rounded text-xs transition"
                >
                  遵命，書記官！
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Custom simple Coins Icon to prevent import mismatch
function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="18" r="4" />
      <path d="M12 18a6 6 0 0 0-6-6" />
    </svg>
  );
}
