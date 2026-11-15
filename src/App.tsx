import React, { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useNewspaper } from "./context/NewspaperContext";
import Sidebar from "./components/Sidebar";
import NewspaperPreview from "./components/NewspaperPreview";
import SaveManager from "./components/SaveManager";
import MobileNav from "./components/MobileNav";
import WelcomeModal from "./components/WelcomeModal";
import { Block, BlockType, ArticleBlock, HeadlineBlock, ImageBlock } from "./types";

export default function App() {
  const {
    newspaperData,
    setNewspaperData,
    addBlockToColumn,
    theme,
    activeAddBlockColId,
    setActiveAddBlockColId,
    activeSidebarColId,
    setActiveSidebarColId,
    showPrintHelp,
    setShowPrintHelp,
    showSaveManager,
    setShowSaveManager,
  } = useNewspaper();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  // Active block if dragging an existing canvas block
  const activeBlock: Block | null = useMemo(() => {
    if (!activeId || activeId.startsWith("palette::")) return null;
    for (const row of newspaperData.rows) {
      for (const col of row.columns) {
        const b = col.blocks.find((blk) => blk.id === activeId);
        if (b) return b;
      }
    }
    return null;
  }, [activeId, newspaperData]);

  // Find which column contains a block id or column id
  const findContainer = (id: string | number): string | null => {
    const strId = String(id);
    for (const row of newspaperData.rows) {
      for (const col of row.columns) {
        if (col.id === strId) return col.id;
        if (col.blocks.find((b) => b.id === strId)) return col.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: any) => {
    setActiveId(String(event.active.id));
    setActiveData(event.active.data.current || null);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    // Palette items do not mutate layout during dragOver; handled in dragEnd
    if (String(active.id).startsWith("palette::")) {
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move existing block across columns
    setNewspaperData((prev) => {
      const newRows = [...prev.rows];
      let activeItem: any;

      newRows.forEach((row) => {
        row.columns.forEach((col) => {
          if (col.id === activeContainer) {
            const idx = col.blocks.findIndex((b) => b.id === active.id);
            if (idx !== -1) {
              activeItem = { ...col.blocks[idx] };
              col.blocks.splice(idx, 1);
            }
          }
        });
      });

      if (!activeItem) return prev;

      newRows.forEach((row) => {
        row.columns.forEach((col) => {
          if (col.id === overContainer) {
            const overIndex = col.blocks.findIndex((b) => b.id === over.id);
            const insertIndex = overIndex >= 0 ? overIndex : col.blocks.length;
            col.blocks.splice(insertIndex, 0, activeItem);
          }
        });
      });

      return { ...prev, rows: newRows };
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    const curActiveId = String(active.id);

    setActiveId(null);
    setActiveData(null);

    if (!over) return;

    // CASE 1: Dragged a template from the Palette onto a column
    if (curActiveId.startsWith("palette::") || activeData?.isPaletteItem) {
      const blockType: BlockType =
        activeData?.blockType || (curActiveId.replace("palette::", "") as BlockType);

      // Determine target column and optionally insert after a specific block
      let targetColId: string | null = null;
      let afterBlockId: string | undefined = undefined;

      const overIdStr = String(over.id);
      const containerOfOver = findContainer(overIdStr);

      if (containerOfOver) {
        targetColId = containerOfOver;
        if (overIdStr !== containerOfOver) {
          afterBlockId = overIdStr;
        }
      } else {
        // Direct column check
        for (const row of newspaperData.rows) {
          for (const col of row.columns) {
            if (col.id === overIdStr) {
              targetColId = col.id;
              break;
            }
          }
          if (targetColId) break;
        }
      }

      if (targetColId) {
        addBlockToColumn(targetColId, blockType, afterBlockId);
      }
      return;
    }

    // CASE 2: Dragged an existing block inside a column
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    if (active.id !== over.id) {
      setNewspaperData((prev) => {
        const newRows = [...prev.rows];
        newRows.forEach((row) => {
          row.columns.forEach((col) => {
            if (col.id === activeContainer) {
              const oldIndex = col.blocks.findIndex((b) => b.id === active.id);
              const newIndex = col.blocks.findIndex((b) => b.id === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                const [movedItem] = col.blocks.splice(oldIndex, 1);
                col.blocks.splice(newIndex, 0, movedItem);
              }
            }
          });
        });
        return { ...prev, rows: newRows };
      });
    }
  };

  // Render ghost card in DragOverlay
  const renderOverlayContent = () => {
    if (!activeId) return null;

    if (activeId.startsWith("palette::")) {
      const type = (activeData?.blockType || activeId.replace("palette::", "")) as BlockType;
      const titles: Record<BlockType, { title: string; desc: string }> = {
        headline: { title: "✦ 大字标题", desc: "主头条/副标题" },
        article: { title: "✍ 文章正文", desc: "首字下沉多段落文章" },
        image: { title: "🖼 版画插图", desc: "木刻版画或现代相片" },
        divider: { title: "◇ 装饰隔线", desc: "双线或徽记分隔条" },
        ad: { title: "🪙 告示商号", desc: "广告商号与边框公告" },
      };
      const info = titles[type] || { title: "模块", desc: "放置在栏目中" };

      return (
        <div className="p-3 bg-[#f5deb3] border-2 border-[#8b4513] shadow-2xl rounded-sm opacity-95 rotate-2 max-w-[240px] pointer-events-none text-xs font-serif text-[#2b221a]">
          <div className="font-bold text-[#8b4513] mb-0.5">{info.title}</div>
          <div className="text-[10px] text-stone-700">{info.desc}</div>
        </div>
      );
    }

    if (activeBlock) {
      return (
        <div className="p-3 bg-[#e8dcc4] border-2 border-[#8b4513] shadow-2xl rounded opacity-95 rotate-1 max-w-[280px] pointer-events-none text-xs font-serif text-[#2c241e]">
          <span className="font-bold text-[#8b4513] block mb-0.5">
            {activeBlock.type === "article"
              ? "✍ 文章区块"
              : activeBlock.type === "headline"
              ? "✦ 大标题区块"
              : activeBlock.type === "image"
              ? "🖼 版画插图"
              : activeBlock.type === "divider"
              ? "◇ 分隔线"
              : "🪙 告示商号"}
          </span>
          <p className="line-clamp-2 text-stone-700 text-[11px] leading-tight">
            {activeBlock.type === "article"
              ? (activeBlock as ArticleBlock).title
              : activeBlock.type === "headline"
              ? (activeBlock as HeadlineBlock).text
              : activeBlock.type === "image"
              ? (activeBlock as ImageBlock).caption || "插图"
              : "区块移动中..."}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#2c241e] text-[#4a3728] flex flex-col md:flex-row font-serif overflow-x-hidden select-none selection:bg-[#8b4513] selection:text-[#f5deb3]">
        <WelcomeModal />

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
                  本编辑器采用先进的 <strong>Vector PDF 排版系统</strong>
                  ，支持完美保存矢量字体，保证 300 ~ 1200 DPI 印刷级无损放大！
                </p>

                <ol className="list-decimal pl-5 text-xs text-stone-300 space-y-2 leading-relaxed">
                  <li>
                    点击左下角的{" "}
                    <strong>【打印 / 导出高分辨率PDF】</strong>{" "}
                    按钮，这会拉起您操作系统的打印窗口。
                  </li>
                  <li>
                    在目标打印机中选择 <strong>【另存为 PDF】</strong> (Save as PDF)。
                  </li>
                  <li>
                    在 <strong>【更多设置】</strong> 中，务必勾选{" "}
                    <strong>【背景图形】</strong> (Background graphics)
                    ，以便完美印出复古黄斑纸质底色！
                  </li>
                  <li>
                    纸张大小推荐选择 <strong>A4</strong>，页边距选择{" "}
                    <strong>无</strong> (None) 或 <strong>默认</strong>，缩放比例选择{" "}
                    <strong>100%</strong>。
                  </li>
                  <li>
                    若需实物美术黄纸印刷，您可以在左侧“印刷”标签中关闭“背景质地与茶渍”，直接在实物泛黄羊皮纸上印制！
                  </li>
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

        {/* Global Drag Overlay */}
        <DragOverlay dropAnimation={null}>{renderOverlayContent()}</DragOverlay>
      </div>
    </DndContext>
  );
}
