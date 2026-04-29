# AI智能体技能（Agent Skills）介绍
## 一、什么是AI智能体技能
**Agent Skills** 是由 [agentskills.io](https://agentskills.io) 推出的**开放格式标准**，用于为AI智能体扩展新能力。通过可复用的指令、脚本和资源文件夹，让智能体获得领域专业知识、新功能和可重复的工作流程。
| 核心属性 | 说明 |
|----------|------|
| 定位 | AI智能体能力扩展的通用开放标准 |
| 开源状态 | 完全开源 |
| 核心特点 | 写一次，到处可用；可移植、可版本控制、跨平台兼容 |
| 设计目标 | 标准化智能体能力扩展方式，降低重复开发成本 |
## 二、核心价值
### 2.1 对开发者
- **减少重复工作**：同一技能可在不同智能体产品中使用，无需为每个平台单独开发
- **标准化交付**：统一的技能格式，便于团队共享和版本管理
- **快速扩展能力**：通过安装现有技能快速获得领域能力，无需从零开发
### 2.2 对企业
- **知识沉淀**：将团队最佳实践、领域专业知识打包为可复用的技能包
- **能力复用**：通用工作流程一次开发，全团队共享使用
- **安全可控**：可审核技能内容，统一管理企业级能力权限
### 2.3 对智能体生态
- **互操作性**：打破不同智能体产品之间的能力壁垒
- **生态繁荣**：社区可自由贡献和共享技能，快速丰富整个生态的能力
## 三、技能标准结构
一个符合规范的技能采用目录结构存储，包含以下部分：
```
skill-name/
├── SKILL.md          # 必需：元数据 + 使用指令（核心文件）
├── scripts/          # 可选：可执行代码脚本（Python、Bash等）
├── references/       # 可选：参考文档、知识库、规则文件
├── assets/           # 可选：模板、配置文件、静态资源
└── examples/         # 可选：使用示例、演示用例
```
## 四、SKILL.md 格式规范
每个技能必须包含 `SKILL.md` 核心文件，由 **YAML frontmatter** 和 **Markdown 内容**两部分组成：
```markdown
---
# Frontmatter 元数据（必需）
name: code-review
description: Perform code review on pull requests, check for security issues, style consistency and performance problems. Use when asked to review code or PRs.
license: Apache-2.0
metadata:
  author: your-org
  version: "1.2.0"
  category: Technical
  tags: [code-review, security, development]
---
# 代码审查技能
## 何时使用
当用户要求审查代码、检查PR、代码质量分析时使用本技能。
## 审查流程
1. 先获取所有变更文件内容
2. 检查代码规范是否符合团队约定
3. 扫描安全漏洞和常见反模式
4. 评估性能影响
5. 生成结构化的审查报告，包含问题、等级、改进建议
## 安全检查清单
- [ ] SQL注入漏洞检查
- [ ] XSS漏洞检查
- [ ] 敏感信息泄露检查
- [ ] 权限控制验证
## 输出要求
使用统一的Markdown格式输出审查结果，分为严重、警告、建议三个等级。
```
### Frontmatter 字段说明
| 字段 | 是否必需 | 说明 |
|------|----------|------|
| name | 必需 | 技能唯一标识符，小写字母、数字、连字符，需与目录名一致 |
| description | 必需 | 技能功能描述，清晰说明用途和使用场景，便于LLM识别 |
| license | 可选 | 技能的开源许可证类型 |
| metadata | 可选 | 额外元信息，如作者、版本、分类、标签等 |
## 五、技能分类与官方资源
官方 [Agent Skills Collection](https://github.com/jwynia/agent-skills) 提供 **112+个开箱即用的可复用技能**，分为三大类别：
| 类别 | 数量 | 典型技能示例 |
|------|------|----------|
| Creative（创意类） | ~57 | 小说写作、世界观构建、角色设计、故事大纲、创意头脑风暴、营销文案生成 |
| Technical（技术类） | ~26 | 代码审查、安全扫描、API文档生成、Git工作流、调试诊断、部署脚本生成 |
| General（通用类） | ~29 | 数据分析、文档处理、报告生成、研究助手、技能构建器、会议纪要生成 |
## 六、技能安装与使用
### 6.1 安装方式
使用官方CLI工具安装技能：
```bash
# 安装所有创意类技能
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/creative
# 安装所有技术类技能
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/tech
# 安装单个技能
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/tech/code-review
```
### 6.2 存储位置
技能分为两级存储，自动按优先级加载：
| 位置 | 作用域 | 说明 |
|------|--------|------|
| `~/.agents/skills/` | 用户级 | 全局所有项目都可使用 |
| `.agents/skills/` | 项目级 | 仅当前项目可用，优先级高于用户级 |
### 6.3 使用方式
技能安装后，智能体会自动识别可用技能，在相关场景下自动调用：
- 无需额外配置，LLM会根据技能描述判断何时使用
- 部分智能体支持 `/skills` 命令手动查看和调用指定技能
## 七、支持技能的智能体产品
| 产品 | 支持程度 | 说明 |
|------|----------|------|
| **Hermes Agent** | 完整支持 | 原生兼容agentskills.io标准，内置技能管理系统 |
| **OpenClaw** | 完整支持 | 支持自定义技能加载和管理 |
| **VS Code Copilot** | 支持 | Agent模式下可通过`/skills`命令使用 |
| **Claude Code** | 支持 | 通过技能扩展能力 |
| **Cursor** | 支持 | 最新版本已内置技能系统 |
## 八、自定义技能开发指南
### 8.1 开发步骤
1. 创建技能目录：`.agents/skills/your-skill-name/`
2. 编写 `SKILL.md` 文件，包含规范的frontmatter和清晰的使用说明
3. 添加脚本、模板等辅助文件（可选）
4. 测试技能在目标智能体中的识别率和执行效果
5. 版本控制并发布到团队/社区
### 8.2 开发最佳实践
- 技能描述要清晰准确，包含明确的使用场景，便于LLM识别
- 尽量使用通用的工具和脚本，避免依赖特定平台
- 提供明确的输入输出格式要求，减少幻觉
- 包含示例用例，帮助LLM理解使用方式
## 九、技能 vs 工具 vs 插件的区别
| 概念 | 定义 | 特点 | 粒度 |
|------|------|------|------|
| **技能（Skill）** | 指令+脚本+资源的组合包 | 轻量、可移植、标准化 | 工作流程级 |
| **工具（Tool）** | 单一功能的调用接口 | 简单、直接、原子操作 | 功能点级 |
| **插件（Plugin）** | 代码级的扩展模块 | 功能强大、需要编程开发 | 平台扩展级 |
## 十、最佳实践
1. **分类管理**：将技能按业务领域分类，便于查找和使用
2. **版本控制**：技能变更纳入版本管理，记录变更历史
3. **权限控制**：企业级使用时，对敏感技能设置访问权限
4. **定期更新**：随着业务变化和工具升级，及时更新技能内容
5. **效果评估**：定期评估技能的使用效果和准确率，持续优化
## 十一、参考资源
- [Agent Skills 官方网站](https://agentskills.io)
- [Agent Skills 官方GitHub](https://github.com/agentskills/agentskills)
- [官方技能集合仓库](https://github.com/jwynia/agent-skills)
- [技能规范文档](https://agentskills.io/specification)
*文档创建时间：2026年4月29日*
