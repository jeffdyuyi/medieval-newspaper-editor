import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ExternalLink, Copy, Check, Heart, Globe, 
  Users, Phone, Sparkles, Printer, MessageSquare
} from "lucide-react";
import logoUrl from "../assets/logo";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-[#120e0b]/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 no-print overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1e1713] border-2 border-[#8b4513] rounded-lg max-w-4xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-[#e8dcc4] font-serif overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-3 md:px-6 md:py-3.5 bg-[#2c221a] border-b border-[#8b4513]/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src={logoUrl} 
                alt="不咕鸟小报编辑器" 
                className="w-7 h-7 object-contain drop-shadow"
              />
              <div>
                <h2 className="text-base md:text-lg font-bold tracking-wider text-[#f5deb3]">
                  不咕鸟小报编辑器
                </h2>
                <p className="text-[11px] text-[#e0a96d]/80">
                  作者信息 · 社区俱乐部 · 核心指引
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 text-[#e8dcc4]/70 hover:text-[#f5deb3] hover:bg-[#8b4513]/30 rounded transition cursor-pointer"
              title="关闭窗口 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Left / Right Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-[#8b4513]/40">
            
            {/* Left Column: Author Info & Community */}
            <div className="md:col-span-5 p-4 md:p-6 bg-[#1a1410] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Author Avatar & Header */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#8b4513]/30">
                  <div className="w-14 h-14 rounded-full bg-[#2c221a] border-2 border-[#8b4513] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                    <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#f5deb3]">不咕鸟</span>
                      <span className="text-xs text-[#e0a96d] px-1.5 py-0.5 rounded bg-[#8b4513]/30 border border-[#8b4513]/40">哈基米德</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      独立开发 · TRPG模组/规则工坊
                    </p>
                  </div>
                </div>

                {/* Greeting / Slogan */}
                <div className="p-3 bg-[#241c16] rounded border border-[#8b4513]/30 text-xs leading-relaxed text-[#dfd0bd]">
                  <p className="flex items-start gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#e0a96d] shrink-0 mt-0.5" />
                    <span>欢迎直接联系或者加群讨论模组、规则以及造轮子、修BUG！</span>
                  </p>
                </div>

                {/* Contact & Groups List */}
                <div className="space-y-2 text-xs">
                  {/* Phone */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#241c16]/70 border border-[#8b4513]/25 hover:border-[#8b4513]/60 transition">
                    <div className="flex items-center gap-2 text-stone-300">
                      <Phone className="w-3.5 h-3.5 text-[#e0a96d]" />
                      <span>联系方式：<strong className="text-[#f5deb3] font-mono">13308009593</strong></span>
                    </div>
                    <button
                      onClick={() => handleCopy("13308009593", "phone")}
                      className="p-1 hover:text-[#e0a96d] text-stone-400 cursor-pointer"
                      title="复制电话"
                    >
                      {copiedKey === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Creation Group */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#241c16]/70 border border-[#8b4513]/25 hover:border-[#8b4513]/60 transition">
                    <div className="flex items-center gap-2 text-stone-300">
                      <Users className="w-3.5 h-3.5 text-[#e0a96d]" />
                      <span>不咕鸟创作交流群：<strong className="text-[#f5deb3] font-mono">261751459</strong></span>
                    </div>
                    <button
                      onClick={() => handleCopy("261751459", "group1")}
                      className="p-1 hover:text-[#e0a96d] text-stone-400 cursor-pointer"
                      title="复制群号"
                    >
                      {copiedKey === "group1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Club Group */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#241c16]/70 border border-[#8b4513]/25 hover:border-[#8b4513]/60 transition">
                    <div className="flex items-center gap-2 text-stone-300">
                      <Users className="w-3.5 h-3.5 text-[#e0a96d]" />
                      <span>秘密基地俱乐部群：<strong className="text-[#f5deb3] font-mono">691707475</strong></span>
                    </div>
                    <button
                      onClick={() => handleCopy("691707475", "group2")}
                      className="p-1 hover:text-[#e0a96d] text-stone-400 cursor-pointer"
                      title="复制群号"
                    >
                      {copiedKey === "group2" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Club Website */}
                  <a
                    href="https://nogubird.top"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded bg-[#241c16]/70 border border-[#8b4513]/25 hover:border-[#e0a96d] hover:bg-[#8b4513]/20 transition group"
                  >
                    <div className="flex items-center gap-2 text-stone-300">
                      <Globe className="w-3.5 h-3.5 text-[#e0a96d]" />
                      <span>成都秘密基地TRPG俱乐部</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-[#e0a96d] font-mono group-hover:underline">
                      nogubird.top
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                </div>
              </div>

              {/* Sponsor / Support Link */}
              <div className="pt-4 border-t border-[#8b4513]/30">
                <a
                  href="https://ifdian.net/a/nogubird"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-[#8b4513] to-[#a0522d] hover:from-[#a0522d] hover:to-[#b86b3a] text-[#f5deb3] font-bold rounded flex items-center justify-center gap-2 shadow-md transition text-xs group cursor-pointer border border-[#d2b48c]/40"
                >
                  <Heart className="w-4 h-4 text-red-300 fill-red-300/60 group-hover:scale-110 transition-transform" />
                  <span>为作者加油 (爱发电)：ifdian.net/a/nogubird</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Right Column: Two Refined Instructions */}
            <div className="md:col-span-7 p-4 md:p-6 bg-[#211a15] space-y-4">
              
              {/* Guide 1: WYSIWYG Editing */}
              <div className="p-3.5 bg-[#2a211a] rounded-lg border border-[#8b4513]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#e0a96d] font-bold text-sm pb-1.5 border-b border-[#8b4513]/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>所见即所得排版指引</span>
                </div>
                <ul className="text-xs text-[#dfd0bd] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e0a96d] font-bold">1.</span>
                    <span><strong>原地直观打字</strong>：报纸上的大标、副标、文章正文与广告均可<strong>直接点击原地光标键入</strong>，按 <kbd className="px-1 py-0.5 bg-[#140f0c] border border-[#8b4513]/50 rounded text-[10px] font-mono">Enter</kbd> 智能分段并自动保持焦点流转。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e0a96d] font-bold">2.</span>
                    <span><strong>划选浮动格式</strong>：用鼠标划选文本，即刻呼出快捷工具条，支持加粗、斜体、下划线及复古<strong>朱砂红</strong>高亮标红。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e0a96d] font-bold">3.</span>
                    <span><strong>灵活素材拖拽</strong>：左侧【📦 素材库】提供标题、正文、版画、分割线及广告等多种古典版式，可随意拖入目标分栏，支持画布栏目的即时拆分与合并。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e0a96d] font-bold">4.</span>
                    <span><strong>精细排版检查器</strong>：点击区块右上角齿轮 <span className="text-[#e0a96d]">⚙</span>，左侧即可展开字号、段落行距、对齐、首字雕花下沉等高级装帧配置。</span>
                  </li>
                </ul>
              </div>

              {/* Guide 2: Vector Printing */}
              <div className="p-3.5 bg-[#2a211a] rounded-lg border border-[#8b4513]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#e0a96d] font-bold text-sm pb-1.5 border-b border-[#8b4513]/30">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>超高解析度 Vector 矢量印刷指南</span>
                </div>
                <div className="text-xs text-[#dfd0bd] space-y-2 leading-relaxed">
                  <p className="text-[11px] text-[#cbbba0]">
                    编辑器基于纯 CSS Vector 矢量排版引擎开发，支持保存原生矢量文字，具备 300 ~ 1200 DPI 印刷级放大无损的出版品质。
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                    <li>
                      点击左下角 <strong>【打印 / 导出高分辨率PDF】</strong>（或快捷键 <kbd className="px-1 py-0.5 bg-[#140f0c] border border-[#8b4513]/50 rounded text-[10px] font-mono">Ctrl+P</kbd>）。
                    </li>
                    <li>
                      在目标打印机中选择 <strong>【另存为 PDF】</strong> (Save as PDF)。
                    </li>
                    <li>
                      在【更多设置】中，务必勾选 <strong>【背景图形】</strong> (Background graphics)，以还原羊皮纸做旧斑驳与茶渍质感。
                    </li>
                    <li>
                      纸张尺寸建议选择 <strong>A4</strong>，页边距选择 <strong>无 (None)</strong>，缩放选择 <strong>100%</strong>。
                    </li>
                    <li>
                      <strong>实体仿古纸印刷</strong>：若使用真实的泛黄特种美术纸，可在全局排版中关闭“纸质纹理”，直接在羊皮纸上喷墨/激光印刷！
                    </li>
                  </ol>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-[#1e1713] border-t border-[#8b4513]/40 flex items-center justify-between shrink-0 text-xs">
            <span className="text-stone-400 text-[11px]">
              Tip: 点击左侧边栏顶部的 Logo 图标可随时重新唤出此窗口。
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#8b4513] hover:bg-[#a0522d] text-[#f5deb3] font-bold rounded transition cursor-pointer text-xs"
            >
              我知道了
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
