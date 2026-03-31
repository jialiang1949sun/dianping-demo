# E. 部署与交付（执行说明）

目标：得到一个任何人都可访问的公网 URL（前端页面 + 后端 API 同域可用），并产出可复用的最终版说明文档与基础测试报告。

本项目当前支持两条部署路线：

## 路线 A（推荐）：Vercel 一键部署（最省事）

适合：你只想要一个能访问的网址，不想管服务器、HTTPS、反向代理等。

### 1) 部署原理

- 前端：Vite 构建产物作为静态站点。
- 后端：`api/index.ts` 作为 Vercel Serverless Function 入口，对外提供 `/api/*`。
- 路由：`vercel.json` 负责把 `/api/(.*)` 转发到 `/api/index`，其余走 SPA 的 `index.html`。

### 2) 你需要准备的配置

- 在 Vercel 项目里设置环境变量（Production 环境）：
  - `JWT_SECRET`：必须改成强随机字符串。
  - `NODE_ENV=production`

说明：本项目默认使用 SQLite（文件在 `api/db/dianping.sqlite`）。Vercel 的 Serverless 运行环境不保证本地文件持久化，因此“生产可用”的方案应迁移到云数据库（例如 Supabase Postgres / PlanetScale / Railway Postgres）。如果只是演示/作业级别的公开访问，仍可先用 Vercel 部署，但要接受数据可能丢失。

### 3) 部署步骤（操作流程）

- 将代码推送到 GitHub（公开或私有都可以）。
- Vercel 新建项目并选择该仓库。
- Framework 选 `Vite`（或自动识别）。
- Build Command 建议用：`npm run build`。
- Output Directory：`dist`。
- 部署成功后会得到类似 `https://xxx.vercel.app` 的公网地址。

### 4) 部署后验收（最小验收清单）

- 访问首页：`/` 可打开。
- 健康检查：`/api/health` 返回 `{ success: true }`。
- 列表接口：`/api/merchants` 返回数据。
- 登录/注册：正常签发 token。

## 路线 B：自有服务器（Docker）

适合：需要数据持久化、可控性更强、想让网址更稳定。

### 1) 部署原理

- 使用 `Dockerfile` 构建：前端 `dist` + 后端 `dist-server`。
- 运行时用 `node dist-server/server.js` 启动同一个进程：
  - 生产环境下 Express 会静态托管 `dist`，并把非 `/api` 的路由回落到 `index.html`（SPA）。
- SQLite 文件与上传目录通过 volume 挂载实现持久化。

### 2) 服务器要求

- 一台 Linux 云服务器（1C2G 起步够用）
- 安装 Docker / docker-compose
- 放行端口（默认 `3002`），或用 Nginx/Cloudflare 做 80/443 反代 + HTTPS

### 3) 一条命令启动

在服务器项目目录执行：

```bash
docker compose up -d --build
```

默认会把服务暴露到：`http://<你的服务器IP>:3002/`

### 4) HTTPS 与域名

- 方案 1：Cloudflare 解析域名 + Full(Strict) + 反代
- 方案 2：Nginx + Let’s Encrypt（Certbot）

## 交付物清单（最终版）

建议最终交付至少包含：

1. 可访问 URL（公网）
2. 使用说明文档（用户/商家/管理员的操作路径）
3. 部署说明文档（环境变量、构建/启动、常见故障）
4. 基础功能测试报告（测试用例、步骤、预期与结果）
5. 源代码（仓库地址或打包）

