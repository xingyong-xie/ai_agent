---
title: DeepSeek 网页搜索与抓取 API
created: 2026-10-25
updated: 2026-10-25
tags: [AI, DeepSeek, 搜索, 抓取, RAG, API, 工具层]
related: "[[Agent_Tool_Layer]], [[LLM_Model_Layer]], [[Agent_MCP_introduce]]"
---

# DeepSeek 网页搜索与抓取 API

## 一、概述

DeepSeek 推出两个面向 **Agent 与 RAG 应用**的实时网页接口，均使用 DeepSeek 自研搜索引擎，采用与 DeepSeek API 相同的 Bearer 鉴权：

| API | 作用 | Endpoint |
|-----|------|----------|
| **Search** | 按 query 搜索网页，返回结构化结果 | `POST https://api.deepseek.com/v1/tools/search` |
| **Fetch** | 抓取单个网页，以 Markdown 文本返回正文 | `POST https://api.deepseek.com/v1/tools/fetch` |

两者的定位互补：Search 负责「找到哪些页面值得读」，Fetch 负责「把某一页读进来」。二者都是只读请求，返回原始 JSON。

> 在 DeepSeek Harness / Claude Code / Codex 中使用 DeepSeek API 时，已经可以通过服务端工具调用访问 Search/Fetch，这部分调用目前未计费，**自北京时间 2026-11-01 00:00 起按次收费**。

---

## 二、鉴权

| 请求头 | 必填 | 值 |
|--------|------|-----|
| `Authorization` | 是 | `Bearer <DeepSeek API Key>` |
| `Content-Type` | 是 | `application/json` |

---

## 三、Search 接口

### 3.1 请求示例

```bash
curl https://api.deepseek.com/v1/tools/search \
  -H "Authorization: Bearer <DeepSeek API Key>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "DeepSeek V4 模型 发布",
    "count": 5,
    "need_content": true
  }'
```

```python
import requests

response = requests.post(
    "https://api.deepseek.com/v1/tools/search",
    headers={"Authorization": "Bearer <DeepSeek API Key>"},
    json={
        "query": "DeepSeek V4 模型 发布",
        "count": 5,
        "need_content": True,
    },
)
response.raise_for_status()

for result in response.json()["results"]:
    print(result["title"], result["url"])
    print(result["summary"])
```

### 3.2 请求字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | - | 搜索词，1～128 个 Unicode 字符，不能全为空白，支持下方搜索语法 |
| `count` | integer | 否 | `10` | 返回条数，1～50 |
| `ori_question` | string | 否 | - | 触发搜索的用户原始问题，1～128 字符，帮助理解搜索意图；传 `null` 视为未提供 |
| `localization` | string | 否 | `""` | 用于优先返回本地化搜索结果的 IP 地址 |
| `need_content` | boolean | 否 | `false` | 是否在 `content` 中返回网页正文；为 `false` 时 `content` 恒为空字符串 |

未知字段会被忽略。

### 3.3 搜索语法

搜索语法原样传递给搜索引擎，可在同一个 query 中组合多个操作符：

| 操作符 | 示例 | 说明 |
|--------|------|------|
| `site:` | `DeepSeek site:github.com` | 限定站点；多个站点用空格分隔并通过 `OR` 连接，如 `DeepSeek site:github.com OR site:huggingface.co` |
| `-site:` | `DeepSeek -site:example.com` | 排除站点，多个用空格分隔 |
| `-` | `DeepSeek -广告` | 排除包含指定关键词的网页 |
| `-"..."` | `DeepSeek -"release notes"` | 排除包含指定短语的网页 |
| `"..."` | `DeepSeek "精确短语"` | 精确匹配短语 |
| `lang:` | `DeepSeek lang:zh,en` | 限定语言，多语言用逗号分隔 |
| `after:` | `DeepSeek after:2025` 或 `after:2025-01-01` | 限定发布日期之后 |
| `before:` | `DeepSeek before:2026` 或 `before:2026-06-01` | 限定发布日期之前 |

组合示例：

```json
{
  "query": "DeepSeek 模型 site:github.com OR site:huggingface.co lang:zh after:2025",
  "count": 10
}
```

### 3.4 响应

成功返回 HTTP 200 与 `results` 数组；搜索正常结束但无匹配时返回空数组。

```json
{
  "results": [
    {
      "rerank_score": 2.4,
      "title": "DeepSeek V4 模型发布",
      "url": "https://example.com/deepseek-v4",
      "snippet": "DeepSeek V4 已上线，支持工具调用与长上下文。",
      "summary": "DeepSeek 发布了 V4 模型。此次发布改进了工具调用与长上下文能力，适合 Agent 工作流。",
      "content": "DeepSeek V4 现已正式上线……",
      "site_name": "Example News",
      "site_icon": "https://example.com/favicon.ico",
      "date": "2026-06-01T00:00:00+00:00",
      "authority": 3
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `rerank_score` | number | 排序分数，0～3，综合相关性、权威性、时效性；**≥ 1.5 为优质结果** |
| `title` | string | 标题 |
| `url` | string | 结果链接 |
| `snippet` | string | 短摘要，通常 100～200 字符，适合前端展示 |
| `summary` | string | 长摘要，通常 600～800 字符，适合喂给模型 |
| `content` | string | 网页正文；`need_content=false` 或正文缺失时为空字符串 |
| `site_name` | string \| null | 站点名称 |
| `site_icon` | string \| null | 站点图标 URL |
| `date` | string \| null | 发布时间，UTC 的 RFC 3339 格式；未知为 `null` |
| `authority` | integer | 网页权威性 0～4（`-1` 未知）；**≥ 3 为极权威结果** |

### 3.5 结果质量信号的使用

- 用 `rerank_score >= 1.5` 过滤优质结果，避免把低质量网页喂给模型
- 用 `authority >= 3` 作为「权威来源」标记，在回答中优先引用
- `date` 可用于时效性过滤（结合 `after:` / `before:` 语法在检索阶段先收窄）
- `snippet` 用于展示，`summary` 用于模型阅读；只有在确需全文时才设置 `need_content=true`

---

## 四、Fetch 接口

### 4.1 请求

```bash
curl https://api.deepseek.com/v1/tools/fetch \
  -H "Authorization: Bearer <DeepSeek API Key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

```python
import requests

response = requests.post(
    "https://api.deepseek.com/v1/tools/fetch",
    headers={"Authorization": "Bearer <DeepSeek API Key>"},
    json={"url": "https://example.com/article"},
)
response.raise_for_status()

page = response.json()
print(page["title"])
print(page["content"])
```

### 4.2 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | 是 | 网页地址，长度 ≤ 8192；必须是含 host 的 HTTP/HTTPS URL，且不能携带用户名或密码 |

### 4.3 响应

```json
{
  "title": "Example article",
  "content": "# Example article\n\nArticle content."
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 页面标题，缺失时为空字符串 |
| `content` | string | 抓取后的 Markdown 正文 |

Fetch 结果受目标站点可用性和访问策略影响，不保证任意 URL 都能取到正文。

---

## 五、错误处理

错误响应使用 OpenAI 兼容格式，`param` 恒为 `null`：

```json
{
  "error": {
    "message": "'count' must be between 1 and 50",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_request_error"
  }
}
```

| 状态码 | 说明 | 是否重试 |
|--------|------|----------|
| 400 | 请求头/请求体不合法（JSON 错误或字段值无效） | 否，先修正请求 |
| 401 | API Key 缺失或无效 | 否 |
| 402 | 账号余额不足 | 否，充值后重试 |
| 403 | Fetch 被安全策略拒绝 | 否 |
| 404 | Fetch 未获取到可用网页内容（URL 不可用/被拦截/站点报错/类型不支持/无 Markdown 正文） | 否 |
| 408 | 读取请求体超时 | 是，等待后重试 |
| 413 | 请求体超过大小限制 | 否 |
| 429 | 超过 Search 或 Fetch 的 QPS 限制 | 是，退避后重试 |
| 500 | 服务器内部错误 | 是 |
| 504 | 下游请求超时 | 是 |

---

## 六、计费

Search 和 Fetch **按请求次数计费**，不按 token 或返回条数计费：

| API | 计费单位 | 价格 |
|-----|----------|------|
| Search | 每 1,000 次成功请求 | 5 元 |
| Fetch | 每 1,000 次成功请求 | 5 元 |

计费细则：

- 只有返回 HTTP 200 且产生结果的请求才计费：Search 的 `results` 必须非空，Fetch 必须返回网页正文
- 请求失败、搜索无结果、超时都不计费
- `count` 只控制返回条数，不影响单次请求价格
- Harness（Claude Code / Codex）中的服务端 Search/Fetch 调用目前免费，**2026-11-01 00:00（北京时间）起按次收费**

---

## 七、限速

对每个账号，Search 与 Fetch 分别独立限速，互不占用额度：

| API | QPS 限制 |
|-----|----------|
| Search | 100 |
| Fetch | 25 |

- QPS 按账号粒度计算，与使用哪个 API Key 无关，也与模型并发限制相互独立
- 超过账号级 QPS 会返回 HTTP 429
- Fetch 另外还有**目标域名级** QPS 限制，超过同样返回 429

---

## 八、Agent / RAG 集成建议

### 8.1 典型检索流程

```
用户问题
  → Search（ori_question 传入原始问题，query 可加 site:/lang:/after: 收窄）
  → 过滤 rerank_score ≥ 1.5（必要时 authority ≥ 3）
  → 多条结果用 summary 直接喂模型
  → 需要全文的少数结果再调 Fetch
  → 拼接来源（title/url/date）→ 交给 LLM 生成带引用的回答
```

### 8.2 作为工具暴露给模型

```json
{
  "type": "function",
  "function": {
    "name": "web_search",
    "description": "搜索实时网页，返回标题、链接、摘要与质量分",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "搜索词，支持 site:/lang:/after: 等语法"
        },
        "count": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 10
        },
        "ori_question": {
          "type": "string",
          "description": "用户的原始问题，用于理解搜索意图"
        }
      },
      "required": ["query"]
    }
  }
}
```

### 8.3 工程注意事项

| 事项 | 建议 |
|------|------|
| **重试策略** | 408 / 429 / 5xx 指数退避重试；402 充值后重试；其它 4xx 不重试 |
| **成本控制** | `count` 按需设置（默认 10）；优先用 `summary`，仅为少量结果开启 `need_content` 或调用 Fetch |
| **缓存去重** | 相同 query + 参数的结果可缓存；多轮对话中复用已抓取页面 |
| **时效性** | 时效敏感问题使用 `after:` / `before:` 在检索阶段收窄，并检查 `date` |
| **内容安全** | 网页内容是外部不可信输入，需防范提示词注入；不要把抓取内容直接当作指令执行 |
| **Fetch 校验** | 只允许 HTTP/HTTPS，限制目标域名白名单，避免内网地址（SSRF 风险） |
| **结果可追溯** | 回答中保留 `title` + `url` + `date`，便于用户核验 |

### 8.4 适用场景

- 需要**实时信息**的问答（新闻、产品发布、价格、赛事）
- **RAG 的在线检索补充**：本地知识库 + 网页检索的混合方案
- **深度研究 Agent**：Search → 过滤 → Fetch → 多源交叉验证
- **竞品/舆情监控**：定时用 `site:` + `after:` 定向抓取

---

## 九、参考资源

- [DeepSeek 网页搜索与抓取指南](https://api-docs.deepseek.com/zh-cn/guides/search/)
- [Search API Reference](https://api-docs.deepseek.com/zh-cn/api/search)
- [Fetch API Reference](https://api-docs.deepseek.com/zh-cn/api/fetch)
- [DeepSeek 开放平台](https://platform.deepseek.com/)

*文档创建时间：2026年10月25日*
