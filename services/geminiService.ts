
import { GoogleGenAI, Type } from "@google/genai";
import { AppConfig, WeeklyReport, InfoSource } from "../types";

export class IntelligenceService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async suggestFocusAreas(sources: InfoSource[]): Promise<string[]> {
    if (sources.length === 0) return [];
    
    const sourceContext = sources
      .filter(s => s.name || s.target)
      .map(s => `${s.name}: ${s.target}`)
      .join("\n");

    if (!sourceContext) return [];

    const prompt = `
      Based on the following information sources and their targets, suggest 5 relevant high-level industry focus areas or keywords that the user should track.
      
      Sources:
      ${sourceContext}
      
      Return the result as a JSON array of strings in Simplified Chinese.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Failed to suggest focus areas:", error);
      return [];
    }
  }

  async generateWeeklyReport(config: AppConfig): Promise<WeeklyReport> {
    const activeAreas = config.areas.filter(a => a.enabled).map(a => a.keyword);
    const activeSources = config.sources.filter(s => s.enabled);
    
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() - config.lookbackDays);
    
    const dateStr = today.toISOString().split('T')[0];
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    const sourceInstructions = activeSources.map((s, index) => 
      `信源 [${index + 1}]: ${s.name} (${s.url})，检索目标: ${s.target || '最新行业动态'}`
    ).join("\n");

    const prompt = `
      今天是 ${dateStr}。请作为一名高级行业分析师执行情报检索任务。
      
      【核心检索指令】
      请使用 Google 搜索工具针对以下每一个预设信源及其网址进行**逐个深度检索**：
      ${sourceInstructions}
      
      【严格过滤与分析要求】
      1. **时间过滤**：只保留发布时间在 ${thresholdStr} 之后的内容。
      2. **关键词过滤**：重点分析与 ${activeAreas.join(", ")} 相关的内容。
      
      【输出架构】
      1. # 行业智能情报深度研报
      2. ## 执行摘要 (Executive Summary)
      3. ## 分信源动态详析 (逐一详述各信源检索到的具体内容)
      4. ## 核心洞察与预测
      5. ## 战略性行动建议
      
      【链接直跳与引证规则】
      - **全量直显引证**：每一项具体数据、新闻或动态后，必须紧跟其对应的 Markdown 链接（格式：[标题](https://...)）。
      - **绝对路径要求**：所有 URL 必须包含 http:// 或 https:// 协议头，确保点击后可直接跳转。
      - **引证同步**：你在正文中引用的每一个链接，都必须确保能被系统识别并汇总到侧边栏。

      语言：简体中文。
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const reportText = response.text || "";
      const sourceMap = new Map<string, { title: string; url: string }>();
      
      // 1. 从 Google Search 元数据中提取引证 (基础数据源)
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          const url = chunk.web.uri.trim();
          if (!sourceMap.has(url)) {
            sourceMap.set(url, {
              title: chunk.web.title?.trim() || "参考资料",
              url: url,
            });
          }
        }
      });

      // 2. 解析正文中实际出现的 Markdown 链接，确保清单包含正文所有涉及的 URL
      // 正则匹配 [标题](URL)
      const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      while ((match = mdLinkRegex.exec(reportText)) !== null) {
        const title = match[1].trim();
        const url = match[2].trim();
        // 如果侧边栏还没有这个 URL，或者这个 URL 只有占位标题，则更新它
        if (!sourceMap.has(url) || sourceMap.get(url)?.title === "参考资料") {
          sourceMap.set(url, { title, url });
        }
      }

      return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        summary: reportText,
        sources: Array.from(sourceMap.values()),
        areasCovered: activeAreas,
        configId: config.id,
        configName: config.name,
      };
    } catch (error) {
      console.error("Intelligence gathering failed:", error);
      throw error;
    }
  }

  async sendToWebhook(report: WeeklyReport, webhookUrl: string) {
    console.log(`Sending report to webhook: ${webhookUrl}`);
    return new Promise((resolve) => setTimeout(resolve, 800));
  }
}
