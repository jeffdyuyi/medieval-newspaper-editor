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
  activeSidebarColId: string | null;
  setActiveSidebarColId: React.Dispatch<React.SetStateAction<string | null>>;
  showWelcomeModal: boolean;
  setShowWelcomeModal: React.Dispatch<React.SetStateAction<boolean>>;
  theme: NewspaperTheme;
  switchTheme: (newTheme: NewspaperTheme, skipConfirm?: boolean) => void;
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
  const [activeSidebarColId, setActiveSidebarColId] = useState<string | null>(null);

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

        const currentFractions =
          row.columnFractions && row.columnFractions.length === row.columns.length
            ? [...row.columnFractions]
            : new Array(row.columns.length).fill(1);

        const currentFr = currentFractions[colIdx] || 1;
        const halfFr = Math.max(0.2, Number((currentFr / 2).toFixed(2)));
        currentFractions.splice(colIdx, 1, halfFr, halfFr);

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
        if (r.columnFractions && r.columnFractions.length === r.columns.length) {
          newFractions = r.columnFractions.filter((_, idx) => idx !== colIdx);
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
    activeSidebarColId, setActiveSidebarColId,
    showWelcomeModal, setShowWelcomeModal,
    theme, switchTheme, updateRowHeight, updateRowColumnFractions,
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
