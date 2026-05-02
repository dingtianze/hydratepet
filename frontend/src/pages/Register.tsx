import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Stepper } from '@components/ui/Stepper';
import { useUserStore } from '@stores/userStore';
import { authApi } from '@services/api';

/**
 * Register Page - HydratePet 用户注册页面
 *
 * 功能：
 * 1. 手机号验证码注册
 * 2. 基础信息设置（昵称、性别、体重）
 * 3. 宠物卵化动画
 * 4. 工作时间设置（用于智能提醒）
 * 5. 完整的表单验证
 *
 * 注册流程：
 * Step 0: 选择登录方式（手机/微信）
 * Step 1: 填写基础信息
 * Step 2: 卵化宠物
 */

const genderOptions = [
  { value: 'male', label: '男生 👨' },
  { value: 'female', label: '女生 👩' },
  { value: 'other', label: '其他 👤' },
];

const timeOptions = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, '0')}:00`,
  label: `${i.toString().padStart(2, '0')}:00`,
}));

const steps = [
  { label: '验证手机' },
  { label: '基础信息' },
  { label: '卵化宠物' },
];

export function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useUserStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Login method
  const [loginMethod, setLoginMethod] = useState<'phone' | 'wechat'>('phone');

  // Step 1: Basic info
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');

  // Step 2: Pet info
  const [petName, setPetName] = useState('');
  const [isHatching, setIsHatching] = useState(false);
  const [hatchProgress, setHatchProgress] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Pixel animation
  const [pixelAnimation, setPixelAnimation] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Hatching animation
  useEffect(() => {
    if (isHatching && hatchProgress < 100) {
      const timer = setTimeout(() => {
        setHatchProgress((prev) => Math.min(prev + 2, 100));
      }, 50);
      return () => clearTimeout(timer);
    } else if (isHatching && hatchProgress >= 100) {
      setTimeout(() => {
        completeRegistration();
      }, 500);
    }
  }, [isHatching, hatchProgress]);

  // Pixel pet animation
  useEffect(() => {
    if (!isHatching) {
      const interval = setInterval(() => {
        setPixelAnimation((prev) => (prev + 1) % 4);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isHatching]);

  /**
   * 验证手机号格式
   */
  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  };

  /**
   * 计算每日推荐饮水量
   * 公式：体重 * 30~35ml，根据性别调整
   */
  const calculateDailyGoal = (): number => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return 1500;
    const factor = gender === 'male' ? 35 : 30;
    return Math.round((w * factor) / 50) * 50;
  };

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    setErrors((prev) => ({ ...prev, phone: '' }));

    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: '请输入手机号' }));
      return;
    }

    if (!validatePhone(phone)) {
      setErrors((prev) => ({ ...prev, phone: '请输入有效的手机号' }));
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await authApi.sendVerificationCode(phone);
      if (response.success) {
        setCountdown(60);
      } else {
        setErrors((prev) => ({ ...prev, phone: response.message || '发送验证码失败' }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, phone: '发送验证码失败，请稍后重试' }));
    } finally {
      setIsSendingCode(false);
    }
  };

  /**
   * Step 0 验证：手机号和验证码
   */
  const validateStep0 = () => {
    const newErrors: Record<string, string> = {};

    if (loginMethod === 'phone') {
      if (!phone) {
        newErrors.phone = '请输入手机号';
      } else if (!validatePhone(phone)) {
        newErrors.phone = '请输入有效的手机号';
      }

      if (!verificationCode) {
        newErrors.verificationCode = '请输入验证码';
      } else if (verificationCode.length !== 6) {
        newErrors.verificationCode = '验证码应为6位数字';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Step 1 验证：基础信息
   */
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!nickname.trim()) {
      newErrors.nickname = '请输入昵称';
    } else if (nickname.length < 2 || nickname.length > 20) {
      newErrors.nickname = '昵称长度应在2-20个字符';
    }

    if (!weight) {
      newErrors.weight = '请输入体重';
    } else {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 200) {
        newErrors.weight = '请输入有效的体重(20-200kg)';
      }
    }

    if (!gender) {
      newErrors.gender = '请选择性别';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Step 2 验证：宠物名称
   */
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!petName.trim()) {
      newErrors.petName = '请为您的宠物取名';
    } else if (petName.length < 1 || petName.length > 10) {
      newErrors.petName = '宠物名称长度应在1-10个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 下一步处理
   */
  const handleNext = () => {
    if (currentStep === 0 && validateStep0()) {
      setCurrentStep(1);
    } else if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setIsHatching(true);
    }
  };

  /**
   * 返回上一步
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/login');
    }
  };

  /**
   * 完成注册
   */
  const completeRegistration = async () => {
    try {
      await register({
        phone,
        nickname: nickname.trim(),
        weight: parseFloat(weight),
        gender: gender as 'male' | 'female' | 'other',
        workStartTime,
        workEndTime,
        petName: petName.trim(),
      });
      navigate('/', { replace: true });
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : '注册失败，请重试',
      });
      setIsHatching(false);
      setHatchProgress(0);
    }
  };

  // 像素宠物动画帧
  const petFrames = ['🥚', '🐱', '🐱', '🥚'];

  /**
   * 渲染 Step 0：选择登录方式
   */
  const renderStep0 = () => (
    <div className="space-y-4">
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 pixel-select ${
            loginMethod === 'phone'
              ? 'border-water-500 bg-water-50 dark:bg-water-900/20 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="text-3xl">📱</span>
          <span className="text-sm font-bold">手机注册</span>
        </button>
        <button
          onClick={() => setLoginMethod('wechat')}
          className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 pixel-select ${
            loginMethod === 'wechat'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="text-3xl">💚</span>
          <span className="text-sm font-bold">微信注册</span>
        </button>
      </div>

      {loginMethod === 'phone' && (
        <>
          <Input
            label="手机号"
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 11);
              setPhone(value);
              setErrors((prev) => ({ ...prev, phone: '' }));
            }}
            error={errors.phone}
            maxLength={11}
            className="pixel-input"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="验证码"
                type="text"
                placeholder="请输入6位验证码"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setErrors((prev) => ({ ...prev, verificationCode: '' }));
                }}
                error={errors.verificationCode}
                maxLength={6}
                className="pixel-input"
              />
            </div>
            <div className="pt-7">
              <Button
                variant="outline"
                size="md"
                onClick={handleSendCode}
                isLoading={isSendingCode}
                disabled={countdown > 0 || !validatePhone(phone)}
                className="whitespace-nowrap min-w-[120px] pixel-btn-secondary"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>
        </>
      )}

      {loginMethod === 'wechat' && (
        <div className="text-center py-8">
          <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 pixel-qr">
            <span className="text-6xl">💚</span>
          </div>
          <p className="text-sm text-gray-500">
            请使用微信扫描二维码注册<br />
            (模拟功能)
          </p>
        </div>
      )}
    </div>
  );

  /**
   * 渲染 Step 1：基础信息设置
   */
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Daily Goal Preview */}
      {weight && parseFloat(weight) > 0 && (
        <div className="bg-water-50 dark:bg-water-900/20 border-2 border-water-200 dark:border-water-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-water-800 dark:text-water-200 text-center">
            <span className="mr-1">💧</span>
            推荐每日饮水目标: <strong>{calculateDailyGoal()}ml</strong>
          </p>
        </div>
      )}

      <Input
        label="昵称"
        type="text"
        placeholder="请输入您的昵称"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          setErrors((prev) => ({ ...prev, nickname: '' }));
        }}
        error={errors.nickname}
        className="pixel-input"
      />

      <Input
        label="体重 (kg)"
        type="number"
        placeholder="请输入体重，用于计算每日推荐饮水量"
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value);
          setErrors((prev) => ({ ...prev, weight: '' }));
        }}
        error={errors.weight}
        helperText="根据您的体重，我们会推荐合适的每日饮水目标"
        min={20}
        max={200}
        className="pixel-input"
      />

      <Select
        label="性别"
        placeholder="请选择性别"
        options={genderOptions}
        value={gender}
        onChange={(e) => {
          setGender(e.target.value);
          setErrors((prev) => ({ ...prev, gender: '' }));
        }}
        error={errors.gender}
        className="pixel-select"
      />

      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          💼 工作时间（用于智能提醒）
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="上班时间"
            options={timeOptions}
            value={workStartTime}
            onChange={(e) => setWorkStartTime(e.target.value)}
            className="pixel-select"
          />
          <Select
            label="下班时间"
            options={timeOptions}
            value={workEndTime}
            onChange={(e) => setWorkEndTime(e.target.value)}
            className="pixel-select"
          />
        </div>
      </div>
    </div>
  );

  /**
   * 渲染 Step 2：宠物卵化
   */
  const renderStep2 = () => {
    if (isHatching) {
      return (
        <div className="text-center py-12">
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Egg Animation */}
            <div
              className={`absolute inset-0 transition-all duration-500 ${
                hatchProgress > 50 ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              }`}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-blue-400 rounded-[45%_45%_40%_40%] flex items-center justify-center shadow-lg pixel-egg">
                <span className="text-5xl animate-pulse">🥚</span>
              </div>
            </div>
            {/* Hatched Pet Animation */}
            <div
              className={`absolute inset-0 transition-all duration-500 ${
                hatchProgress > 50 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-water-400 to-water-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce pixel-pet">
                <span className="text-6xl">🐱</span>
              </div>
            </div>
          </div>

          {/* Progress Bar - Pixel Style */}
          <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded-none mx-auto mb-4 overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <div
              className="h-full bg-gradient-to-r from-water-500 to-water-600 transition-all duration-100 pixel-progress"
              style={{ width: `${hatchProgress}%` }}
            />
          </div>

          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2 pixel-text">
            {hatchProgress < 30
              ? '卵化中...'
              : hatchProgress < 70
              ? '即将破壳...'
              : hatchProgress < 100
              ? '宝宝出生了！'
              : '卵化完成！'}
          </p>
          <p className="text-sm text-gray-500 font-mono">{hatchProgress}%</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-200 to-blue-400 rounded-[45%_45%_40%_40%] flex items-center justify-center shadow-lg animate-pulse pixel-egg">
            <span className="text-4xl">{petFrames[pixelAnimation]}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 pixel-text">
            卵化您的专属宠物
          </h3>
          <p className="text-sm text-gray-500">
            给宝宝取个可爱的名字吧
          </p>
        </div>

        <Input
          label="宠物名称"
          type="text"
          placeholder="例如：水水、氢氢"
          value={petName}
          onChange={(e) => {
            setPetName(e.target.value);
            setErrors((prev) => ({ ...prev, petName: '' }));
          }}
          error={errors.petName}
          className="pixel-input"
        />

        {/* Pet Tips */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <span className="mr-1">💡</span>
            小贴士：每天记录饮水，您的宠物就会健康成长！
          </p>
        </div>

        {errors.submit && (
          <p className="text-sm text-red-600 text-center pixel-text">{errors.submit}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Pixel Style Header */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-700 text-white px-6 pt-8 pb-8 relative overflow-hidden">
        {/* Pixel decorations */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-sm" />
        <div className="absolute top-8 right-8 w-2 h-2 bg-white/30 rounded-sm" />
        <div className="absolute bottom-4 right-4 w-4 h-4 bg-white/10 rounded-sm" />

        <div className="flex items-center mb-4">
          <button
            onClick={handleBack}
            disabled={isHatching}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 pixel-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-2 pixel-text">注册</h1>
        </div>
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 -mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation Buttons */}
          {!isHatching && (
            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button variant="secondary" onClick={handleBack} className="flex-1 pixel-btn-secondary">
                  ← 上一步
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                isLoading={isLoading}
                className={currentStep === 0 ? 'w-full pixel-btn-primary' : 'flex-1 pixel-btn-primary'}
              >
                {currentStep === 2 ? '开始卵化 🥚' : '下一步 →'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Login Link */}
      <div className="px-6 py-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          已有账号？{' '}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold pixel-link"
          >
            立即登录 →
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 text-center">
        <p className="text-xs text-gray-400">
          注册即表示您同意我们的
          <a href="#" className="text-primary-600 hover:underline">服务条款</a>
          和
          <a href="#" className="text-primary-600 hover:underline">隐私政策</a>
        </p>
      </div>

      {/* Pixel style CSS */}
      <style>{`
        .pixel-text {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
        .pixel-input {
          font-family: 'Courier New', monospace;
        }
        .pixel-select select {
          font-family: 'Courier New', monospace;
        }
        .pixel-btn {
          image-rendering: pixelated;
        }
        .pixel-btn-primary {
          border-bottom: 4px solid rgba(0,0,0,0.2);
          text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
        }
        .pixel-btn-primary:active {
          border-bottom: 2px solid rgba(0,0,0,0.2);
          transform: translateY(2px);
        }
        .pixel-btn-secondary {
          border: 2px solid currentColor;
          border-bottom: 4px solid currentColor;
        }
        .pixel-btn-secondary:active {
          border-bottom: 2px solid currentColor;
          transform: translateY(2px);
        }
        .pixel-link {
          position: relative;
          text-decoration: underline;
          text-decoration-style: dashed;
        }
        .pixel-select {
          transition: all 0.2s;
        }
        .pixel-select:hover {
          transform: translateY(-2px);
        }
        .pixel-egg {
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
        }
        .pixel-pet {
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
        }
        .pixel-progress {
          box-shadow: inset 0 2px 0 rgba(255,255,255,0.3);
        }
        .pixel-qr {
          border: 3px solid #07C160;
          box-shadow: 4px 4px 0 rgba(7,193,96,0.3);
        }
      `}</style>
    </div>
  );
}
