import React, { useState, useEffect } from "react";
import { X, Save, Upload, Trash2, Clock, FilePlus } from "lucide-react";
import { NewspaperData, PaperTone } from "../types";
import { useNewspaper, sanitizeNewspaperData } from "../context/NewspaperContext";

interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  data: NewspaperData;
}

interface SaveManagerProps {
  onClose: () => void;
}

export default function SaveManager({ onClose }: SaveManagerProps) {
  const {
    newspaperData,
    setNewspaperData,
    setSelectedBlockId,
    setSelectedRowId,
    setSelectedColumnId,
    setSelectedSealId,
    paperTone,
    setPaperTone,
    columnGap,
    setColumnGap,
    globalHeadingScale,
    setGlobalHeadingScale,
    globalBodyScale,
    setGlobalBodyScale,
    enableParchmentTexture,
    setEnableParchmentTexture,
    enableCoffeeStains,
    setEnableCoffeeStains,
    theme,
    convertThemeContent,
  } = useNewspaper();

  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [newSaveName, setNewSaveName] = useState("");

  const storageKey = `newspaper_saves_${theme}`;

  useEffect(() => {
    let raw = localStorage.getItem(storageKey);
    // Backward compatibility for fantasy theme with legacy key
    if (!raw && theme === "fantasy") {
      raw = localStorage.getItem("medieval_newspaper_saves");
    }
    if (raw) {
      try {
        setSaves(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse saves", e);
      }
    } else {
      setSaves([]);
    }
  }, [storageKey, theme]);

  const saveToLocalStorage = (newSaves: SaveSlot[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newSaves));
    setSaves(newSaves);
  };

  const handleCreateSave = () => {
    const name = newSaveName.trim() || `存档 ${new Date().toLocaleString()}`;
    const newSave: SaveSlot = {
      id: `save_${Date.now()}`,
      name,
      timestamp: Date.now(),
      data: sanitizeNewspaperData(newspaperData),
    };
    saveToLocalStorage([newSave, ...saves]);
    setNewSaveName("");
  };

  const handleOverwrite = (id: string) => {
    if (!confirm("确定要用当前报纸覆盖此存档吗？")) return;
    const newSaves = saves.map((s) =>
      s.id === id
        ? { ...s, data: sanitizeNewspaperData(newspaperData), timestamp: Date.now() }
        : s
    );
    saveToLocalStorage(newSaves);
  };

  const handleLoad = (save: SaveSlot) => {
    if (!confirm("加载存档将覆盖当前未保存的内容，确定要加载吗？")) return;
    let targetData = save.data;
    if (save.data.theme && save.data.theme !== theme) {
      const fromName = save.data.theme === "republican" ? "民国报刊" : "中世纪奇幻";
      const toName = theme === "republican" ? "民国报刊" : "中世纪奇幻";
      const ok = confirm(
        `检测到该存档记录源自【${fromName}】环境。\n\n是否允许将其中的标题、副标、文章正文、作者、图片与告示等内容，自动转换并适配至当前【${toName}】编辑器？`
      );
      if (!ok) return;
      targetData = convertThemeContent(save.data, theme);
    }
    const sanitized = sanitizeNewspaperData(targetData);
    setNewspaperData(sanitized);
    setSelectedBlockId(null);
    setSelectedRowId(null);
    setSelectedColumnId(null);
    setSelectedSealId(null);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定要永久删除此存档吗？此操作不可逆！")) return;
    saveToLocalStorage(saves.filter((s) => s.id !== id));
  };

  // Helper for JSON File Export (includes layout settings)
  const handleExportJson = () => {
    const backupPayload = {
      app: "medieval-newspaper-editor",
      version: "2.0",
      exportTime: new Date().toISOString(),
      data: newspaperData,
      settings: {
        paperTone,
        columnGap,
        globalHeadingScale,
        globalBodyScale,
        enableParchmentTexture,
        enableCoffeeStains,
      },
    };

    const dataStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${newspaperData.header.title || "newspaper"}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper for JSON File Import (supports both raw NewspaperData and full backup packets)
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let rawData: NewspaperData | null = null;

        // Check if it's the enhanced 2.0 backup envelope
        if (parsed && parsed.data && parsed.data.rows && parsed.data.header) {
          rawData = parsed.data;
          // Restore visual settings if present
          if (parsed.settings) {
            if (parsed.settings.paperTone) setPaperTone(parsed.settings.paperTone as PaperTone);
            if (typeof parsed.settings.columnGap === "number") setColumnGap(parsed.settings.columnGap);
            if (typeof parsed.settings.globalHeadingScale === "number") setGlobalHeadingScale(parsed.settings.globalHeadingScale);
            if (typeof parsed.settings.globalBodyScale === "number") setGlobalBodyScale(parsed.settings.globalBodyScale);
            if (typeof parsed.settings.enableParchmentTexture === "boolean") setEnableParchmentTexture(parsed.settings.enableParchmentTexture);
            if (typeof parsed.settings.enableCoffeeStains === "boolean") setEnableCoffeeStains(parsed.settings.enableCoffeeStains);
          }
        } else if (parsed && parsed.rows && parsed.header) {
          // Classic raw NewspaperData
          rawData = parsed;
        }

        if (rawData) {
          let finalData = rawData;
          if (rawData.theme && rawData.theme !== theme) {
            const fromName = rawData.theme === "republican" ? "民国报刊" : "中世纪奇幻";
            const toName = theme === "republican" ? "民国报刊" : "中世纪奇幻";
            const ok = confirm(
              `检测到该存档文件源自【${fromName}】环境。\n\n是否允许将其中的标题、副标、文章正文、作者、图片与告示等内容，自动转换并适配至当前【${toName}】编辑器？`
            );
            if (!ok) return;
            finalData = convertThemeContent(rawData, theme);
          }
          const sanitized = sanitizeNewspaperData(finalData);
          setNewspaperData(sanitized);
          setSelectedBlockId(null);
          setSelectedRowId(null);
          setSelectedColumnId(null);
          setSelectedSealId(null);
          alert("存档与排版内容已成功导入！");
          onClose();
        } else {
          alert("文件格式不正确，未检测到合法的报纸版面数据。");
        }
      } catch (err) {
        alert("读取文件失败，请确保它是合法的 JSON 文件。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#e8dcc4] border-2 border-[#8b4513] rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-serif">
        {/* Header */}
        <div className="bg-[#dcd0b8] border-b-2 border-[#8b4513] p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2c241e] flex items-center gap-2">
            <Save className="w-5 h-5 text-[#8b4513]" />
            档案馆 (多存档管理)
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#8b4513]/10 text-[#8b4513] rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          {/* Create New Save */}
          <div className="bg-[#dcd0b8]/40 p-4 border border-[#8b4513]/30 rounded space-y-3">
            <h3 className="text-sm font-bold text-[#8b4513]">存入新档</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="在此输入存档名称（如：最终决战号外）..."
                className="flex-1 bg-[#e8dcc4] border border-[#8b4513] rounded px-3 py-2 text-sm text-[#2c241e] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              />
              <button
                onClick={handleCreateSave}
                className="bg-[#8b4513] hover:bg-[#753a10] text-[#f5deb3] px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>

          {/* Local Save List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#8b4513] border-b border-[#8b4513]/20 pb-1">
              本地历史存档 ({saves.length})
            </h3>

            {saves.length === 0 ? (
              <p className="text-xs text-[#8b4513]/60 italic py-4 text-center">
                档案馆空空如也，尚未有任何记录。
              </p>
            ) : (
              <div className="grid gap-3">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="bg-[#dcd0b8]/60 border border-[#8b4513]/40 p-3 rounded flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-[#2c241e]">{save.name}</h4>
                      <p className="text-xs text-[#8b4513]/80 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(save.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLoad(save)}
                        className="px-3 py-1.5 bg-[#2c241e] text-[#e8dcc4] text-xs rounded hover:bg-black transition-colors cursor-pointer"
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleOverwrite(save.id)}
                        className="px-3 py-1.5 border border-[#8b4513] text-[#8b4513] text-xs rounded hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors cursor-pointer"
                      >
                        覆盖
                      </button>
                      <button
                        onClick={() => handleDelete(save.id)}
                        className="px-2 py-1.5 border border-red-800/50 text-red-800 text-xs rounded hover:bg-red-100 transition-colors cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Import / Export */}
          <div className="pt-4 border-t border-[#8b4513]/30">
            <h3 className="text-sm font-bold text-[#8b4513] mb-3">文件备份与迁移</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportJson}
                className="flex-1 py-2 border border-[#8b4513] text-[#8b4513] rounded text-sm font-bold hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                导出 JSON 备份
              </button>
              <label className="flex-1 py-2 border border-[#8b4513] text-[#8b4513] rounded text-sm font-bold hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                导入 JSON 备份
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-[#8b4513]/70 mt-2 leading-relaxed">
              您可以将报纸数据导出为包含排版设定的独立 JSON 文件。导入时将自动进行数据安全性校验与清洗，保障不同设备之间的无缝流转。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
