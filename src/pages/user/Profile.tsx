import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, Upload, Heart, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

type Profile = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  avatar_url?: string | null;
  created_at: string;
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, login, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/auth/profile');
        if (res.success) {
          setProfile(res.user);
          setName(res.user.name || '');
          setPhone(res.user.phone || '');
          setAvatarUrl(res.user.avatar_url || '');
        }
      } catch (e: any) {
        toast.error(e?.message || '加载个人资料失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('昵称不能为空');
      return;
    }
    try {
      const res = await api.put('/auth/profile', { name: name.trim(), phone: phone.trim() || null });
      if (res.success) {
        setProfile(res.user);
        if (token) {
          login(
            {
              id: res.user.id,
              email: res.user.email,
              name: res.user.name,
              role: res.user.role
            },
            token
          );
        }
        toast.success('资料已保存');
      }
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    }
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    try {
      const up = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      } as any);
      const url = up.url;
      const res = await api.put('/auth/avatar', { avatar_url: url });
      if (res.success) {
        setProfile(res.user);
        setAvatarUrl(res.user.avatar_url || '');
        if (token) {
          login(
            {
              id: res.user.id,
              email: res.user.email,
              name: res.user.name,
              role: res.user.role,
              avatar_url: res.user.avatar_url
            },
            token
          );
        }
        toast.success('头像已更新');
      }
    } catch (e: any) {
      toast.error(e?.message || '头像上传失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-xl font-bold text-gray-900 mb-2">无法加载个人资料</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">个人资料</div>
            <div className="text-gray-500 mt-1">管理昵称与联系方式</div>
          </div>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-orange-700 font-extrabold text-xl">
                  {(user?.name || profile.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">角色</div>
              <div className="font-bold text-gray-900">{profile.role}</div>
            </div>
            <label className="ml-auto inline-flex items-center px-4 py-2 rounded-full bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              上传头像
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
              />
            </label>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">昵称</div>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">手机号</div>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="可选"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">邮箱</div>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={profile.email}
                disabled
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="text-lg font-extrabold text-gray-900">我的</div>
        <div className="text-gray-500 mt-1">收藏与评价记录</div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/favorites"
            className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-orange-50/40 hover:border-orange-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mr-4">
                <Heart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">我的收藏</div>
                <div className="text-sm text-gray-500">查看已收藏的店铺</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-orange-600">查看</div>
          </Link>

          <Link
            to="/my-reviews"
            className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-orange-50/40 hover:border-orange-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mr-4">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">我的评价</div>
                <div className="text-sm text-gray-500">按时间查看评价记录</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-orange-600">查看</div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;

