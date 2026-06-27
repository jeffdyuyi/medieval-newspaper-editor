const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
const sidebarPath = path.join(__dirname, 'src', 'components', 'Sidebar.tsx');
const previewPath = path.join(__dirname, 'src', 'components', 'NewspaperPreview.tsx');
const appTsx = fs.readFileSync(appPath, 'utf-8');

// Ensure components dir exists
if (!fs.existsSync(path.join(__dirname, 'src', 'components'))) {
  fs.mkdirSync(path.join(__dirname, 'src', 'components'));
}

// Find <aside> and </aside>
const asideStart = appTsx.indexOf('<aside');
const asideEnd = appTsx.indexOf('</aside>') + '</aside>'.length;
const asideContent = appTsx.substring(asideStart, asideEnd);

// Find <main> and </main>
const mainStart = appTsx.indexOf('<main');
const mainEnd = appTsx.indexOf('</main>') + '</main>'.length;
const mainContent = appTsx.substring(mainStart, mainEnd);

// Extract CoinsIcon
const coinsIconRegex = /function CoinsIcon[\s\S]*?<\/svg>\s*;\s*\}/;
const coinsIconMatch = appTsx.match(coinsIconRegex);
const coinsIconContent = coinsIconMatch ? coinsIconMatch[0] : '';

// Create Sidebar.tsx
const sidebarTsx = `import React, { useRef } from 'react';
import { 
  Feather, RefreshCw, HelpCircle, Scissors, Type as FontIcon, 
  Layout, Settings, FileText, Image as ImageIcon, Plus, 
  ArrowUp, ArrowDown, Trash2, Printer, Download 
} from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";
import { BlockType, ColumnSplit, ArticleBlock, ImageBlock } from "../types";

${coinsIconContent.replace('function CoinsIcon', 'export function CoinsIcon')}

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
    showPrintHelp, setShowPrintHelp,
    isExporting, setIsExporting,
    activeAddBlockColId, setActiveAddBlockColId,
    activeSidebarColId, setActiveSidebarColId,
    findSelectedBlock, selectBlockAndContext, updateBlock, updateHeader,
    updateRowSplit, addNewRow, deleteRow, moveRow,
    addBlockToColumn, deleteBlock, moveBlock, moveBlockHorizontally, handleResetData
  } = useNewspaper();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportPNG = async () => {
    const element = document.getElementById("printable-newspaper-content");
    if (!element) return;
    try {
      setIsExporting(true);
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const serializedHtml = new XMLSerializer().serializeToString(element);
      const fontStyles = \`
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
      \`;
      const svg = \`
        <svg xmlns="http://www.w3.org/2000/svg" width="\${width}" height="\${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              <style>\${fontStyles}</style>
              \${serializedHtml}
            </div>
          </foreignObject>
        </svg>
      \`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = window.URL.createObjectURL(blob);
      const img = new Image();
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
          downloadLink.download = \`\${newspaperData.header.title || "medieval-newspaper"}.png\`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        window.URL.revokeObjectURL(blobUrl);
        setIsExporting(false);
      };
      img.onerror = () => { throw new Error("Render load error"); };
      img.src = blobUrl;
    } catch (err) {
      console.error("PNG export failure, falling back:", err);
      setIsExporting(false);
      alert("由于预览沙箱的安全限制，部分外链字体或大尺寸图片在导出为PNG时可能受到限制。\\n\\n强烈推荐点击左下角的【打印与高分辨率PDF】按钮！");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const selectedBlock = findSelectedBlock();

  return (
    <>
      ${asideContent}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
    </>
  );
}
`;
fs.writeFileSync(sidebarPath, sidebarTsx);

// Create NewspaperPreview.tsx
const previewTsx = `import React from 'react';
import { Eye, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { useNewspaper } from "../context/NewspaperContext";
import { FANTASY_CLIPART } from "../clipart";
import { CoinsIcon } from "./Sidebar";
import { ArticleBlock, HeadlineBlock, ImageBlock, DividerBlock, AdBlock } from "../types";

export default function NewspaperPreview() {
  const {
    newspaperData,
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
    addBlockToColumn, deleteBlock, moveBlock, moveBlockHorizontally
  } = useNewspaper();

  return (
    ${mainContent}
  );
}
`;
fs.writeFileSync(previewPath, previewTsx);

// Update App.tsx
const newAppTsx = `import React from "react";
import { Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNewspaper } from "./context/NewspaperContext";
import Sidebar from "./components/Sidebar";
import NewspaperPreview from "./components/NewspaperPreview";

export default function App() {
  const {
    activeAddBlockColId, setActiveAddBlockColId,
    activeSidebarColId, setActiveSidebarColId,
    showPrintHelp, setShowPrintHelp
  } = useNewspaper();

  return (
    <div className="min-h-screen bg-[#2c241e] text-[#4a3728] flex flex-col md:flex-row font-serif overflow-x-hidden select-none selection:bg-[#8b4513] selection:text-[#f5deb3]">
      
      {/* Click-outside backdrop overlay */}
      {(activeAddBlockColId !== null || activeSidebarColId !== null) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={() => {
            setActiveAddBlockColId(null);
            setActiveSidebarColId(null);
          }}
        />
      )}
      
      <Sidebar />
      <NewspaperPreview />

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
                本编辑器采用先进的 <strong>Vector PDF 排版系统</strong>，支持完美保存矢量字体，保证 300 ~ 1200 DPI 印刷级无损放大！
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
`;
fs.writeFileSync(appPath, newAppTsx);

console.log("Refactoring complete.");
