---
title: Zeabur 平台介绍
created: 2026-05-18
updated: 2026-05-18
tags: [AI, Zeabur, 云平台, PaaS, 部署, AI DevOps, 容器]
related: "[[AI_Agent_Development_Framework]], [[Agent_MCP_introduce]], [[Agent_Skills_introduce]]"
---

# Zeabur 平台介绍

## 一、概述

**Zeabur** 是一个 AI 驱动的云部署平台，定位为 **"Your AI DevOps Engineer"**，让开发者专注于代码，由 AI 处理所有部署和运维工作。

| 属性 | 说明 |
|------|------|
| **定位** | AI 驱动的 PaaS 云平台 / AI DevOps 工程师 |
| **创立** | 2022 年，GitHub 组织创建于 2022.6 |
| **开源** | 核心仓库 MPL 2.0 开源，Go 语言构建 |
| **官网** | https://zeabur.com |
| **文档** | https://zeabur.com/docs |
| **GitHub** | https://github.com/zeabur |

### 核心特色

| 特色 | 说明 |
|------|------|
| **AI DevOps** | 内置 AI 智能体，自然语言管理基础设施 |
| **零配置部署** | `zbpack` 自动检测语言/框架，无需 Dockerfile |
| **自带硬件（BYOH）** | Wonder Mesh 将任意机器变为 Zeabur 节点 |
| **AI Hub** | 统一 OpenAI 兼容 API 接入 GPT/Claude/Grok |
| **一站式平台** | 前端+后端+数据库+邮件+AI+域名，一个项目搞定 |

---

## 二、核心产品

### 2.1 部署系统

| 功能 | 说明 |
|------|------|
| **一键部署** | 推送代码自动检测框架并构建，无需 Dockerfile |
| **多种部署方式** | GitHub/Git、Dockerfile、Docker 镜像、CLI、Deploy Button、VS Code/Cursor 扩展 |
| **自动 CI/CD** | 每次 `git push` 自动触发构建和部署 |
| **模板市场** | 数百个一键部署模板（WordPress/PostgreSQL/Redis/n8n 等） |

### 2.2 计算服务

| 类型 | 说明 |
|------|------|
| **Server（服务器）** | 单机部署，从 Zeabur 购买或自带硬件，按月固定计费 |
| **Cluster（集群）** | 多节点 Kubernetes 环境，跨节点调度、自动故障转移、分布式存储 |
| **Shared Cluster** | 已废弃（2026.4 起不再接受新服务），迁移至 Server 模型 |

**基础设施提供商**：

| 提供商 | 说明 |
|--------|------|
| **AWS** | 亚马逊云 |
| **GCP** | 谷歌云 |
| **Hetzner** | 欧洲高性价比 |
| **DigitalOcean** | 开发者友好 |
| **Linode** | Akamai 旗下 |
| **Tencent Cloud** | 腾讯云 |
| **Aliyun** | 阿里云 |
| **Volcengine** | 火山引擎 |
| **Glows.ai** | GPU 云 |

### 2.3 存储服务

| 服务 | 说明 |
|------|------|
| **持久化卷** | 每个服务独立存储卷 |
| **分布式卷** | 集群模式，跟随工作负载跨节点 |
| **备份恢复** | Dev 计划及以上支持自动备份 |
| **S3 兼容存储** | 通过 InsForge 集成或 MinIO 模板 |

### 2.4 网络服务

| 服务 | 说明 |
|------|------|
| **私有网络** | 同项目服务间内网通信（内部主机名） |
| **公网暴露** | 域名绑定和端口转发 |
| **免费子域名** | `*.zeabur.app` 自动 SSL |
| **自定义域名** | 自带域名 + 自动证书 |
| **防火墙** | 服务器级别入站/出站规则 |
| **Cloudflare** | 边缘安全、CDN、DDoS 防护 |

### 2.5 域名注册

| 功能 | 说明 |
|------|------|
| **内置注册商** | 直接在 Zeabur 仪表板注册和管理域名 |
| **DNS 管理** | DNS 记录管理和注册人信息维护 |
| **免费子域名** | `.zeabur.app` 子域名即开即用 |

### 2.6 邮件服务

| 功能 | 说明 |
|------|------|
| **Zeabur Email** | 基于 AWS SES 的企业级邮件发送 API |
| **发送模式** | 即时发送、定时发送、批量发送 |
| **Webhook** | 投递/退回/投诉事件通知 |
| **自定义发件域** | DKIM/SPF 验证 |
| **SLA** | 99.9% 可用性保证 |

### 2.7 AI Hub

| 属性 | 说明 |
|------|------|
| **定位** | 统一 AI 服务，一个 API Key 访问多模型 |
| **API 兼容** | OpenAI 兼容接口 |
| **支持模型** | GPT-4o、Claude、Grok 等 |
| **计费** | 按 Token 计费，可查看使用历史 |
| **多区域** | 东京（HND1）、旧金山（SFO1） |

---

## 三、AI 能力详解

Zeabur 最大的差异化优势在于 **AI 原生设计**：

### 3.1 Claude Code 插件（agent-skills）

| 属性 | 说明 |
|------|------|
| **仓库** | https://github.com/zeabur/agent-skills |
| **兼容** | Claude Code + OpenAI Codex |
| **技能数** | 18+ |

**覆盖能力**：

| 类别 | 技能示例 |
|------|----------|
| **服务器管理** | 租用服务器、查看规格、管理防火墙 |
| **部署操作** | 部署服务、绑定域名、配置环境变量 |
| **数据库** | 创建数据库、备份恢复、连接管理 |
| **诊断调试** | 查看日志、健康检查、故障排查 |
| **配置管理** | 资源调整、扩缩容、服务重启 |

> 通过自然语言对话即可完成所有 DevOps 操作。

### 3.2 MCP Server

| 属性 | 说明 |
|------|------|
| **包名** | `@zeabur/mcp-server` |
| **兼容** | Claude Desktop、Cursor 等 MCP 客户端 |

通过 MCP 协议将 Zeabur 连接到任何 AI 助手，实现项目/部署/变量/日志的对话式管理。

### 3.3 zbplan（AI Dockerfile 生成）

| 属性 | 说明 |
|------|------|
| **功能** | AI 分析项目，自动生成 Dockerfile |
| **流程** | 分析项目 → 搜索基础镜像 → 生成 Dockerfile → 构建测试 → 迭代修复 |
| **成本** | 约 $0.20/Dockerfile 生成 |
| **底层** | 使用 Claude Sonnet 4.6 / GPT-5.5 |

### 3.4 仪表板 AI 助手

在 Zeabur 控制台内置 AI 助手，自然语言创建项目、部署服务、配置变量、绑定域名。

### 3.5 Chrome 扩展

为 AI 编程工具添加 "Deploy to Zeabur" 按钮，一键部署。

### 3.6 InsForge（Agent 原生 BaaS）

| 功能 | 说明 |
|------|------|
| **PostgreSQL** | 托管数据库 |
| **JWT 认证** | 身份验证 |
| **S3 存储** | 对象存储 |
| **Edge Functions** | 无服务器边缘函数 |
| **MCP 协议** | AI 智能体直接操作 |

专为 AI Agent 自主构建全栈应用而设计，定位为 Agent 原生的 Supabase 替代。

---

## 四、Wonder Mesh（自带硬件）

| 属性 | 说明 |
|------|------|
| **功能** | 将任意计算机/服务器变为 Zeabur 计算节点 |
| **隧道** | WireGuard 加密隧道，无需公网 IP/端口映射/防火墙配置 |
| **支持系统** | Linux (amd64/arm64)、macOS (amd64/arm64) |
| **体验** | 完整 Zeabur 功能：部署模板、推送代码、绑定域名、监控资源 |

```
┌──────────────────────────────────────────────┐
│              Zeabur 控制平面                    │
│                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ 云服务器  │  │ 云服务器  │  │ 自带机器  │  │
│   │ (AWS)    │  │ (Hetzner)│  │ (家庭/办公)│  │
│   └──────────┘  └──────────┘  └──────────┘  │
│         │             │             │         │
│         └─────────────┼─────────────┘         │
│                       │                       │
│              Wonder Mesh (WireGuard)           │
│              统一管理和调度                      │
└──────────────────────────────────────────────┘
```

---

## 五、支持的语言与框架

### 语言（zbpack 自动检测）

| 语言 | 包管理器 |
|------|----------|
| **Node.js** | npm / yarn / pnpm |
| **Python** | pip / poetry |
| **Go** | go modules |
| **Java** | maven / gradle |
| **PHP** | composer |
| **Ruby** | bundler |
| **Rust** | cargo |
| **.NET** | nuget |
| **Elixir** | mix |
| **Bun** | bun |
| **Deno** | deno |
| **Dart** | pub |
| **Swift** | swift package |

### 框架（专用指南/优化）

| 框架 | 说明 |
|------|------|
| **Next.js** | 自动检测，一级支持 |
| **Nuxt.js** | Vue 全栈框架 |
| **Express.js** | Node.js 后端 |
| **Payload CMS** | Headless CMS |
| **Elysia** | Bun Web 框架 |
| **Socket.io** | 实时通信 |
| **Vapor** | Swift 服务端 |
| **Serverpod** | Dart 服务端 |

此外支持自定义 Dockerfile 部署任意技术栈。

---

## 六、开发者体验

### 6.1 CLI

```bash
# 安装（无需全局安装）
npx zeabur@latest

# 登录
npx zeabur auth login

# 项目管理
npx zeabur project list
npx zeabur project create

# 部署
npx zeabur deploy

# 服务管理
npx zeabur service list
npx zeabur service logs

# 环境变量
npx zeabur env set KEY=VALUE
npx zeabur env list
```

### 6.2 仪表板

| 功能 | 说明 |
|------|------|
| **项目管理** | 创建/删除/切换项目 |
| **服务管理** | 部署/回滚/暂停/重启/扩缩容 |
| **环境变量** | 仪表板配置，无需 `.env` 文件 |
| **域名管理** | 绑定域名、DNS 配置 |
| **资源监控** | CPU/内存/磁盘实时监控 |
| **AI 助手** | 内置自然语言操作 |
| **团队协作** | 多成员项目管理（Team 计划） |

### 6.3 API

| 类型 | 说明 |
|------|------|
| **GraphQL API** | 完整编程访问 `api.zeabur.com/graphql` |
| **REST API** | Upload API（ZIP 部署）、Email API |
| **WebSocket** | 实时日志和项目事件订阅 |
| **API Keys** | 编程访问认证 |

### 6.4 编辑器/工具集成

| 工具 | 说明 |
|------|------|
| **VS Code / Cursor** | 一键部署扩展 |
| **Chrome 扩展** | AI 编程工具集成 |
| **Raycast 扩展** | 启动器快速部署 |

---

## 七、定价

| 计划 | 价格 | 核心功能 |
|------|------|----------|
| **Free** | $0/月 | 个人探索，服务自动休眠，无 SLA，无邮件/备份 |
| **Dev** | $5/月 | 无自动休眠，AI 助手，自动备份，域名购买，邮件服务 |
| **Pro** | $19/月 | 更大构建规格（4C8G），30 天日志，更高配额，优先支持 |
| **Team** | $79/月（3 席位，+$24/席位） | 团队协作，角色权限，无限外部服务器，90 天日志 |
| **Enterprise** | 定制 | 专属支持，SLA，定制合同 |

**服务器定价**：按月固定费率，根据提供商/区域/规格（1-32 vCPU，2-64 GB RAM），Zeabur 常有折扣。

**支付方式**：信用卡 + 支付宝。

---

## 八、与同类产品对比

| 维度 | **Zeabur** | **Vercel** | **Railway** | **Render** | **Fly.io** | **Heroku** |
|------|-----------|-----------|-------------|-----------|-----------|-----------|
| **AI DevOps** | 内置 AI 智能体+MCP+Skills | 无 | 无 | 无 | 无 | 无 |
| **AI Hub** | 统一 LLM API | AI Gateway | 无 | 无 | 无 | 无 |
| **构建系统** | zbpack 自动检测 + zbplan AI 生成 | Build Output API | Nixpacks | Dockerfile/Buildpack | Dockerfile | Buildpacks |
| **基础设施** | 专属服务器+K8s 集群+Wonder Mesh | Serverless+Edge | 容器共享基础设施 | 容器（免费休眠） | 边缘容器 | Dyno |
| **自带硬件** | 是（Wonder Mesh/SSH/BYO K8s） | 否 | 否 | 否 | 有限 | 否 |
| **GPU 支持** | 是 | 否 | 是 | 是 | 是 | 是 |
| **域名注册** | 内置 | 否 | 否 | 否 | 否 | 否 |
| **邮件服务** | 内置 | 否 | 否 | 否 | 否 | 否 |
| **开源** | MPL 2.0 | 否 | 否 | 否 | 否 | 否 |
| **多云提供商** | 9+ 家可选 | 自有 | 自有 | 自有 | 自有 | 自有 |
| **起步价** | Free → $5/月 | Free → $20/月 | Free → $5/月 | Free → $7/月 | 按用量 | $5/月 |

### Zeabur 独特优势

1. **AI 原生设计** — Claude Code 插件 + MCP Server + AI Hub + AI 助手 + zbplan，竞品无对标
2. **自带硬件（BYOH）** — Wonder Mesh 让家用/办公机器成为云节点，业界独有
3. **一站式平台** — 部署+数据库+邮件+AI+域名，一个项目私有网络互联
4. **开源核心** — 主仓库和工具链（zbpack/stratus/CLI）开源
5. **多云灵活** — 9+ 基础设施提供商可选，或自带
6. **内置域名注册和邮件** — PaaS 中罕见的组合

---

## 九、适用场景与人群

### 适用场景

| 场景 | 说明 |
|------|------|
| **快速原型** | 一键部署任意框架，无需 Dockerfile |
| **全栈部署** | 前端+后端+数据库+邮件在一个项目中私有网络互联 |
| **AI 应用托管** | AI Hub 提供 LLM 访问，GPU 支持模型推理 |
| **自托管服务** | WordPress/n8n/Ghost 通过模板市场一键部署 |
| **Homelab/边缘计算** | Wonder Mesh 利用个人硬件 |
| **生产级工作负载** | 专属服务器 + HA 集群 |
| **团队协作** | 多成员项目管理，角色权限控制 |

### 适用人群

| 人群 | 说明 |
|------|------|
| **"Vibe Coders"** | 专注代码不想碰基础设施的开发者 |
| **AI 原生开发者** | 使用 Claude Code/Codex/Cursor 构建应用 |
| **个人开发者/副项目** | Free 和 Dev 计划低成本起步 |
| **创业团队** | Pro 和 Team 计划，按需扩展 |
| **Homelab 爱好者** | Wonder Mesh 自托管部署 |
| **中国/亚洲市场** | 支付宝、腾讯云、阿里云、火山引擎 |

---

## 十、安全与合规

| 措施 | 说明 |
|------|------|
| **传输加密** | TLS 1.2+ 全链路加密 |
| **存储加密** | AES-256 静态加密 |
| **容器隔离** | 网络级隔离的独立容器 |
| **DDoS 防护** | Cloudflare 自动防护 |
| **内部访问** | Tailscale 控制内部访问 |
| **SOC 2 Type II** | 认证进行中 |

---

## 十一、近期更新（2025-2026）

| 时间 | 更新 |
|------|------|
| **2025.7** | 服务器退款政策变更（7月21日后不再退款） |
| **2026.1** | Agent Skills v1.16.0（18+ 技能，支持 OpenAI Codex） |
| **2026.4** | Shared Cluster 废弃，全面转向 Server 模型 |
| 近期 | zbplan AI Dockerfile 生成、Wonder Mesh BYOH、InsForge 集成、Zeabur Email、域名注册、Chrome 扩展、多区域 AI Hub |

---

## 十二、参考资源

- [Zeabur 官网](https://zeabur.com)
- [Zeabur 文档](https://zeabur.com/docs)
- [Zeabur 模板市场](https://zeabur.com/templates)
- [Zeabur AI Hub 定价](https://zeabur.com/models)
- [Zeabur GitHub](https://github.com/zeabur)
- [Agent Skills GitHub](https://github.com/zeabur/agent-skills)
- [zbpack GitHub](https://github.com/zeabur/zbpack)
- [Zeabur CLI GitHub](https://github.com/zeabur/cli)
- [Zeabur Discord](https://discord.gg/DrdGCvXEyY)

---

*文档创建时间：2026年05月18日*
