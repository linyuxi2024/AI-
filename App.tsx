
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { AppConfig, WeeklyReport } from './types';
import { Calendar, ChevronRight, X, FileText, Clock, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DEFAULT_CONFIG: AppConfig = {
  id: 'default-set',
  name: '默认行业情报集',
  sources: [
    { id: '1', name: 'TechCrunch', url: 'https://techcrunch.com', target: 'AI and Startups', enabled: true },
    { id: '2', name: 'Reuters', url: 'https://reuters.com', target: 'Global Tech Policy', enabled: true }
  ],
  areas: [
    { id: '1', keyword: '人工智能 (AI)', enabled: true },
    { id: '2', keyword: '大语言模型 (LLM)', enabled: true }
  ],
  lookbackDays: 7,
  updateDay: 1, // Monday
  updateTime: "10:00",
  autoSend: true
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [viewingReport, setViewingReport] = useState<WeeklyReport | null>(null);
  
  const [configs, setConfigs] = useState<AppConfig[]>(() => {
    const saved = localStorage.getItem('intelligence_hub_configs');
    return saved ? JSON.parse(saved) : [DEFAULT_CONFIG];
  });

  const [activeConfigId, setActiveConfigId] = useState<string>(() => {
    return localStorage.getItem('active_config_id') || configs[0]?.id || DEFAULT_CONFIG.id;
  });

  const [reports, setReports] = useState<WeeklyReport[]>(() => {
    const saved = localStorage.getItem('intelligence_hub_reports');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('intelligence_hub_configs', JSON.stringify(configs));
    localStorage.setItem('active_config_id', activeConfigId);
  }, [configs, activeConfigId]);

  useEffect(() => {
    localStorage.setItem('intelligence_hub_reports', JSON.stringify(reports));
  }, [reports]);

  const activeConfig = configs.find(c => c.id === activeConfigId) || configs[0] || DEFAULT_CONFIG;

  const handleReportGenerated = (report: WeeklyReport) => {
    const enrichedReport = { 
      ...report, 
      configId: activeConfig.id, 
      configName: activeConfig.name 
    };
    setReports(prev => [enrichedReport, ...prev]);
    setActiveTab('dashboard');
  };

  const handleSaveConfig = (config: AppConfig) => {
    setConfigs(prev => {
      const index = prev.findIndex(c => c.id === config.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = config;
        return updated;
      }
      return [...prev, config];
    });
    setActiveConfigId(config.id);
  };

  const handleDeleteConfig = (id: string) => {
    if (configs.length <= 1) {
      alert('至少需要保留一个配置集。');
      return;
    }
    const newConfigs = configs.filter(c => c.id !== id);
    setConfigs(newConfigs);
    if (activeConfigId === id) {
      setActiveConfigId(newConfigs[0].id);
    }
  };

  const latestReport = reports.find(r => r.configId === activeConfigId) || reports[0] || null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 flex-1 p-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>系统</span>
            <ChevronRight size={14} />
            <span className="text-slate-600 capitalize">
              {activeTab === 'dashboard' ? '概览' : activeTab === 'history' ? '历史' : '配置'}
            </span>
            <ChevronRight size={14} />
            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md text-blue-600 font-black text-[10px] border border-blue-100 uppercase tracking-widest shadow-sm">
              <SettingsIcon size={12} />
              {activeConfig.name}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-700">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard 
            latestReport={latestReport} 
            config={activeConfig} 
            onReportGenerated={handleReportGenerated} 
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            configs={configs}
            activeConfigId={activeConfigId}
            onSave={handleSaveConfig}
            onDelete={handleDeleteConfig}
            onSelect={setActiveConfigId}
          />
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">历史周报归档</h2>
              <p className="text-slate-400 text-sm font-medium">已存储 {reports.length} 份分析简报</p>
            </div>
            
            {reports.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-32 text-center shadow-sm border-dashed">
                <Clock className="mx-auto text-slate-200 mb-6" size={80} />
                <p className="text-slate-500 text-lg font-bold">目前还没有任何历史记录</p>
                <p className="text-slate-400 text-sm mt-2">快去概览页开始您的第一次情报检索吧</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reports.map(report => (
                  <div key={report.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-1">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                        <FileText size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-black text-slate-900 text-2xl truncate">
                            {new Date(report.timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 情报周报
                          </h4>
                          <span className="flex-shrink-0 px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest">{report.configName || '默认'}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(report.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} />{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                        onClick={() => setViewingReport(report)}
                        className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                      >
                        点击查看详情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Report Details Modal - High Typography Polish */}
      {viewingReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewingReport(null)}>
          <div 
            className="bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-12 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-2xl shadow-blue-200">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">历史情报回顾</h2>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
                    {viewingReport.configName} • {new Date(viewingReport.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingReport(null)}
                className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={32} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 md:p-20 scroll-smooth">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-16">
                <div className="xl:col-span-3">
                  <article className="prose prose-slate prose-xl max-w-none 
                    prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tighter
                    prose-h1:text-6xl prose-h1:mb-16 prose-h1:leading-none
                    prose-h2:text-4xl prose-h2:mt-24 prose-h2:mb-10 prose-h2:border-l-8 prose-h2:border-blue-600 prose-h2:pl-8
                    prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-8 prose-h3:text-blue-600
                    prose-p:text-slate-600 prose-p:text-xl prose-p:leading-relaxed prose-p:mb-10
                    prose-strong:text-slate-900 prose-strong:font-black
                    prose-li:text-slate-600 prose-li:text-xl
                    prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                    prose-hr:my-20 prose-hr:border-slate-100">
                    <ReactMarkdown 
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                      }}
                    >
                      {viewingReport.summary}
                    </ReactMarkdown>
                  </article>
                </div>
                
                <div className="space-y-12">
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                      <ExternalLink size={16} className="text-blue-500" />
                      参考溯源
                    </h4>
                    <div className="space-y-6">
                      {viewingReport.sources.map((src, i) => (
                        <a 
                          key={i} 
                          href={src.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block group"
                        >
                          <p className="text-sm font-black text-slate-700 group-hover:text-blue-600 line-clamp-2 leading-tight transition-colors">
                            {src.title}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono mt-2 truncate">{src.url}</p>
                          <div className="h-1 w-0 group-hover:w-full bg-blue-600 transition-all duration-500 mt-2 rounded-full"></div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">覆盖领域</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {viewingReport.areasCovered.map(area => (
                        <span key={area} className="px-3 py-1.5 bg-white text-slate-800 text-[10px] font-black border border-slate-200 rounded-lg shadow-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-12 py-10 border-t border-slate-100 bg-white flex justify-end items-center gap-6">
               <p className="text-slate-300 text-xs font-bold uppercase tracking-widest hidden md:block">Intelligence Hub AI Review System</p>
              <button 
                onClick={() => setViewingReport(null)}
                className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200"
              >
                收起报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
