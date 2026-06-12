import { axiosClient } from '@/api/axiosClient';
import { env } from '@/config/env';
import { MOCK_ACTIVITY, mockDelay } from '@/mocks/data';
import type { ActivityItem } from '@/types/domain';

/** Dashboard aggregates: KPI tiles, finance pulse, overdue list and chart. */

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingApprovals: number;
  totalCollected: number;
  outstanding: number;
  dueToday: number;
  overdueCount: number;
  overdueTotal: number;
  invitesPending: number;
  invitesCompleted: number;
}

export interface OverdueItem {
  studentId: string;
  name: string;
  sequence: number;
  dueDate: string;
  amount: number;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  expected: number;
  collected: number;
}

const MOCK_STATS: DashboardStats = {
  totalStudents: 1248,
  activeStudents: 1042,
  pendingApprovals: 4,
  totalCollected: 412000,
  outstanding: 86500,
  dueToday: 2,
  overdueCount: 3,
  overdueTotal: 21500,
  invitesPending: 5,
  invitesCompleted: 18,
};

const MOCK_OVERDUE: OverdueItem[] = [
  { studentId: 'PA-1011', name: 'Ece Koç', sequence: 4, dueDate: '2026-02-12', amount: 6500 },
  { studentId: 'PA-1038', name: 'Selin Arslan', sequence: 4, dueDate: '2026-04-20', amount: 8000 },
  { studentId: 'PA-1043', name: 'Mert Yıldız', sequence: 4, dueDate: '2026-05-10', amount: 7000 },
];

const MOCK_MONTHLY: MonthlyPoint[] = [
  { month: '2026-01', label: 'Oca', expected: 14500, collected: 24000 },
  { month: '2026-02', label: 'Şub', expected: 25900, collected: 32500 },
  { month: '2026-03', label: 'Mar', expected: 24900, collected: 11000 },
  { month: '2026-04', label: 'Nis', expected: 24900, collected: 18000 },
  { month: '2026-05', label: 'May', expected: 10750, collected: 9500 },
  { month: '2026-06', label: 'Haz', expected: 39250, collected: 10800 },
];

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    if (env.useMocks) {
      return mockDelay(MOCK_STATS);
    }
    const { data } = await axiosClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  async activity(): Promise<ActivityItem[]> {
    if (env.useMocks) {
      return mockDelay(MOCK_ACTIVITY);
    }
    const { data } = await axiosClient.get<ActivityItem[]>('/dashboard/activity');
    return data;
  },

  async overdue(): Promise<OverdueItem[]> {
    if (env.useMocks) {
      return mockDelay(MOCK_OVERDUE);
    }
    const { data } = await axiosClient.get<OverdueItem[]>('/dashboard/overdue');
    return data;
  },

  async monthly(): Promise<MonthlyPoint[]> {
    if (env.useMocks) {
      return mockDelay(MOCK_MONTHLY);
    }
    const { data } = await axiosClient.get<MonthlyPoint[]>('/dashboard/monthly');
    return data;
  },
};
