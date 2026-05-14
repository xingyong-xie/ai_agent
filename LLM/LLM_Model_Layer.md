---
title: 智能体模型层
created: 2026-05-14
updated: 2026-05-14
tags: [AI, 模型层, LLM, 提供商, 路由, 成本]
related: "[[LLM_Transformer_Architecture]], [[LLM_MoE_Architecture]], [[AI_Agent_Development_Framework]]"
---

# 智能体模型层（Model Layer）

## 一、什么是智能体模型层

**智能体模型层** 是 AI 智能体的核心组成部分，负责提供推理、决策和生成能力。模型层的选择和配置直接影响智能体的性能、成本和可靠性。

| 组成部分 | 说明 |
|----------|------|
| **模型选择** | 根据任务需求选择合适的 LLM |
| **模型提供商** | 连接不同的 LLM 服务（OpenAI、Anthropic、Google等） |
| **模型路由** | 多模型负载均衡、降级、重试策略 |
| **成本管理** | Token 计费、预算控制、使用追踪 |

---

## 二、主流 LLM 提供商

| 提供商 | 代表模型 | 特点 | 定价参考 |
|--------|----------|------|----------|
| **Anthropic** | Claude Opus 4.6、Sonnet 4.6、Haiku 4.5 | 推理能力强、安全可靠、长上下文 | $15-75/百万token |
| **OpenAI** | GPT-4o、GPT-4.1、o1、o3-mini | 生态成熟、工具丰富、API稳定 | $5-30/百万token |
| **Google** | Gemini 2.5 Pro、Flash | 多模态、免费额度、Google生态 | $1.25-8.75/百万token |
| **xAI** | Grok 2、Grok 3 | 实时信息、社交媒体集成 | $5-15/百万token |
| **Meta** | Llama 3.1、3.2、3.3 | 开源、可本地部署、免费 | 开源免费 |
| **Mistral** | Mistral Large、Medium | 欧洲出品、开源版本 | $2-8/百万token |
| **DeepSeek** | DeepSeek V3、R1 | 中国出品、性价比高 | $0.27-1.1/百万token |
| **本地模型** | Ollama、vLLM、LocalAI | 隐私优先、无API费用 | 硬件成本 |

---

## 三、国内主流 LLM 提供商（Top 10）

| 厂商 | 代表模型 | 特点 | 定价参考 |
|------|----------|------|----------|
| **阿里通义** | Qwen2.5、Qwen-Max、Qwen-Plus | 中文能力强，多模态支持，阿里生态 | $0.5-4/百万 token |
| **百度文心** | 文心一言 4.5、文心一言 X1 | 中文理解深，知识图谱丰富，百度搜索集成 | ¥0.8-12/千 token |
| **腾讯混元** | 混元 Large、混元 Lite | 游戏/社交场景优化，微信生态集成 | ¥0.5-8/千 token |
| **字节豆包** | 豆包 1.5 Pro、豆包 Lite | 字节生态，短视频/推荐场景优化 | ¥0.3-5/千 token |
| **智谱 AI** | GLM-Edge、GLM-Pro | 清华系，中英双语，长上下文支持 | ¥1-15/千 token |
| **月之暗面** | Kimi K1.5、Kimi Plus | 超长上下文（200 万 +），中文搜索增强 | ¥1-10/千 token |
| **MiniMax** | MiniMax-01、海螺 AI | 多模态生成，语音/文本双模优化 | ¥0.5-6/千 token |
| **阶跃星辰** | 跃问 Lite、跃问 Pro | 清华背景，推理能力强，企业级服务 | ¥0.8-8/千 token |
| **零一万物** | Yi-Lightning、Yi-Large | 李开复创办，中英双语优秀，开源友好 | ¥0.6-5/千 token |
| **百川智能** | Baichuan 2、Baichuan N1 | 医疗/金融场景优化，开源模型丰富 | ¥0.4-4/千 token |

### 国内厂商产品详情

**1. 阿里通义千问**
| 属性 | 说明 |
|------|------|
| **厂商** | 阿里巴巴达摩院 |
| **官网** | https://tongyi.aliyun.com |
| **API 平台** | 阿里云百炼平台 |
| **主力模型** | Qwen2.5-72B、Qwen-Max（商用）、Qwen-Plus（平衡） |
| **特点** | 中文能力最强之一，支持 256K 上下文，多模态（图像/音频/视频） |

**2. 百度文心一言**
| 属性 | 说明 |
|------|------|
| **厂商** | 百度 |
| **官网** | https://yiyan.baidu.com |
| **API 平台** | 百度智能云千帆大模型平台 |
| **主力模型** | 文心一言 4.5、文心一言 X1（推理增强） |
| **特点** | 中文知识图谱丰富，搜索增强，适合政务/企业场景 |

**3. 腾讯混元**
| 属性 | 说明 |
|------|------|
| **厂商** | 腾讯 |
| **官网** | https://hunyuan.tencent.com |
| **API 平台** | 腾讯云混元平台 |
| **主力模型** | 混元 Large、混元 Lite、混元 Turbo |
| **特点** | 游戏/社交场景优化，微信/企业微信生态集成 |

**4. 字节豆包**
| 属性 | 说明 |
|------|------|
| **厂商** | 字节跳动 |
| **官网** | https://doubao.com |
| **API 平台** | 火山引擎方舟大模型平台 |
| **主力模型** | 豆包 1.5 Pro、豆包 Lite、Doubao-seed（视觉） |
| **特点** | 短视频/推荐场景优化，字节生态集成，性价比高 |

**5. 智谱 AI（GLM）**
| 属性 | 说明 |
|------|------|
| **厂商** | 智谱 AI（清华系） |
| **官网** | https://open.bigmodel.cn |
| **API 平台** | 智谱开放平台 |
| **主力模型** | GLM-Edge（边缘）、GLM-Pro（商用）、GLM-130B（开源） |
| **特点** | 中英双语优秀，长上下文（128K），开源生态友好 |

**6. 月之暗面（Kimi）**
| 属性 | 说明 |
|------|------|
| **厂商** | 月之暗面科技 |
| **官网** | https://kimi.ai |
| **API 平台** | 月之暗面开放平台 |
| **主力模型** | Kimi K1.5、Kimi Plus、Kimi Search |
| **特点** | 全球领先 200 万 + 字上下文，中文搜索增强，长文档分析专家 |

**7. MiniMax**
| 属性 | 说明 |
|------|------|
| **厂商** | MiniMax（稀宇科技） |
| **官网** | https://www.minimax.io |
| **API 平台** | MiniMax 开放平台 |
| **主力模型** | MiniMax-01、海螺 AI、Speech-01（语音） |
| **特点** | 多模态生成能力强，语音合成业界领先，游戏/社交场景优化 |

**8. 阶跃星辰**
| 属性 | 说明 |
|------|------|
| **厂商** | 阶跃星辰（StepFun） |
| **官网** | https://www.stepfun.com |
| **API 平台** | 阶跃开放平台 |
| **主力模型** | 跃问 Lite、跃问 Pro、Step-1V（视觉） |
| **特点** | 清华背景，推理能力强，企业级服务，多模态理解优秀 |

**9. 零一万物**
| 属性 | 说明 |
|------|------|
| **厂商** | 零一万物（李开复创办） |
| **官网** | https://www.lingyiwanwu.com |
| **API 平台** | 零一开放平台 |
| **主力模型** | Yi-Lightning、Yi-Large、Yi-34B（开源） |
| **特点** | 中英双语优秀，开源社区活跃，HuggingFace 热门模型提供方 |

**10. 百川智能**
| 属性 | 说明 |
|------|------|
| **厂商** | 百川智能（搜狗创始人王小川创办） |
| **官网** | https://www.baichuan-ai.com |
| **API 平台** | 百川开放平台 |
| **主力模型** | Baichuan 2、Baichuan N1、Baichuan-M1（多模态） |
| **特点** | 医疗/金融垂直场景优化，开源模型丰富，中文理解优秀 |

---

## 四、模型能力对比

| 能力维度 | Claude Opus | GPT-4o | Gemini Pro | Llama 3.1 |
|----------|-------------|--------|------------|-----------|
| **推理能力** | 极强 | 强 | 强 | 中 |
| **代码生成** | 极强 | 极强 | 强 | 强 |
| **长上下文** | 200K | 128K | 1M+ | 128K |
| **多模态** | 支持 | 支持 | 支持 | 部分 |
| **工具调用** | 极强 | 强 | 强 | 中 |
| **安全合规** | 极强 | 强 | 强 | 中 |
| **开源程度** | 闭源 | 闭源 | 闭源 | 开源 |

---

## 五、模型选择策略

| 任务类型 | 推荐模型 | 原因 |
|----------|----------|------|
| **复杂推理** | Claude Opus 4.6 | 推理能力最强，安全可靠 |
| **日常对话** | Claude Sonnet 4.6 / GPT-4o | 平衡性能与成本 |
| **代码生成** | Claude Code / GPT-4.1 | 专为代码优化 |
| **大规模文档** | Gemini 2.5 Pro | 1M+ 上下文窗口 |
| **成本敏感** | Claude Haiku / Gemini Flash | 低价高效 |
| **隐私优先** | Llama 3.1 + Ollama | 本地部署，数据可控 |
| **实时信息** | Grok / Gemini | 实时搜索能力 |
| **中国场景** | DeepSeek V3 | 中文优化，性价比高 |

---

## 六、LiteLLM：统一模型调用接口

**LiteLLM** 是开源的统一模型调用库，提供 OpenAI 兼容接口，支持 100+ LLM 提供商。

| 属性 | 说明 |
|------|------|
| **类型** | Python SDK + Proxy 服务器 |
| **开源** | MIT 许可证 |
| **支持模型** | 100+ 提供商 |
| **GitHub** | https://github.com/BerriAI/litellm |

**核心功能**：

| 功能 | 说明 |
|------|------|
| **统一接口** | 所有模型使用 OpenAI 格式调用 |
| **模型路由** | 负载均衡、降级、重试 |
| **成本追踪** | Token 计费、预算管理 |
| **Fallback** | 自动降级到备用模型 |
| **流式输出** | 统一的流式响应处理 |
| **缓存优化** | 响应缓存减少成本 |

**使用示例**：

```python
from litellm import completion

# 统一调用不同提供商
response = completion(
    model="claude-3-sonnet-20240229",  # Anthropic
    messages=[{"role": "user", "content": "Hello"}]
)

response = completion(
    model="gpt-4o",  # OpenAI
    messages=[{"role": "user", "content": "Hello"}]
)

response = completion(
    model="gemini/gemini-pro",  # Google
    messages=[{"role": "user", "content": "Hello"}]
)

# 本地模型
response = completion(
    model="ollama/llama3.1",
    messages=[{"role": "user", "content": "Hello"}]
)
```

---

## 七、模型路由配置

**负载均衡配置**：

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      rpm: 500  # 每分钟请求限制

  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4o
      api_key: os.environ/AZURE_API_KEY
      rpm: 800

router_settings:
  routing_strategy: simple-shuffle  # 负载均衡策略
  num_retries: 3
  timeout: 30
```

**降级策略配置**：

```yaml
litellm_settings:
  fallbacks:
    - {"gpt-4": ["claude-3-sonnet", "gemini-pro"]}
  context_window_fallbacks:
    - {"gpt-4": ["gpt-3.5-turbo-16k"]}
  allowed_fails: 3
  cooldown_time: 30
```

**路由策略类型**：

| 策略 | 说明 |
|------|------|
| **simple-shuffle** | 简单轮询，均匀分配请求 |
| **usage-based-routing** | 根据使用量动态分配 |
| **latency-based-routing** | 根据响应延迟选择最快节点 |
| **cost-based-routing** | 根据成本优先选择便宜模型 |

---

## 八、成本管理

**Token 计费追踪**：

```python
from litellm import completion

response = completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    metadata={"user_id": "user123"}  # 用户追踪
)

# 获取成本信息
print(response.usage)  # Token 使用量
cost = litellm.completion_cost(response)  # 计算成本
```

**预算控制配置**：

```yaml
general_settings:
  master_key: "your-master-key"

  # 预算限制
  budget_duration: "1d"  # 每日预算
  max_budget: 100  # 最大金额

  # 用户级预算
  user_budgets:
    user123: 10
    user456: 20
```

---

## 九、多模型协作

智能体可同时使用多个模型，各司其职：

| 模型角色 | 推荐模型 | 用途 |
|----------|----------|------|
| **主模型** | Claude Sonnet / GPT-4o | 复杂推理、决策 |
| **快速模型** | Claude Haiku / Gemini Flash | 简单任务、大量并发 |
| **工具模型** | GPT-4o-mini | 工具调用、格式化输出 |
| **代码模型** | Claude Code / DeepSeek Coder | 代码生成、审查 |
| **视觉模型** | GPT-4o-vision / Gemini Vision | 图像理解、OCR |

---

## 十、模型层最佳实践

| 建议 | 说明 |
|------|------|
| **分级使用** | 复杂任务用强模型，简单任务用快模型 |
| **设置降级** | 主模型失败时自动降级到备用模型 |
| **监控成本** | 实时追踪 Token 消耗，设置预算上限 |
| **缓存响应** | 相似请求缓存结果，减少重复调用 |
| **本地优先** | 非敏感任务优先使用本地开源模型 |
| **异步调用** | 并发任务使用异步 API 提高效率 |

---

## 十一、参考资源

- [LiteLLM 官网](https://litellm.ai)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [LiteLLM 文档](https://docs.litellm.ai)
- [Anthropic Claude](https://www.anthropic.com)
- [OpenAI GPT](https://platform.openai.com)
- [Google Gemini](https://ai.google.dev)
- [xAI Grok](https://x.ai)
- [Meta Llama](https://llama.meta.com)
- [DeepSeek](https://www.deepseek.com)
- [Ollama 本地模型](https://ollama.ai)

---

*文档创建时间：2026年05月14日*
