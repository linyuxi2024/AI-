
export interface InfoSource {
  id: string;
  name: string;
  url: string;
  target: string;
  enabled: boolean;
}

export interface FocusArea {
  id: string;
  keyword: string;
  enabled: boolean;
}

export interface AppConfig {
  id: string;
  name: string;
  sources: InfoSource[];
  areas: FocusArea[];
  lookbackDays: number;
  updateDay: number; // 0-6 (Sunday-Saturday)
  updateTime: string; // HH:mm
  webhookUrl?: string;
  autoSend: boolean;
}

export interface WeeklyReport {
  id: string;
  timestamp: string;
  summary: string;
  sources: { title: string; url: string }[];
  areasCovered: string[];
  configId: string; // Track which config generated this report
  configName: string; // Readable name at generation time
}
