import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

type FavoriteMerchant = {
  id: number;
  name: string;
  address: string;
  category: string;
  cover_image_url?: string | null;
  average_rating: number;
  review_count: number;
  favorited_at?: string;
};

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FavoriteMerchant[]>([]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.favorited_at || '').localeCompare(String(a.favorited_at || '')));
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/favorites');
      if (res.success) {
        setItems(res.data || []);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      toast.error(e?.message || '加载收藏失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    load();
  }, [isAuthenticated, navigate]);

  const remove = async (merchantId: number) => {
    try {
      await api.delete(`/users/me/favorites/${merchantId}`);
      setItems((prev) => prev.filter((x) => x.id !== merchantId));
      toast.success('已取消收藏');
    } catch (e: any) {
      toast.error(e?.message || '取消收藏失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
              <div className="bg-gray-200 h-44 rounded-xl mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-orange-400" />
        </div>
        <div className="text-xl font-bold text-gray-900 mb-2">还没有收藏</div>
        <div className="text-gray-500 mb-6">去首页挑选你喜欢的店铺吧</div>
        <Link to="/" className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">我的收藏</div>
          <div className="text-gray-500 mt-1">共 {sorted.length} 家店铺</div>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100"
        >
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sorted.map((m, index) => (
          <div key={m.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
            <Link to={`/merchant/${m.id}`} className="block">
              <div className="h-44 bg-gray-200 relative overflow-hidden">
                <img
                  src={m.cover_image_url || `https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop&q=80&sig=${index}`}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = `https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80&sig=${index}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                  {m.category}
                </div>
              </div>
            </Link>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/merchant/${m.id}`} className="font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition-colors">
                  {m.name}
                </Link>
                <div className="flex items-center bg-orange-50 px-2 py-1 rounded-md flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                  <span className="font-bold text-orange-600 text-sm">{Number(m.average_rating).toFixed(1)}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">{m.review_count} 条真实评价</div>

              <div className="flex items-start text-gray-500 mt-4 bg-gray-50 p-3 rounded-xl">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                <span className="text-sm line-clamp-2 leading-relaxed">{m.address}</span>
              </div>

              <button
                type="button"
                onClick={() => remove(m.id)}
                className="mt-4 inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                取消收藏
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FavoritesPage;

