import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { Star, MapPin, Phone, Clock, Info, ChevronLeft, Heart, Share2, MessageSquare, Image as ImageIcon, Store, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Merchant {
  id: number;
  name: string;
  address: string;
  phone: string;
  category: string;
  business_hours: string;
  description: string;
  average_rating: number;
  review_count: number;
  photos: { id: number; photo_url: string }[];
  owner_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image_url?: string | null;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  reply_text?: string | null;
  reply_created_at?: string | null;
  reply_updated_at?: string | null;
  replied_by_name?: string | null;
}

const MerchantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replySubmittingId, setReplySubmittingId] = useState<number | null>(null);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const merchantRes = await api.get(`/merchants/${id}`);
      if (merchantRes.success) {
        setMerchant(merchantRes.data);
      } else {
        setMerchant(null);
        setLoadError(merchantRes.message || '商户信息加载失败');
        return;
      }
    } catch (error: any) {
      setMerchant(null);
      setLoadError(error?.message || '商户信息加载失败');
      return;
    }

    try {
      const reviewsRes = await api.get(`/merchants/${id}/reviews`);
      if (reviewsRes.success) {
        const next = reviewsRes.data || [];
        setReviews(next);
        setReplyDrafts((prev) => {
          const merged: Record<number, string> = { ...prev };
          for (const r of next as any[]) {
            if (typeof merged[r.id] === 'undefined' && r.reply_text) {
              merged[r.id] = String(r.reply_text);
            }
          }
          return merged;
        });
      }
    } catch (error: any) {
      setReviews([]);
      toast.error(error?.message || '评论加载失败（不影响查看商户详情）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !id) {
        setIsSaved(false);
        return;
      }
      try {
        const res = await api.get('/users/me/favorites');
        const list = res?.data || [];
        const mid = Number(id);
        setIsSaved(Array.isArray(list) ? list.some((x: any) => Number(x.id) === mid) : false);
      } catch {
        setIsSaved(false);
      }
    };
    checkFavorite();
  }, [id, isAuthenticated]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('请先登录后再发表评价');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/merchants/${id}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      toast.success('评价发布成功！');
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || '评价发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-80 bg-gray-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <Store className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">商户暂时无法打开</h2>
        <p className="text-gray-500 mb-8">{loadError || '抱歉，您访问的商户页面找不到了'}</p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="mb-4 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          重试加载
        </button>
        <Link to="/" className="px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors">
          返回首页
        </Link>
      </div>
    );
  }

  // Get image based on category for consistency with home page
  const getHeroImage = () => {
    if (merchant.cover_image_url) return merchant.cover_image_url;
    const defaultImages = {
      'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
      'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80',
      'Shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
      'Entertainment': 'https://images.unsplash.com/photo-1498837167922-41c143dc249c?w=1600&q=80'
    };
    return defaultImages[merchant.category as keyof typeof defaultImages] || defaultImages['Restaurant'];
  };

  const hasCoords = typeof merchant.latitude === 'number' && typeof merchant.longitude === 'number';
  const mapUrl = hasCoords
    ? (() => {
        const lat = merchant.latitude as number;
        const lon = merchant.longitude as number;
        const delta = 0.01;
        const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
      })()
    : null;
  const mapLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${merchant.latitude}&mlon=${merchant.longitude}#map=16/${merchant.latitude}/${merchant.longitude}`
    : null;

  const canReply =
    isAuthenticated &&
    (user?.role === 'admin' || (user?.role === 'merchant_admin' && merchant?.owner_id === user?.id));

  const submitReply = async (reviewId: number) => {
    if (!canReply) {
      toast.error('无权限回复');
      return;
    }
    const text = String(replyDrafts[reviewId] || '').trim();
    if (!text) {
      toast.error('回复内容不能为空');
      return;
    }
    if (text.length > 200) {
      toast.error('回复最多 200 字');
      return;
    }
    setReplySubmittingId(reviewId);
    try {
      await api.put(`/merchants/${id}/reviews/${reviewId}/reply`, { reply_text: text });
      toast.success('回复已发布');
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || '回复失败');
    } finally {
      setReplySubmittingId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-16"
    >
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Link to="/" className="flex items-center hover:text-orange-500 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回列表
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{merchant.name}</span>
      </div>

      {/* Hero Section */}
      <div className="relative h-[400px] rounded-[2rem] overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10" />
        <img 
          src={getHeroImage()} 
          alt={merchant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Top actions */}
        <div className="absolute top-6 right-6 z-20 flex space-x-3">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('链接已复制到剪贴板');
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const toggle = async () => {
                if (!isAuthenticated) {
                  toast.error('请先登录');
                  return;
                }
                const mid = Number(id);
                if (!mid) return;
                try {
                  if (isSaved) {
                    await api.delete(`/users/me/favorites/${mid}`);
                    setIsSaved(false);
                    toast.success('已取消收藏');
                  } else {
                    await api.post('/users/me/favorites', { merchant_id: mid });
                    setIsSaved(true);
                    toast.success('收藏成功');
                  }
                } catch (e: any) {
                  toast.error(e?.message || '操作失败');
                }
              };
              toggle();
            }}
            className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 text-white">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-4 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
              {merchant.category}
            </span>
            <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-orange-400 fill-current mr-1.5" />
              <span className="font-bold mr-1">{Number(merchant.average_rating).toFixed(1)}</span>
              <span className="text-gray-300 text-sm">({merchant.review_count} 条评价)</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{merchant.name}</h1>
          <div className="flex items-center text-gray-200">
            <MapPin className="w-5 h-5 mr-2 text-orange-400" />
            <span className="text-lg">{merchant.address}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Info Cards */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">商户信息</h3>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mr-4">
                  <Phone className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="font-medium text-gray-900">{merchant.phone || '暂无信息'}</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mr-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">营业时间</div>
                  <div className="font-medium text-gray-900">{merchant.business_hours || '暂无信息'}</div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">商户简介</h3>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mr-4">
                  <Info className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-gray-600 leading-relaxed">
                  {merchant.description || '这家商户很懒，还没有填写简介。'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="text-xl font-bold text-gray-900 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-orange-500" />
                店铺相册
              </div>
              <div className="text-sm text-gray-500">{merchant.photos?.length || 0} 张</div>
            </div>

            {merchant.photos && merchant.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {merchant.photos.map((p) => (
                  <a
                    key={p.id}
                    href={p.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-gray-50"
                  >
                    <img
                      src={p.photo_url}
                      alt="photo"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-6">商家暂未上传相册照片</div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-orange-500" />
                精选评价
              </h2>
              <span className="text-gray-500 font-medium bg-gray-50 px-4 py-1.5 rounded-full">
                全部 {reviews.length} 条
              </span>
            </div>
            
            <div className="space-y-8">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg">还没有人写过评价，快来抢沙发吧！</p>
                </div>
              ) : (
                reviews.map((review, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={review.id} 
                    className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-orange-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{review.user_name}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('zh-CN', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-orange-400 fill-current' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{review.comment}</p>

                    {review.reply_text ? (
                      <div className="mt-5 bg-white rounded-2xl border border-orange-100 p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold text-orange-700">商家回复</div>
                          <div className="text-xs text-gray-400">
                            {review.reply_updated_at
                              ? new Date(review.reply_updated_at).toLocaleDateString('zh-CN')
                              : review.reply_created_at
                                ? new Date(review.reply_created_at).toLocaleDateString('zh-CN')
                                : ''}
                          </div>
                        </div>
                        <div className="mt-2 text-gray-700 whitespace-pre-wrap">{review.reply_text}</div>
                        {review.replied_by_name ? (
                          <div className="mt-2 text-xs text-gray-400">回复人：{review.replied_by_name}</div>
                        ) : null}
                      </div>
                    ) : null}

                    {canReply && (
                      <div className="mt-5">
                        <div className="text-sm font-semibold text-gray-700 mb-2">{review.reply_text ? '编辑回复' : '商家回复'}</div>
                        <textarea
                          rows={3}
                          maxLength={200}
                          value={replyDrafts[review.id] ?? ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                          placeholder="感谢您的评价，我们会持续改进..."
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className={`text-xs font-medium ${(replyDrafts[review.id] || '').length >= 190 ? 'text-red-500' : 'text-gray-400'}`}>
                            {(replyDrafts[review.id] || '').length} / 200
                          </div>
                          <button
                            type="button"
                            onClick={() => submitReply(review.id)}
                            disabled={replySubmittingId === review.id}
                            className="px-5 py-2.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                          >
                            {replySubmittingId === review.id ? '提交中...' : '发布回复'}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="text-lg font-bold text-gray-900">商户位置</div>
              {mapLink ? (
                <a href={mapLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                  在地图中打开 →
                </a>
              ) : null}
            </div>
            {mapUrl ? (
              <iframe
                title="merchant-map"
                src={mapUrl}
                className="w-full h-[320px]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="p-10 text-center text-gray-500">该商户暂未设置经纬度，无法展示地图</div>
            )}
          </div>
        </div>

        {/* Sidebar (Right Column) */}
        <div className="lg:col-span-1">
          {/* Write Review Form - Sticky */}
          <div className="bg-white rounded-3xl shadow-lg shadow-orange-500/5 border border-orange-100 p-8 sticky top-28">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-orange-500 fill-current" />
              写下您的体验
            </h3>
            
            {isAuthenticated ? (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                    您给这家店打几分？
                  </label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none p-1"
                      >
                        <Star 
                          className={`w-10 h-10 transition-colors duration-300 ${
                            star <= rating ? 'text-orange-500 fill-current drop-shadow-md' : 'text-gray-200'
                          }`} 
                        />
                      </motion.button>
                    ))}
                  </div>
                  <div className="text-center text-sm font-medium text-orange-600 mt-2 h-5">
                    {['极差', '失望', '一般', '满意', '超赞'][rating - 1]}
                  </div>
                </div>
                
                <div>
                  <textarea
                    rows={5}
                    maxLength={200}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all resize-none text-gray-700"
                    placeholder="环境如何？服务怎样？菜品合口味吗？分享给更多人吧..."
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <button type="button" className="text-gray-400 hover:text-orange-500 transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className={`text-xs font-medium ${comment.length >= 190 ? 'text-red-500' : 'text-gray-400'}`}>
                      {comment.length} / 200
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className={`w-full py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/30 text-base font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-0.5 ${
                    (submitting || !comment.trim()) ? 'opacity-50 cursor-not-allowed transform-none hover:transform-none' : ''
                  }`}
                >
                  {submitting ? '提交中...' : '发布评价'}
                </button>
              </form>
            ) : (
              <div className="text-center py-10 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <User className="w-8 h-8 text-orange-300" />
                </div>
                <p className="text-gray-600 mb-6 font-medium">登录后分享您的消费体验</p>
                <Link 
                  to="/login"
                  className="inline-block px-8 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 hover:shadow-lg transition-all"
                >
                  立即登录 / 注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MerchantDetail;
