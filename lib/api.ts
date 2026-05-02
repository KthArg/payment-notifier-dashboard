const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

const REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Error ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Contraseña incorrecta');
  }
  return res.json();
}

// ── Members ───────────────────────────────────────────────────────────────────
export interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  monthlyAmount: number;
  dueDay: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── SINPE Senders ─────────────────────────────────────────────────────────────
export type SenderStatus = 'unknown' | 'dismissed' | 'linked';

export interface SinpeSender {
  id: string;
  phoneNumber: string;
  fullName?: string;
  status: SenderStatus;
  memberId?: string;
  dismissedAt?: string;
  lastSeenAt: string;
  lastTransaction?: {
    id: string;
    amount: number;
    currency: string;
    bankName: string;
    transactionDate: string;
    senderName?: string;
  };
}

export const api = {
  sinpeSenders: {
    badge: () => request<{ data: Record<SenderStatus, number> }>('/api/sinpe-senders/badge').then(r => r.data),
    list: (status: SenderStatus) => request<{ data: SinpeSender[] }>(`/api/sinpe-senders?status=${status}`).then(r => r.data),
    dismiss: (id: string) => request<{ success: boolean }>(`/api/sinpe-senders/${id}/dismiss`, { method: 'POST' }),
    revert: (id: string) => request<{ success: boolean }>(`/api/sinpe-senders/${id}/revert`, { method: 'POST' }),
    link: (id: string, memberId: string) => request<{ success: boolean }>(`/api/sinpe-senders/${id}/link`, { method: 'POST', body: JSON.stringify({ memberId }) }),
  },
  members: {
    list: () => request<{ data: Member[] }>('/api/members').then(r => r.data),
    get: (id: string) => request<{ data: Member }>(`/api/members/${id}`).then(r => r.data),
    records: (id: string) => request<{ data: MonthlyRecord[] }>(`/api/members/${id}/records`).then(r => r.data),
    create: (dto: Omit<Member, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) =>
      request<{ data: Member }>('/api/members', { method: 'POST', body: JSON.stringify(dto) }).then(r => r.data),
    update: (id: string, dto: Partial<Member>) =>
      request<{ data: Member }>(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(dto) }).then(r => r.data),
    delete: (id: string) =>
      request<void>(`/api/members/${id}`, { method: 'DELETE' }),
    manualPay: (memberId: string, recordId: string, amountPaid: number, notes?: string) =>
      request<{ data: MonthlyRecord }>(`/api/members/${memberId}/records/${recordId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amountPaid, notes }),
      }).then(r => r.data),
  },

  reports: {
    current: () => request<{ data: ReportData }>('/api/reports/monthly').then(r => r.data),
    get: (year: number, month: number) =>
      request<{ data: ReportData }>(`/api/reports/monthly/${year}/${month}`).then(r => r.data),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MonthlyRecord {
  id: string;
  memberId: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid?: number;
  status: 'pending' | 'paid_on_time' | 'paid_late' | 'overdue';
  paidAt?: string;
  createdAt: string;
}

export interface MonthlyRecordWithMember extends MonthlyRecord {
  member: { id: string; fullName: string; phoneNumber: string; email?: string };
}

export interface ReportStats {
  month: number;
  year: number;
  totalMembers: number;
  paidOnTime: number;
  paidLate: number;
  overdue: number;
  pending: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface ReportData {
  stats: ReportStats;
  records: MonthlyRecordWithMember[];
}
