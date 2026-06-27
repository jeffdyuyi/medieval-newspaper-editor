import React from "react";
import { Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNewspaper } from "./context/NewspaperContext";
import Sidebar from "./components/Sidebar";
import NewspaperPreview from "./components/NewspaperPreview";
import SaveManager from "./components/SaveManager";
import MobileNav from "./components/MobileNav";

export default function App() {
  const {
    activeAddBlockColId, setActiveAddBlockColId,
    activeSidebarColId, setActiveSidebarColId,
    showPrintHelp, setShowPrintHelp,
    showSaveManager, setShowSaveManager
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
      <MobileNav />
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

      {showSaveManager && <SaveManager onClose={() => setShowSaveManager(false)} />}
    </div>
  );
}
