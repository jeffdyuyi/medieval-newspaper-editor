import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  NewspaperData, Row, Column, Block, BlockType, 
  ColumnSplit, NewspaperHeader, NewspaperTheme,
  ArticleBlock, HeadlineBlock
} from "../types";
import { INITIAL_NEWSPAPER_DATA, REPUBLICAN_NEWSPAPER_DATA } from "../defaultData";


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

interface NewspaperContextType {
  newspaperData: NewspaperData;
  setNewspaperData: React.Dispatch<React.SetStateAction<NewspaperData>>;
  activeTab: "header" | "layout" | "blocks" | "settings";
  setActiveTab: React.Dispatch<React.SetStateAction<"header" | "layout" | "blocks" | "settings">>;
  blockTabMode: "edit" | "create";
  setBlockTabMode: React.Dispatch<React.SetStateAction<"edit" | "create">>;
  selectedBlockId: string | null;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedRowId: string | null;
  setSelectedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedColumnId: string | null;
  setSelectedColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  globalHeadingScale: number;
  setGlobalHeadingScale: React.Dispatch<React.SetStateAction<number>>;
  globalBodyScale: number;
  setGlobalBodyScale: React.Dispatch<React.SetStateAction<number>>;
  columnGap: number;
  setColumnGap: React.Dispatch<React.SetStateAction<number>>;
  enableParchmentTexture: boolean;
  setEnableParchmentTexture: React.Dispatch<React.SetStateAction<boolean>>;
  enableCoffeeStains: boolean;
  setEnableCoffeeStains: React.Dispatch<React.SetStateAction<boolean>>;
  showPrintHelp: boolean;
  setShowPrintHelp: React.Dispatch<React.SetStateAction<boolean>>;
  showSaveManager: boolean;
  setShowSaveManager: React.Dispatch<React.SetStateAction<boolean>>;
  isExporting: boolean;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  activeAddBlockColId: string | null;
  setActiveAddBlockColId: React.Dispatch<React.SetStateAction<string | null>>;
  activeSidebarColId: string | null;
  setActiveSidebarColId: React.Dispatch<React.SetStateAction<string | null>>;
  showWelcomeModal: boolean;
  setShowWelcomeModal: React.Dispatch<React.SetStateAction<boolean>>;
  theme: NewspaperTheme;
  switchTheme: (newTheme: NewspaperTheme, skipConfirm?: boolean) => void;
  updateRowHeight: (rowId: string, height: number) => void;
  
  findSelectedBlock: () => Block | null;
  selectBlockAndContext: (blockId: string, colId: string, rowId: string) => void;
  updateBlock: (blockId: string, updater: (block: Block) => Block) => void;
  updateHeader: (updater: (header: NewspaperHeader) => NewspaperHeader) => void;
  updateRowSplit: (rowId: string, newSplit: ColumnSplit) => void;
  addNewRow: () => void;
  deleteRow: (rowId: string) => void;
  moveRow: (rowId: string, direction: "up" | "down") => void;
  addBlockToColumn: (colId: string, type: BlockType, afterBlockId?: string) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, colId: string, direction: "up" | "down") => void;
  moveBlockHorizontally: (blockId: string, fromColId: string, rowId: string, direction: "left" | "right") => void;
  handleResetData: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const NewspaperContext = createContext<NewspaperContextType | undefined>(undefined);

export const NewspaperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<{ past: NewspaperData[], present: NewspaperData, future: NewspaperData[] }>(() => {
    const saved = localStorage.getItem("medieval_newspaper_data");
    let initial = sanitizeNewspaperData(INITIAL_NEWSPAPER_DATA);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initial = sanitizeNewspaperData(parsed);
      } catch (e) {
        // ignore
      }
    }
    return { past: [], present: initial, future: [] };
  });

  const newspaperData = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setNewspaperData = React.useCallback((action: React.SetStateAction<NewspaperData>) => {
    setHistory(current => {
      const nextState = typeof action === "function" ? (action as any)(current.present) : action;
      if (nextState === current.present) return current;
      const newPast = [...current.past, current.present].slice(-30);
      return {
        past: newPast,
        present: nextState,
        future: []
      };
    });
  }, []);

  const undo = React.useCallback(() => {
    setHistory(current => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future]
      };
    });
  }, []);

  const redo = React.useCallback(() => {
    setHistory(current => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      const newFuture = current.future.slice(1);
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    const saved = localStorage.getItem("medieval_newspaper_data");
    const chosen = localStorage.getItem("has_chosen_theme");
    return !saved && !chosen;
  });

  const [activeTab, setActiveTab] = useState<"header" | "layout" | "blocks" | "settings">("blocks");
  const [blockTabMode, setBlockTabMode] = useState<"edit" | "create">("edit");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() => {
    const saved = localStorage.getItem("medieval_newspaper_data");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.theme === "republican" ? "rep_block_art_1" : "block_art_1";
    } catch (e) {
      return "block_art_1";
    }
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(() => {
    const saved = localStorage.getItem("medieval_newspaper_data");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.theme === "republican" ? "rep_row_1" : "row_1";
    } catch (e) {
      return "row_1";
    }
  });
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(() => {
    const saved = localStorage.getItem("medieval_newspaper_data");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.theme === "republican" ? "rep_col_1_1" : "col_1_2";
    } catch (e) {
      return "col_1_2";
    }
  });

  const [globalHeadingScale, setGlobalHeadingScale] = useState<number>(100);
  const [globalBodyScale, setGlobalBodyScale] = useState<number>(100);
  const [columnGap, setColumnGap] = useState<number>(6);
  const [enableParchmentTexture, setEnableParchmentTexture] = useState<boolean>(true);
  const [enableCoffeeStains, setEnableCoffeeStains] = useState<boolean>(true);

  const [showPrintHelp, setShowPrintHelp] = useState<boolean>(false);
  const [showSaveManager, setShowSaveManager] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [activeAddBlockColId, setActiveAddBlockColId] = useState<string | null>(null);
  const [activeSidebarColId, setActiveSidebarColId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("medieval_newspaper_data", JSON.stringify(newspaperData));
  }, [newspaperData]);

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

  const selectBlockAndContext = (blockId: string, colId: string, rowId: string) => {
    setSelectedBlockId(blockId);
    setSelectedColumnId(colId);
    setSelectedRowId(rowId);
    setBlockTabMode("edit");
    setActiveTab("blocks");
  };

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

  const updateHeader = (updater: (header: NewspaperHeader) => NewspaperHeader) => {
    setNewspaperData(prev => ({
      ...prev,
      header: updater(prev.header)
    }));
  };

  const updateRowSplit = (rowId: string, newSplit: ColumnSplit) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id !== rowId) return row;
        let colCount = 1;
        if (newSplit === "1-1" || newSplit === "1-2" || newSplit === "2-1") colCount = 2;
        if (newSplit === "1-1-1") colCount = 3;

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

        if (row.columns.length > colCount) {
          const targetCol = newColumns[newColumns.length - 1];
          for (let i = colCount; i < row.columns.length; i++) {
            targetCol.blocks = [...targetCol.blocks, ...row.columns[i].blocks];
          }
        }

        return { ...row, split: newSplit, columns: newColumns };
      })
    }));
  };

  const addNewRow = () => {
    const newRowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRow: Row = {
      id: newRowId,
      split: "1",
      columns: [{ id: `col_${newRowId}_0`, blocks: [] }]
    };
    setNewspaperData(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
    setSelectedRowId(newRowId);
    setSelectedColumnId(`col_${newRowId}_0`);
    setSelectedBlockId(null);
  };

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

  const addBlockToColumn = (colId: string, type: BlockType, afterBlockId?: string) => {
    const newBlockId = `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let newBlock: Block;

    if (type === "headline") {
      newBlock = { id: newBlockId, type: "headline", text: "新栏目大标题", subtitle: "在此输入吸引人眼球的副标题", font: "font-xiaowei", size: "normal" };
    } else if (type === "article") {
      newBlock = {
        id: newBlockId, type: "article", title: "新记事文章标题", subtitle: "皇家学者关于此事件的简短叙述",
        author: "帝国记录官", paragraphs: ["在遥远的行省，风雨交加的夜里，一件奇妙的逸闻悄然发生。据当地守卫描述，那是个不可思议的开端...", "学者们在羊皮纸上写下了这段记录，供王都的臣民们阅览。"],
        dropCap: true, fontSize: "sm", font: "font-serif", align: "justify"
      };
    } else if (type === "image") {
      newBlock = { id: newBlockId, type: "image", src: "", filter: "woodblock", caption: "古老手抄本插图摹印", isClipart: true, clipartId: "castle", scale: 75 };
    } else if (type === "divider") {
      newBlock = { id: newBlockId, type: "divider", style: "ornament", ornamentType: "fleur-de-lis" };
    } else {
      newBlock = { id: newBlockId, type: "ad", title: "大炼金商行告示", content: "出售上等秘银盾牌、精制魔法卷轴。保证正品，拒绝赝品！", price: "售价：面议", merchant: "北街红狮子铁匠铺", borderStyle: "dashed" };
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
          return { ...col, blocks: newBlocks };
        })
      }))
    }));

    setSelectedBlockId(newBlockId);
    setSelectedColumnId(colId);
    setBlockTabMode("edit");
    setActiveTab("blocks");
  };

  const deleteBlock = (blockId: string) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        columns: row.columns.map(col => ({ ...col, blocks: col.blocks.filter(b => b.id !== blockId) }))
      }))
    }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

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

  const theme: NewspaperTheme = (newspaperData.theme as NewspaperTheme) || "fantasy";

  const convertBlocksForTheme = (data: NewspaperData, targetTheme: NewspaperTheme): NewspaperData => {
    const convertedRows = data.rows.map(row => ({
      ...row,
      height: targetTheme === "republican" ? (row.height || 480) : undefined,
      columns: row.columns.map(col => ({
        ...col,
        blocks: col.blocks.map(block => {
          if (block.type === "article") {
            const b = block as ArticleBlock;
            if (targetTheme === "republican") {
              return { ...b, font: (b.font === "font-gothic" || b.font === "font-cinzel") ? "font-serif" : b.font, titleMarker: b.titleMarker || "none" };
            }
            return { ...b };
          }
          if (block.type === "headline") {
            const b = block as HeadlineBlock;
            if (targetTheme === "republican") {
              return { ...b, font: (b.font === "font-gothic" || b.font === "font-cinzel") ? "font-xiaowei" : b.font, titleMarker: b.titleMarker || "none" };
            }
            return { ...b };
          }
          if (block.type === "divider") {
            const d = block as any;
            if (targetTheme === "republican" && d.style === "ornament") return { ...d, style: "wenwu" };
            if (targetTheme === "fantasy" && (d.style === "wenwu" || d.style === "yunwen")) return { ...d, style: "double" };
            return block;
          }
          if (block.type === "ad") {
            const a = block as any;
            if (targetTheme === "republican" && a.borderStyle === "ornate") return { ...a, borderStyle: "wenwu" };
            if (targetTheme === "fantasy" && (a.borderStyle === "wenwu" || a.borderStyle === "yunwen")) return { ...a, borderStyle: "ornate" };
            return block;
          }
          return block;
        })
      }))
    }));
    return {
      ...data,
      theme: targetTheme,
      header: {
        ...data.header,
        headerStyle: targetTheme === "republican" ? "classic" : data.header.headerStyle,
        republicanHeaderStyle: targetTheme === "republican" ? (data.header.republicanHeaderStyle || "vertical-box") : undefined,
      },
      rows: convertedRows
    };
  };

  const switchTheme = (newTheme: NewspaperTheme, skipConfirm = false) => {
    if (theme === newTheme && localStorage.getItem("has_chosen_theme")) return;
    if (!skipConfirm) {
      const newThemeName = newTheme === "fantasy" ? "中世纪奇幻" : "民国报刊";
      const currentThemeName = theme === "fantasy" ? "中世纪奇幻" : "民国报刊";
      const choice = confirm(
        `即将切换至「${newThemeName}」主题。\n\n当前文字内容将被保留并转换格式，不兼容的样式将重置为新主题默认值。\n\n如需保留当前「${currentThemeName}」存档，请先取消，前往存档管理保存后再切换。\n\n确认切换到「${newThemeName}」吗？`
      );
      if (!choice) return;
    }
    
    // Set localStorage flag so welcome modal is never shown again
    localStorage.setItem("has_chosen_theme", "true");
    setShowWelcomeModal(false);

    // If there is no saved layout, load the respective theme's default data template
    const saved = localStorage.getItem("medieval_newspaper_data");
    if (!saved) {
      const defaultData = newTheme === "republican" ? REPUBLICAN_NEWSPAPER_DATA : INITIAL_NEWSPAPER_DATA;
      setNewspaperData(defaultData);
      setSelectedBlockId(newTheme === "republican" ? "rep_block_art_1" : "block_art_1");
      setSelectedRowId(newTheme === "republican" ? "rep_row_1" : "row_1");
      setSelectedColumnId(newTheme === "republican" ? "rep_col_1_1" : "col_1_2");
    } else {
      const converted = convertBlocksForTheme(newspaperData, newTheme);
      setNewspaperData(converted);
      setSelectedBlockId(null);
      setSelectedRowId(null);
      setSelectedColumnId(null);
    }
  };

  const updateRowHeight = (rowId: string, height: number) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.id === rowId ? { ...row, height } : row)
    }));
  };

  const handleResetData = () => {
    const isRepublican = theme === "republican";
    const themeName = isRepublican ? "「时事新报」民国样板" : "「星辉帝国要闻报」";
    const defaultData = isRepublican ? REPUBLICAN_NEWSPAPER_DATA : INITIAL_NEWSPAPER_DATA;
    const defaultBlockId = isRepublican ? "rep_block_art_1" : "block_art_1";
    if (confirm(`您确定要重置所有编辑内容，恢复到预设的${themeName}吗？`)) {
      setNewspaperData(defaultData);
      setSelectedBlockId(defaultBlockId);
    }
  };

  const contextValue: NewspaperContextType = {
    newspaperData, setNewspaperData,
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
    showSaveManager, setShowSaveManager,
    isExporting, setIsExporting,
    activeAddBlockColId, setActiveAddBlockColId,
    activeSidebarColId, setActiveSidebarColId,
    showWelcomeModal, setShowWelcomeModal,
    theme, switchTheme, updateRowHeight,
    findSelectedBlock, selectBlockAndContext, updateBlock, updateHeader,
    updateRowSplit, addNewRow, deleteRow, moveRow,
    addBlockToColumn, deleteBlock, moveBlock, moveBlockHorizontally, handleResetData,
    undo, redo, canUndo, canRedo
  };

  return (
    <NewspaperContext.Provider value={contextValue}>
      {children}
    </NewspaperContext.Provider>
  );
};

export const useNewspaper = () => {
  const context = useContext(NewspaperContext);
  if (context === undefined) {
    throw new Error("useNewspaper must be used within a NewspaperProvider");
  }
  return context;
};
