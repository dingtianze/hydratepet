import { useWaterStore } from '@stores/waterStore';
import { usePetStore } from '@stores/petStore';
import type { WaterType } from '../types/index';

const QUICK_AMOUNTS = [100, 200, 250, 500];

const WATER_TYPES: { type: WaterType; label: string; emoji: string }[] = [
  { type: 'water', label: '白开水', emoji: '💧' },
  { type: 'tea', label: '茶', emoji: '🍵' },
  { type: 'coffee', label: '咖啡', emoji: '☕' },
  { type: 'juice', label: '果汁', emoji: '🧃' },
  { type: 'milk', label: '牛奶', emoji: '🥛' },
  { type: 'other', label: '其他', emoji: '🫖' },
];

export function QuickAddWater() {
  const { addRecord } = useWaterStore();
  const { feedPet, addGrowth } = usePetStore();

  const handleAddWater = (amount: number, type: WaterType = 'water') => {
    addRecord({
      userId: 'current-user',
      amount,
      drinkTime: new Date().toISOString(),
      type,
      petReaction: getPetReaction(amount),
    });

    // Update pet
    feedPet(amount);
    addGrowth(Math.floor(amount / 10));
  };

  return (
    <div className="space-y-4">
      {/* Quick amount buttons */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleAddWater(amount)}
            className="btn-water py-3 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            +{amount}ml
          </button>
        ))}
      </div>

      {/* Water type buttons */}
      <div className="grid grid-cols-3 gap-2">
        {WATER_TYPES.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => handleAddWater(250, type)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('customAmount') as HTMLInputElement;
          const amount = parseInt(input.value, 10);
          if (amount > 0) {
            handleAddWater(amount);
            input.value = '';
          }
        }}
        className="flex gap-2"
      >
        <input
          type="number"
          name="customAmount"
          placeholder="自定义量 (ml)"
          min="1"
          max="2000"
          className="input flex-1"
        />
        <button type="submit" className="btn-primary px-6">
          确定
        </button>
      </form>
    </div>
  );
}

function getPetReaction(amount: number): string {
  if (amount >= 500) return '哇！好满足！♥️';
  if (amount >= 250) return '呼~好喝！';
  if (amount >= 100) return '谢谢主人！';
  return '嘞呗嘞呗~';
}
