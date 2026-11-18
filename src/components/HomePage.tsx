import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Printer, ExternalLink, ArrowRight, BookOpen, 
  CheckCircle2, Heart, Users, Sun, Moon
} from "lucide-react";
import logoUrl from "../assets/logo";
import { NewspaperTheme } from "../types";
import { useNewspaper } from "../context/NewspaperContext";

interface HomePageProps {
  onSelectTheme: (theme: NewspaperTheme) => void;
  onOpenAbout: () => void;
}

export default function HomePage({ onSelectTheme, onOpenAbout }: HomePageProps) {
  const { uiTheme, toggleUiTheme } = useNewspaper();

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-pixel flex flex-col justify-between selection:bg-[var(--color-accent)] selection:text-[var(--color-text-selected)] relative overflow-x-hidden transition-colors duration-200">
      
      {/* Background Ambient Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-gold)]/30 via-[var(--color-paper)] to-[var(--color-paper)]" />

      {/* Top Navbar */}
      <header className="relative z-10 px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper-shade)]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--color-paper-light)] border border-[var(--color-line)] p-1 flex items-center justify-center shadow-md shrink-0">
            <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-wider text-[var(--color-gold)] leading-tight">
              不咕鸟小报编辑器
            </h1>
            <p className="text-[10px] text-[var(--color-muted)] leading-none mt-0.5">
              历史报刊排版工坊
            </p>
          </div>
        </div>

        {/* Top Actions: Theme Switcher & About */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleUiTheme}
            type="button"
            className="pixel-btn text-xs px-3 py-1.5"
            title={`当前工具栏视觉风格：${uiTheme === "fantasy" ? "深色奇幻点阵 (Fantasy)" : "明亮羊皮纸冒险 (Adventure)"}。点击切换`}
          >
            {uiTheme === "fantasy" ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>深色奇幻</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>明亮冒险</span>
              </>
            )}
          </button>

          {/* Author & Community Info Mini Button */}
          <button
            onClick={onOpenAbout}
            type="button"
            className="pixel-btn text-xs px-3 py-1.5"
            title="点击查看作者信息、俱乐部群号与支持通道"
          >
            <Users className="w-3.5 h-3.5 text-[var(--color-gold)]" />
            <span>关于作者 / 交流社群</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-10 flex-1 flex flex-col items-center text-center justify-center space-y-8 w-full">
        
        {/* Hero Title */}
        <div className="space-y-2.5 max-w-xl">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="w-16 h-16 mx-auto bg-[var(--color-paper-light)] border-2 border-[var(--color-line)] p-2 shadow-lg flex items-center justify-center mb-1.5"
          >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow" />
          </motion.div>

          <motion.h2 
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold tracking-widest text-[var(--color-gold)]"
          >
            开启历史报刊创作
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-[var(--color-muted)] tracking-wide"
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
            className="group cursor-pointer pixel-panel p-5 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[var(--color-paper-shade)] border border-[var(--color-line)] text-xs font-bold text-[var(--color-gold)]">
                  ⚔️ 中世纪奇幻
                </span>
                <span className="text-xs text-[var(--color-muted)] group-hover:text-[var(--color-gold)] flex items-center gap-1">
                  进入排版 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--color-gold)] group-hover:brightness-110 transition-colors">
                  王国小报 · 报纸样板
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  羊皮纸与古籍手抄本风格
                </p>
              </div>

              <ul className="text-xs text-[var(--color-ink)] space-y-1.5 leading-relaxed pt-2 border-t border-[var(--color-line)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>羊皮纸纤维肌理与茶渍做旧</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>自由分栏与首字雕花下沉</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>古典木刻插图与装饰隔线</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--color-line)] flex justify-between items-center text-xs text-[var(--color-gold)] font-bold">
              <span className="text-[var(--color-muted)] font-normal">独立草稿沙箱</span>
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
            className="group cursor-pointer pixel-panel p-5 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[var(--color-paper-shade)] border border-[var(--color-line)] text-xs font-bold text-[var(--color-gold)]">
                  📰 民国报刊
                </span>
                <span className="text-xs text-[var(--color-muted)] group-hover:text-[var(--color-gold)] flex items-center gap-1">
                  进入排版 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-gold)] transition-colors">
                  時事新報 · 民国样版
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  近代铅印与经典纵向竖排风格
                </p>
              </div>

              <ul className="text-xs text-[var(--color-ink)] space-y-1.5 leading-relaxed pt-2 border-t border-[var(--color-line)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>经典直行竖排与文武边线</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>报栏分栏、告白与新闻照片</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                  <span>粗糙新闻纸与油墨晕渍仿真</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--color-line)] flex justify-between items-center text-xs text-[var(--color-ink)] font-bold">
              <span className="text-[var(--color-muted)] font-normal">独立草稿沙箱</span>
              <span className="underline group-hover:text-[var(--color-gold)]">开启排版 →</span>
            </div>
          </motion.div>

        </div>

        {/* Minimalist Feature Indicator Strip */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--color-muted)] pt-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold)]" /> 所见即所得编辑
          </span>
          <span className="opacity-40 hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-[var(--color-gold)]" /> 矢量印刷级 PDF 导出
          </span>
          <span className="opacity-40 hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[var(--color-gold)]" /> 跨环境 JSON 智能互转
          </span>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3.5 px-4 text-center border-t border-[var(--color-line)] bg-[var(--color-paper-shade)]/90 text-[11px] text-[var(--color-muted)] flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto w-full">
        <span>© 不咕鸟（哈基米德）· 成都秘密基地TRPG俱乐部</span>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <button onClick={onOpenAbout} className="hover:text-[var(--color-gold)] cursor-pointer">
            作者与社群
          </button>
          <a href="https://nogubird.top" target="_blank" rel="noreferrer" className="hover:text-[var(--color-gold)] flex items-center gap-1">
            nogubird.top <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noreferrer" className="hover:text-red-400 flex items-center gap-1">
            爱发电 <Heart className="w-3 h-3 text-red-400 fill-red-400/40" />
          </a>
        </div>
      </footer>

    </div>
  );
}
