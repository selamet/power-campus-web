import { axiosClient } from '@/api/axiosClient';
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

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const { data } = await axiosClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  async activity(): Promise<ActivityItem[]> {
    const { data } = await axiosClient.get<ActivityItem[]>('/dashboard/activity');
    return data;
  },

  async overdue(): Promise<OverdueItem[]> {
    const { data } = await axiosClient.get<OverdueItem[]>('/dashboard/overdue');
    return data;
  },

  async monthly(): Promise<MonthlyPoint[]> {
    const { data } = await axiosClient.get<MonthlyPoint[]>('/dashboard/monthly');
    return data;
  },
};
