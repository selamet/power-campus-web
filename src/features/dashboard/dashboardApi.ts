import { axiosClient } from '@/api/axiosClient';
import { env } from '@/config/env';
import { MOCK_ACTIVITY, mockDelay } from '@/mocks/data';
import type { ActivityItem } from '@/types/domain';

/** Dashboard aggregates: KPI tiles and the recent-activity feed. */

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingApprovals: number;
  totalCollected: number;
  outstanding: number;
}

const MOCK_STATS: DashboardStats = {
  totalStudents: 1248,
  activeStudents: 1042,
  pendingApprovals: 4,
  totalCollected: 412000,
  outstanding: 86500,
};

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
};
