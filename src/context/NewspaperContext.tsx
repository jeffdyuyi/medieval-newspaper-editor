import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  NewspaperData, Row, Column, Block, BlockType, 
  ColumnSplit, NewspaperHeader, NewspaperTheme, PaperTone,
  ArticleBlock, HeadlineBlock, ImageBlock
} from "../types";
import { INITIAL_NEWSPAPER_DATA, REPUBLICAN_NEWSPAPER_DATA } from "../defaultData";


export function sanitizeNewspaperData(data: NewspaperData): NewspaperData {
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

export type SidebarTab = "blocks" | "inspector" | "header" | "layout" | "settings";

interface NewspaperContextType {
  newspaperData: NewspaperData;
  setNewspaperData: React.Dispatch<React.SetStateAction<NewspaperData>>;
  activeTab: SidebarTab;
  setActiveTab: React.Dispatch<React.SetStateAction<SidebarTab>>;
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
  paperTone: PaperTone;
  setPaperTone: React.Dispatch<React.SetStateAction<PaperTone>>;
  geminiApiKey: string;
  setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
  showPrintHelp: boolean;
  setShowPrintHelp: React.Dispatch<React.SetStateAction<boolean>>;
  showSaveManager: boolean;
  setShowSaveManager: React.Dispatch<React.SetStateAction<boolean>>;
  showAboutModal: boolean;
  setShowAboutModal: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  isExporting: boolean;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  activeAddBlockColId: string | null;
  setActiveAddBlockColId: React.Dispatch<React.SetStateAction<string | null>>;
  currentView: "home" | "editor";
  setCurrentView: React.Dispatch<React.SetStateAction<"home" | "editor">>;
  autoSaveStatus: "saved" | "saving";
  openEditor: (theme: NewspaperTheme) => void;
  navigateToHome: () => void;
  convertThemeContent: (data: NewspaperData, targetTheme: NewspaperTheme) => NewspaperData;
  theme: NewspaperTheme;
  updateRowHeight: (rowId: string, height: number) => void;
  updateRowColumnFractions: (rowId: string, fractions: number[]) => void;
  
  findSelectedBlock: () => Block | null;
  selectBlockAndContext: (blockId: string, colId: string, rowId: string) => void;
  updateBlock: (blockId: string, updater: (block: Block) => Block) => void;
  updateHeader: (updater: (header: NewspaperHeader) => NewspaperHeader) => void;
  updateRowSplit: (rowId: string, newSplit: ColumnSplit) => void;
  splitColumn: (rowId: string, colId: string) => void;
  deleteColumn: (rowId: string, colId: string) => void;
  insertRowBelow: (afterRowId?: string) => void;
  addNewRow: () => void;
  deleteRow: (rowId: string) => void;
  moveRow: (rowId: string, direction: "up" | "down") => void;
  addBlockToColumn: (colId: string, type: BlockType, afterBlockId?: string) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, colId: string, direction: "up" | "down") => void;
  moveBlockHorizontally: (blockId: string, fromColId: string, rowId: string, direction: "left" | "right") => void;
  handleResetData: () => void;
  triggerImageUpload: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const NewspaperContext = createContext<NewspaperContextType | undefined>(undefined);

export const loadThemeDraft = (targetTheme: NewspaperTheme): NewspaperData => {
  const specificKey = `newspaper_draft_${targetTheme}`;
  const saved = localStorage.getItem(specificKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return sanitizeNewspaperData(parsed);
    } catch (e) {
      // ignore
    }
  }
  const oldLegacy = localStorage.getItem("medieval_newspaper_data");
  if (oldLegacy) {
    try {
      const parsed = JSON.parse(oldLegacy);
      if (parsed.theme === targetTheme) {
        return sanitizeNewspaperData(parsed);
      }
    } catch (e) {
      // ignore
    }
  }
  return sanitizeNewspaperData(targetTheme === "republican" ? REPUBLICAN_NEWSPAPER_DATA : INITIAL_NEWSPAPER_DATA);
};

export const NewspaperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<"home" | "editor">(() => {
    const savedView = sessionStorage.getItem("current_view");
    return savedView === "editor" ? "editor" : "home";
  });

  const [history, setHistory] = useState<{ past: NewspaperData[], present: NewspaperData, future: NewspaperData[] }>(() => {
    const initialTheme = (localStorage.getItem("active_newspaper_theme") as NewspaperTheme) || "fantasy";
    const initialData = loadThemeDraft(initialTheme);
    return { past: [], present: initialData, future: [] };
  });

  const newspaperData = history.present;
  const theme = newspaperData.theme;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    if (currentView !== "editor") return;
    setAutoSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`newspaper_draft_${newspaperData.theme}`, JSON.stringify(newspaperData));
        setAutoSaveStatus("saved");
      } catch (e) {
        console.error("Auto save failed", e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newspaperData, currentView]);

  const openEditor = (targetTheme: NewspaperTheme) => {
    localStorage.setItem("active_newspaper_theme", targetTheme);
    const draft = loadThemeDraft(targetTheme);
    setHistory({ past: [], present: draft, future: [] });
    setCurrentView("editor");
    sessionStorage.setItem("current_view", "editor");
    setSelectedBlockId(targetTheme === "republican" ? "rep_block_art_1" : "block_art_1");
    setSelectedRowId(targetTheme === "republican" ? "rep_row_1" : "row_1");
    setSelectedColumnId(targetTheme === "republican" ? "rep_col_1_1" : "col_1_2");
  };

  const navigateToHome = () => {
    if (newspaperData) {
      localStorage.setItem(`newspaper_draft_${newspaperData.theme}`, JSON.stringify(newspaperData));
    }
    setCurrentView("home");
    sessionStorage.setItem("current_view", "home");
  };

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

  const [activeTab, setActiveTab] = useState<SidebarTab>("blocks");
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

  const getInitialLayoutSetting = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem("newspaper_layout_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      } catch (e) {}
    }
    return defaultValue;
  };

  const [globalHeadingScale, setGlobalHeadingScale] = useState<number>(() => getInitialLayoutSetting("globalHeadingScale", 100));
  const [globalBodyScale, setGlobalBodyScale] = useState<number>(() => getInitialLayoutSetting("globalBodyScale", 100));
  const [columnGap, setColumnGap] = useState<number>(() => getInitialLayoutSetting("columnGap", 6));
  const [enableParchmentTexture, setEnableParchmentTexture] = useState<boolean>(() => getInitialLayoutSetting("enableParchmentTexture", true));
  const [enableCoffeeStains, setEnableCoffeeStains] = useState<boolean>(() => getInitialLayoutSetting("enableCoffeeStains", true));
  const [paperTone, setPaperTone] = useState<PaperTone>(() => getInitialLayoutSetting("paperTone", "default"));
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("newspaper_gemini_api_key") || "";
  });

  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem("newspaper_gemini_api_key", geminiApiKey);
    } else {
      localStorage.removeItem("newspaper_gemini_api_key");
    }
  }, [geminiApiKey]);

  const [showPrintHelp, setShowPrintHelp] = useState<boolean>(false);
  const [showSaveManager, setShowSaveManager] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem("sidebar_width");
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 280 && val <= 700) return val;
    }
    return 380;
  });

  useEffect(() => {
    localStorage.setItem("sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [activeAddBlockColId, setActiveAddBlockColId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlockId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88);
          updateBlock(selectedBlockId, b => ({
            ...b,
            type: "image",
            src: compressed,
            isClipart: false,
            clipartId: undefined
          }) as ImageBlock);
        }
      };
      img.src = srcUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    try {
      localStorage.setItem("medieval_newspaper_data", JSON.stringify(newspaperData));
    } catch (e) {
      console.warn("localStorage quota exceeded when saving newspaper data", e);
    }
  }, [newspaperData]);

  useEffect(() => {
    const settings = {
      globalHeadingScale,
      globalBodyScale,
      columnGap,
      enableParchmentTexture,
      enableCoffeeStains,
      paperTone
    };
    localStorage.setItem("newspaper_layout_settings", JSON.stringify(settings));
  }, [globalHeadingScale, globalBodyScale, columnGap, enableParchmentTexture, enableCoffeeStains, paperTone]);

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

  const splitColumn = (rowId: string, colId: string) => {
    let createdColId: string | null = null;
    setNewspaperData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row.id !== rowId) return row;
        const colIdx = row.columns.findIndex((c) => c.id === colId);
        if (colIdx === -1) return row;

        if (row.columns.length >= 4) {
          alert("单行最多支持拆分为 4 个栏目，以保证排版美感与文字可读性。");
          return row;
        }

        const newColId = `col_${rowId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        createdColId = newColId;
        const newCol: Column = {
          id: newColId,
          blocks: [],
        };

        const newColumns = [...row.columns];
        newColumns.splice(colIdx + 1, 0, newCol);

        let currentFractions: number[];
        if (row.columns.length === 1) {
          currentFractions = [1, 1];
        } else {
          const prevFrs =
            row.columnFractions && row.columnFractions.length === row.columns.length
              ? [...row.columnFractions]
              : new Array(row.columns.length).fill(1);
          const currentFr = prevFrs[colIdx] || 1;
          const halfFr = Math.max(0.2, Number((currentFr / 2).toFixed(2)));
          prevFrs.splice(colIdx, 1, halfFr, halfFr);
          currentFractions = prevFrs;
        }

        const newSplit: ColumnSplit =
          newColumns.length === 2
            ? "1-1"
            : newColumns.length === 3
            ? "1-1-1"
            : "1-1-1";

        return {
          ...row,
          split: newSplit,
          columns: newColumns,
          columnFractions: currentFractions,
        };
      }),
    }));

    if (createdColId) {
      setSelectedRowId(rowId);
      setSelectedColumnId(createdColId);
      setSelectedBlockId(null);
    }
  };

  const deleteColumn = (rowId: string, colId: string) => {
    const row = newspaperData.rows.find((r) => r.id === rowId);
    if (!row) return;

    if (row.columns.length <= 1) {
      if (confirm("该板块目前只有这一个栏目，删除栏目将直接删除整行板块。确定要删除整行吗？")) {
        deleteRow(rowId);
      }
      return;
    }

    const colIdx = row.columns.findIndex((c) => c.id === colId);
    if (colIdx === -1) return;
    const targetCol = row.columns[colIdx];

    const mergeTargetIdx = colIdx === 0 ? 1 : colIdx - 1;
    if (targetCol.blocks.length > 0) {
      const confirmMerge = confirm(
        `此栏目内包含 ${targetCol.blocks.length} 个内容区块。\n\n删除后，这些内容将被自动合并到相邻栏目中，避免内容丢失。确定继续吗？`
      );
      if (!confirmMerge) return;
    }

    setNewspaperData((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => {
        if (r.id !== rowId) return r;

        const newColumns = r.columns
          .map((col, idx) => {
            if (idx === mergeTargetIdx) {
              return {
                ...col,
                blocks: [...col.blocks, ...targetCol.blocks],
              };
            }
            return col;
          })
          .filter((_, idx) => idx !== colIdx);

        let newFractions: number[] | undefined = undefined;
        if (newColumns.length <= 1) {
          // 合并后仅剩单栏，必须彻底清除 fractions，使单栏回归 100% 满宽自适应
          newFractions = undefined;
        } else if (r.columnFractions && r.columnFractions.length === r.columns.length) {
          // 多栏情况下，将被删除栏目的宽度份额完整交还累加到合并目标栏目中
          const currentFrs = [...r.columnFractions];
          const deletedFr = currentFrs[colIdx] || 1;
          currentFrs[mergeTargetIdx] = Number(((currentFrs[mergeTargetIdx] || 1) + deletedFr).toFixed(2));
          newFractions = currentFrs.filter((_, idx) => idx !== colIdx);
        }

        const newSplit: ColumnSplit =
          newColumns.length === 1
            ? "1"
            : newColumns.length === 2
            ? "1-1"
            : "1-1-1";

        return {
          ...r,
          split: newSplit,
          columns: newColumns,
          columnFractions: newFractions,
        };
      }),
    }));

    if (selectedColumnId === colId) {
      setSelectedColumnId(null);
      setSelectedBlockId(null);
    }
  };

  const insertRowBelow = (afterRowId?: string) => {
    const newRowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRow: Row = {
      id: newRowId,
      split: "1",
      columns: [{ id: `col_${newRowId}_0`, blocks: [] }],
      height: theme === "republican" ? 480 : undefined,
    };

    setNewspaperData((prev) => {
      if (!afterRowId) {
        return { ...prev, rows: [...prev.rows, newRow] };
      }
      const idx = prev.rows.findIndex((r) => r.id === afterRowId);
      if (idx === -1) {
        return { ...prev, rows: [...prev.rows, newRow] };
      }
      const newRows = [...prev.rows];
      newRows.splice(idx + 1, 0, newRow);
      return { ...prev, rows: newRows };
    });

    setSelectedRowId(newRowId);
    setSelectedColumnId(`col_${newRowId}_0`);
    setSelectedBlockId(null);
  };

  const addNewRow = () => {
    insertRowBelow();
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
    const isRep = (newspaperData.theme as NewspaperTheme) === "republican";
    let newBlock: Block;

    if (type === "headline") {
      newBlock = isRep
        ? { id: newBlockId, type: "headline", text: "本埠時事要聞", subtitle: "特派通訊員自前方發來電訊", font: "font-xiaowei", size: "normal", titleMarker: "square" }
        : { id: newBlockId, type: "headline", text: "新栏目大标题", subtitle: "在此输入吸引人眼球的副标题", font: "font-xiaowei", size: "normal" };
    } else if (type === "article") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "article", title: "滬申各界春季公祭紀實", subtitle: "昨午各界代表齊聚會堂場面極為隆重",
            author: "本報特派記者", publishOffice: "時事新報社印",
            paragraphs: ["昨日午後，各界代表假座大禮堂舉行公祭典禮。到會人士數百人，秩序井然，備極莊嚴...", "典禮於二時開始，首由主席登壇宣告開會，奏樂行禮如儀，詞旨深沉，在座者莫不肅然。"],
            dropCap: true, fontSize: "sm", font: "font-serif", align: "justify", titleMarker: "square"
          }
        : {
            id: newBlockId, type: "article", title: "新记事文章标题", subtitle: "皇家学者关于此事件的简短叙述",
            author: "帝国记录官", publishOffice: "圣塞西尔记录署印",
            paragraphs: ["在遥远的行省，风雨交加的夜里，一件奇妙的逸闻悄然发生。据当地守卫描述，那是个不可思议的开端...", "学者们在羊皮纸上写下了这段记录，供王都的臣民们阅览。"],
            dropCap: true, fontSize: "sm", font: "font-serif", align: "justify"
          };
    } else if (type === "image") {
      newBlock = isRep
        ? { id: newBlockId, type: "image", src: "", filter: "sepia", caption: "街市人力黃包車實景", isClipart: true, clipartId: "rickshaw", scale: 80 }
        : { id: newBlockId, type: "image", src: "", filter: "woodblock", caption: "古老手抄本插图摹印", isClipart: true, clipartId: "castle", scale: 75 };
    } else if (type === "divider") {
      newBlock = isRep
        ? { id: newBlockId, type: "divider", style: "wenwu" }
        : { id: newBlockId, type: "divider", style: "ornament", ornamentType: "fleur-de-lis" };
    } else if (type === "bounty") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "bounty",
            headerText: "懸 賞 通 緝",
            bountyAmount: "賞格：大洋 壹仟圓 整",
            targetName: "江洋大盜·趙黑虎",
            crimeDetails: "案由：昨夜夥同匪徒持械搶掠洋行銀元，現飭巡捕緝拿，生擒或密報破案者從重酬獎。",
            issuedBy: "淞滬巡警總局 督察處 宣",
            avatarType: "clipart",
            clipartId: "vintage-camera",
            borderStyle: "wenwu"
          }
        : {
            id: newBlockId, type: "bounty",
            headerText: "✦ 懸賞通緝 ✦",
            bountyAmount: "賞金：5,000 金幣 · 生死不論",
            targetName: "暗夜刺客·維克托",
            crimeDetails: "罪名：盜掘古王陵寢秘寶、襲擊帝國巡邏隊。極度危險，常出沒於黑霧森林。",
            issuedBy: "聖殿騎士團 治安判事署 簽批",
            avatarType: "clipart",
            clipartId: "skull",
            borderStyle: "wood"
          };
    } else if (type === "briefs") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "briefs",
            title: "■ 申江本埠時事短電 ■",
            borderStyle: "boxed",
            items: [
              { id: "b1", tag: "【法租界訊】", text: "電車路昨晚全部通車，票價維持原額，商民咸稱便利。" },
              { id: "b2", tag: "【總商會訊】", text: "各業同業公會昨開茶話會，商討平抑米價救濟平民辦法。" },
              { id: "b3", tag: "【輪船消息】", text: "江裕輪自漢口裝運熟桐油二千桶抵滬，今早進港卸貨。" }
            ]
          }
        : {
            id: newBlockId, type: "briefs",
            title: "❖ 王國四方短訊輯要 ❖",
            borderStyle: "vintage",
            items: [
              { id: "b1", tag: "【西境要塞】", text: "巡林客哨所昨報，黑霧山谷魔獸異動暫歇，商道已重開。" },
              { id: "b2", tag: "【白銀港口】", text: "精靈商船隊攜珍珠草與月光絲綢順風抵港，水手雲集。" },
              { id: "b3", tag: "【皇家法學院】", text: "春季法術考核明日舉行，院長提醒學徒佩帶防護符文。" }
            ]
          };
    } else if (type === "table") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "table",
            title: "中外洋行銀圓行情牌價",
            subtitle: "上海金業公所昨日申刻牌價",
            headers: ["洋鈿種類", "昨日收盤", "今日開盤", "市面行情"],
            rows: [
              ["袁大頭壹圓", "七角八分", "七角八分二厘", "平穩"],
              ["孫頭開國幣", "七角七分", "七角七分五厘", "微升"],
              ["墨西哥鷹洋", "七角六分", "七角六分", "持平"],
              ["雙毫銀角子", "一角五分", "一角五分二厘", "交易旺"]
            ],
            style: "boxed"
          }
        : {
            id: newBlockId, type: "table",
            title: "皇家行商·武器藥劑官價牌",
            subtitle: "聖歷742年春 帝國度支司特許發布",
            headers: ["品名與規格", "官方定價", "市面備註"],
            rows: [
              ["精煉秘銀長劍", "120 金幣", "存貨緊俏·每人限購一柄"],
              ["極效治療藥劑", "15 金幣", "鍊金術士公會特許正品"],
              ["古銀旅行乾糧包", "3 銀幣", "耐寒耐濕·冒險必備"],
              ["魔法照明水晶", "45 銀幣", "光芒可持續七日不滅"]
            ],
            style: "classic"
          };
    } else if (type === "seal") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "seal",
            text: "淞滬警備司·驗訖",
            subtext: "民國十二年 · 核准印發",
            sealShape: "oval",
            color: "red",
            rotation: -4,
            align: "center"
          }
        : {
            id: newBlockId, type: "seal",
            text: "聖塞西爾·御審",
            subtext: "特許放行 · 聖歷742年",
            sealShape: "wax",
            color: "crimson",
            rotation: -6,
            align: "center"
          };
    } else if (type === "letter") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "letter",
            title: "【讀者投書】",
            recipient: "主筆先生大鑒：",
            content: "昨日拜讀貴報所評《電車工人風潮》一文，立論平正，深獲鄙人共鳴。然查南市各路行車，每遇早暮繁劇之時，擁擠不堪。若能增開班次，則工友生計得全，市民亦免苦候之虞矣。",
            sender: "愛國路讀者·王啟明 頓首",
            date: "十一月十五日夜",
            borderStyle: "vintage"
          }
        : {
            id: newBlockId, type: "letter",
            title: "【讀者來鴻】",
            recipient: "致 帝國時報總編閣下：",
            content: "近日王都盛傳巨龍重現邊境之流言，人心惶惶。鄙人長年巡狩於黑森林，確見林间雀鳥絕跡、地脈微震，絕非空穴來風。願王都守衛嚴加防範，莫使邊陲重蹈三十年前之災厄。",
            sender: "遠境巡林客·阿蘭 謹書於西境哨所",
            date: "星輝曆七四二年·冬月",
            borderStyle: "paper"
          };
    } else if (type === "obituary") {
      newBlock = isRep
        ? {
            id: newBlockId, type: "obituary",
            headerBadge: "【 訃 告 】",
            deceasedName: "先考嚴公諱複先府君",
            titleOrRole: "前北京大學校長 · 思想啟蒙家 · 文林巨擘",
            dates: "生於清咸豐四年 · 卒於民國十年 享壽六十有八",
            message: "不孝男等痛心疾首，先考不幸於昨日申刻因痼疾復發，在滬寓溘然長逝。生平道德文章，天下共仰。茲定於本月二十日假座萬國公殯舍開弔，薄陳菲奠，用答存唁。",
            mourners: "治喪委員會 暨 孤哀子等 泣血稽顙",
            serviceInfo: "開弔日期：本月二十日上午十時 / 靈堂設在膠州路萬國殯儀館大禮堂",
            borderStyle: "black-thick"
          }
        : {
            id: newBlockId, type: "obituary",
            headerBadge: "✦ 沉 痛 哀 告 ✦",
            deceasedName: "亞瑟·馮·瓦倫丁 卿",
            titleOrRole: "前皇家第二禁衛騎士團副團長 · 金鳶尾勳章受勳者",
            dates: "聖歷 668 年 ~ 742 年 · 享年七十四歲",
            message: "瓦倫丁卿於前日黎明在王都宅邸安詳逝世。卿戎馬一生，三度衛戍王畿，勇毅忠誠，名垂帝國史冊。大主教將於明晨親臨主持追思彌撒。",
            mourners: "帝國皇家騎士團 暨 瓦倫丁家族 泣告",
            serviceInfo: "追思彌撒：明晨辰時 王都聖彼得主教堂 / 安葬於聖塞西爾先賢陵園",
            borderStyle: "black-thick"
          };
    } else {
      newBlock = isRep
        ? { id: newBlockId, type: "ad", title: "先施公司新貨告白", content: "本公司由英美各國採辦應時綢緞呢絨、時裝西服，照公道定價發售，歡迎各界賜顧！", price: "定價：童叟無欺", merchant: "南京路大東門英租界", borderStyle: "wenwu" }
        : { id: newBlockId, type: "ad", title: "大炼金商行告示", content: "出售上等秘银盾牌、精制魔法卷轴。保证正品，拒绝赝品！", price: "售价：面议", merchant: "北街红狮子铁匠铺", borderStyle: "dashed" };
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

  const convertThemeContent = (data: NewspaperData, targetTheme: NewspaperTheme): NewspaperData => {
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
          if (block.type === "bounty") {
            const bo = block as any;
            if (targetTheme === "republican" && bo.borderStyle === "wood") return { ...bo, borderStyle: "wenwu", clipartId: bo.clipartId === "skull" ? "vintage-camera" : bo.clipartId };
            if (targetTheme === "fantasy" && bo.borderStyle === "wenwu") return { ...bo, borderStyle: "wood", clipartId: bo.clipartId === "vintage-camera" ? "skull" : bo.clipartId };
            return block;
          }
          if (block.type === "seal") {
            const s = block as any;
            if (targetTheme === "republican" && s.sealShape === "wax") return { ...s, sealShape: "oval", color: "red" };
            if (targetTheme === "fantasy" && s.sealShape === "oval") return { ...s, sealShape: "wax", color: "crimson" };
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

  const updateRowHeight = (rowId: string, height: number) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.id === rowId ? { ...row, height } : row)
    }));
  };

  const updateRowColumnFractions = (rowId: string, fractions: number[]) => {
    setNewspaperData(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.id === rowId ? { ...row, columnFractions: fractions } : row)
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
    selectedBlockId, setSelectedBlockId,
    selectedRowId, setSelectedRowId,
    selectedColumnId, setSelectedColumnId,
    globalHeadingScale, setGlobalHeadingScale,
    globalBodyScale, setGlobalBodyScale,
    columnGap, setColumnGap,
    enableParchmentTexture, setEnableParchmentTexture,
    enableCoffeeStains, setEnableCoffeeStains,
    paperTone, setPaperTone,
    geminiApiKey, setGeminiApiKey,
    showPrintHelp, setShowPrintHelp,
    showSaveManager, setShowSaveManager,
    showAboutModal, setShowAboutModal,
    sidebarWidth, setSidebarWidth,
    isExporting, setIsExporting,
    activeAddBlockColId, setActiveAddBlockColId,
    currentView, setCurrentView,
    autoSaveStatus,
    openEditor,
    navigateToHome,
    convertThemeContent,
    theme, updateRowHeight, updateRowColumnFractions,
    findSelectedBlock, selectBlockAndContext, updateBlock, updateHeader,
    updateRowSplit, splitColumn, deleteColumn, insertRowBelow, addNewRow, deleteRow, moveRow,
    addBlockToColumn, deleteBlock, moveBlock, moveBlockHorizontally, handleResetData,
    triggerImageUpload,
    undo, redo, canUndo, canRedo
  };

  return (
    <NewspaperContext.Provider value={contextValue}>
      {children}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
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
