---
title: Vercel 平台介绍
created: 2026-05-15
updated: 2026-05-15
tags: [AI, Vercel, 云平台, Next.js, AI SDK, 部署, 边缘计算]
related: "[[AI_Agent_Development_Framework]], [[Claude_Code_Introduction]], [[LLM_Model_Layer]]"
---

# Vercel 平台介绍

## 一、概述

**Vercel** 是一个面向前端开发者和全栈应用的云平台，口号为 "Develop. Preview. Ship."。它提供零配置部署、全球边缘网络、Serverless/Edge 计算以及 AI 工具链等完整产品体系。

| 属性 | 说明 |
|------|------|
| **创立** | 2015 年，Guillermo Rauch（CEO），原名 ZEIT，2020 年更名 Vercel |
| **总部** | 美国旧金山 |
| **核心项目** | Next.js（创建并维护，139K+ GitHub Stars） |
| **定位** | 从前端托管演进为全栈计算平台 |
| **官网** | https://vercel.com |

### 核心能力

| 能力 | 说明 |
|------|------|
| **零配置部署** | 支持 35+ 框架自动检测和构建 |
| **全球边缘网络** | 100+ PoP 节点，自动缓存和分发 |
| **Fluid Compute** | 统一执行模型，实例跨请求复用，减少冷启动 |
| **AI SDK** | TypeScript 生态最流行的 AI 开发库（24K+ Stars） |
| **AI Gateway** | 统一接入 279+ 模型 / 28+ 提供商，零加价 |
| **Sandbox** | Firecracker 微型 VM 安全沙箱 |

---

## 二、核心产品

### 2.1 部署系统

| 功能 | 说明 |
|------|------|
| **Preview Deployments** | 每次 git push 自动生成预览 URL |
| **Production Deployments** | 推送到 main 分支或 `vercel --prod` 触发 |
| **Rolling Releases** | 渐进式/金丝雀发布（2025.6 GA） |
| **Promote** | `vercel promote <url>` 即时提升预览到生产，无需重新构建 |
| **Rollback** | `vercel rollback` 回退到上一版本 |

### 2.2 计算服务（Vercel Functions）

| 运行时 | 状态 | 说明 |
|--------|------|------|
| **Node.js 24 LTS** | GA（默认） | 完整 Node.js 运行时，所有 npm 包可用 |
| **Python 3.13/3.14** | GA | FastAPI/Django，Fluid Compute 支持 |
| **Edge (V8 Isolates)** | 可用 | 超低冷启动（<1ms），仅 Web Standard API |
| **Bun** | 公测 | CPU 密集型任务延迟降低 ~28% |
| **Rust** | 公测 | 原生性能，HTTP 流式输出 |
| **Go** | 可用 | 系统级服务 |

**Fluid Compute**（默认执行模型）：

| 特性 | 说明 |
|------|------|
| **实例复用** | 跨并发请求复用函数实例，显著减少冷启动 |
| **Active CPU 计费** | 仅 CPU 活跃时计费，await 等待期间费率大幅降低 |
| **成本节省** | 高并发场景最高节省 85% |
| **超时** | 默认 300s，Pro/Enterprise 最高 800s |

### 2.3 存储服务

| 服务 | 说明 |
|------|------|
| **Edge Config** | 超低延迟全局 KV 存储（读取 <1ms），用于功能开关/A/B 测试/动态路由 |
| **Vercel Blob** | 非结构化数据存储（图片/视频/文档），支持客户端上传，最高 5 TB |
| **Marketplace** | Neon Postgres、Upstash Redis、Supabase 等第三方数据库集成 |

### 2.4 AI 产品线

| 产品 | 说明 |
|------|------|
| **AI SDK** | TypeScript AI 开发库，24K+ Stars，30+ 提供商适配 |
| **AI Gateway** | 统一 API 接入 279+ 模型，零加价，自动故障转移 |
| **Chat SDK** | 多平台聊天机器人 SDK（Slack/Teams/Discord/Telegram/WhatsApp 等） |
| **Sandbox** | Firecracker 微型 VM，安全代码执行（2026.1 GA） |
| **Workflow DevKit** | 持久化执行长任务（小时/天级），DurableAgent 支持 |
| **Vercel Agent** | AI 代码审查和生产调查（公测） |

### 2.5 其他服务

| 服务 | 说明 |
|------|------|
| **Cron Jobs** | 定时任务调度，标准 cron 表达式 |
| **Queues** | 持久化事件流，至少一次投递（公测） |
| **Analytics** | Web 分析和 Web Vitals 追踪 |
| **OG Image** | 动态 OG 图片生成 |
| **BotID** | 机器人检测和验证（GA） |
| **Firewall** | WAF、IP 封锁、攻击模式 |
| **MCP Server** | AI 智能体交互 Vercel 部署/日志/项目 |

---

## 三、AI SDK 详解

### 3.1 概述

Vercel AI SDK 是 TypeScript 生态中最流行的 AI 开发库，提供统一的模型调用接口。

| 属性 | 说明 |
|------|------|
| **核心包** | `ai`（npm 最新 v6.0.182，canary v7.0.0） |
| **GitHub Stars** | 24,235+ |
| **提供商适配** | 30+ 官方 `@ai-sdk/*` 包 |
| **开源** | 完全开源 |

### 3.2 架构

```
AI SDK Core (ai)
├── generateText()        → 单次文本生成
├── streamText()          → 实时流式输出
├── tool()                → 工具定义与调用
├── Output.object()       → 结构化 JSON 输出
└── ToolLoopAgent         → 工具循环智能体

Provider Packages (@ai-sdk/*)
├── @ai-sdk/openai
├── @ai-sdk/anthropic
├── @ai-sdk/google
├── @ai-sdk/xai
├── @ai-sdk/deepseek
└── ... 30+ 提供商

UI Packages
├── @ai-sdk/react         → useChat hook
├── @ai-sdk/vue
├── @ai-sdk/svelte
└── @ai-sdk/angular
```

### 3.3 核心特性

| 特性 | 说明 |
|------|------|
| **文本生成与流式** | `generateText()` / `streamText()` + UI 流式渲染 |
| **结构化输出** | `Output.object()` / `Output.array()` / `Output.choice()`，Zod 验证 |
| **工具调用** | `tool()` + `inputSchema` (Zod) + `execute`，多步工具循环 |
| **智能体** | `ToolLoopAgent` 工具循环模式 / `DurableAgent` 持久化智能体 |
| **框架 UI Hook** | React/Vue/Svelte/Angular 的 `useChat` 实现 |
| **MCP 支持** | 兼容 Model Context Protocol 工具定义 |
| **AI Gateway 集成** | 自动路由、故障转移、成本追踪、零加价 |

### 3.4 支持的提供商

| 提供商 | 包名 | 说明 |
|--------|------|------|
| **OpenAI** | `@ai-sdk/openai` | GPT-5.4、o3 等 |
| **Anthropic** | `@ai-sdk/anthropic` | Claude Opus 4.1、Sonnet 4.6 |
| **Google** | `@ai-sdk/google` | Gemini 2.5 Pro/Flash |
| **xAI** | `@ai-sdk/xai` | Grok 4 |
| **DeepSeek** | `@ai-sdk/deepseek` | DeepSeek V3.2 |
| **Mistral** | `@ai-sdk/mistral` | Mistral Large |
| **Amazon Bedrock** | `@ai-sdk/amazon-bedrock` | AWS 托管模型 |
| **Azure OpenAI** | `@ai-sdk/azure` | Azure 托管 GPT |
| **Alibaba** | `@ai-sdk/alibaba` | Qwen 3.6 |
| **Groq** | `@ai-sdk/groq` | 高速推理 |

### 3.5 AI Gateway

| 特性 | 说明 |
|------|------|
| **模型数量** | 279+ 模型 / 28+ 提供商 |
| **零加价** | Token 按提供商原价，无额外费用 |
| **路由延迟** | <20ms |
| **自动故障转移** | 提供商级别 failover |
| **成本追踪** | 按用户/标签归因，预算告警 |
| **速率限制** | 按用户请求/min、Token/天、并发请求 |
| **审计日志** | 每次请求记录（模型/Token/延迟/用户/标签） |
| **OIDC 认证** | Vercel 部署无需 API Key |

---

## 四、框架支持

### 4.1 一级支持（Vercel 构建）

| 框架 | 说明 |
|------|------|
| **Next.js** | Vercel 创建并维护，零配置，完整功能支持 |
| **React** | CRA、Vite 等构建方式 |
| **Svelte / SvelteKit** | 完整支持，ISR 可用 |
| **Vue / Nuxt** | 完整支持，ISR 可用 |
| **Astro** | 完整支持，ISR 可用 |

### 4.2 后端框架（零配置运行）

| 框架 | 语言 | 说明 |
|------|------|------|
| **Express** | Node.js | 最流行的 Node.js 框架 |
| **FastAPI** | Python | 高性能 Python API 框架 |
| **NestJS** | Node.js | 企业级 Node.js 框架 |
| **Hono** | TypeScript | 轻量级跨运行时框架 |

共支持 **35+ 框架**，零配置自动检测。

---

## 五、与 Next.js 的关系

| 维度 | 说明 |
|------|------|
| **创建者** | Vercel 创建了 Next.js 并持续维护 |
| **深度集成** | ISR、Server Actions、App Router、PPR 针对 Vercel 基础设施优化 |
| **非独占** | 支持 35+ 框架，后端框架原生运行，ISR 支持非 Next.js 框架 |
| **可移植** | Next.js `output: 'standalone'` 支持 Docker 自托管 |

---

## 六、Vercel CLI

| 属性 | 说明 |
|------|------|
| **包名** | `vercel`（npm，最新 v54.0.0） |
| **GitHub Stars** | 15,400+ |

### 常用命令

```bash
# 认证
vercel login

# 项目管理
vercel link                     # 关联项目
vercel pull                     # 拉取环境变量和配置

# 开发
vercel dev                      # 本地开发服务器

# 部署
vercel                          # 预览部署
vercel --prod                   # 生产部署
vercel promote <url>            # 提升预览到生产
vercel rollback                 # 回退版本

# 诊断
vercel logs <url>               # 查看日志
vercel inspect <url>            # 部署详情
vercel ls                       # 列出部署

# 环境变量
vercel env pull                 # 同步环境变量
vercel env add/remove/list      # 管理环境变量

# 防火墙
vercel firewall rules list      # 查看规则
vercel firewall ip block <ip>   # 封锁 IP
vercel firewall attack-mode     # 攻击模式
```

---

## 七、CI/CD 集成

### Git 自动集成

| 平台 | 说明 |
|------|------|
| **GitHub** | Push-to-deploy，PR 自动预览 URL |
| **GitLab** | Push-to-deploy |
| **Bitbucket** | Push-to-deploy |

### 自定义 CI/CD

```bash
# GitHub Actions / GitLab CI / Bitbucket Pipelines
npm install -g vercel
vercel pull --yes --environment=production --token=$VERCEL_TOKEN
vercel build --prod --token=$VERCEL_TOKEN
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### OIDC Federation

Vercel 函数可使用短期 OIDC Token 认证 AWS/GCP/Vault，无需存储长期密钥。

---

## 八、定价

| 计划 | Hobby（免费） | Pro（$20/用户/月） | Enterprise（定制） |
|------|-------------|-------------------|-------------------|
| **定位** | 个人/非商业 | 团队协作 | 企业级 |
| **带宽** | 100 GB/月 | 1 TB/月 | 自定义 |
| **函数执行** | 100 GB-Hrs | 1,000 GB-Hrs | 自定义 |
| **边缘请求** | 100 万/月 | 1,000 万/月 | 自定义 |
| **部署数** | 100/天 | 无限 | 无限 |
| **函数超时** | 300s | 300s-800s | 自定义 |
| **CPU 规格** | 1 vCPU / 2 GB | 最高 2 vCPU / 4 GB | 自定义 |
| **Fluid Compute** | 支持 | Active CPU 计费 | 多区域故障转移 |
| **防火墙** | 自动 DDoS 防护 | 自定义规则 + IP 封锁 | JA3 指纹 + 高级 WAF |
| **SSO/SCIM** | 无 | 无 | 支持 |
| **SLA** | 无 | 无 | 99.99% |
| **AI Gateway** | 免费额度 | 免费额度 + 按量付费 | 自定义 |

### 计费模型

- **Active CPU 计费**：仅 CPU 活跃时间计费，await 等待期间低费率
- **AI Gateway 零加价**：Token 按提供商原价
- **BYOK**：自带 API Key 走 Gateway 无额外费用

---

## 九、与同类产品对比

### Vercel vs Netlify vs Cloudflare Pages vs AWS Amplify

| 维度 | **Vercel** | **Netlify** | **Cloudflare Pages** | **AWS Amplify** |
|------|-----------|-------------|---------------------|-----------------|
| **旗舰框架** | Next.js（创建者） | 无 | 无 | 无 |
| **AI 工具** | AI SDK + Gateway + Chat SDK + Sandbox | 无 | 无 | 无 |
| **计算模型** | Fluid Compute（实例复用） | 传统 Serverless | Workers（更成熟边缘） | AWS Lambda |
| **Python/Go/Rust** | 完整支持 | 有限 | Workers 支持 | Lambda 支持 |
| **边缘节点** | 100+ | 100+ | 300+（更大网络） | AWS 全球 |
| **数据库** | Marketplace（Neon/Supabase 等） | 集成市场 | D1/KV（自建） | DynamoDB/Cognito |
| **开发者体验** | 优秀（零配置/即时预览） | 优秀 | 良好 | 中等（AWS 复杂） |
| **学习曲线** | 低 | 低 | 低 | 高 |
| **规模成本** | 可偏高 | 可偏高 | 较低 | 规模大时更优 |
| **厂商锁定** | 较高（Next.js 耦合） | 低 | 低 | 高（AWS 生态） |

### Vercel 独特优势

1. **AI SDK** — TypeScript 生态最流行的 AI 开发库，竞品无对标
2. **Next.js 关系** — 创建并维护最流行的 React 框架
3. **Fluid Compute** — 实例复用 + Active CPU 计费，高并发成本优势
4. **AI Gateway** — 统一多提供商 API，零加价，故障转移
5. **Sandbox** — Firecracker 微型 VM 安全沙箱
6. **Workflow DevKit** — 长任务持久化执行，DurableAgent
7. **Chat SDK** — 一次开发多平台聊天机器人

---

## 十、适用场景与人群

### 适用场景

| 场景 | 说明 |
|------|------|
| **前端应用部署** | Next.js/React/Vue/Svelte 零配置部署，即时预览 |
| **全栈应用** | Express/FastAPI/Hono 后端原生运行 |
| **AI 应用开发** | AI SDK + AI Gateway + Sandbox 完整工具链 |
| **多平台聊天机器人** | Chat SDK 统一开发 Slack/Teams/Discord 等 |
| **长任务/工作流** | Workflow DevKit 持久化执行 |
| **企业级应用** | SSO/审计/防火墙/SLA 保障 |

### 适用人群

| 人群 | 说明 |
|------|------|
| **前端开发者** | 零配置部署，即时预览，极致开发体验 |
| **Next.js 用户** | 一级支持，深度集成，最佳优化 |
| **AI 应用开发者** | AI SDK 是 TypeScript 生态首选 |
| **创业团队** | 免费起步，按需扩展，快速迭代 |
| **企业团队** | SSO/审计/合规/WAF/SLA 企业级保障 |

---

## 十一、近期更新（2025-2026）

### 2025 年

| 时间 | 更新 |
|------|------|
| **6月** | Rolling Releases GA、BotID GA |
| **8月** | AI Gateway GA（100+ 模型统一 API） |
| **11月** | Sign in with Vercel GA（OAuth 提供商） |
| 全年 | Fluid Compute 成为默认执行模型、Active CPU 计费、Node.js 24 LTS、AI SDK v6 |

### 2026 年（至5月）

| 时间 | 更新 |
|------|------|
| **1月** | Vercel Sandbox GA（Firecracker 微型 VM） |
| 全年 | Vercel Agent 公测、Queues 公测、Next.js 16 发布、AI Gateway 扩展至 279 模型、Chat SDK 发布 |

---

## 十二、参考资源

- [Vercel 官网](https://vercel.com)
- [Vercel 文档](https://vercel.com/docs)
- [Vercel 博客](https://vercel.com/blog)
- [Vercel 定价](https://vercel.com/pricing)
- [Vercel Marketplace](https://vercel.com/marketplace)
- [AI SDK 文档](https://ai-sdk.dev/docs)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Vercel CLI GitHub](https://github.com/vercel/vercel)
- [Workflow DevKit](https://useworkflow.dev)

---

*文档创建时间：2026年05月15日*
