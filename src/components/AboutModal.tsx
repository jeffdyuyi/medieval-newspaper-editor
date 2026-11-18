import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ExternalLink, Copy, Check, Heart, Globe, 
  Users, Phone, Sparkles, Printer, MessageSquare
} from "lucide-react";
import logoUrl from "../assets/logo";
import PixelIcon from "./PixelIcon";

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
        className="fixed inset-0 z-50 bg-[#070a10]/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 no-print overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="pixel-panel max-w-4xl w-full text-[var(--color-ink)] overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="pixel-panel-header p-3 md:px-5 md:py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src={logoUrl} 
                alt="不咕鸟小报编辑器" 
                className="w-7 h-7 object-contain drop-shadow"
              />
              <div>
                <h2 className="text-sm md:text-base font-bold tracking-wider text-[var(--color-gold)]">
                  不咕鸟小报编辑器
                </h2>
                <p className="text-[11px] text-[var(--color-muted)]">
                  作者信息 · 社区俱乐部 · 核心指引
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 text-[var(--color-muted)] hover:text-[var(--color-gold)] transition cursor-pointer"
              title="关闭窗口 (ESC)"
            >
              <PixelIcon name="pixel/close" size={18} />
            </button>
          </div>

          {/* Modal Body: Left / Right Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-[var(--color-line)] pixel-scroll">
            
            {/* Left Column: Author Info & Community */}
            <div className="md:col-span-5 p-4 md:p-5 bg-[var(--color-paper-light)] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Author Avatar & Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-line)]">
                  <div className="w-12 h-12 bg-[var(--color-paper)] border border-[var(--color-line)] p-1 flex items-center justify-center shrink-0">
                    <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--color-ink)]">不咕鸟</span>
                      <span className="text-[11px] text-[var(--color-gold)] px-1.5 py-0.5 bg-[var(--color-paper)] border border-[var(--color-line)]">哈基米德</span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      独立开发 · TRPG模组/规则工坊
                    </p>
                  </div>
                </div>

                {/* Greeting / Slogan */}
                <div className="pixel-card p-3 text-xs leading-relaxed text-[var(--color-ink)]">
                  <p className="flex items-start gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[var(--color-gold)] shrink-0 mt-0.5" />
                    <span>
                      致力于为广大跑团主持者 (KP/DM) 及桌游创作者打造<strong>沉浸、开箱即用、具备实体印刷质感</strong>的跑团辅助工具。愿这份小报编辑器能为您的冒险世界增添更多生动的历史沉淀！
                    </span>
                  </p>
                </div>

                {/* QQ Community Card */}
                <div className="pixel-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--color-gold)] font-bold">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[var(--color-gold)]" />
                      <span>创想俱乐部交流群</span>
                    </div>
                    <span className="text-[10px] text-emerald-400">活跃交流</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-[var(--color-paper-shade)] p-2 border border-[var(--color-line)]">
                    <div>
                      <div className="text-[10px] text-[var(--color-muted)]">官方 QQ 俱乐部群</div>
                      <div className="text-sm font-mono font-bold text-[var(--color-gold)]">261751459</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("261751459", "qq_group")}
                      className="pixel-btn text-xs px-2.5 py-1"
                      title="复制群号"
                    >
                      {copiedKey === "qq_group" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制群号</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="pixel-card p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-gold)] font-bold">
                    <Phone className="w-4 h-4 text-[var(--color-gold)]" />
                    <span>作者直接联系方式</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--color-paper-shade)] p-2 border border-[var(--color-line)]">
                      <div className="text-[10px] text-[var(--color-muted)]">个人 QQ 号</div>
                      <div className="font-mono font-bold text-[var(--color-ink)] text-xs truncate">447432386</div>
                      <button
                        type="button"
                        onClick={() => handleCopy("447432386", "qq_person")}
                        className="mt-1.5 text-[10px] text-[var(--color-gold)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "qq_person" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "qq_person" ? "已复制" : "复制QQ"}</span>
                      </button>
                    </div>

                    <div className="bg-[var(--color-paper-shade)] p-2 border border-[var(--color-line)]">
                      <div className="text-[10px] text-[var(--color-muted)]">个人微信号</div>
                      <div className="font-mono font-bold text-[var(--color-ink)] text-xs truncate">Garrrfield-</div>
                      <button
                        type="button"
                        onClick={() => handleCopy("Garrrfield-", "wechat")}
                        className="mt-1.5 text-[10px] text-[var(--color-gold)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "wechat" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "wechat" ? "已复制" : "复制微信"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribution / Heart Note */}
              <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                <span className="flex items-center gap-1">
                  <span>Built with</span>
                  <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                  <span>for TTRPG community</span>
                </span>
                <span>纯纯离线 · 无跨域上传</span>
              </div>
            </div>

            {/* Right Column: User Guide & Tips */}
            <div className="md:col-span-7 p-4 md:p-6 bg-[var(--color-paper)] space-y-4">
              
              {/* Guide 1: WYSIWYG Editing */}
              <div className="pixel-card p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-gold)] font-bold text-sm pb-1.5 border-b border-[var(--color-line)]">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                  <span>高效所见即所得排版指南</span>
                </div>
                <ul className="text-xs text-[var(--color-ink)] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[var(--color-gold)] font-bold">1.</span>
                    <span><strong>原地直观打字</strong>：报纸上的大标、副标、文章正文与广告均可<strong>直接点击原地光标键入</strong>，按 <kbd className="px-1 py-0.5 bg-[var(--color-paper-light)] border border-[var(--color-line)] text-[10px] font-mono">Enter</kbd> 智能分段并自动保持焦点流转。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[var(--color-gold)] font-bold">2.</span>
                    <span><strong>划选浮动格式</strong>：用鼠标划选文本，即刻呼出快捷工具条，支持加粗、斜体、下划线及复古五色墨彩高亮。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[var(--color-gold)] font-bold">3.</span>
                    <span><strong>灵活素材拖拽</strong>：左侧【📦 素材库】提供标题、正文、版画、分割线及广告等多种古典版式，可随意拖入目标分栏，支持画布栏目的即时拆分与合并。</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[var(--color-gold)] font-bold">4.</span>
                    <span><strong>精细排版检查器</strong>：点击区块右上角齿轮 <span className="text-[var(--color-gold)]">⚙</span>，左侧即可展开字号、段落行距、对齐、首字雕花下沉等高级装帧配置。</span>
                  </li>
                </ul>
              </div>

              {/* Guide 2: Vector Printing */}
              <div className="pixel-card p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-gold)] font-bold text-sm pb-1.5 border-b border-[var(--color-line)]">
                  <Printer className="w-4 h-4 text-[var(--color-gold)]" />
                  <span>超高解析度 Vector 矢量印刷指南</span>
                </div>
                <div className="text-xs text-[var(--color-ink)] space-y-2 leading-relaxed">
                  <p className="text-[11px] text-[var(--color-muted)]">
                    编辑器基于纯 CSS Vector 矢量排版引擎开发，支持保存原生矢量文字，具备 300 ~ 1200 DPI 印刷级放大无损的出版品质。
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-[var(--color-muted)]">
                    <li>
                      点击左下角 <strong className="text-[var(--color-ink)]">【打印 / 导出高分辨率PDF】</strong>（或快捷键 <kbd className="px-1 py-0.5 bg-[var(--color-paper-light)] border border-[var(--color-line)] text-[10px] font-mono text-[var(--color-ink)]">Ctrl+P</kbd>）。
                    </li>
                    <li>
                      在目标打印机中选择 <strong className="text-[var(--color-ink)]">【另存为 PDF】</strong> (Save as PDF)。
                    </li>
                    <li>
                      在【更多设置】中，务必勾选 <strong className="text-[var(--color-ink)]">【背景图形】</strong> (Background graphics)，以还原羊皮纸做旧斑驳与茶渍质感。
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
          <div className="pixel-panel-header p-3 flex items-center justify-between shrink-0 text-xs">
            <span className="text-[var(--color-muted)] text-[11px]">
              Tip: 点击左侧边栏顶部的 Logo 图标可随时重新唤出此窗口。
            </span>
            <button
              onClick={onClose}
              className="pixel-btn text-xs px-4 py-1.5 font-bold"
            >
              我知道了
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
