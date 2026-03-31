-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'merchant_admin', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ADD COLUMN avatar_url TEXT;

CREATE TABLE IF NOT EXISTS auth_otps (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    category TEXT NOT NULL,
    business_hours TEXT,
    latitude REAL,
    longitude REAL,
    cover_image_url TEXT,
    description TEXT,
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);

-- 3. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    UNIQUE (user_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_merchant ON reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE TABLE IF NOT EXISTS review_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER UNIQUE NOT NULL,
  merchant_id INTEGER NOT NULL,
  replied_by INTEGER NOT NULL,
  reply_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Merchant Photos Table
CREATE TABLE IF NOT EXISTS merchant_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_photos_merchant ON merchant_photos(merchant_id);

-- 5. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    UNIQUE (user_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Insert dummy data (SQLite handles IGNORE slightly differently, so we use INSERT OR IGNORE)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
(1, 'admin@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Admin User', 'admin'),
(2, 'merchant@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Test Merchant', 'merchant_admin'),
(3, 'user@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Normal User', 'user');

DELETE FROM merchant_photos;
DELETE FROM reviews;
DELETE FROM favorites;
DELETE FROM merchants;

INSERT OR REPLACE INTO merchants (id, name, address, phone, category, business_hours, latitude, longitude, cover_image_url, description, owner_id) VALUES
(1, '海底捞火锅(南京西路店)', '静安区南京西路 1038 号', '021-00000001', 'Restaurant', '10:00-02:00', 31.231, 121.459, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop&q=80', '服务热情，适合聚餐，锅底选择多。', 2),
(2, '小杨生煎(人民广场店)', '黄浦区人民大道 200 号', '021-00000002', 'Restaurant', '07:00-21:00', 31.230, 121.474, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80', '外脆里嫩，汤汁丰富，经典上海味。', 2),
(3, '南翔馒头店(豫园店)', '黄浦区豫园老街 1 号', '021-00000003', 'Restaurant', '09:00-20:30', 31.227, 121.492, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&auto=format&fit=crop&q=80', '招牌小笼包，来豫园必吃。', 2),
(4, '老吉士(淮海中路店)', '徐汇区淮海中路 41 号', '021-00000004', 'Restaurant', '11:00-22:00', 31.221, 121.462, 'https://images.unsplash.com/photo-1604908177522-4025dbf4b7b1?w=1200&auto=format&fit=crop&q=80', '本帮菜口味地道，红烧肉很赞。', 2),
(5, '星巴克臻选上海烘焙工坊', '静安区南京西路 789 号', '021-00000005', 'Cafe', '07:30-23:00', 31.231, 121.454, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80', '巨型咖啡烘焙工坊，拍照很出片。', 2),
(6, 'Seesaw Coffee(静安寺店)', '静安区愚园路 68 号', '021-00000006', 'Cafe', '08:00-21:30', 31.224, 121.446, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&auto=format&fit=crop&q=80', '精品咖啡，手冲稳定，环境舒适。', 2),
(7, '喜茶(淮海中路店)', '黄浦区淮海中路 755 号', '021-00000007', 'Cafe', '10:00-22:00', 31.214, 121.463, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80', '芝芝水果茶很受欢迎，出杯快。', 2),
(8, 'Manner Coffee(武康路店)', '徐汇区武康路 210 号', '021-00000008', 'Cafe', '08:00-20:30', 31.206, 121.440, 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=1200&auto=format&fit=crop&q=80', '小而美的社区咖啡，性价比高。', 2),
(9, '上海迪士尼乐园', '浦东新区川沙新镇黄赵路 310 号', '021-00000009', 'Family', '09:00-21:00', 31.143, 121.657, 'https://images.unsplash.com/photo-1520975962215-3bcd3c8b9e08?w=1200&auto=format&fit=crop&q=80', '亲子出游首选，项目丰富，烟花必看。', 2),
(10, '上海自然博物馆', '静安区北京西路 510 号', '021-00000010', 'Family', '09:00-17:15', 31.239, 121.453, 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop&q=80', '寓教于乐，适合带孩子认识自然。', 2),
(11, '静安大悦城(亲子体验区)', '静安区西藏北路 166 号', '021-00000011', 'Family', '10:00-22:00', 31.244, 121.470, 'https://images.unsplash.com/photo-1520975869018-0b3e2d47cdb6?w=1200&auto=format&fit=crop&q=80', '室内亲子活动多，周末遛娃方便。', 2),
(12, 'Hello Kitty 主题乐园(上海)', '浦东新区世纪大道 100 号', '021-00000012', 'Family', '10:00-20:00', 31.225, 121.538, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop&q=80', '主题场景可爱，适合拍照与亲子互动。', 2),
(13, 'e家洁到家保洁(上海)', '黄浦区南京东路 299 号', '400-000-001', 'LifeService', '08:00-20:00', 31.236, 121.488, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&auto=format&fit=crop&q=80', '上门保洁服务，预约方便，响应快。', 2),
(14, '手机快修(徐家汇店)', '徐汇区虹桥路 1 号', '400-000-002', 'LifeService', '10:00-22:00', 31.193, 121.439, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80', '换屏电池立等可取，支持质保。', 2),
(15, '洁丰干洗(静安寺店)', '静安区华山路 2 号', '021-00000015', 'LifeService', '09:00-21:00', 31.223, 121.446, 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&auto=format&fit=crop&q=80', '上门取送，干洗护理更安心。', 2),
(16, '宠物护理站(陆家嘴店)', '浦东新区世纪大道 8 号', '021-00000016', 'LifeService', '10:00-20:00', 31.235, 121.507, 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=1200&auto=format&fit=crop&q=80', '洗护美容寄养一站式，环境干净。', 2),
(17, '上海国金中心 IFC', '浦东新区世纪大道 8 号', '021-00000017', 'Shopping', '10:00-22:00', 31.235, 121.507, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&auto=format&fit=crop&q=80', '高端商场，品牌齐全，交通便利。', 2),
(18, '南京路步行街(购物区)', '黄浦区南京东路 1 号', '021-00000018', 'Shopping', '全天', 31.238, 121.490, 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=1200&auto=format&fit=crop&q=80', '人气商圈，逛街购物的经典目的地。', 2),
(19, '静安嘉里中心', '静安区南京西路 1515 号', '021-00000019', 'Shopping', '10:00-22:00', 31.223, 121.445, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80', '餐饮购物一体，环境舒适。', 2),
(20, '上海环球港', '普陀区中山北路 3300 号', '021-00000020', 'Shopping', '10:00-22:00', 31.233, 121.414, 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=1200&auto=format&fit=crop&q=80', '综合体很大，适合一站式消费。', 2),
(21, '上海大剧院', '黄浦区人民大道 300 号', '021-00000021', 'Entertainment', '10:00-22:00', 31.230, 121.472, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80', '演出丰富，建筑很有特色。', 2),
(22, 'K歌派对(淮海中路店)', '黄浦区淮海中路 999 号', '021-00000022', 'Entertainment', '12:00-02:00', 31.215, 121.460, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&auto=format&fit=crop&q=80', '音效不错，朋友聚会氛围很好。', 2),
(23, '密室逃脱(五角场店)', '杨浦区四平路 2500 号', '021-00000023', 'Entertainment', '13:00-23:00', 31.299, 121.514, 'https://images.unsplash.com/photo-1526455590540-48f3db9b7f84?w=1200&auto=format&fit=crop&q=80', '剧情沉浸，机关丰富，适合团建。', 2),
(24, '桌游俱乐部(新天地店)', '黄浦区马当路 245 号', '021-00000024', 'Entertainment', '14:00-23:00', 31.217, 121.475, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&auto=format&fit=crop&q=80', '桌游种类多，新手也能快速上手。', 2),
(25, '上海外滩华尔道夫酒店', '黄浦区中山东一路 2 号', '021-00000025', 'Hotel', '全天', 31.240, 121.490, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80', '外滩景观一流，适合度假与纪念日。', 2),
(26, '上海浦东丽思卡尔顿酒店', '浦东新区陆家嘴环路 479 号', '021-00000026', 'Hotel', '全天', 31.238, 121.499, 'https://images.unsplash.com/photo-1551887373-6cd6a0e0fd31?w=1200&auto=format&fit=crop&q=80', '高空景观房，服务细致。', 2),
(27, '锦江之星(人民广场店)', '黄浦区南京西路 5 号', '021-00000027', 'Hotel', '全天', 31.231, 121.469, 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&auto=format&fit=crop&q=80', '位置便利，性价比高，出行方便。', 2),
(28, '民宿·梧桐里(衡山路)', '徐汇区衡山路 1 号', '021-00000028', 'Hotel', '全天', 31.210, 121.446, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&auto=format&fit=crop&q=80', '梧桐树下的慢生活，适合周末小住。', 2),
(29, '上海中心观光厅', '浦东新区银城中路 501 号', '021-00000029', 'Travel', '08:30-22:00', 31.233, 121.505, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80', '高空观景，俯瞰浦江两岸。', 2),
(30, '外滩城市漫步(集合点)', '黄浦区中山东一路外滩', '021-00000030', 'Travel', '全天', 31.240, 121.490, 'https://images.unsplash.com/photo-1520962917960-650d44c8a52b?w=1200&auto=format&fit=crop&q=80', '经典路线，拍照打卡很方便。', 2);
