import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WaterRecord } from '../types/index';

interface WaterState {
  records: WaterRecord[];
  todayAmount: number;
  dailyGoal: number;
  isLoading: boolean;
  
  // Actions
  setRecords: (records: WaterRecord[]) => void;
  setLoading: (value: boolean) => void;
  setDailyGoal: (goal: number) => void;
  addRecord: (record: Omit<WaterRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, updates: Partial<WaterRecord>) => void;
  getTodayRecords: () => WaterRecord[];
  getWeekRecords: () => WaterRecord[];
  getTodayAmount: () => number;
  getProgressPercentage: () => number;
  isGoalReached: () => boolean;
}

const defaultDailyGoal = 2000; // ml

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      records: [],
      todayAmount: 0,
      dailyGoal: defaultDailyGoal,
      isLoading: false,

      setRecords: (records) => {
        set({ records });
        // Recalculate today amount
        const todayRecords = get().getTodayRecords();
        const todayAmount = todayRecords.reduce((sum, r) => sum + r.amount, 0);
        set({ todayAmount });
      },
      
      setLoading: (value) => set({ isLoading: value }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      addRecord: (record) => {
        const newRecord: WaterRecord = {
          ...record,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const newRecords = [newRecord, ...state.records];
          const todayAmount = newRecords
            .filter((r) => isToday(r.drinkTime))
            .reduce((sum, r) => sum + r.amount, 0);
          return { records: newRecords, todayAmount };
        });
      },

      deleteRecord: (id) => {
        set((state) => {
          const newRecords = state.records.filter((r) => r.id !== id);
          const todayAmount = newRecords
            .filter((r) => isToday(r.drinkTime))
            .reduce((sum, r) => sum + r.amount, 0);
          return { records: newRecords, todayAmount };
        });
      },

      updateRecord: (id, updates) => {
        set((state) => {
          const newRecords = state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          );
          const todayAmount = newRecords
            .filter((r) => isToday(r.drinkTime))
            .reduce((sum, r) => sum + r.amount, 0);
          return { records: newRecords, todayAmount };
        });
      },

      getTodayRecords: () => {
        return get().records.filter((r) => isToday(r.drinkTime));
      },

      getWeekRecords: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return get().records.filter((r) => new Date(r.drinkTime) >= weekAgo);
      },

      getTodayAmount: () => {
        return get().todayAmount;
      },

      getProgressPercentage: () => {
        const { todayAmount, dailyGoal } = get();
        return Math.min(100, Math.round((todayAmount / dailyGoal) * 100));
      },

      isGoalReached: () => {
        return get().todayAmount >= get().dailyGoal;
      },
    }),
    {
      name: 'hydratepet-water-storage',
      partialize: (state) => ({
        records: state.records,
        dailyGoal: state.dailyGoal,
      }),
    }
  )
);

// Helper function
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
