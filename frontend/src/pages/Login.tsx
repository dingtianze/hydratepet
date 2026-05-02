import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useUserStore } from '@stores/userStore';
import { authApi } from '@services/api';

/**
 * Login Page - HydratePet 用户登录页面
 *
 * 功能：
 * 1. 手机号/验证码登录
 * 2. 游客模式入口
 * 3. 微信登录（预留）
 * 4. 完整的表单验证
 *
 * 像素风格UI设计：
 * - 像素边框和阴影效果
 * - 复古游戏风格配色
 * - 8-bit风格图标
 */

export function Login() {
  const navigate = useNavigate();
  const { login, loginAsGuest, isAuthenticated, isLoading } = useUserStore();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'guest'>('phone');

  // Phone login form state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Pixel animation states
  const [pixelAnimation, setPixelAnimation] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for verification code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Pixel pet animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPixelAnimation((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  /**
   * 验证手机号格式
   * 中国大陆手机号规则：1[3-9]开头，共11位
   */
  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  };

  /**
   * 发送验证码
   * 包含60秒倒计时限制
   */
  const handleSendCode = async () => {
    setPhoneError('');

    if (!phone) {
      setPhoneError('请输入手机号');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('请输入有效的手机号');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await authApi.sendVerificationCode(phone);
      if (response.success) {
        setCountdown(60);
      } else {
        setPhoneError(response.message || '发送验证码失败');
      }
    } catch (error) {
      setPhoneError('发送验证码失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  /**
   * 手机号登录处理
   */
  const handlePhoneLogin = async () => {
    setPhoneError('');
    setCodeError('');

    // 表单验证
    if (!phone) {
      setPhoneError('请输入手机号');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('请输入有效的手机号');
      return;
    }

    if (!code) {
      setCodeError('请输入验证码');
      return;
    }

    if (code.length !== 6) {
      setCodeError('验证码应为6位数字');
      return;
    }

    try {
      await login({ phone, code });
      navigate('/', { replace: true });
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : '登录失败');
    }
  };

  /**
   * 游客模式登录
   * 创建临时用户，数据保存在本地
   */
  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Guest login failed:', error);
    }
  };

  /**
   * 微信登录（预留）
   */
  const handleWechatLogin = () => {
    alert('微信登录功能即将上线');
  };

  // 像素宠物动画帧
  const petFrames = ['🐱', '😺', '😸', '😺'];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Pixel Style Header */}
      <div className="bg-gradient-to-b from-water-500 to-water-600 text-white px-6 pt-8 pb-16 rounded-b-3xl relative overflow-hidden">
        {/* Pixel decorations */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-sm" />
        <div className="absolute top-8 right-8 w-2 h-2 bg-white/30 rounded-sm" />
        <div className="absolute bottom-8 left-8 w-4 h-4 bg-white/10 rounded-sm" />

        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/welcome')}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors pixel-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-2 pixel-text">登录</h1>
        </div>

        {/* Pixel Pet Animation */}
        <div className="flex justify-center mt-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl pixel-border">
              {petFrames[pixelAnimation]}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs animate-pulse">
              ✨
            </div>
          </div>
        </div>

        <p className="text-water-100 text-center mt-4 text-sm">
          欢迎回来，继续您的喝水之旅
        </p>
      </div>

      {/* Login Content */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          {/* Login Method Tabs - Pixel Style */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all pixel-tab ${
                loginMethod === 'phone'
                  ? 'bg-white dark:bg-gray-600 text-water-600 dark:text-water-400 shadow-sm border-2 border-water-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-650'
              }`}
            >
              📱 手机登录
            </button>
            <button
              onClick={() => setLoginMethod('guest')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all pixel-tab ${
                loginMethod === 'guest'
                  ? 'bg-white dark:bg-gray-600 text-water-600 dark:text-water-400 shadow-sm border-2 border-water-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-650'
              }`}
            >
              👤 游客模式
            </button>
          </div>

          {loginMethod === 'phone' ? (
            <div className="space-y-4">
              {/* Phone Input */}
              <Input
                label="手机号"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setPhone(value);
                  setPhoneError('');
                }}
                error={phoneError}
                maxLength={11}
                className="pixel-input"
              />

              {/* Verification Code Input */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="验证码"
                    type="text"
                    placeholder="请输入6位验证码"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                      setCodeError('');
                    }}
                    error={codeError}
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

              {/* Login Button */}
              <Button
                variant="water"
                size="lg"
                fullWidth
                onClick={handlePhoneLogin}
                isLoading={isLoading}
                className="mt-6 pixel-btn-primary font-bold"
              >
                <span className="mr-2">🎮</span>
                登 录
              </Button>

              {/* WeChat Login */}
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">或</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleWechatLogin}
                className="mt-4 pixel-btn-wechat"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#07C160">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                </svg>
                微信登录
              </Button>
            </div>
          ) : (
            /* Guest Mode */
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center pixel-avatar animate-float">
                <span className="text-5xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 pixel-text">
                游客模式
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="mr-1">⚠️</span>
                  数据仅保存在本地<br />
                  建议稍后注册账号同步数据
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleGuestLogin}
                isLoading={isLoading}
                className="pixel-btn-primary"
              >
                <span className="mr-2">🚀</span>
                一键体验
              </Button>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-water-600 dark:text-water-400 hover:text-water-700 font-bold pixel-link"
              >
                立即注册 →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">
          登录即表示您同意我们的
          <a href="#" className="text-water-600 hover:underline">服务条款</a>
          和
          <a href="#" className="text-water-600 hover:underline">隐私政策</a>
        </p>
      </div>

      {/* Pixel style CSS */}
      <style>{`
        .pixel-text {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
        .pixel-border {
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
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
        .pixel-tab {
          position: relative;
        }
        .pixel-input {
          font-family: 'Courier New', monospace;
        }
        .pixel-link {
          position: relative;
          text-decoration: underline;
          text-decoration-style: dashed;
        }
        .pixel-avatar {
          box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
          border: 3px solid rgba(255,255,255,0.3);
        }
        .pixel-btn-wechat {
          background: linear-gradient(to bottom, #07C160, #06ae56);
          color: white;
          border-bottom: 4px solid #057d46;
        }
        .pixel-btn-wechat:active {
          border-bottom: 2px solid #057d46;
          transform: translateY(2px);
        }
      `}</style>
    </div>
  );
}
