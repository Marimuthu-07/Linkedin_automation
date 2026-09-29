import {
  DashboardOverview,
  NetworkingContact,
  NetworkingStats,
  NetworkingMessage,
  PaginatedResponse,
  ContentPost,
  ContentRevision,
  ContentMetric,
  ContentStats,
  Lead,
  Internship,
  AnalyticsSnapshot,
  Task,
  NotificationItem,
  UserSettings,
} from '@linkedin-growth/shared';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; mode: string; database: string }>('/health'),

  // Dashboard
  getDashboardOverview: () => request<DashboardOverview>('/dashboard/overview'),

  // Networking
  getNetworkingStats: () => request<NetworkingStats>('/networking/stats'),
  getNetworkingContacts: (params?: {
    status?: string;
    category?: string;
    company?: string;
    search?: string;
    followUpDue?: string | boolean;
    followUpFilter?: string;
    page?: number;
    limit?: number;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<PaginatedResponse<NetworkingContact>>(`/networking${query ? `?${query}` : ''}`);
  },
  getContactById: (id: string) =>
    request<NetworkingContact>(`/networking/${id}`),
  createContact: (data: any) =>
    request<NetworkingContact>('/networking', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: any) =>
    request<NetworkingContact>(`/networking/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateContactStatus: (id: string, status: string) =>
    request<NetworkingContact>(`/networking/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteContact: (id: string) =>
    request<{ id: string; message: string }>(`/networking/${id}`, { method: 'DELETE' }),
  generateContactDraft: (id: string, type?: string) =>
    request<{
      contact: NetworkingContact;
      message: NetworkingMessage;
      draft: string;
      personalizationBasis: string[];
      isLimitedPersonalization: boolean;
      toneNotes?: string;
      guidance: string;
    }>(`/networking/${id}/generate-message`, { method: 'POST', body: JSON.stringify({ type }) }),
  createContactMessage: (id: string, data: any) =>
    request<NetworkingMessage>(`/networking/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  updateContactMessage: (id: string, messageId: string, data: any) =>
    request<NetworkingMessage>(`/networking/${id}/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteContactMessage: (id: string, messageId: string) =>
    request<{ id: string; message: string }>(`/networking/${id}/messages/${messageId}`, { method: 'DELETE' }),

  // Content
  getContentStats: () => request<ContentStats>('/content/stats'),
  getContentPosts: (params?: {
    status?: string;
    category?: string;
    search?: string;
    scheduled?: string | boolean;
    published?: string | boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<PaginatedResponse<ContentPost>>(`/content${query ? `?${query}` : ''}`);
  },
  getContentPostById: (id: string) =>
    request<ContentPost>(`/content/${id}`),
  createContentPost: (data: any) =>
    request<ContentPost>('/content', { method: 'POST', body: JSON.stringify(data) }),
  updateContentPost: (id: string, data: any) =>
    request<ContentPost>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateContentStatus: (id: string, status: string, extra?: { externalPostUrl?: string; publishedAt?: string }) =>
    request<ContentPost>(`/content/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
  deleteContentPost: (id: string) =>
    request<{ id: string; message: string }>(`/content/${id}`, { method: 'DELETE' }),
  generatePostDraft: (id: string, options?: { desiredLength?: string }) =>
    request<{
      post: ContentPost;
      draft: string;
      generated: any;
      warnings: string[];
      isLimitedContext: boolean;
    }>(`/content/${id}/generate`, { method: 'POST', body: JSON.stringify(options || {}) }),
  regeneratePostDraft: (id: string, options?: { desiredLength?: string; tone?: string; autoApply?: boolean }) =>
    request<{
      currentVersion: any;
      newVersion: any;
      post?: ContentPost;
      warnings: string[];
      isLimitedContext: boolean;
    }>(`/content/${id}/regenerate`, { method: 'POST', body: JSON.stringify(options || {}) }),
  generatePostHooks: (id: string) =>
    request<{ hooks: string[]; rationale?: string; post: ContentPost }>(`/content/${id}/generate-hooks`, {
      method: 'POST',
    }),
  generatePostCta: (id: string) =>
    request<{ ctas: string[] }>(`/content/${id}/generate-cta`, { method: 'POST' }),
  generatePostHashtags: (id: string) =>
    request<{ hashtags: string[] }>(`/content/${id}/generate-hashtags`, { method: 'POST' }),
  getContentRevisions: (id: string) =>
    request<ContentRevision[]>(`/content/${id}/revisions`),
  publishRecordPost: (id: string, data?: { publishedAt?: string; externalPostUrl?: string }) =>
    request<ContentPost>(`/content/${id}/publish-record`, { method: 'POST', body: JSON.stringify(data || {}) }),
  getContentMetrics: (id: string) =>
    request<{ snapshots: ContentMetric[]; latest: ContentMetric | null; totalSnapshots: number }>(`/content/${id}/metrics`),
  recordContentMetrics: (id: string, metrics: any) =>
    request<{ snapshot: ContentMetric; post: ContentPost }>(`/content/${id}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metrics),
    }),
  generateStandaloneContent: (data: any) =>
    request<{
      title: string;
      hook: string;
      body: string;
      cta: string;
      hashtags: string[];
      suggestedHashtags: string[];
      alternativeHooks: string[];
      personalizationBasis: string[];
      isLimitedContext: boolean;
      warnings: string[];
    }>('/content/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Legacy alias
  generateContent: (data: any) =>
    request<any>('/content/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContentMetrics: (id: string, metrics: any) =>
    request<any>(`/content/${id}/metrics`, { method: 'POST', body: JSON.stringify(metrics) }),


  // Leads
  getLeads: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Lead[]>(`/leads${query ? `?${query}` : ''}`);
  },
  createLead: (data: any) =>
    request<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) =>
    request<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: string) =>
    request<{ id: string }>(`/leads/${id}`, { method: 'DELETE' }),
  scoreLead: (factors: any) =>
    request<any>('/leads/score', { method: 'POST', body: JSON.stringify(factors) }),
  generateLeadOutreach: (id: string) =>
    request<{ lead: Lead; draft: string; breakdown: any; guidance: string }>(`/leads/${id}/generate-outreach`, { method: 'POST' }),

  // Internships
  getInternships: (params?: { status?: string; remote?: string; minScore?: string; role?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Internship[]>(`/internships${query ? `?${query}` : ''}`);
  },
  createInternship: (data: any) =>
    request<Internship>('/internships', { method: 'POST', body: JSON.stringify(data) }),
  updateInternship: (id: string, data: any) =>
    request<Internship>(`/internships/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteInternship: (id: string) =>
    request<{ id: string }>(`/internships/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalyticsSnapshots: (days: number = 30) =>
    request<AnalyticsSnapshot[]>(`/analytics/snapshots?days=${days}`),
  recordAnalyticsSnapshot: (data: any) =>
    request<AnalyticsSnapshot>('/analytics/snapshots', { method: 'POST', body: JSON.stringify(data) }),
  getContentPerformance: () =>
    request<{
      allPosts: ContentPost[];
      topByImpressions: ContentPost[];
      topByEngagementRate: ContentPost[];
      topByComments: ContentPost[];
      categoryStats: Array<{ category: string; postCount: number; totalImpressions: number; avgEngagementRate: number | null }>;
      formulaExplanation: string;
    }>('/analytics/content-performance'),

  // Tasks
  getTasks: (params?: { status?: string; type?: string; priority?: string; dueToday?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (data: any) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<{ id: string }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),

  // Settings
  getSettings: () => request<UserSettings>('/settings'),
  updateSettings: (data: Partial<UserSettings>) =>
    request<UserSettings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};
