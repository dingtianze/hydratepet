import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { useUserStore } from '@stores/userStore';

export function Welcome() {
  const navigate = useNavigate();
  const { isLoading, checkAuth } = useUserStore();
  const [animationStep, setAnimationStep] = useState(0);

  // Check if already authenticated
  useEffect(() => {
    const init = async () => {
      const authenticated = await checkAuth();
      if (authenticated) {
        navigate('/', { replace: true });
      }
    };
    init();
  }, [checkAuth, navigate]);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStep(1), 500);
    const timer2 = setTimeout(() => setAnimationStep(2), 1000);
    const timer3 = setTimeout(() => setAnimationStep(3), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleStart = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-bounce">
            <div className="w-16 h-16 mx-auto bg-water-500 rounded-lg flex items-center justify-center">
              <span className="text-3xl">💧</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 px-6">
      {/* Logo Section */}
      <div className="text-center mb-8">
        {/* Pixel Pet Avatar */}
        <div
          className={`
            relative mx-auto mb-6 transition-all duration-700 transform
            ${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `}
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-water-400 to-water-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
            <div className="relative">
              {/* Simple pixel pet face */}
              <div className="text-6xl">🐱</div>
              {/* Water drop decoration */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-water-300 rounded-full animate-pulse">
                💧
              </div>
            </div>
          </div>
          {/* Pixel decorations */}
          <div
            className={`
              absolute -left-4 top-1/2 w-4 h-4 bg-pet-happy rounded transition-all duration-500 delay-300
              ${animationStep >= 2 ? 'opacity-100' : 'opacity-0'}
            `}
          />
          <div
            className={`
              absolute -right-4 top-1/2 w-4 h-4 bg-water-400 rounded transition-all duration-500 delay-500
              ${animationStep >= 2 ? 'opacity-100' : 'opacity-0'}
            `}
          />
          <div
            className={`
              absolute left-1/2 -top-4 w-3 h-3 bg-primary-400 rounded transition-all duration-500 delay-700
              ${animationStep >= 2 ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Brand Name */}
        <h1
          className={`
            text-4xl font-bold text-gray-900 dark:text-white mb-2 pixel-text transition-all duration-700 delay-200
            ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <span className="text-water-500">Hydrate</span>
          <span className="text-primary-600">Pet</span>
        </h1>

        {/* Tagline */}
        <p
          className={`
            text-lg text-gray-600 dark:text-gray-400 transition-all duration-700 delay-400
            ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          像素宠物喝水助手
        </p>
        <p
          className={`
            text-sm text-gray-500 dark:text-gray-500 mt-1 transition-all duration-700 delay-500
            ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          养成喝水好习惯，陪伴萌宠健康成长
        </p>
      </div>

      {/* Feature Pills */}
      <div
        className={`
          flex flex-wrap justify-center gap-3 mb-10 transition-all duration-700 delay-600
          ${animationStep >= 3 ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {['🎮 像素养成', '⏰ 智能提醒', '📊 喝水记录'].map((feature, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <div
        className={`
          w-full max-w-xs transition-all duration-700 delay-700
          ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <Button
          variant="water"
          size="lg"
          fullWidth
          onClick={handleStart}
          className="text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          开始使用 →
        </Button>
      </div>

      {/* Footer */}
      <p
        className={`
          mt-8 text-xs text-gray-400 dark:text-gray-600 transition-all duration-700 delay-800
          ${animationStep >= 3 ? 'opacity-100' : 'opacity-0'}
        `}
      >
        © 2024 HydratePet · 健康生活每一天
      </p>
    </div>
  );
}
