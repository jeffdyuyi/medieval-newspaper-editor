import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Printer, ExternalLink, ArrowRight, BookOpen, 
  Compass, Feather, CheckCircle2, Heart, Users
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
      <header className="relative z-10 px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#8b4513]/40 bg-[#16110e]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2c221a] border-2 border-[#8b4513] p-1 flex items-center justify-center shadow-md">
            <img src={logoUrl} alt="不咕鸟" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-wider text-[#f5deb3] leading-tight">
              不咕鸟小报编辑器
            </h1>
            <p className="text-[10px] text-[#e0a96d]/80 leading-none">
              历史报刊排版 · TRPG模组/世界观出版工坊
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
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col items-center text-center space-y-10">
        
        {/* Hero Title */}
        <div className="space-y-3 max-w-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-b from-[#2e231b] to-[#1a1410] border-2 border-[#8b4513] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center mb-2"
          >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow" />
          </motion.div>

          <motion.h2 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-4xl font-bold tracking-widest text-[#f5deb3]"
          >
            开启您的历史报刊创作
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-[#c5b59f] leading-relaxed max-w-xl mx-auto"
          >
            双环境深度隔离设计，专注于各自独立的排版逻辑与装帧美学。所有编辑实时自动保存，支持导出 300~1200 DPI 印刷级无损矢量 PDF 与高清图片。
          </motion.p>
        </div>

        {/* Dual Editor Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
          
          {/* Card 1: Fantasy Theme */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, translateY: -4 }}
            onClick={() => onSelectTheme("fantasy")}
            className="group cursor-pointer bg-[#241c16] hover:bg-[#2b211a] border-2 border-[#8b4513]/70 hover:border-[#e0a96d] rounded-xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-[#8b4513]/30 border border-[#8b4513]/60 text-xs font-bold text-[#e0a96d]">
                  ⚔️ 中世纪奇幻
                </span>
                <span className="text-xs text-stone-400 group-hover:text-[#f5deb3] flex items-center gap-1 font-sans">
                  进入编辑器 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#f5deb3] group-hover:text-amber-200 transition-colors">
                  星辉帝国要闻报
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  剑与魔法 · 古籍手抄本 · 帝国特许印刷局风格
                </p>
              </div>

              <ul className="text-xs text-[#dfd0bd] space-y-1.5 leading-relaxed pt-2 border-t border-[#8b4513]/30">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>复古羊皮纸肌理与真实茶渍黄斑旧化</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>所见即所得自由分栏、首字哥特雕花下沉</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>古典木刻版画、装饰双隔线与商号告示</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#8b4513]/30 flex justify-between items-center text-xs text-[#e0a96d] font-bold">
              <span>独立草稿隔离 · 自动保存</span>
              <span className="underline">开启奇幻创作 →</span>
            </div>
          </motion.div>

          {/* Card 2: Republican Theme */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, translateY: -4 }}
            onClick={() => onSelectTheme("republican")}
            className="group cursor-pointer bg-[#1e1c1a] hover:bg-[#252220] border-2 border-stone-600 hover:border-stone-400 rounded-xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-600 text-xs font-bold text-stone-300">
                  📰 民国报刊
                </span>
                <span className="text-xs text-stone-400 group-hover:text-stone-200 flex items-center gap-1 font-sans">
                  进入编辑器 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-stone-200 group-hover:text-white transition-colors">
                  時事新報 · 民国样版
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  近代风云 · 经典纵向竖排 · 老上海画报铅印风格
                </p>
              </div>

              <ul className="text-xs text-stone-300 space-y-1.5 leading-relaxed pt-2 border-t border-stone-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>经典直行竖排：自右向左自然流动排版</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>文武线框、云纹花边、商业告白及新闻照片</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>新闻纸粗糙颗粒与油墨晕渍仿真</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-700 flex justify-between items-center text-xs text-stone-300 font-bold">
              <span>独立草稿隔离 · 自动保存</span>
              <span className="underline">开启民国创作 →</span>
            </div>
          </motion.div>

        </div>

        {/* Feature Highlights Banner */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
          <div className="p-4 bg-[#231b15]/60 border border-[#8b4513]/30 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 text-[#e0a96d] text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>所见即所得原地打字</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              无需繁复的侧边栏表单，报纸上任意文字直接点击即可光标打字，敲回车分段，划选文本呼出富文本工具条。
            </p>
          </div>

          <div className="p-4 bg-[#231b15]/60 border border-[#8b4513]/30 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 text-[#e0a96d] text-xs font-bold">
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Vector PDF 矢量印刷</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              纯 CSS 矢量出版级引擎，Ctrl+P 另存为 PDF 完美保留矢量字形，300~1200 DPI 放大无损，亦支持导出高清图片。
            </p>
          </div>

          <div className="p-4 bg-[#231b15]/60 border border-[#8b4513]/30 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 text-[#e0a96d] text-xs font-bold">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>多草稿与跨环境 JSON 转换</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              编辑内容全自动实时保存到本地，支持多草稿存档管理；通过导入导出 JSON 文件，可在奇幻与民国之间智能互换。
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 text-center border-t border-[#8b4513]/30 bg-[#140e0b] text-[11px] text-stone-500 flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto w-full">
        <span>© 不咕鸟（哈基米德）· 成都秘密基地TRPG俱乐部 · 纯前端离线单文件出版工具</span>
        <div className="flex items-center gap-4 mt-2 md:mt-0 text-stone-400">
          <button onClick={onOpenAbout} className="hover:text-[#e0a96d] cursor-pointer">
            联系方式与群号
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
