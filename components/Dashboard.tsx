
import React, { useState } from 'react';
import { WeeklyReport, AppConfig } from '../types';
import { IntelligenceService } from '../services/geminiService';
import { RefreshCw, Send, CheckCircle2, AlertCircle, ExternalLink, FileText, Settings as ConfigIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  latestReport: WeeklyReport | null;
  config: AppConfig;
  onReportGenerated: (report: WeeklyReport) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ latestReport, config, onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus(`正在执行全量引证检索：正文将自动生成可跳转链接，并汇总至引证列表...`);
    try {
      const service = new IntelligenceService();
      const report = await service.generateWeeklyReport(config);
      onReportGenerated(report);
      setStatus("情报研报已生成！正文含可点击链接，引证列表已更新。");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus("检索失败，请检查 API 配置或网络连通性。");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSend = async () => {
    if (!latestReport || !config.webhookUrl) return;
    setLoading(true);
    setStatus("正在推送研报至配置的 Webhook 端点...");
    try {
      const service = new IntelligenceService();
      await service.sendToWebhook(latestReport, config.webhookUrl);
      setStatus("推送成功！");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus("推送失败，请确认 Webhook 地址有效性。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">情报概览</h2>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-200">
              <ConfigIcon size={12} />
              {config.name}
            </div>
            <p className="text-slate-500 text-sm font-medium">
              检索模式：数据源依次检索 • 过滤非检索时间内的信息
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualSend}
            disabled={loading || !latestReport || !config.webhookUrl}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all text-sm font-bold shadow-sm"
          >
            <Send size={18} className="text-slate-400" />
            手动推送
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-bold shadow-xl shadow-blue-100 active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            执行全链接情报检索
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border shadow-sm animate-in slide-in-from-top-2 duration-300 ${
          status.includes('失败') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          {status.includes('失败') ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="font-bold">{status}</span>
        </div>
      )}

      {!latestReport ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-24 text-center space-y-6 shadow-sm border-dashed">
          <div className="bg-slate-50 w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100">
            <FileText className="text-slate-200" size={56} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">等待发起全量检索</h3>
            <p className="text-slate-400 max-w-md mx-auto text-base leading-relaxed font-medium">
              研报将包含<b>直接跳转链接</b>，所有在分析中涉及的数据源网址都将完整展示。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-200">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">情报分析周报</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
                      检索执行于: {new Date(latestReport.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-10 md:p-16">
                <div className="prose prose-slate max-w-none 
                  prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                  prose-h1:text-5xl prose-h1:mb-12 prose-h1:border-b-8 prose-h1:border-blue-600 prose-h1:pb-4 prose-h1:leading-tight
                  prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:border-l-8 prose-h2:border-blue-600 prose-h2:pl-6 prose-h2:bg-slate-50/50 prose-h2:py-2
                  prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-6 prose-h3:text-blue-700
                  prose-p:text-slate-600 prose-p:text-lg prose-p:leading-[1.8] prose-p:mb-8
                  prose-li:text-slate-600 prose-li:text-lg prose-li:mb-4
                  prose-strong:text-slate-900 prose-strong:font-black
                  prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
                  prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                  prose-hr:my-16 prose-hr:border-slate-100">
                  <ReactMarkdown 
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                    }}
                  >
                    {latestReport.summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
                <ExternalLink size={16} className="text-blue-500" />
                权威引证清单 ({latestReport.sources.length})
              </h4>
              <p className="text-[10px] text-slate-400 mb-6 font-medium leading-relaxed">
                以下为本次研报中涉及到的<b>所有原始信源与数据出处</b>，点击即可溯源：
              </p>
              <div className="space-y-4">
                {latestReport.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all border border-slate-100 group"
                  >
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-tight">
                      {src.title}
                    </p>
                    <div className="flex items-center gap-2 mt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <p className="text-[10px] text-slate-400 truncate font-mono tracking-tighter">{src.url}</p>
                    </div>
                  </a>
                ))}
                {latestReport.sources.length === 0 && (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs italic">暂未检索到可跳转的外部链接。</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h4 className="font-black text-slate-900 mb-6 text-[10px] uppercase tracking-[0.25em]">关注关键词</h4>
              <div className="flex flex-wrap gap-2.5">
                {latestReport.areasCovered.map((area, idx) => (
                  <span key={idx} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-xl border border-emerald-100 uppercase tracking-tight shadow-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
