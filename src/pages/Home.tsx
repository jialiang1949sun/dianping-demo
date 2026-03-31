import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Star, MapPin, Search, ArrowRight, Utensils, Coffee, ShoppingBag, Music, ChevronLeft, ChevronRight, Users, Wrench, Building2, Store, HeartPulse, Dumbbell, GraduationCap, Sparkles, Plane } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Merchant {
  id: number;
  name: string;
  address: string;
  category: string;
  average_rating: number;
  review_count: number;
  cover_image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [grouped, setGrouped] = useState<Record<string, Merchant[]>>({});
  const [minRating, setMinRating] = useState<number>(0);
  const [sortMode, setSortMode] = useState<'recommended' | 'distance'>('recommended');
  const [radiusKm, setRadiusKm] = useState<number>(0);

  const readUserCoords = () => {
    const lat = localStorage.getItem('dp_lat');
    const lon = localStorage.getItem('dp_lon');
    if (!lat || !lon) return null;
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isNaN(la) || Number.isNaN(lo)) return null;
    return { lat: la, lon: lo };
  };

  const haversineKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const getDistanceKm = (m: Merchant) => {
    const userCoords = readUserCoords();
    if (!userCoords) return null;
    if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return null;
    return haversineKm(userCoords, { lat: m.latitude, lon: m.longitude });
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const heroSlides = [
    {
      src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2000&q=80',
      title: '发现身边的美好生活',
      subtitle: '真实的用户评价，海量的本地商户，帮你做出更好的消费决策'
    },
    {
      src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=2000&q=80',
      title: '热门餐饮与咖啡馆',
      subtitle: '从早餐到夜宵，一键找到高分好店'
    },
    {
      src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2000&q=80',
      title: '逛街购物与休闲娱乐',
      subtitle: '购物、娱乐、亲子，一站式探索本地生活'
    },
    {
      src: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=2000&q=80',
      title: '周末出游与酒店民宿',
      subtitle: '周边游住哪里？看评价再决定'
    }
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    if (heroPaused) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [heroPaused, heroSlides.length]);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const isSearchMode = !!keyword;
        let url = isSearchMode
          ? `/merchants?limit=40${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`
          : '/merchants?limit=300';

        if (isSearchMode) {
          const coords = readUserCoords();
          if (coords && (sortMode === 'distance' || radiusKm > 0)) {
            url += `&lat=${encodeURIComponent(String(coords.lat))}&lon=${encodeURIComponent(String(coords.lon))}&sort=${encodeURIComponent(sortMode)}`;
            if (radiusKm > 0) url += `&radiusKm=${encodeURIComponent(String(radiusKm))}`;
            if (minRating > 0) url += `&minRating=${encodeURIComponent(String(minRating))}`;
          }
        }

        const response = await api.get(url);
        if (response.success) {
          const list: Merchant[] = response.data;
          setMerchants(list);

          const map: Record<string, Merchant[]> = {};
          for (const m of list) {
            if (!map[m.category]) map[m.category] = [];
            map[m.category].push(m);
          }
          for (const key of Object.keys(map)) {
            map[key] = map[key].slice(0, 5);
          }
          setGrouped(map);
        }
      } catch (error) {
        console.error('Failed to fetch merchants', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [keyword, category, sortMode, radiusKm, minRating]);

  const categoryMeta = useMemo(() => {
    const m: Record<string, { label: string; icon: any; desc: string }> = {
      Restaurant: { label: '美食', icon: Utensils, desc: '火锅烧烤、甜品小吃、地方菜系' },
      Cafe: { label: '咖啡/奶茶', icon: Coffee, desc: '手冲咖啡、烘焙甜品、下午茶' },
      Family: { label: '亲子', icon: Users, desc: '亲子乐园、儿童活动、周末遛娃' },
      LifeService: { label: '生活服务', icon: Wrench, desc: '保洁维修、洗衣洗护、宠物服务' },
      Shopping: { label: '商城/购物', icon: ShoppingBag, desc: '潮流集合、数码周边、超市百货' },
      Entertainment: { label: '娱乐', icon: Music, desc: '影院 KTV、桌游密室、休闲放松' },
      Hotel: { label: '酒店', icon: Building2, desc: '商务出行、度假民宿、温泉酒店' },
      Beauty: { label: '丽人', icon: Sparkles, desc: '美发美甲、皮肤管理、轻医美' },
      Fitness: { label: '运动健身', icon: Dumbbell, desc: '健身房、私教课、瑜伽普拉提' },
      Medical: { label: '医疗健康', icon: HeartPulse, desc: '体检、牙科、门诊挂号' },
      Education: { label: '教育培训', icon: GraduationCap, desc: '语言培训、兴趣班、素质教育' },
      Travel: { label: '旅行出行', icon: Plane, desc: '景点门票、出行服务、周边游' }
    };
    return m;
  }, []);

  const getCategoryLabel = (key: string) => categoryMeta[key]?.label || key;
  const getCategoryDesc = (key: string) => categoryMeta[key]?.desc || '精选推荐，口碑好评' ;
  const getCategoryIcon = (key: string) => (categoryMeta[key]?.icon || Store);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of merchants) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    const order = Object.keys(counts)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 12);
    return { counts, order };
  }, [merchants]);

  const filterCategories = useMemo(() => {
    const list = [{ name: '全部', label: '全部', icon: Search } as { name: string; label: string; icon: any }];
    for (const key of categoryStats.order) {
      list.push({ name: key, label: getCategoryLabel(key), icon: getCategoryIcon(key) });
    }
    return list;
  }, [categoryStats.order, getCategoryLabel, getCategoryIcon]);

  const visibleCategoryOrder = useMemo(() => {
    if (!category) return categoryStats.order;
    return categoryStats.order.includes(category) ? [category] : [category];
  }, [category, categoryStats.order]);

  // Helper function to get random high-quality Unsplash image based on category
  const getImageUrl = (cat: string, index: number) => {
    const defaultImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1498837167922-41c143dc249c?w=800&q=80'
    ];
    return defaultImages[index % defaultImages.length];
  };

  const getMerchantCover = (merchant: Merchant, index: number) => {
    return merchant.cover_image_url || getImageUrl(merchant.category, index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const isSearchView = !!keyword;
  const coordsForUi = readUserCoords();
  const filteredMerchants = useMemo(() => {
    let list = merchants;
    if (minRating > 0) {
      list = list.filter((m) => Number(m.average_rating) >= minRating);
    }
    if (radiusKm > 0) {
      list = list.filter((m) => {
        const d = getDistanceKm(m);
        return d !== null && d <= radiusKm;
      });
    }
    if (sortMode === 'distance') {
      const withDist = list
        .map((m) => ({ m, d: getDistanceKm(m) }))
        .sort((a, b) => {
          if (a.d === null && b.d === null) return 0;
          if (a.d === null) return 1;
          if (b.d === null) return -1;
          return a.d - b.d;
        })
        .map((x) => x.m);
      return withDist;
    }
    return list;
  }, [merchants, minRating, sortMode, radiusKm]);

  const nearbyMerchants = useMemo(() => {
    if (keyword) return [] as { m: Merchant; d: number }[];
    const coords = readUserCoords();
    if (!coords) return [] as { m: Merchant; d: number }[];
    let list = merchants
      .map((m) => ({ m, d: getDistanceKm(m) }))
      .filter((x): x is { m: Merchant; d: number } => typeof x.d === 'number')
      .sort((a, b) => a.d - b.d);
    if (radiusKm > 0) list = list.filter((x) => x.d <= radiusKm);
    return list.slice(0, 8);
  }, [keyword, merchants, radiusKm]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/40 z-10" />
        <AnimatePresence mode="wait">
          <motion.img
            key={heroSlides[heroIndex].src}
            src={heroSlides[heroIndex].src}
            alt={heroSlides[heroIndex].title}
            className="w-full h-[320px] md:h-[360px] object-cover"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        </AnimatePresence>

        <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
          <button
            type="button"
            aria-label="上一张"
            onClick={() => setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
            className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="下一张"
            onClick={() => setHeroIndex((i) => (i + 1) % heroSlides.length)}
            className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-colors flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`跳转到第 ${idx + 1} 张`}
              onClick={() => setHeroIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${idx === heroIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-4">
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 text-center tracking-tight"
          >
            {heroSlides[heroIndex].title.includes('美好生活') ? (
              <>发现身边的<span className="text-orange-500">美好生活</span></>
            ) : (
              <>{heroSlides[heroIndex].title}</>
            )}
          </motion.h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl text-center font-light">
            {heroSlides[heroIndex].subtitle}
          </p>
          <div className="flex space-x-4">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg flex items-center">
              探索热门 <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Categories (Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-2">
        {filterCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.name || (cat.name === '全部' && !category);
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={cat.name}
              onClick={() => setCategory(cat.name === '全部' ? '' : cat.name)}
              className={`w-full justify-center flex items-center px-4 py-2.5 rounded-full font-medium transition-all duration-300 shadow-sm ${
                isActive
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-orange-400' : 'text-gray-400'}`} />
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {!keyword && (
          <div className="space-y-10">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">热门分类</h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">覆盖全品类</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categoryStats.order.map((key) => {
                  const Icon = getCategoryIcon(key);
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategory(key)}
                      className="text-left group bg-gradient-to-br from-gray-50 to-white border border-gray-200/70 rounded-2xl p-5 hover:shadow-lg hover:border-orange-200 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{getCategoryLabel(key)}</div>
                          <div className="text-xs text-gray-500 mt-1 leading-relaxed">{getCategoryDesc(key)}</div>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                          <Icon className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">{(categoryStats.counts[key] || 0)} 家可选</div>
                      <div className="mt-4 text-xs font-medium text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">查看推荐 →</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="text-2xl font-bold text-gray-900">附近好店</div>
                  <div className="text-sm text-gray-500 mt-1">基于定位计算距离（不填经纬度的店铺不会参与）</div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                    disabled={!coordsForUi}
                  >
                    <option value={0}>不限距离</option>
                    <option value={1}>1 km 内</option>
                    <option value={3}>3 km 内</option>
                    <option value={5}>5 km 内</option>
                    <option value={10}>10 km 内</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100"
                  >
                    去定位
                  </button>
                </div>
              </div>

              {!coordsForUi ? (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                  还没有定位信息。请在顶部导航栏点击定位后再查看附近好店。
                </div>
              ) : nearbyMerchants.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                  附近暂无匹配店铺（可能是商户未填写经纬度或超出距离范围）。
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {nearbyMerchants.map(({ m, d }, index) => (
                    <Link
                      to={`/merchant/${m.id}`}
                      key={m.id}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
                    >
                      <div className="h-40 bg-gray-200 relative overflow-hidden">
                        <img
                          src={getMerchantCover(m, index)}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.onerror = null;
                            img.src = getImageUrl(m.category, index);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                          {formatDistance(d)}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{m.name}</div>
                          <div className="flex items-center bg-orange-50 px-2 py-1 rounded-md flex-shrink-0">
                            <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                            <span className="font-bold text-orange-600 text-sm">{Number(m.average_rating).toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{m.review_count} 条真实评价</div>
                        <div className="flex items-start text-gray-500 mt-auto bg-gray-50 p-3 rounded-xl mt-4">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span className="text-sm line-clamp-2 leading-relaxed">{m.address}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-orange-500 fill-current" />
                  为您推荐
                </h2>
                <div className="flex items-center gap-2">
                  {category ? (
                    <button
                      type="button"
                      onClick={() => setCategory('')}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                    >
                      清除分类筛选
                    </button>
                  ) : null}
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">每类 4-5 家</span>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-10">
                  {visibleCategoryOrder.map((key) => {
                    const Icon = getCategoryIcon(key);
                    const list = grouped[key] || [];
                    return (
                      <div key={key} className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mr-3">
                              <Icon className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-gray-900">{getCategoryLabel(key)}</div>
                              <div className="text-sm text-gray-500">精选推荐</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCategory(key)}
                            className="text-sm font-medium text-orange-600 hover:text-orange-700"
                          >
                            查看更多 →
                          </button>
                        </div>

                        {list.length === 0 ? (
                          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-6">该分类暂无推荐数据</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {list.slice(0, 4).map((merchant, index) => (
                              <Link
                                to={`/merchant/${merchant.id}`}
                                key={merchant.id}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
                              >
                                <div className="h-40 bg-gray-200 relative overflow-hidden">
                                  <img
                                    src={getMerchantCover(merchant, index)}
                                    alt={merchant.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      img.onerror = null;
                                      img.src = getImageUrl(merchant.category, index);
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{merchant.name}</div>
                                    <div className="flex items-center bg-orange-50 px-2 py-1 rounded-md flex-shrink-0">
                                      <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                                      <span className="font-bold text-orange-600 text-sm">{Number(merchant.average_rating).toFixed(1)}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">{merchant.review_count} 条真实评价</div>
                                  <div className="flex items-start text-gray-500 mt-auto bg-gray-50 p-3 rounded-xl group-hover:bg-orange-50/50 transition-colors mt-4">
                                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-orange-400" />
                                    <span className="text-sm line-clamp-2 leading-relaxed">{merchant.address}</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {keyword && (
          <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            {keyword ? (
              <>
                <Search className="w-6 h-6 mr-2 text-orange-500" />
                包含 "{keyword}" 的搜索结果
              </>
            ) : (
              <>
                <Star className="w-6 h-6 mr-2 text-orange-500 fill-current" />
                为您推荐的好店
              </>
            )}
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            共 {merchants.length} 家
          </span>
        </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm font-semibold text-gray-700">筛选</div>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                >
                  <option value={0}>全部评分</option>
                  <option value={4}>4.0 分以上</option>
                  <option value={4.5}>4.5 分以上</option>
                </select>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                >
                  <option value="recommended">推荐排序</option>
                  <option value="distance" disabled={!coordsForUi}>
                    距离最近{!coordsForUi ? '（需定位）' : ''}
                  </option>
                </select>

                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  disabled={!coordsForUi}
                >
                  <option value={0}>不限距离</option>
                  <option value={1}>1 km 内</option>
                  <option value={3}>3 km 内</option>
                  <option value={5}>5 km 内</option>
                  <option value={10}>10 km 内</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMinRating(0);
                  setSortMode('recommended');
                  setRadiusKm(0);
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                重置
              </button>
            </div>
        
            {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
            ) : filteredMerchants.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"
          >
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">未找到相关商户</h3>
            <p className="text-gray-500 mb-6">换个关键词或者分类试试看吧</p>
            <button 
              onClick={() => { setCategory(''); window.history.replaceState(null, '', '/') }}
              className="px-6 py-2 bg-orange-50 text-orange-600 font-medium rounded-full hover:bg-orange-100 transition-colors"
            >
              查看全部推荐
            </button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
                {filteredMerchants.map((merchant, index) => (
              <motion.div variants={itemVariants} key={merchant.id}>
                <Link 
                  to={`/merchant/${merchant.id}`} 
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
                >
                  <div className="h-56 bg-gray-200 relative overflow-hidden">
                    <img 
                      src={getMerchantCover(merchant, index)} 
                      alt={merchant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = getImageUrl(merchant.category, index);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm flex items-center">
                      {merchant.category}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {merchant.name}
                      </h3>
                      <div className="flex items-center bg-orange-50 px-2 py-1 rounded-md ml-2 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                        <span className="font-bold text-orange-600 text-sm">
                          {Number(merchant.average_rating).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4">
                          {merchant.review_count} 条真实评价
                          {(() => {
                            const d = getDistanceKm(merchant);
                            if (d === null) return null;
                            return <span className="ml-2 text-gray-400">· 距离 {formatDistance(d)}</span>;
                          })()}
                    </div>

                    <div className="flex items-start text-gray-500 mt-auto bg-gray-50 p-3 rounded-xl group-hover:bg-orange-50/50 transition-colors">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-orange-400" />
                      <span className="text-sm line-clamp-2 leading-relaxed">{merchant.address}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
