import { Member, Payment, Plan, DashboardStats, ActivityItem, MessageTemplate, MessageLog, User, GymClass, ClassBooking, AttendanceRecord, Invoice, InvoiceSettings } from '../types';

const API_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const defaultHeaders = getAuthHeaders();
  const mergedOptions = {
    ...options,
    headers: { ...defaultHeaders, ...(options?.headers || {}) },
  };

  const res = await fetch(url, mergedOptions);

  if (res.status === 401) {
    // Token expired or invalid — auto-logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as any;
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>(`${API_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Users (admin)
  getUsers: () => request<User[]>(`${API_URL}/users`),

  createUser: (user: { username: string; password: string; fullName: string; role: string; phone?: string; email?: string }) =>
    request<User>(`${API_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  updateUser: (id: string, updates: Partial<User & { password?: string; isActive?: boolean }>) =>
    request<{ message: string }>(`${API_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteUser: (id: string) =>
    request<void>(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  // Members
  getMembers: () =>
    request<Member[]>(`${API_URL}/members`),

  getMember: (id: string) =>
    request<Member>(`${API_URL}/members/${id}`),

  addMember: (member: Partial<Member>) =>
    request<Member>(`${API_URL}/members`, {
      method: 'POST',
      body: JSON.stringify(member),
    }),

  updateMember: (id: string, member: Partial<Member>) =>
    request<Member>(`${API_URL}/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),

  deleteMember: (id: string) =>
    request<void>(`${API_URL}/members/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (memberId?: string) =>
    request<Payment[]>(`${API_URL}/payments${memberId ? `?member_id=${memberId}` : ''}`),

  addPayment: (payment: { memberId: string; planId?: string; amount: number; method: string; notes?: string }) =>
    request<Payment>(`${API_URL}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    }),

  getPlans: () =>
    request<Plan[]>(`${API_URL}/payments/plans`),

  addPlan: (plan: { id?: string; name: string; durationMonths: number; price: number }) =>
    request<Plan>(`${API_URL}/payments/plans`, {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  deletePlan: (id: string) =>
    request<void>(`${API_URL}/payments/plans/${id}`, { method: 'DELETE' }),

  deletePayment: (id: string) =>
    request<void>(`${API_URL}/payments/${id}`, { method: 'DELETE' }),

  getRevenueSummary: () =>
    request<{ totalRevenue: number; thisMonthRevenue: number; lastMonthRevenue: number; totalPayments: number; thisMonthPayments: number; methods: any[] }>(`${API_URL}/payments/summary`),

  // Dashboard
  getDashboardStats: () =>
    request<DashboardStats>(`${API_URL}/dashboard/stats`),

  getExpiringMembers: () =>
    request<Member[]>(`${API_URL}/dashboard/expiring`),

  getActivity: (limit?: number) =>
    request<ActivityItem[]>(`${API_URL}/dashboard/activity${limit ? `?limit=${limit}` : ''}`),

  getRevenueChart: () =>
    request<{ month: string; revenue: number; payment_count: number }[]>(`${API_URL}/dashboard/revenue-chart`),

  // WhatsApp
  getWhatsAppStatus: () =>
    request<{ ready: boolean; qrCode: string | null }>(`${API_URL}/whatsapp/status`),

  sendWhatsApp: (to: string, message: string, memberId?: string, templateId?: string) =>
    request<{ success: boolean }>(`${API_URL}/whatsapp/send`, {
      method: 'POST',
      body: JSON.stringify({ to, message, memberId, templateId }),
    }),

  sendBulkWhatsApp: (memberIds: string[], templateId: string) =>
    request<{ results: { memberId: string; status: string; error?: string }[] }>(`${API_URL}/whatsapp/send-bulk`, {
      method: 'POST',
      body: JSON.stringify({ memberIds, templateId }),
    }),

  getTemplates: () =>
    request<MessageTemplate[]>(`${API_URL}/whatsapp/templates`),

  saveTemplate: (template: { id?: string; name: string; content: string }) =>
    request<MessageTemplate>(`${API_URL}/whatsapp/templates`, {
      method: 'POST',
      body: JSON.stringify(template),
    }),

  deleteTemplate: (id: string) =>
    request<void>(`${API_URL}/whatsapp/templates/${id}`, { method: 'DELETE' }),

  getMessageLog: (limit?: number) =>
    request<MessageLog[]>(`${API_URL}/whatsapp/log${limit ? `?limit=${limit}` : ''}`),

  // Classes
  getClasses: () => request<GymClass[]>(`${API_URL}/classes`),
  getTodayClasses: () => request<GymClass[]>(`${API_URL}/classes/today`),
  getClassSchedule: (classId: string, date: string) =>
    request<{ class: GymClass; bookings: ClassBooking[]; booked: number }>(`${API_URL}/classes/${classId}/schedule?date=${date}`),
  createClass: (data: { name: string; trainerId?: string; dayOfWeek: string; startTime: string; endTime: string; maxCapacity?: number }) =>
    request<GymClass>(`${API_URL}/classes`, { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: string, data: any) =>
    request<GymClass>(`${API_URL}/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: string) =>
    request<{ message: string }>(`${API_URL}/classes/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (classId: string, memberId: string, bookingDate: string) =>
    request<ClassBooking>(`${API_URL}/bookings`, { method: 'POST', body: JSON.stringify({ classId, memberId, bookingDate }) }),
  cancelBooking: (id: string) =>
    request<{ message: string }>(`${API_URL}/bookings/${id}/cancel`, { method: 'PUT' }),
  checkinBooking: (id: string) =>
    request<{ message: string; attendanceId: string }>(`${API_URL}/bookings/${id}/checkin`, { method: 'PUT' }),
  getMemberBookings: (memberId: string) =>
    request<ClassBooking[]>(`${API_URL}/bookings/member/${memberId}`),

  // Check-in & Attendance
  quickCheckin: (memberId: string) =>
    request<any>(`${API_URL}/checkin`, { method: 'POST', body: JSON.stringify({ memberId }) }),
  qrScan: (memberId: string) =>
    request<any>(`${API_URL}/checkin/scan`, { method: 'POST', body: JSON.stringify({ memberId }) }),
  getQrData: (memberId: string) =>
    request<{ qrData: string; member: any }>(`${API_URL}/checkin/qr/${memberId}`),
  getAttendance: (filters?: { date?: string; memberId?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.date) params.set('date', filters.date);
    if (filters?.memberId) params.set('memberId', filters.memberId);
    if (filters?.limit) params.set('limit', String(filters.limit));
    return request<AttendanceRecord[]>(`${API_URL}/checkin/attendance?${params}`);
  },
  getTodayCheckinCount: () =>
    request<{ count: number }>(`${API_URL}/checkin/attendance/today-count`),

  // Invoices
  getInvoices: (month?: string, memberId?: string) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (memberId) params.set('memberId', memberId);
    return request<Invoice[]>(`${API_URL}/invoices?${params}`);
  },
  getInvoice: (id: string) => request<Invoice>(`${API_URL}/invoices/${id}`),
  getInvoiceSettings: () => request<InvoiceSettings>(`${API_URL}/invoices/settings/all`),
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) =>
    request<{ message: string }>(`${API_URL}/invoices/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
};
