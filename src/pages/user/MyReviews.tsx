import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { MessageSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';

type MyReview = {
  id: number;
  merchant_id: number;
  merchant_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = async (nextPage: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/me/reviews?page=${nextPage}&limit=${limit}`);
      if (res.success) {
        setItems(res.data || []);
        setPagination(res.pagination || null);
        setPage(nextPage);
      } else {
        setItems([]);
        setPagination(null);
      }
    } catch (e: any) {
      toast.error(e?.message || '加载我的评价失败');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    load(1);
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-xl font-bold text-gray-900 mb-2">还没有评价</div>
        <div className="text-gray-500 mb-6">去看看附近的好店，写下你的第一条评价</div>
        <Link to="/" className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">我的评价</div>
          <div className="text-gray-500 mt-1">共 {pagination?.total ?? items.length} 条</div>
        </div>
        <button
          type="button"
          onClick={() => load(page)}
          className="px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100"
        >
          刷新
        </button>
      </div>

      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link to={`/merchant/${r.merchant_id}`} className="text-lg font-extrabold text-gray-900 hover:text-orange-600 transition-colors">
                  {r.merchant_name}
                </Link>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <div className="inline-flex items-center">
                    <Star className="w-4 h-4 text-orange-500 fill-current mr-1" />
                    <span className="font-bold text-gray-800">{r.rating}</span>
                    <span className="ml-1">/ 5</span>
                  </div>
                  <span>·</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
              <Link
                to={`/merchant/${r.merchant_id}`}
                className="shrink-0 px-4 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-semibold hover:bg-orange-100"
              >
                去店铺
              </Link>
            </div>

            <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {r.comment}
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => load(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-50"
          >
            上一页
          </button>
          <div className="text-sm text-gray-600">
            第 <span className="font-bold text-gray-900">{page}</span> / {pagination.totalPages} 页
          </div>
          <button
            type="button"
            onClick={() => load(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MyReviewsPage;

