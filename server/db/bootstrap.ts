export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS merchants (
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
  )`,
  `CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category)`,
  `CREATE TABLE IF NOT EXISTS reviews (
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
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_merchant ON reviews(merchant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`,
  `CREATE TABLE IF NOT EXISTS review_replies (
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
  )`,
  `CREATE TABLE IF NOT EXISTS merchant_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_photos_merchant ON merchant_photos(merchant_id)`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    UNIQUE (user_id, merchant_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`,
  `CREATE TABLE IF NOT EXISTS auth_otps (
    phone TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
]

export const seedStatements = [
  `INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES
    (1, 'admin@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Admin User', 'admin'),
    (2, 'merchant@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Test Merchant', 'merchant_admin'),
    (3, 'user@example.com', '$2a$10$X1zJ3wK9/y.uH.8fU8q.eeo/8eE8yZ8pY7z.Z/8.G/u/e.U.m.y', 'Normal User', 'user')`,
  `INSERT OR IGNORE INTO merchants (id, name, address, phone, category, business_hours, latitude, longitude, cover_image_url, description, owner_id) VALUES
    (1, '海底捞火锅(南京西路店)', '静安区南京西路 1038 号', '021-00000001', 'Restaurant', '10:00-02:00', 31.231, 121.459, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop&q=80', '服务热情，适合聚餐，锅底选择多。', 2),
    (2, '星巴克臻选上海烘焙工坊', '静安区南京西路 789 号', '021-00000005', 'Cafe', '07:30-23:00', 31.231, 121.454, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80', '巨型咖啡烘焙工坊，拍照很出片。', 2),
    (3, '上海迪士尼乐园', '浦东新区川沙新镇黄赵路 310 号', '021-00000009', 'Family', '09:00-21:00', 31.143, 121.657, 'https://images.unsplash.com/photo-1520975962215-3bcd3c8b9e08?w=1200&auto=format&fit=crop&q=80', '亲子出游首选，项目丰富，烟花必看。', 2),
    (4, '上海国金中心 IFC', '浦东新区世纪大道 8 号', '021-00000017', 'Shopping', '10:00-22:00', 31.235, 121.507, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&auto=format&fit=crop&q=80', '高端商场，品牌齐全，交通便利。', 2),
    (5, '上海外滩华尔道夫酒店', '黄浦区中山东一路 2 号', '021-00000025', 'Hotel', '全天', 31.240, 121.490, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80', '外滩景观一流，适合度假与纪念日。', 2),
    (6, '上海中心观光厅', '浦东新区银城中路 501 号', '021-00000029', 'Travel', '08:30-22:00', 31.233, 121.505, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80', '高空观景，俯瞰浦江两岸。', 2)`,
]

