import React from "react";
import { motion } from "motion/react";
import { useNewspaper } from "../context/NewspaperContext";

export default function WelcomeModal() {
  const { switchTheme, showWelcomeModal } = useNewspaper();

  if (!showWelcomeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#140f0d]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-4xl w-full bg-[#1e1713] border-2 border-[#8b4513]/60 rounded-xl p-6 md:p-10 shadow-2xl flex flex-col items-center text-center space-y-8 my-auto"
      >
        <div className="space-y-2">
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-4xl font-bold font-serif text-[#e8dcc4] tracking-widest"
          >
            历史报刊排版模板
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-[#e8dcc4] font-serif italic"
          >
            — 开启您的历史报纸创作之旅 —
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#cbbba0] max-w-xl leading-relaxed font-serif"
        >
          请选择您想要创作的报纸风格。该选择将为您加载对应的初始设计样板。您随时可以在编辑界面顶部的切换按钮或“印刷”设置中进行实时更换，且已写好的文字内容会得到平滑转换。
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl pt-2">
          {/* FANTASY THEME CARD */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.03, translateY: -4 }}
            onClick={() => switchTheme("fantasy", true)}
            className="group cursor-pointer bg-[#e8dcc4] border-2 border-[#8b4513] p-6 rounded-lg text-left shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-80 relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] text-black text-9xl select-none font-serif group-hover:scale-110 transition-transform duration-500">
              ⚔
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#8b4513]/30 pb-2">
                <span className="text-xl font-bold font-serif text-[#2c241e]">⚔ 中世纪奇幻</span>
                <span className="text-[10px] bg-[#8b4513] text-[#f5deb3] px-2 py-0.5 rounded font-serif">星辉帝国要闻报</span>
              </div>
              <p className="text-xs text-[#5c4a3c] font-serif leading-relaxed">
                厚重的羊皮纸纤维质地，神秘的茶渍污斑，传统的哥特及复古宋体字型。两侧配有繁复的骑士徽章与双线花边。
              </p>
              <ul className="text-[11px] text-[#4a3728]/80 font-serif space-y-1 pl-4 list-disc">
                <li>羊皮纸复古背景渲染</li>
                <li>水平花纹分隔线与徽章</li>
                <li>哥特式大标题样式</li>
                <li>中世纪行商草药布告</li>
              </ul>
            </div>
            
            <button className="w-full py-2 bg-[#8b4513] text-[#f5deb3] text-xs font-bold rounded hover:bg-[#70350d] transition duration-200 text-center">
              选择此风格并进入
            </button>
          </motion.div>

          {/* REPUBLICAN THEME CARD */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.03, translateY: -4 }}
            onClick={() => switchTheme("republican", true)}
            className="group cursor-pointer bg-[#f4f3ef] border-2 border-[#1a1a1a] p-6 rounded-lg text-left shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-80 relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] text-black text-9xl select-none font-serif group-hover:scale-110 transition-transform duration-500">
              ■
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/30 pb-2">
                <span className="text-xl font-bold font-serif text-[#1a1a1a]">■ 民国报刊</span>
                <span className="text-[10px] bg-[#1a1a1a] text-[#f4f3ef] px-2 py-0.5 rounded font-serif">时事新报</span>
              </div>
              <p className="text-xs text-[#444444] font-serif leading-relaxed">
                苍劲朴素的白报纸油墨质感，极具历史感的双栏「文武线」边框，支持独特的竖排文本排版，重现民国时期的纸上新闻风云。
              </p>
              <ul className="text-[11px] text-[#444444]/80 font-serif space-y-1 pl-4 list-disc">
                <li>油墨污斑与白报纸底色</li>
                <li>文武线双重外框与竖向分隔</li>
                <li>民国风竖排标题与商号布告</li>
                <li>支持左右移栏和排版对齐</li>
              </ul>
            </div>

            <button className="w-full py-2 bg-[#1a1a1a] text-[#f4f3ef] text-xs font-bold rounded hover:bg-black transition duration-200 text-center">
              选择此风格并进入
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="text-[10px] text-[#cbbba0] font-serif"
        >
          提示：本工具完全运行在您的浏览器本地，不收集任何个人数据。
        </motion.div>
      </motion.div>
    </div>
  );
}
