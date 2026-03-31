# 简化版大众点评（全栈演示）

一个“简化版大众点评”全栈应用：商户浏览/搜索/分类、详情地图、评价、收藏、用户中心、商户后台（店铺管理/相册/回复）。

## 在线地址

- Vercel：`https://trae04-project-solojo9x.vercel.app`

说明：线上版本主要用于演示 UI/流程；由于 Serverless 环境对本地文件持久化有限，SQLite/上传资源可能会丢失。

## 功能概览

- 用户：邮箱+密码登录、手机号验证码登录、个人资料（头像/昵称/手机号）、我的收藏、我的评价（分页）
- 商户：列表/分类推荐、关键词搜索、评分筛选、距离排序/距离范围（基于定位）、商户详情（地图/相册/评价）
- 商家：商户后台（创建/编辑店铺、封面上传、相册批量上传/删除、评价回复）

## 本地开发（在 Trae 里稳定预览）

前端通过 Vite 启动，后端为 Express API，通过 Vite proxy 走 `/api`。

在 Trae 终端运行：

```bash
node scripts/dev-trae.mjs
```

默认端口：

- 前端：`http://127.0.0.1:5174/`
- 后端：`.env` 的 `PORT`（默认 `3002`）

初始化/重置数据库（SQLite）：

```bash
node ./node_modules/tsx/dist/cli.mjs server/db/run-init.ts
```

## 文档

- 文档总览： [docs/README.md](docs/README.md)

## 部署

- Vercel 部署与交付说明：见 [deployment-delivery.md](.trae/documents/deployment-delivery.md)

