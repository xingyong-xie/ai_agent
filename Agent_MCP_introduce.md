# 智能体MCP（模型上下文协议）介绍
## 一、什么是MCP
**MCP（Model Context Protocol，模型上下文协议）** 是由 Anthropic 推出的**开放协议标准**，用于标准化AI应用如何向大语言模型提供上下文和外部能力。MCP充当一个通用接口层，将AI模型与各种数据源、工具和服务连接起来。
| 核心属性 | 说明 |
|----------|------|
| 推出方 | Anthropic |
| 类型 | 开放网络协议标准 |
| 底层协议 | JSON-RPC 2.0 |
| 开源状态 | 完全开源 |
| 设计目标 | 标准化AI应用与外部世界的通信方式，打破能力壁垒 |
| 灵感来源 | 借鉴Language Server Protocol (LSP) 的设计思想，实现"一次实现，到处可用" |
## 二、核心价值
### 2.1 对于智能体开发者
- **统一接入标准**：所有数据源和工具都通过标准方式接入，无需为每个平台单独开发集成
- **解耦设计**：AI应用与数据源分离，可灵活组合不同的MCP服务器
- **降低开发成本**：直接复用社区已有的MCP服务器，无需从零开发各种工具集成
### 2.2 对于企业用户
- **安全可控**：统一管理外部数据和工具的访问权限，审计所有调用
- **能力复用**：一次部署MCP服务器，所有智能体产品都可使用
- **生态兼容**：支持所有主流智能体产品，保护技术投资
### 2.3 对于生态发展
- **开放繁荣**：社区可以自由开发和共享MCP服务器，快速扩展整个生态的能力
- **标准统一**：避免碎片化的私有协议，降低整个生态的协作成本
## 三、架构设计
MCP采用经典的 **客户端-服务器三层架构**：
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MCP Host   │────▶│ MCP Client  │────▶│ MCP Server  │
│ (AI智能体应用)│     │ (内置连接器)     │ (能力提供者) │
└─────────────┘     └─────────────┘     └─────────────┘
```
### 各角色说明
| 角色 | 说明 | 示例 |
|------|------|------|
| **Host（主机）** | 启动MCP连接的AI智能体应用 | Claude Code、Cursor、VS Code Copilot、Hermes Agent |
| **Client（客户端）** | Host内置的MCP连接器，负责与服务器通信 | 各智能体内置的MCP客户端实现 |
| **Server（服务器）** | 提供具体能力的后端服务 | 文件系统服务器、GitHub服务器、PostgreSQL服务器 |
### 工作流程
1. Host启动时根据配置连接指定的MCP服务器
2. 客户端获取服务器提供的能力列表（资源、工具、提示模板）
3. LLM在推理过程中根据需求调用对应的MCP能力
4. 服务器返回结果，LLM结合结果生成最终回答
## 四、核心功能
MCP服务器可以向智能体提供三类核心能力：
### 4.1 Resources（资源）
暴露可读取的数据资源，智能体可以直接获取这些资源内容作为上下文：
- 文件内容、数据库记录、API响应、文档内容等
- 支持资源变更通知，智能体可以感知数据更新
### 4.2 Tools（工具）
提供可调用的函数接口，智能体可以通过参数调用执行实际操作：
- 搜索文件、发送Slack消息、查询数据库、执行命令等
- 工具定义采用标准化格式，兼容OpenAI Function Calling、Anthropic Tool Use等主流格式
### 4.3 Prompts（提示模板）
提供预定义的提示模板，标准化常见工作流：
- 代码审查模板、报告生成模板、故障排查模板等
- 可复用常用提示，避免重复编写
### 4.4 客户端侧能力
MCP客户端也向服务器提供能力支持：
- **Sampling（采样）**：服务器可以发起LLM生成请求
- **Roots（根目录）**：服务器可以询问文件系统边界
- **Elicitation（引导）**：服务器可以请求用户提供额外信息
## 五、常用MCP服务器列表
目前官方和社区已提供数百个开箱即用的MCP服务器：
### 官方维护服务器
| 服务器 | 功能 |
|--------|------|
| Filesystem | 文件系统读写访问 |
| GitHub | GitHub API集成，PR/Issue管理 |
| Git | Git仓库操作 |
| Google Drive | Google Drive文件访问 |
| Puppeteer | 浏览器自动化，网页抓取、截图 |
| PostgreSQL | PostgreSQL数据库查询 |
| Slack | Slack消息发送、频道管理 |
### 社区热门服务器
| 服务器 | 功能 |
|--------|------|
| MySQL | MySQL数据库查询 |
| Redis | Redis缓存操作 |
| Jira | Jira工单管理 |
| Confluence | Confluence文档访问 |
| Calendar | 日历日程管理 |
| Notion | Notion页面读写 |
| AWS | 亚马逊云服务操作 |
## 六、支持MCP的产品
主流AI智能体产品均已内置MCP客户端支持：
| 产品 | 支持程度 | 说明 |
|------|----------|------|
| **Claude Code** | 完整支持 | Anthropic官方产品，原生深度集成 |
| **Cursor** | 完整支持 | 最新版本已内置MCP客户端，可视化配置 |
| **VS Code Copilot** | 支持 | Agent模式下可使用MCP能力 |
| **Zed** | 支持 | 编辑器原生内置MCP支持 |
| **Windsurf** | 支持 | Codeium旗下IDE，MCP扩展能力 |
| **Hermes Agent** | 完整支持 | 开源智能体，原生MCP集成 |
| **OpenClaw** | 支持 | 多平台AI助手网关，MCP集成 |
## 七、配置示例（Claude Code）
在Claude Code的 `settings.json` 配置文件中添加MCP服务器：
```json
{
  "mcpServers": {
    // 文件系统服务器
    "filesystem": {
      "command": "node",
      "args": ["mcp-server-filesystem", "/workspace/project"]
    },
    // GitHub服务器
    "github": {
      "command": "node",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    // PostgreSQL服务器
    "postgres": {
      "command": "node",
      "args": ["mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db"
      }
    },
    // 浏览器自动化服务器
    "puppeteer": {
      "command": "node",
      "args": ["mcp-server-puppeteer"]
    }
  }
}
```
配置完成后重启Claude Code即可自动连接这些服务器，获得对应的能力。
## 八、MCP服务器开发指南
### 8.1 开发方式
官方提供Python和TypeScript两种SDK，可快速开发自定义MCP服务器：
#### Python示例
```python
from mcp.server import Server
from mcp.types import Tool
from datetime import datetime
# 创建服务器实例
server = Server("my-custom-server")
# 声明提供的工具
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_current_time",
            description="获取当前系统时间，格式为ISO 8601"
        )
    ]
# 实现工具调用逻辑
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_current_time":
        return {
            "content": [
                {
                    "type": "text",
                    "text": datetime.now().isoformat()
                }
            ]
        }
    
    raise ValueError(f"未知工具：{name}")
# 启动服务器
if __name__ == "__main__":
    server.run()
```
### 8.2 开发流程
1. 选择合适的SDK（Python/TypeScript）
2. 实现资源/工具/提示模板的相关接口
3. 本地测试服务器功能
4. 打包发布，配置到智能体中使用
## 九、与类似协议的对比
| 协议 | 类型 | 主要用途 | 设计目标 |
|------|------|----------|----------|
| **MCP** | AI上下文协议 | 连接AI智能体与数据源/工具 | 标准化AI与外部世界的通信 |
| **LSP** | 语言服务协议 | 编辑器与语言服务通信 | 标准化代码编辑器的语言支持 |
| **OpenAPI** | API规范 | RESTful API定义 | 标准化HTTP接口的描述方式 |
| **GraphQL** | API查询语言 | 数据API查询 | 优化客户端的数据获取方式 |
## 十、最佳实践
### 10.1 部署最佳实践
- 按业务领域划分MCP服务器，避免单服务器功能过多
- 敏感数据的MCP服务器部署在企业内网，配置访问控制
- 对MCP服务器的所有调用记录审计日志，便于追溯
### 10.2 使用最佳实践
- 仅加载当前项目需要的MCP服务器，减少不必要的能力暴露
- 定期更新MCP服务器版本，获得最新功能和安全修复
- 自定义MCP服务器提供清晰的工具描述和参数约束，减少LLM错误调用
### 10.3 安全最佳实践
- 对写入/执行类工具配置权限审批，避免危险操作
- 限制MCP服务器的访问范围，最小权限原则
- 敏感数据的MCP服务器配置加密和身份认证
## 十一、参考资源
- [MCP 官方网站](https://modelcontextprotocol.io)
- [MCP 官方GitHub](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [MCP 规范文档](https://modelcontextprotocol.io/specification)
- [官方MCP服务器集合](https://github.com/modelcontextprotocol/servers)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
*文档创建时间：2026年4月29日*
