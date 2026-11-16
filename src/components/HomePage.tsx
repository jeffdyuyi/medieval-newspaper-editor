import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Printer, ExternalLink, ArrowRight, BookOpen, 
  CheckCircle2, Heart, Users
} from "lucide-react";
import logoUrl from "../assets/logo";
import { NewspaperTheme } from "../types";

interface HomePageProps {
  onSelectTheme: (theme: NewspaperTheme) => void;
  onOpenAbout: () => void;
}

export default function HomePage({ onSelectTheme, onOpenAbout }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#1c1612] text-[#e8dcc4] font-serif flex flex-col justify-between selection:bg-[#8b4513] selection:text-[#f5deb3] relative overflow-x-hidden">
      
      {/* Background Texture & Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8b4513]/40 via-[#1c1612]/80 to-[#120d0a]" />

      {/* Top Navbar */}
      <header className="relative z-10 px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-[#8b4513]/40 bg-[#16110e]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2c221a] border border-[#8b4513] p-1 flex items-center justify-center shadow-md">
            <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-wider text-[#f5deb3] leading-tight">
              不咕鸟小报编辑器
            </h1>
            <p className="text-[10px] text-[#e0a96d]/80 leading-none">
              历史报刊排版工坊
            </p>
          </div>
        </div>

        {/* Author & Community Info Mini Button */}
        <button
          onClick={onOpenAbout}
          type="button"
          className="px-3 py-1.5 rounded-full border border-[#8b4513] hover:border-[#e0a96d] bg-[#2a2019] hover:bg-[#382b22] text-[#f5deb3] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md group"
          title="点击查看作者信息、俱乐部群号与支持通道"
        >
          <Users className="w-3.5 h-3.5 text-[#e0a96d] group-hover:scale-110 transition-transform" />
          <span>关于作者 / 交流社群</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-10 flex-1 flex flex-col items-center text-center justify-center space-y-8 w-full">
        
        {/* Hero Title */}
        <div className="space-y-2.5 max-w-xl">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-[#2e231b] to-[#1a1410] border-2 border-[#8b4513] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center mb-1.5"
          >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow" />
          </motion.div>

          <motion.h2 
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold tracking-widest text-[#f5deb3]"
          >
            开启历史报刊创作
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-[#c5b59f] tracking-wide"
          >
            独立双环境排版 · 实时自动保存 · 印刷级矢量输出
          </motion.p>
        </div>

        {/* Dual Editor Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full text-left">
          
          {/* Card 1: Fantasy Theme */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.015, translateY: -3 }}
            onClick={() => onSelectTheme("fantasy")}
            className="group cursor-pointer bg-[#241c16] hover:bg-[#2b211a] border-2 border-[#8b4513]/70 hover:border-[#e0a96d] rounded-xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#8b4513]/30 border border-[#8b4513]/60 text-xs font-bold text-[#e0a96d]">
                  ⚔️ 中世纪奇幻
                </span>
                <span className="text-xs text-stone-400 group-hover:text-[#f5deb3] flex items-center gap-1 font-sans">
                  进入排版 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f5deb3] group-hover:text-amber-200 transition-colors">
                  星辉帝国要闻报
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  羊皮纸与古籍手抄本风格
                </p>
              </div>

              <ul className="text-xs text-[#dfd0bd] space-y-1.5 leading-relaxed pt-2 border-t border-[#8b4513]/30">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>羊皮纸纤维肌理与茶渍做旧</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>自由分栏与首字雕花下沉</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>古典木刻插图与装饰隔线</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-[#8b4513]/30 flex justify-between items-center text-xs text-[#e0a96d] font-bold">
              <span className="text-stone-400 font-normal">独立草稿沙箱</span>
              <span className="underline">开启排版 →</span>
            </div>
          </motion.div>

          {/* Card 2: Republican Theme */}
          <motion.div
            initial={{ x: 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.015, translateY: -3 }}
            onClick={() => onSelectTheme("republican")}
            className="group cursor-pointer bg-[#1e1c1a] hover:bg-[#252220] border-2 border-stone-600 hover:border-stone-400 rounded-xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-600 text-xs font-bold text-stone-300">
                  📰 民国报刊
                </span>
                <span className="text-xs text-stone-400 group-hover:text-stone-200 flex items-center gap-1 font-sans">
                  进入排版 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-200 group-hover:text-white transition-colors">
                  時事新報 · 民国样版
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  近代铅印与经典纵向竖排风格
                </p>
              </div>

              <ul className="text-xs text-stone-300 space-y-1.5 leading-relaxed pt-2 border-t border-stone-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>经典直行竖排与文武边线</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>报栏分栏、告白与新闻照片</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>粗糙新闻纸与油墨晕渍仿真</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-700 flex justify-between items-center text-xs text-stone-300 font-bold">
              <span className="text-stone-400 font-normal">独立草稿沙箱</span>
              <span className="underline">开启排版 →</span>
            </div>
          </motion.div>

        </div>

        {/* Minimalist Feature Indicator Strip */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-stone-400 font-sans pt-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#e0a96d]" /> 所见即所得编辑
          </span>
          <span className="text-stone-700 hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-[#e0a96d]" /> 矢量印刷级 PDF 导出
          </span>
          <span className="text-stone-700 hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#e0a96d]" /> 跨环境 JSON 智能互转
          </span>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3.5 px-4 text-center border-t border-[#8b4513]/30 bg-[#140e0b] text-[11px] text-stone-500 flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto w-full">
        <span>© 不咕鸟（哈基米德）· 成都秘密基地TRPG俱乐部</span>
        <div className="flex items-center gap-4 mt-2 md:mt-0 text-stone-400">
          <button onClick={onOpenAbout} className="hover:text-[#e0a96d] cursor-pointer">
            作者与社群
          </button>
          <a href="https://nogubird.top" target="_blank" rel="noreferrer" className="hover:text-[#e0a96d] flex items-center gap-1">
            nogubird.top <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noreferrer" className="hover:text-red-300 flex items-center gap-1">
            爱发电 <Heart className="w-3 h-3 text-red-400 fill-red-400/40" />
          </a>
        </div>
      </footer>

    </div>
  );
}
