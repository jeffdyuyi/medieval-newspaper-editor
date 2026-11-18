import React, { useState, useEffect } from "react";
import { NewspaperData, PaperTone } from "../types";
import { useNewspaper, sanitizeNewspaperData } from "../context/NewspaperContext";
import PixelIcon from "./PixelIcon";

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
    }
  }, [storageKey, theme]);

  const saveToLocalStorage = (newSaves: SaveSlot[]) => {
    setSaves(newSaves);
    localStorage.setItem(storageKey, JSON.stringify(newSaves));
    if (theme === "fantasy") {
      localStorage.setItem("medieval_newspaper_saves", JSON.stringify(newSaves));
    }
  };

  const handleCreateSave = () => {
    if (!newSaveName.trim()) {
      alert("请输入存档名称");
      return;
    }

    const newSave: SaveSlot = {
      id: Date.now().toString(),
      name: newSaveName.trim(),
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(newspaperData)),
    };

    const newSaves = [newSave, ...saves];
    saveToLocalStorage(newSaves);
    setNewSaveName("");
  };

  const handleOverwrite = (id: string) => {
    if (!confirm("确定要使用当前画布内容覆盖此存档吗？")) return;
    const newSaves = saves.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          timestamp: Date.now(),
          data: JSON.parse(JSON.stringify(newspaperData)),
        };
      }
      return s;
    });
    saveToLocalStorage(newSaves);
  };

  const handleLoad = (save: SaveSlot) => {
    let targetData = save.data;
    if (save.data.theme && save.data.theme !== theme) {
      const fromName = save.data.theme === "republican" ? "民国报刊" : "中世纪奇幻";
      const toName = theme === "republican" ? "民国报刊" : "中世纪奇幻";
      const ok = confirm(
        `检测到该存档源自【${fromName}】环境。\n\n是否允许将其中的标题、副标、文章正文、作者、图片与告示等内容，自动转换并适配至当前【${toName}】？`
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

  // Helper for JSON File Import
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let rawData: NewspaperData | null = null;

        if (parsed && parsed.data && parsed.data.rows && parsed.data.header) {
          rawData = parsed.data;
          if (parsed.settings) {
            if (parsed.settings.paperTone) setPaperTone(parsed.settings.paperTone as PaperTone);
            if (typeof parsed.settings.columnGap === "number") setColumnGap(parsed.settings.columnGap);
            if (typeof parsed.settings.globalHeadingScale === "number") setGlobalHeadingScale(parsed.settings.globalHeadingScale);
            if (typeof parsed.settings.globalBodyScale === "number") setGlobalBodyScale(parsed.settings.globalBodyScale);
            if (typeof parsed.settings.enableParchmentTexture === "boolean") setEnableParchmentTexture(parsed.settings.enableParchmentTexture);
            if (typeof parsed.settings.enableCoffeeStains === "boolean") setEnableCoffeeStains(parsed.settings.enableCoffeeStains);
          }
        } else if (parsed && parsed.rows && parsed.header) {
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
    <div className="fixed inset-0 bg-[#070a10]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="pixel-panel max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="pixel-panel-header px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-gold)] flex items-center gap-2">
            <PixelIcon name="pixel/save" size={18} className="text-[var(--color-gold)]" />
            档案馆 (多存档管理)
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:text-[var(--color-gold)] text-[var(--color-muted)] transition-colors cursor-pointer"
            title="关闭"
          >
            <PixelIcon name="pixel/close" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 pixel-scroll">
          {/* Create New Save */}
          <div className="pixel-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-gold)]">存入新档</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="在此输入存档名称（如：最终决战号外）..."
                className="pixel-input flex-1 text-sm"
              />
              <button
                onClick={handleCreateSave}
                className="pixel-btn text-sm px-4 py-1.5"
              >
                <PixelIcon name="pixel/add" size={16} />
                保存
              </button>
            </div>
          </div>

          {/* Local Save List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-1 flex items-center justify-between">
              <span>本地历史存档</span>
              <span className="text-xs text-[var(--color-muted)] font-normal">{saves.length} 个记录</span>
            </h3>

            {saves.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] italic py-6 text-center">
                档案馆空空如也，尚未有任何记录。
              </p>
            ) : (
              <div className="grid gap-3">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="pixel-card pixel-card-hover p-3 flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-[var(--color-ink)] text-sm">{save.name}</h4>
                      <p className="text-xs text-[var(--color-muted)] flex items-center gap-1.5 mt-1">
                        <span>{new Date(save.timestamp).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLoad(save)}
                        className="pixel-btn text-xs px-3 py-1"
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleOverwrite(save.id)}
                        className="pixel-btn text-xs px-3 py-1 text-[var(--color-gold)]"
                      >
                        覆盖
                      </button>
                      <button
                        onClick={() => handleDelete(save.id)}
                        className="pixel-btn pixel-btn-danger text-xs px-2.5 py-1 text-[var(--color-danger)]"
                        title="删除"
                      >
                        <PixelIcon name="pixel/delete" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Import / Export */}
          <div className="pt-4 border-t border-[var(--color-line)]">
            <h3 className="text-sm font-bold text-[var(--color-gold)] mb-3">文件备份与迁移</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportJson}
                className="pixel-btn flex-1 py-2 text-sm"
              >
                <PixelIcon name="pixel/download" size={16} />
                导出 JSON 备份
              </button>
              <label className="pixel-btn flex-1 py-2 text-sm cursor-pointer">
                <PixelIcon name="pixel/upload" size={16} />
                导入 JSON 备份
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] mt-2 leading-relaxed">
              可将版面数据导出为包含排版设定的独立 JSON 文件。导入时将自动进行数据安全性校验与清洗，保障不同设备之间的无缝流转。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
