import React, { useState, useEffect } from "react";
import { X, Save, Upload, Trash2, Clock, FilePlus } from "lucide-react";
import { NewspaperData } from "../types";
import { useNewspaper } from "../context/NewspaperContext";

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
  const { newspaperData, setNewspaperData } = useNewspaper();
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [newSaveName, setNewSaveName] = useState("");

  useEffect(() => {
    const loadedSaves = localStorage.getItem("medieval_newspaper_saves");
    if (loadedSaves) {
      try {
        setSaves(JSON.parse(loadedSaves));
      } catch (e) {
        console.error("Failed to parse saves", e);
      }
    }
  }, []);

  const saveToLocalStorage = (newSaves: SaveSlot[]) => {
    localStorage.setItem("medieval_newspaper_saves", JSON.stringify(newSaves));
    setSaves(newSaves);
  };

  const handleCreateSave = () => {
    const name = newSaveName.trim() || `存档 ${new Date().toLocaleString()}`;
    const newSave: SaveSlot = {
      id: `save_${Date.now()}`,
      name,
      timestamp: Date.now(),
      data: newspaperData,
    };
    saveToLocalStorage([newSave, ...saves]);
    setNewSaveName("");
  };

  const handleOverwrite = (id: string) => {
    if (!confirm("确定要用当前报纸覆盖此存档吗？")) return;
    const newSaves = saves.map(s => 
      s.id === id ? { ...s, data: newspaperData, timestamp: Date.now() } : s
    );
    saveToLocalStorage(newSaves);
  };

  const handleLoad = (save: SaveSlot) => {
    if (!confirm("加载存档将覆盖当前未保存的内容，确定要加载吗？")) return;
    setNewspaperData(save.data);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定要永久删除此存档吗？此操作不可逆！")) return;
    saveToLocalStorage(saves.filter(s => s.id !== id));
  };

  // Helper for JSON File Export
  const handleExportJson = () => {
    const dataStr = JSON.stringify(newspaperData, null, 2);
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
        if (parsed && parsed.rows && parsed.header) {
          setNewspaperData(parsed);
          onClose();
        } else {
          alert("文件格式不正确，无法读取报纸数据。");
        }
      } catch (err) {
        alert("读取文件失败，请确保它是合法的 JSON 文件。");
      }
    };
    reader.readAsText(file);
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
          <button onClick={onClose} className="p-1 hover:bg-[#8b4513]/10 text-[#8b4513] rounded transition-colors">
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
                className="bg-[#8b4513] hover:bg-[#753a10] text-[#f5deb3] px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-1.5"
              >
                <FilePlus className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>

          {/* Local Save List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#8b4513] border-b border-[#8b4513]/20 pb-1">本地历史存档 ({saves.length})</h3>
            
            {saves.length === 0 ? (
              <p className="text-xs text-[#8b4513]/60 italic py-4 text-center">档案馆空空如也，尚未有任何记录。</p>
            ) : (
              <div className="grid gap-3">
                {saves.map(save => (
                  <div key={save.id} className="bg-[#dcd0b8]/60 border border-[#8b4513]/40 p-3 rounded flex items-center justify-between group">
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
                        className="px-3 py-1.5 bg-[#2c241e] text-[#e8dcc4] text-xs rounded hover:bg-black transition-colors"
                      >
                        加载
                      </button>
                      <button 
                        onClick={() => handleOverwrite(save.id)}
                        className="px-3 py-1.5 border border-[#8b4513] text-[#8b4513] text-xs rounded hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors"
                      >
                        覆盖
                      </button>
                      <button 
                        onClick={() => handleDelete(save.id)}
                        className="px-2 py-1.5 border border-red-800/50 text-red-800 text-xs rounded hover:bg-red-100 transition-colors"
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
                className="flex-1 py-2 border border-[#8b4513] text-[#8b4513] rounded text-sm font-bold hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                导出 JSON 备份
              </button>
              <label className="flex-1 py-2 border border-[#8b4513] text-[#8b4513] rounded text-sm font-bold hover:bg-[#8b4513] hover:text-[#f5deb3] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                导入 JSON 备份
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
            <p className="text-[11px] text-[#8b4513]/70 mt-2 leading-relaxed">
              您可以将报纸数据导出为独立的 JSON 文件，发送给其他设备或其他用户。导入时将会直接覆盖当前编辑器内的内容。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
