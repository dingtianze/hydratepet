import { useWaterStore } from '@stores/waterStore';
import { useMemo } from 'react';
import type { WaterRecord, WaterType } from '../types/index';

const WATER_TYPE_ICONS: Record<WaterType, string> = {
  water: '💧',
  tea: '🍵',
  coffee: '☕',
  juice: '🧃',
  milk: '🥛',
  other: '🫖',
};

const WATER_TYPE_LABELS: Record<WaterType, string> = {
  water: '白开水',
  tea: '茶',
  coffee: '咖啡',
  juice: '果汁',
  milk: '牛奶',
  other: '其他',
};

export function Records() {
  const { records, getTodayRecords, getWeekRecords, deleteRecord, isGoalReached } = useWaterStore();

  const todayRecords = getTodayRecords();
  const weekRecords = getWeekRecords();

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date().getDay();
    
    return Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7;
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const dayRecords = records.filter((r) => {
        const recordDate = new Date(r.drinkTime);
        return (
          recordDate.getDate() === date.getDate() &&
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const total = dayRecords.reduce((sum, r) => sum + r.amount, 0);
      
      return {
        day: days[dayIndex],
        amount: total,
        fullDate: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      };
    });
  }, [records]);

  const maxAmount = Math.max(...weeklyStats.map((s) => s.amount), 1000);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">饮水记录</h1>

      {/* Weekly Chart */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          近7天饮水情况
        </h2>
        <div className="flex items-end justify-between h-40 gap-2">
          {weeklyStats.map((stat, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-water-400 rounded-t-md transition-all duration-500 relative group"
                style={{ height: `${(stat.amount / maxAmount) * 100}%` }}
              >
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {stat.fullDate}
                  <br />
                  {stat.amount}ml
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-2">{stat.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>周饮水: {weekRecords.reduce((sum, r) => sum + r.amount, 0)}ml</span>
          <span>次数: {weekRecords.length}次</span>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          今日摘要
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-water-50 dark:bg-water-900/20 rounded-lg">
            <p className="text-2xl font-bold text-water-600">
              {todayRecords.length}
            </p>
            <p className="text-xs text-gray-500">饮水次数</p>
          </div>
          <div className="p-3 bg-water-50 dark:bg-water-900/20 rounded-lg">
            <p className="text-2xl font-bold text-water-600">
              {todayRecords.reduce((sum, r) => sum + r.amount, 0)}
            </p>
            <p className="text-xs text-gray-500">总量 (ml)</p>
          </div>
          <div className="p-3 bg-water-50 dark:bg-water-900/20 rounded-lg">
            <p className="text-2xl font-bold text-water-600">
              {todayRecords.length > 0
                ? Math.round(
                    todayRecords.reduce((sum, r) => sum + r.amount, 0) /
                      todayRecords.length
                  )
                : 0}
            </p>
            <p className="text-xs text-gray-500">平均 (ml)</p>
          </div>
        </div>
      </div>

      {/* Today's Records List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          今日详情
        </h2>
        
        {todayRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl">💧</span>
            <p className="mt-2">今天还没有记录，快来喝水吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayRecords
              .sort((a, b) => new Date(b.drinkTime).getTime() - new Date(a.drinkTime).getTime())
              .map((record) => (
                <RecordItem
                  key={record.id}
                  record={record}
                  onDelete={deleteRecord}
                />
              ))}
          </div>
        )}

        {isGoalReached() && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">
              🎉 恭喜你完成今日目标！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordItem({
  record,
  onDelete,
}: {
  record: WaterRecord;
  onDelete: (id: string) => void;
}) {
  const time = new Date(record.drinkTime).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{WATER_TYPE_ICONS[record.type]}</span>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {record.amount}ml {WATER_TYPE_LABELS[record.type]}
          </p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {record.petReaction && (
          <span className="text-sm text-primary-600 dark:text-primary-400">
            {record.petReaction}
          </span>
        )}
        <button
          onClick={() => onDelete(record.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="删除"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
