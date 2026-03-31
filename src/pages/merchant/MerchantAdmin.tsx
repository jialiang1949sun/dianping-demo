import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Building2, Image as ImageIcon, MapPin, Save, Store, Wand2, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Merchant = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  category: string;
  business_hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image_url?: string | null;
  description?: string | null;
};

const MerchantAdmin: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isMerchant = user?.role === 'merchant_admin' || user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Merchant | null>(null);
  const [photos, setPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    category: 'Restaurant',
    business_hours: '',
    latitude: '',
    longitude: '',
    cover_image_url: '',
    description: ''
  });

  const categories = useMemo(
    () => [
      { value: 'Restaurant', label: '美食' },
      { value: 'Cafe', label: '咖啡/奶茶' },
      { value: 'Family', label: '亲子' },
      { value: 'LifeService', label: '生活服务' },
      { value: 'Shopping', label: '商城/购物' },
      { value: 'Entertainment', label: '娱乐' },
      { value: 'Hotel', label: '酒店' },
      { value: 'Travel', label: '旅行出行' }
    ],
    []
  );

  const hydrateForm = (m: Merchant | null) => {
    if (!m) return;
    setForm({
      name: m.name || '',
      address: m.address || '',
      phone: m.phone || '',
      category: m.category || 'Restaurant',
      business_hours: m.business_hours || '',
      latitude: m.latitude === null || m.latitude === undefined ? '' : String(m.latitude),
      longitude: m.longitude === null || m.longitude === undefined ? '' : String(m.longitude),
      cover_image_url: m.cover_image_url || '',
      description: m.description || ''
    });
  };

  const loadMine = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchants/mine/list');
      const list: Merchant[] = res.data || [];
      if (list.length > 0) {
        setCurrent(list[0]);
        hydrateForm(list[0]);
        setPhotosLoading(true);
        try {
          const detail = await api.get(`/merchants/${list[0].id}`);
          setPhotos(detail?.data?.photos || []);
        } finally {
          setPhotosLoading(false);
        }
      } else {
        setCurrent(null);
        setPhotos([]);
      }
    } catch (e: any) {
      toast.error(e?.message || '加载商户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fillFromMyLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('浏览器不支持定位');
      return;
    }
    toast.loading('正在获取当前位置...', { id: 'loc' });
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      });
      setField('latitude', String(pos.coords.latitude));
      setField('longitude', String(pos.coords.longitude));
      toast.success('已填入经纬度', { id: 'loc' });
    } catch (e: any) {
      toast.error(e?.message || '定位失败', { id: 'loc' });
    }
  };

  const suggestCover = () => {
    const map: Record<string, string> = {
      Restaurant: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
      Cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80',
      Family: 'https://images.unsplash.com/photo-1520975962215-3bcd3c8b9e08?w=1200&auto=format&fit=crop&q=80',
      LifeService: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&auto=format&fit=crop&q=80',
      Shopping: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&auto=format&fit=crop&q=80',
      Entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      Hotel: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80'
    };
    setField('cover_image_url', map[form.category] || map.Restaurant);
    toast.success('已生成推荐封面');
  };

  const uploadCover = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const up = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      } as any);
      if (up?.url) {
        setField('cover_image_url', up.url);
        toast.success('封面已上传，可点击保存生效');
      }
    } catch (e: any) {
      toast.error(e?.message || '封面上传失败');
    }
  };

  const addAlbumPhotos = async (files: FileList) => {
    if (!current?.id) {
      toast.error('请先保存创建店铺后再上传相册');
      return;
    }
    setPhotosUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        const up = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        } as any);
        if (up?.url) {
          await api.post(`/merchants/${current.id}/photos`, { photo_url: up.url });
        }
      }
      toast.success('相册已更新');
      const detail = await api.get(`/merchants/${current.id}`);
      setPhotos(detail?.data?.photos || []);
    } catch (e: any) {
      toast.error(e?.message || '相册上传失败');
    } finally {
      setPhotosUploading(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!current?.id) return;
    try {
      await api.delete(`/merchants/${current.id}/photos/${photoId}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('已删除');
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.category) {
      toast.error('请填写店名、地址、分类');
      return;
    }
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || null,
      category: form.category,
      business_hours: form.business_hours.trim() || null,
      latitude: form.latitude.trim() ? Number(form.latitude.trim()) : null,
      longitude: form.longitude.trim() ? Number(form.longitude.trim()) : null,
      cover_image_url: form.cover_image_url.trim() || null,
      description: form.description.trim() || null
    };
    try {
      if (current?.id) {
        await api.put(`/merchants/${current.id}`, payload);
        toast.success('商户信息已保存');
      } else {
        await api.post('/merchants', payload);
        toast.success('已创建商户');
      }
      await loadMine();
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-orange-500" />
        </div>
        <div className="text-xl font-bold text-gray-900 mb-2">请先登录</div>
        <div className="text-gray-500">登录后才能进入商户后台</div>
      </div>
    );
  }

  if (!isMerchant) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-xl font-bold text-gray-900 mb-2">当前账号不是商户账号</div>
        <div className="text-gray-500">请使用“商户入驻”注册的账号登录后再使用此功能</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">商户后台</div>
            <div className="text-gray-500 mt-1">管理您的店铺信息、封面图和定位</div>
          </div>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">店铺名称</div>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="例如：串串小馆"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">分类</div>
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">店铺地址</div>
              <input
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="例如：朝阳区幸福路 88 号"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">联系电话</div>
                <input
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="例如：010-88886666"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">营业时间</div>
                <input
                  value={form.business_hours}
                  onChange={(e) => setField('business_hours', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="例如：11:00-23:30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">纬度 (latitude)</div>
                <input
                  value={form.latitude}
                  onChange={(e) => setField('latitude', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="例如：39.915"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">经度 (longitude)</div>
                <input
                  value={form.longitude}
                  onChange={(e) => setField('longitude', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="例如：116.404"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fillFromMyLocation}
                className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                使用我的位置
              </button>
              <button
                type="button"
                onClick={suggestCover}
                className="inline-flex items-center px-4 py-2 rounded-full bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                生成推荐封面
              </button>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">封面图链接 (cover_image_url)</div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    value={form.cover_image_url}
                    onChange={(e) => setField('cover_image_url', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="粘贴图片 URL"
                  />
                </div>
                <label className="inline-flex items-center px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                  <Upload className="w-4 h-4 mr-2" />
                  上传封面
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCover(f);
                    }}
                  />
                </label>
                <div className="w-14 h-14 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {form.cover_image_url ? (
                    <img src={form.cover_image_url} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">店铺相册</div>
                  <div className="text-xs text-gray-500 mt-1">上传后会在店铺详情页展示</div>
                </div>
                <label className={`inline-flex items-center px-4 py-2 rounded-full border font-semibold cursor-pointer ${photosUploading ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100'}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  {photosUploading ? '上传中...' : '上传照片'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={photosUploading}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length) addAlbumPhotos(files);
                    }}
                  />
                </label>
              </div>

              {photosLoading ? (
                <div className="mt-4 grid grid-cols-3 gap-3 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <div className="mt-4 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-6">还没有相册照片</div>
              ) : (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={p.photo_url} alt="photo" className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setField('cover_image_url', p.photo_url)}
                          className="px-3 py-1.5 rounded-full bg-white/90 text-gray-900 text-xs font-bold"
                        >
                          设为封面
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhoto(p.id)}
                          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">简介</div>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                placeholder="简单介绍一下店铺特色..."
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MerchantAdmin;
