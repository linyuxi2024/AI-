
import React from 'react';
import { LayoutDashboard, Settings, History, BrainCircuit, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'history' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '概览 (Dashboard)' },
    { id: 'history', icon: History, label: '周报归档 (History)' },
    { id: 'settings', icon: Settings, label: '配置中心 (Settings)' },
  ] as const;

  return (
    <div className="w-64 bg-slate-900 h-screen text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <BrainCircuit className="text-blue-400 w-8 h-8" />
        <h1 className="text-xl font-bold tracking-tight">AI信息检索系统</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-medium">系统状态: 运行中</span>
          </div>
          <p className="text-[10px] text-slate-500">下次自动更新: 周一 10:00</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
