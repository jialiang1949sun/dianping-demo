import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Store, User, LogOut, Search, Menu, X, MapPin, LocateFixed, ChevronDown, Building2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [city, setCity] = useState<string>(() => localStorage.getItem('dp_city') || '上海');
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [manualCity, setManualCity] = useState('');

  // Sync search keyword from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get('keyword');
    if (keyword) setSearchKeyword(keyword);
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-location-root]')) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Reverse geocode failed');
    const data = await resp.json();
    const addr = data?.address || {};
    const label = addr.city || addr.town || addr.village || addr.county || addr.state;
    return (label as string) || '已定位';
  };

  const locateNow = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('当前浏览器不支持定位');
      setCity('未定位');
      return;
    }
    setIsLocating(true);
    setCity('定位中...');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      localStorage.setItem('dp_lat', String(pos.coords.latitude));
      localStorage.setItem('dp_lon', String(pos.coords.longitude));
      const nextCity = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      localStorage.setItem('dp_city', nextCity);
      setCity(nextCity);
      toast.success(`已定位：${nextCity}`);
    } catch (e: any) {
      const msg = e?.message || '定位失败，请检查浏览器权限';
      toast.error(msg);
      const cached = localStorage.getItem('dp_city');
      setCity(cached || '未定位');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    locateNow();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50' 
          : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="bg-orange-500 p-2 rounded-xl group-hover:bg-orange-600 transition-colors shadow-sm">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                大众点评
              </span>
            </Link>
            
            {/* Location Selector (Desktop) */}
            <div className="hidden md:flex items-center ml-8 relative" data-location-root>
              <button
                type="button"
                onClick={() => setIsLocationOpen((v) => !v)}
                className="flex items-center px-3 py-1.5 bg-gray-50 rounded-full cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200/50"
              >
                <MapPin className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-gray-700 font-medium max-w-[140px] truncate">{city}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
              </button>

              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-12 left-0 w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-900">定位</div>
                      <button
                        type="button"
                        onClick={locateNow}
                        disabled={isLocating}
                        className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${isLocating ? 'text-gray-400 border-gray-200' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                      >
                        <span className="inline-flex items-center">
                          <LocateFixed className="h-4 w-4 mr-1" />
                          {isLocating ? '定位中' : '重新定位'}
                        </span>
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">当前：{city}</div>
                    <div className="mt-4">
                      <div className="text-xs font-medium text-gray-600 mb-2">手动设置城市</div>
                      <div className="flex gap-2">
                        <input
                          value={manualCity}
                          onChange={(e) => setManualCity(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                          placeholder="例如：上海"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = manualCity.trim();
                            if (!v) return;
                            localStorage.setItem('dp_city', v);
                            localStorage.removeItem('dp_lat');
                            localStorage.removeItem('dp_lon');
                            setCity(v);
                            setManualCity('');
                            toast.success(`已切换：${v}`);
                            setIsLocationOpen(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                        >
                          确定
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search Section (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  name="search"
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all sm:text-sm shadow-inner"
                  placeholder="搜索商户、地址或分类..."
                  type="search"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute inset-y-1.5 right-1.5 px-4 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors shadow-sm"
                >
                  搜索
                </button>
              </form>
            </div>
          </div>

          {/* User Section (Desktop) */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                {(user?.role === 'merchant_admin' || user?.role === 'admin') && (
                  <Link
                    to="/merchant-admin"
                    className="hidden lg:flex items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Building2 className="h-4 w-4 mr-1.5" />
                    商户后台
                  </Link>
                )}
                <Link to="/profile" className="flex items-center group">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200 group-hover:border-orange-300 transition-colors">
                    <span className="text-orange-600 font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-orange-500 transition-colors">
                    {user?.name}
                  </span>
                </Link>
                <div className="h-4 w-px bg-gray-200"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>退出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-900 text-white hover:bg-gray-800 px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md"
                >
                  免费注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">打开主菜单</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 pt-4 pb-3 space-y-3">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="truncate max-w-[220px]">{city}</span>
                </div>
                <button
                  type="button"
                  onClick={locateNow}
                  disabled={isLocating}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border ${isLocating ? 'text-gray-400 border-gray-200' : 'text-orange-600 border-orange-200 bg-white'}`}
                >
                  {isLocating ? '定位中' : '刷新'}
                </button>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="search-mobile"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-orange-500 sm:text-sm"
                  placeholder="搜索商户..."
                  type="search"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </form>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="px-4 flex items-center mb-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                      <span className="text-orange-600 font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{user?.name}</div>
                      <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    退出登录
                  </button>
                  {(user?.role === 'merchant_admin' || user?.role === 'admin') && (
                    <Link
                      to="/merchant-admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      商户后台
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col px-4 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 text-base font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
                  >
                    免费注册
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
