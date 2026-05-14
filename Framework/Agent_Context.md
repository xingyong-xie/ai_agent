---
title: 智能体上下文
created: 2026-05-14
updated: 2026-05-14
tags: [AI, 上下文, Context Engineering, 上下文工程, 记忆]
related: "[[Agent_MCP_introduce]], [[Agent_Skills_introduce]], [[LLM_Model_Layer]]"
---

# 智能体上下文（Agent Context）

## 一、什么是智能体上下文

**智能体上下文（Agent Context）** 是 AI 智能体在执行任务时所拥有的信息环境，包括：
- 系统提示（System Prompt）
- 对话历史（Conversation History）
- 工具定义（Tool Definitions）
- 外部知识（External Knowledge）
- 执行状态（Execution State）

上下文管理是智能体高效运行的关键挑战，直接影响智能体的性能、准确性和成本。

---

## 二、Context Window 的挑战

| 挑战 | 说明 |
|------|------|
| **容量限制** | LLM 有固定的上下文窗口大小（如 200K tokens） |
| **信息膨胀** | 工具调用结果、日志文件等大量数据快速消耗上下文 |
| **成本问题** | 更多上下文意味着更高的 API 调用成本 |
| **注意力稀释** | 过多无关信息会干扰模型判断 |

---

## 三、上下文工程核心原则

**Context Engineering** 是通过精心设计和管理上下文来优化智能体性能的实践：

| 原则 | 说明 |
|------|------|
| **最小化起始** | 从最小必要上下文开始，逐步增加 |
| **注意力锚点** | 关键信息放在上下文开头或结尾（模型关注度最高） |
| **高质量优先** | 精选高信号内容，避免噪音填充 |
| **结构化组织** | 使用清晰标题、分区帮助模型解析 |
| **渐进式披露** | 先加载摘要/大纲，按需获取详细内容 |
| **压缩与总结** | 及时压缩历史对话，保留关键信息 |

---

## 四、上下文优化技术

| 技术 | 说明 | 适用场景 |
|------|------|----------|
| **观察掩码** | 数据直接存储到文件系统，不进入上下文 | 大文件处理、日志分析 |
| **压缩触发** | 上下文利用率超阈值时自动压缩历史 | 长对话会话 |
| **渐进披露** | 先加载大纲，按需获取细节 | 文档生成、报告编写 |
| **KV-Cache优化** | 稳定元素放前面，动态元素放后面 | API缓存优化 |
| **FTS5检索** | 全文搜索索引，按需检索相关信息 | 知识库查询 |

---

## 五、上下文管理工具与框架

### Context Mode

**Context Mode** 是一个 MCP 插件，专为 Claude Code 设计，可**减少 98% 的上下文窗口使用**。

| 属性 | 说明 |
|------|------|
| **类型** | MCP 插件 |
| **效果** | 减少 98% 上下文消耗 |
| **原理** | 沙箱数据处理 + FTS5/BM25 知识库索引 |
| **GitHub** | https://github.com/mksglu/context-mode |

**核心特性**：
- **沙箱执行**：在隔离子进程中处理数据，结果不进入上下文
- **FTS5 知识库**：SQLite 全文搜索，BM25 排名算法
- **会话追踪**：跨会话保持文件、任务、决策的连续性
- **多平台支持**：Claude Code、Gemini CLI、VS Code Copilot、OpenCode

### Agentic Context Engine (ACE)

**Agentic Context Engine (ACE)** 是一个让 AI 智能体从执行反馈中**持续学习改进**的框架。

| 属性 | 说明 |
|------|------|
| **来源** | Stanford & SambaNova 研究成果 (arXiv:2510.04618) |
| **类型** | Python 框架 |
| **特点** | 无需微调，纯上下文学习 |
| **GitHub** | https://github.com/kayba-ai/agentic-context-engine |

**核心架构 - 三角色协作**：

| 角色 | 功能 |
|------|------|
| **Generator** | 基于学习模式生成策略 |
| **Reflector** | 分析执行结果，识别成功/失败原因 |
| **Curator** | 更新 Playbook，添加新策略 |

**Playbook 系统**：
- 动态策略知识库
- 记录成功模式、失败教训、工具用法、边缘情况
- 每次任务后自动更新

**性能提升**：
- 复杂任务性能提升 20-35%
- Token 使用减少 49%
- 支持 100+ LLM 提供商（通过 LiteLLM）

### Context Hub

**Context Hub** 是专为 AI 编程智能体设计的**文档管理系统**。

| 属性 | 说明 |
|------|------|
| **类型** | CLI工具 + MCP服务器 |
| **特点** | 精选、版本化的第三方文档 |
| **效果** | 减少幻觉，提高准确性 |
| **GitHub** | https://github.com/andrewyng/context-hub |

**核心功能**：

| 功能 | 说明 |
|------|------|
| **文档检索** | 搜索 API、SDK、框架文档 |
| **语言变体** | 支持不同语言版本的文档 |
| **本地注释** | 添加学习笔记，跨会话持久化 |
| **反馈机制** | 向内容作者提交改进建议 |
| **自改进循环** | 持续积累知识和经验 |

**CLI 使用示例**：

```bash
# 搜索文档
chub search "stripe payments"

# 获取文档
chub get stripe/api --lang js -o stripe-docs.md

# 添加注释（保存学习成果）
chub annotate stripe/api "idempotency_key header prevents duplicate charges"
```

---

## 六、上下文工具对比

| 工具 | 类型 | 主要功能 | 效果 | 适用场景 |
|------|------|----------|------|----------|
| **Context Mode** | MCP插件 | 沙箱处理+FTS5索引 | 减少98%上下文 | 大数据处理、长会话 |
| **ACE** | Python框架 | 执行反馈学习 | 性能提升20-35% | 浏览器自动化、多步推理 |
| **Context Hub** | CLI+MCP | 精选文档管理 | 减少幻觉 | API/SDK开发、技术问答 |
| **Context Lens** | HTTP代理 | 上下文可视化 | 可视化分析 | 调试、优化分析 |

---

## 七、记忆-上下文集成

将记忆系统与上下文管理结合的最佳实践：

```python
class MemoryContextIntegrator:
    def build_context(self, task: str, current_context: str = "") -> str:
        # 1. 从任务中提取实体
        entities = self._extract_entities(task)

        # 2. 检索相关记忆
        memories = self.memory_system.retrieve(entities)

        # 3. 格式化记忆为上下文
        memory_section = self._format_memories(memories)

        # 4. 合并上下文并检查限制
        combined = current_context + "\n\n" + memory_section

        # 5. 超限时截断
        if self._token_count(combined) > self.context_limit:
            combined = self._truncate_context(combined, self.context_limit)

        return combined
```

---

## 八、最佳实践建议

| 建议 | 说明 |
|------|------|
| **分层加载** | 先摘要后细节，避免一次性加载全部 |
| **定期压缩** | 设置阈值自动触发历史压缩 |
| **实体提取** | 识别关键实体，定向检索相关信息 |
| **结构化输出** | 要求工具返回结构化、压缩的结果 |
| **缓存优化** | 稳定内容放前面，利用 KV-Cache |

---

## 九、参考资源

- [Context Mode GitHub](https://github.com/mksglu/context-mode)
- [Agentic Context Engine GitHub](https://github.com/kayba-ai/agentic-context-engine)
- [Context Hub GitHub](https://github.com/andrewyng/context-hub)
- [Agent Skills for Context Engineering](https://github.com/muratcankoylan/agent-skills-for-context-engineering)
- [Context Lens GitHub](https://github.com/larsderidder/context-lens)

---

*文档创建时间：2026年05月14日*
