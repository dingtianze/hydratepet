import { useState, useRef } from 'react';
import { shareApi } from '@services/api';

interface ShareCardProps {
  petName: string;
  petStage: string;
  todayAmount: number;
  goalReached: boolean;
  streakDays: number;
}

export function ShareCard({ petName, petStage, todayAmount, goalReached, streakDays }: ShareCardProps) {
  const [showCard, setShowCard] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stageEmoji: Record<string, string> = {
    egg: '🥚',
    baby: '👶',
    child: '👦',
    teen: '💁',
    adult: '👨‍🦰',
  };

  async function handleShare() {
    setShowCard(true);
    setGenerating(true);
    try {
      await shareApi.generate();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  async function downloadCard() {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `hydratepet-share-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function shareToNative() {
    const text = `我的像素宠物 ${petName} 今天喝了 ${todayAmount}ml 水！${goalReached ? '达标啦🎉' : ''} 连续打卡 ${streakDays} 天🔥`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HydratePet 喝水打卡',
          text,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板！');
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
      >
        <span>📤</span>
        分享成就
      </button>

      {showCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCard(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{stageEmoji[petStage] || '💧'}</div>
                  <div className="text-lg font-bold">{petName}</div>
                  <div className="text-sm opacity-80">深海霸主的养成日记</div>
                </div>

                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{todayAmount}<span className="text-lg">ml</span></div>
                    <div className="text-sm opacity-90">今日饮水量</div>
                  </div>
                </div>

                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-xl font-bold">{streakDays}天</div>
                    <div className="text-xs opacity-80">连续打卡</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{goalReached ? '✅' : '⏳'}</div>
                    <div className="text-xs opacity-80">目标状态</div>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs opacity-70">
                  HydratePet · 像素宠物喝水助手
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={shareToNative}
                className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                分享
              </button>
              <button
                onClick={downloadCard}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                保存图片
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
