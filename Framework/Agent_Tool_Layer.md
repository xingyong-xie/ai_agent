---
title: 智能体工具层
created: 2026-05-14
updated: 2026-05-14
tags: [AI, 工具层, Function Calling, 工具调用, 工具定义]
related: "[[Agent_MCP_introduce]], [[Agent_Skills_introduce]], [[AI_Agent_Development_Framework]]"
---

# 智能体工具层（Tool Layer）

## 一、什么是智能体工具层

**智能体工具层（Tool Layer）** 是 AI 智能体与外部世界交互的桥梁，负责管理工具的发现、调用和结果处理。工具层让智能体能够执行实际操作，而非仅限于文本生成。

| 组成部分 | 说明 |
|----------|------|
| **工具注册** | 维护可用工具及其定义（名称、描述、参数） |
| **工具路由** | 根据任务意图选择合适的工具 |
| **参数映射** | 将自然语言转换为结构化参数 |
| **执行引擎** | 调用实际的 API、函数或系统 |
| **结果解析** | 将工具返回结果格式化为 LLM 可理解的文本 |

---

## 二、工具层的核心价值

| 价值 | 说明 |
|------|------|
| **能力扩展** | 让智能体超越纯文本，执行实际操作 |
| **外部连接** | 连接数据库、API、文件系统等外部系统 |
| **标准化接口** | 统一的工具定义和调用规范 |
| **可组合性** | 多个工具可串联完成复杂任务 |

---

## 三、工具类型分类

**按功能分类**：

| 类别 | 工具示例 | 用途 |
|------|----------|------|
| **文件操作** | Read、Write、Edit、Glob | 读写文件、目录搜索 |
| **代码执行** | Bash、Python REPL | 运行命令、执行脚本 |
| **搜索检索** | Grep、WebSearch、WebFetch | 内容搜索、网络请求 |
| **数据分析** | SQL Query、Chart Generator | 数据库查询、图表生成 |
| **代码智能** | LSP（跳转定义、查找引用） | 代码分析、重构 |
| **通信工具** | Email、Slack、Telegram | 发送消息、通知 |
| **图像处理** | Image Generator、OCR | 图像生成、文字识别 |
| **浏览器控制** | Puppeteer、Selenium | 网页抓取、自动化 |
| **数据库** | PostgreSQL、MongoDB、Redis | 数据存储、查询 |
| **云服务** | AWS、Azure、GCP API | 云资源管理 |

**按调用模式分类**：

| 模式 | 说明 | 示例 |
|------|------|------|
| **同步调用** | 单个工具顺序执行 | 先读文件再编辑 |
| **并行调用** | 多个工具同时执行 | 同时搜索多个数据源 |
| **链式调用** | 一个工具的输出作为下一个的输入 | 搜索→过滤→格式化 |
| **条件调用** | 根据结果决定是否调用下一个 | 失败时调用备用工具 |

---

## 四、工具定义规范

**OpenAI Function Calling 格式**：

```json
{
  "type": "function",
  "function": {
    "name": "search_files",
    "description": "Search for files matching a pattern in the project directory",
    "parameters": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string",
          "description": "The glob pattern to search for (e.g., '*.md')"
        },
        "path": {
          "type": "string",
          "description": "The directory to search in (optional)"
        }
      },
      "required": ["pattern"]
    }
  }
}
```

**Anthropic Tool Use 格式**：

```json
{
  "name": "search_files",
  "description": "Search for files matching a pattern",
  "input_schema": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Glob pattern like '*.md'"
      }
    },
    "required": ["pattern"]
  }
}
```

**Google Gemini Function Declarations**：

```json
{
  "name": "search_files",
  "description": "Search files in project",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "File pattern"
      }
    },
    "required": ["pattern"]
  }
}
```

---

## 五、工具调用流程

```
用户请求 → LLM推理 → 决定调用工具 → 生成参数 → 执行工具 → 获取结果 → 返回LLM → 生成回答
```

**详细流程**：

1. **意图识别** - LLM 分析用户请求，判断是否需要工具
2. **工具选择** - 从工具列表中选择合适的工具
3. **参数生成** - 根据用户请求生成结构化参数
4. **工具执行** - 调用实际函数/API
5. **结果处理** - 解析执行结果
6. **上下文更新** - 将结果添加到对话历史
7. **回答生成** - LLM 结合结果生成最终回答

---

## 六、LangChain 工具开发

**创建自定义工具**：

```python
from langchain.tools import tool
from pydantic import BaseModel

class SearchInput(BaseModel):
    query: str
    max_results: int = 10

@tool(args_schema=SearchInput)
def search_database(query: str, max_results: int = 10) -> str:
    """Search the database for matching records.

    Args:
        query: The search query string
        max_results: Maximum number of results to return
    """
    # 实际数据库查询逻辑
    results = db.search(query, limit=max_results)
    return str(results)
```

**使用工具的智能体**：

```python
from langchain.agents import create_tool_calling_agent
from langchain_openai import ChatOpenAI

tools = [search_database, read_file, send_email]
llm = ChatOpenAI(model="gpt-4o")

agent = create_tool_calling_agent(llm, tools)

# 执行任务
result = agent.invoke({
    "input": "搜索数据库中关于AI的记录，并发送邮件通知"
})
```

---

## 七、Claude Code 内置工具

Claude Code 提供丰富的内置工具集：

| 工具 | 功能 | 参数示例 |
|------|------|----------|
| **Read** | 读取文件内容 | `file_path: "/src/main.py"` |
| **Write** | 写入新文件 | `file_path`, `content` |
| **Edit** | 编辑现有文件 | `file_path`, `old_string`, `new_string` |
| **Bash** | 执行 shell 命令 | `command: "npm test"` |
| **Glob** | 文件模式搜索 | `pattern: "**/*.ts"` |
| **Grep** | 内容正则搜索 | `pattern: "function.*"` |
| **LSP** | 代码智能操作 | `operation: "goToDefinition"` |
| **WebFetch** | 获取网页内容 | `url: "https://example.com"` |
| **WebSearch** | 网络搜索 | `query: "Python教程"` |
| **TaskCreate** | 创建子任务 | `subject`, `description` |

---

## 八、工具调用最佳实践

**工具设计原则**：

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个工具只做一件事，保持简单 |
| **清晰描述** | 工具名称和描述要准确，便于 LLM 理解 |
| **参数验证** | 使用 Schema 验证参数，防止错误调用 |
| **错误处理** | 返回清晰的错误信息，便于 LLM 修正 |
| **结果简洁** | 输出精炼，避免消耗过多上下文 |

**工具调用优化**：

| 建议 | 说明 |
|------|------|
| **并行化** | 无依赖的工具可并行调用，提高效率 |
| **缓存结果** | 相似请求缓存工具结果，减少重复调用 |
| **降级策略** | 工具失败时提供备用方案 |
| **权限控制** | 限制工具的访问范围，确保安全 |
| **输出压缩** | 大结果压缩为摘要，节省上下文 |

---

## 九、工具与 Skills 的区别

| 维度 | 工具（Tool） | 技能（Skill） |
|------|--------------|---------------|
| **定义** | 单一功能函数 | 指令+脚本+资源的组合 |
| **粒度** | 原子操作 | 工作流程 |
| **复杂度** | 简单直接 | 可包含多个工具 |
| **可移植性** | 依赖智能体平台 | 开放标准，跨平台 |
| **示例** | `read_file()` | "代码审查"技能 |

---

## 十、工具层框架对比

| 框架 | 工具数量 | 特点 |
|------|----------|------|
| **LangChain** | 500+ | 预构建集成丰富，社区活跃 |
| **Claude Code** | 11+ | CLI专用，深度集成 |
| **MCP Servers** | 数百个 | 开放标准，可跨平台 |
| **AutoGPT Plugins** | 100+ | 自主智能体专用 |
| **OpenAI Assistants** | 自定义 | OpenAI生态集成 |

---

## 十一、工具安全与权限

| 安全措施 | 说明 |
|----------|------|
| **白名单机制** | 只允许调用预先批准的工具 |
| **权限分级** | 工具分为只读/写入/执行等权限级别 |
| **参数限制** | 限制可传递的参数范围 |
| **沙箱执行** | 在隔离环境中执行危险操作 |
| **审计日志** | 记录所有工具调用，便于追溯 |

---

## 十二、参考资源

- [LangChain Tools 文档](https://python.langchain.com/docs/concepts/tools)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Google Gemini Function Calling](https://ai.google.dev/gemini/docs/function-calling)
- [Claude Code 工具](https://code.claude.com/docs/tools)
- [MCP Servers 目录](https://github.com/modelcontextprotocol/servers)

---

*文档创建时间：2026年05月14日*
