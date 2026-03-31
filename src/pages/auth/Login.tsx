import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { Store, Mail, Lock, ArrowRight, Phone, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const id = window.setInterval(() => setOtpCooldown((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [otpCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = mode === 'password'
        ? await api.post('/auth/login', { email, password })
        : await api.post('/auth/login-otp', { phone, code: otp });
      if (response.success) {
        login(response.user, response.token);
        toast.success('登录成功，欢迎回来！');
        if (response.user?.role === 'merchant_admin' || response.user?.role === 'admin') {
          navigate('/merchant-admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      toast.error(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    const p = phone.trim();
    if (!p) {
      toast.error('请输入手机号');
      return;
    }
    try {
      const res = await api.post('/auth/request-otp', { phone: p });
      toast.success('验证码已发送');
      if (res.code) {
        toast.success(`开发模式验证码：${res.code}`, { duration: 6000 });
      }
      setOtpCooldown(60);
    } catch (e: any) {
      toast.error(e?.message || '发送验证码失败');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50"
      >
        <div>
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
              <Store className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            欢迎回来
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            登录您的账户以继续探索
          </p>
        </div>

        <div className="mt-8">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              邮箱登录
            </button>
            <button
              type="button"
              onClick={() => setMode('otp')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              手机验证码
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'password' ? (
              <>
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1 ml-1">邮箱地址</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all sm:text-sm"
                      placeholder="请输入您的邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1 ml-1 pr-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
                    <span className="text-sm font-medium text-gray-400">邮箱+密码</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all sm:text-sm"
                      placeholder="请输入您的密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">手机号</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      required
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all sm:text-sm"
                      placeholder="请输入手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 ml-1 pr-1">
                    <label className="block text-sm font-medium text-gray-700">验证码</label>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={otpCooldown > 0}
                      className={`text-sm font-bold ${otpCooldown > 0 ? 'text-gray-400' : 'text-orange-600 hover:text-orange-500'}`}
                    >
                      {otpCooldown > 0 ? `${otpCooldown}s 后重试` : '获取验证码'}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                    <input
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      required
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all sm:text-sm"
                      placeholder="6 位验证码"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登录中...
                </div>
              ) : (
                <>
                  登录 <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
          
          <div className="text-center text-sm mt-6">
            <span className="text-gray-500">还没有账号？ </span>
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-500 transition-colors">
              立即免费注册
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
