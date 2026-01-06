
import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, InfoSource, FocusArea } from '../types';
import { Plus, Trash2, Save, Globe, Target, Bell, Clock, FileUp, Download, Sparkles, Loader2, List, Check, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import { IntelligenceService } from '../services/geminiService';

interface SettingsProps {
  configs: AppConfig[];
  activeConfigId: string;
  onSave: (config: AppConfig) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ configs, activeConfigId, onSave, onDelete, onSelect }) => {
  const currentConfig = configs.find(c => c.id === activeConfigId) || configs[0];
  const [localConfig, setLocalConfig] = useState<AppConfig>(currentConfig);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingName, setPendingName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSourcesCount = useRef(localConfig.sources.length);

  // Sync local state when active config changes from parent
  useEffect(() => {
    setLocalConfig(currentConfig);
  }, [activeConfigId, currentConfig]);

  const inputStyles = "w-full px-3 py-2 text-sm bg-blue-50 text-blue-900 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-400 outline-none placeholder:text-blue-300 transition-all";

  const addSource = () => {
    const newSource: InfoSource = { id: crypto.randomUUID(), name: '', url: '', target: '', enabled: true };
    setLocalConfig({ ...localConfig, sources: [...localConfig.sources, newSource] });
  };

  const addArea = () => {
    const newArea: FocusArea = { id: crypto.randomUUID(), keyword: '', enabled: true };
    setLocalConfig({ ...localConfig, areas: [...localConfig.areas, newArea] });
  };

  const removeSource = (id: string) => {
    setLocalConfig({ ...localConfig, sources: localConfig.sources.filter(s => s.id !== id) });
  };

  const removeArea = (id: string) => {
    setLocalConfig({ ...localConfig, areas: localConfig.areas.filter(a => a.id !== id) });
  };

  const handleAutoAnalyze = async (sourcesToAnalyze = localConfig.sources) => {
    const validSources = sourcesToAnalyze.filter(s => s.name || s.target);
    if (validSources.length === 0) return;

    setIsAnalyzing(true);
    try {
      const service = new IntelligenceService();
      const suggestions = await service.suggestFocusAreas(validSources);
      
      if (suggestions.length > 0) {
        const existingKeywords = new Set(localConfig.areas.map(a => a.keyword.toLowerCase()));
        const newAreas: FocusArea[] = suggestions
          .filter(keyword => !existingKeywords.has(keyword.toLowerCase()))
          .map(keyword => ({
            id: crypto.randomUUID(),
            keyword,
            enabled: true
          }));

        if (newAreas.length > 0) {
          setLocalConfig(prev => ({
            ...prev,
            areas: [...prev.areas, ...newAreas]
          }));
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateNew = () => {
    const newId = crypto.randomUUID();
    const newConfig: AppConfig = {
      id: newId,
      name: `新情报集 ${configs.length + 1}`,
      sources: [],
      areas: [],
      lookbackDays: 7,
      updateDay: 1,
      updateTime: "09:00",
      autoSend: false
    };
    onSave(newConfig);
    onSelect(newId);
  };

  const initiateSave = () => {
    setShowNameDialog(true);
    setPendingName(localConfig.name);
  };

  const confirmSave = () => {
    if (!pendingName.trim()) return;
    const updated = { ...localConfig, name: pendingName.trim() };
    onSave(updated);
    setShowNameDialog(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let importedSources: any[] = [];
      if (file.name.endsWith('.json')) {
        const content = await file.text();
        importedSources = JSON.parse(content);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        importedSources = XLSX.utils.sheet_to_json(worksheet);
      }

      const newSources: InfoSource[] = importedSources.map(s => {
        const name = s.name || s['名称'] || s['Name'] || '未命名';
        const url = s.url || s['网址'] || s['URL'] || '';
        const target = s.target || s['目标'] || s['检索目标'] || s['Target'] || '';
        return {
          id: crypto.randomUUID(),
          name: String(name).trim(),
          url: String(url).trim(),
          target: String(target).trim(),
          enabled: true
        };
      }).filter(s => s.url);

      if (newSources.length > 0) {
        const updatedSources = [...localConfig.sources, ...newSources];
        setLocalConfig(prev => ({ ...prev, sources: updatedSources }));
        handleAutoAnalyze(updatedSources);
      }
    } catch (err) { alert('解析失败'); }
    e.target.value = '';
  };

  return (
    <div className="flex gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Configuration Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <List size={18} className="text-blue-500" />
              配置集列表
            </h3>
            <button 
              onClick={handleCreateNew}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="新增配置集"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-1.5">
            {configs.map(config => (
              <div 
                key={config.id}
                onClick={() => onSelect(config.id)}
                className={`group w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                  activeConfigId === config.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {activeConfigId === config.id ? <Check size={14} /> : <div className="w-3.5" />}
                  <span className="text-sm font-semibold truncate leading-none">{config.name}</span>
                </div>
                {configs.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(config.id); }}
                    className={`p-1 opacity-0 group-hover:opacity-100 rounded hover:bg-red-500 hover:text-white transition-all ${activeConfigId === config.id ? 'text-blue-200' : 'text-slate-300'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 space-y-8 pb-24">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <Pencil size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800">{localConfig.name}</h2>
                <button onClick={() => setShowNameDialog(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-sm text-slate-500">正在编辑当前选中的情报配置集</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={initiateSave}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200 active:scale-95"
            >
              <Save size={20} />
              保存配置
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Sources Section */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                <Globe size={24} className="text-blue-500" />
                情报信息源
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors text-sm font-bold border border-blue-200"
                >
                  <FileUp size={18} />
                  批量导入
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json,.csv,.xlsx,.xls" className="hidden" />
                <button onClick={addSource} className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-md">
                  <Plus size={24} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {localConfig.sources.map((source, idx) => (
                <div key={source.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      placeholder="网站名称"
                      value={source.name}
                      onChange={e => {
                        const newSources = [...localConfig.sources];
                        newSources[idx].name = e.target.value;
                        setLocalConfig({...localConfig, sources: newSources});
                      }}
                      className={inputStyles}
                    />
                    <input
                      placeholder="URL 地址"
                      value={source.url}
                      onChange={e => {
                        const newSources = [...localConfig.sources];
                        newSources[idx].url = e.target.value;
                        setLocalConfig({...localConfig, sources: newSources});
                      }}
                      className={inputStyles + " font-mono text-xs"}
                    />
                    <div className="flex gap-3 items-center">
                      <Target size={16} className="text-blue-400" />
                      <input
                        placeholder="核心监控目标 (如: 技术趋势)"
                        value={source.target}
                        onChange={e => {
                          const newSources = [...localConfig.sources];
                          newSources[idx].target = e.target.value;
                          setLocalConfig({...localConfig, sources: newSources});
                        }}
                        className={inputStyles}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeSource(source.id)} 
                    className="absolute -top-3 -right-3 p-2 bg-white text-red-500 border border-slate-200 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {localConfig.sources.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center">
                  <Globe size={40} className="mb-2 opacity-20" />
                  <p>点击右上角按钮添加信息源</p>
                </div>
              )}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                  <Target size={24} className="text-emerald-500" />
                  监控关键词
                </h3>
                <button 
                  onClick={() => handleAutoAnalyze()}
                  disabled={isAnalyzing || localConfig.sources.length === 0}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                    isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200'
                  }`}
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  智能提取
                </button>
              </div>
              <button onClick={addArea} className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-100">
                <Plus size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {localConfig.areas.map((area, idx) => (
                <div key={area.id} className="flex gap-2 items-center group animate-in zoom-in-95 duration-200">
                  <input
                    placeholder="如: Generative AI"
                    value={area.keyword}
                    onChange={e => {
                      const newAreas = [...localConfig.areas];
                      newAreas[idx].keyword = e.target.value;
                      setLocalConfig({...localConfig, areas: newAreas});
                    }}
                    className={inputStyles + " font-bold"}
                  />
                  <button onClick={() => removeArea(area.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule & Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2 text-xl">
              <Clock size={24} className="text-purple-500" />
              检索时间配置
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-bold text-slate-600">回顾时长 (天)</label>
                <input
                  type="number"
                  value={localConfig.lookbackDays}
                  onChange={e => setLocalConfig({...localConfig, lookbackDays: parseInt(e.target.value)})}
                  className={inputStyles + " w-24 text-center"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">每周定时运行</label>
                <div className="flex gap-3">
                  <select
                    value={localConfig.updateDay}
                    onChange={e => setLocalConfig({...localConfig, updateDay: parseInt(e.target.value)})}
                    className={inputStyles + " flex-1 font-bold"}
                  >
                    <option value={1}>每周一</option>
                    <option value={2}>每周二</option>
                    <option value={3}>每周三</option>
                    <option value={4}>每周四</option>
                    <option value={5}>每周五</option>
                    <option value={6}>每周六</option>
                    <option value={0}>每周日</option>
                  </select>
                  <input
                    type="time"
                    value={localConfig.updateTime}
                    onChange={e => setLocalConfig({...localConfig, updateTime: e.target.value})}
                    className={inputStyles + " w-32 font-bold"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2 text-xl">
              <Bell size={24} className="text-orange-500" />
              自动化推送
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="autoSend"
                  checked={localConfig.autoSend}
                  onChange={e => setLocalConfig({...localConfig, autoSend: e.target.checked})}
                  className="w-6 h-6 text-blue-600 rounded-lg cursor-pointer accent-blue-600"
                />
                <label htmlFor="autoSend" className="text-sm font-bold text-slate-700 cursor-pointer">自动将报告推送至 Webhook</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Webhook 地址</label>
                <input
                  placeholder="https://oapi.dingtalk.com/..."
                  value={localConfig.webhookUrl || ''}
                  onChange={e => setLocalConfig({...localConfig, webhookUrl: e.target.value})}
                  className={inputStyles + " font-mono text-[11px]"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Rename Modal */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">保存配置集</h3>
            <p className="text-sm text-slate-500 mb-6">请为当前配置集指定一个便于识别的名称。</p>
            <input 
              autoFocus
              className={inputStyles + " py-3 text-lg font-bold mb-8"}
              value={pendingName}
              onChange={e => setPendingName(e.target.value)}
              placeholder="例如: 智能投研-AI方向"
              onKeyDown={e => e.key === 'Enter' && confirmSave()}
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowNameDialog(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={confirmSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
