# Windows 10 安装 Claude Code 完整指南

本文档介绍在 Windows 10 系统上安装 Claude Code 的完整步骤。

---

## 目录

- [前置要求](#前置要求)
- [方式一：通过 WSL2 安装（推荐）](#方式一通过-wsl2-安装推荐)
- [方式二：直接在 Windows 安装](#方式二直接在-windows-安装)
- [方式三：一键安装脚本](#方式三一键安装脚本)
- [安装后配置](#安装后配置)
- [常见问题](#常见问题)

---

## 前置要求

| 要求 | 说明 |
|------|------|
| **操作系统** | Windows 10 版本 2004+（内部版本 19041+） |
| **WSL2** | 需要启用 WSL2 功能 |
| **Node.js** | 版本 18+（推荐 20+） |
| **网络** | 需要能访问 claude.ai（可能需要代理） |

### 检查 Windows 版本

以管理员身份运行 PowerShell，执行：
```powershell
winver
```

确认版本号 ≥ 19041。

---

## 方式一：通过 WSL2 安装（推荐）

### 步骤 1：安装/启用 WSL2

以**管理员身份**运行 PowerShell：

```powershell
wsl --install
```

该命令会：
- 启用 WSL 功能
- 启用虚拟机平台功能
- 安装 Ubuntu 作为默认发行版

如果已安装 WSL，确保设置为 WSL2：
```powershell
wsl --set-default-version 2
```

**重启电脑**（如果提示需要）

### 步骤 2：验证 WSL 安装

```powershell
wsl --list --verbose
```

输出示例：
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

### 步骤 3：打开 WSL 终端

```powershell
wsl
```

首次启动会进入 Ubuntu 终端，需要设置用户名和密码。

### 步骤 4：在 WSL 中安装 Node.js

**方式 A：使用 apt（简单）**
```bash
sudo apt update
sudo apt install -y nodejs npm
node --version
npm --version
```

**方式 B：使用 nvm（推荐，更灵活）**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 加载 nvm
source ~/.bashrc

# 安装 Node.js LTS
nvm install 20
nvm use 20

# 验证
node --version
npm --version
```

### 步骤 5：安装 Claude Code

```bash
curl -fsSL https://claude.ai/install-cli.sh | bash
```

安装过程：
- 下载最新版本的 Claude Code
- 安装到 `~/.local/bin` 目录
- 自动配置 PATH

### 步骤 6：验证安装

```bash
claude --version
```

输出示例：
```
2.1.114 (Claude Code)
```

---

## 方式二：直接在 Windows 安装

### 步骤 1：安装 Node.js

**选项 A：从官网下载**
1. 访问 [https://nodejs.org](https://nodejs.org)
2. 下载 **LTS 版本** Windows 安装程序（.msi）
3. 运行安装程序，按默认选项安装

**选项 B：使用 winget**
```powershell
winget install OpenJS.NodeJS.LTS
```

**选项 C：使用 Chocolatey**
```powershell
choco install nodejs-lts
```

安装完成后验证：
```powershell
node --version
npm --version
```

### 步骤 2：安装 Claude Code

```powershell
npm install -g @anthropic/claude-code
```

如果出现权限错误，以管理员身份运行 PowerShell 或使用：
```powershell
npm install -g @anthropic/claude-code --force
```

### 步骤 3：验证安装

```powershell
claude --version
```

---

## 方式三：一键安装脚本

### 自动安装脚本

保存为 `install-claude.ps1`：

```powershell
# 检查 WSL 是否已安装
Write-Host "Checking WSL..."
try {
    $wslStatus = wsl --status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WSL not found, installing WSL..."
        wsl --install
        Write-Host "Please restart your computer and re-run this script"
        exit 0
    }
} catch {
    Write-Host "WSL not found, installing WSL..."
    wsl --install
    Write-Host "Please restart your computer and re-run this script"
    exit 0
}

Write-Host "WSL is installed, proceeding..."

# 在 WSL 中安装
wsl -e bash -c @"
echo 'Installing Node.js...'
sudo apt update
sudo apt install -y nodejs npm

echo 'Installing Claude Code...'
curl -fsSL https://claude.ai/install-cli.sh | bash

echo 'Verifying installation...'
claude --version
"@

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Run 'wsl claude' to start Claude Code."
```

运行脚本：
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-claude.ps1
```

---

## 安装后配置

### 1. 认证 Claude

**方式 A：交互式登录**
```bash
claude login
```
按提示完成认证。

**方式 B：设置 API Key 环境变量**

在 WSL 中，编辑 `~/.bashrc`：
```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 2. 配置 PATH（如果 claude 命令找不到）

在 WSL 中，编辑 `~/.bashrc`：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 3. 在 Windows Terminal 中使用

创建快捷方式或别名：

**PowerShell 配置文件（`$PROFILE`）**：
```powershell
function claude { wsl -e claude @args }
```

然后就可以直接在 PowerShell 中运行：
```powershell
claude
```

### 4. 配置 MCP 服务器（可选）

编辑 `~/.claude/settings.json`：
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["mcp-server-filesystem", "/home/yourname/projects"]
    }
  }
}
```

---

## 常见问题

### WSL 相关问题

| 问题 | 解决方法 |
|------|---------|
| **wsl 命令找不到** | 运行 `wsl --install` 或手动启用 WSL 功能 |
| **wsl 安装失败** | 确保 Windows 版本 ≥ 2004，运行 `dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart` |
| **无法访问网络** | 在 WSL 中编辑 `/etc/resolv.conf`，添加 `nameserver 8.8.8.8` |
| **WSL2 启动失败** | 确保已安装"虚拟机平台"功能 |

### 安装相关问题

| 问题 | 解决方法 |
|------|---------|
| **curl 下载失败** | 使用代理或更换网络环境，检查 `curl --version` |
| **npm 权限错误** | 使用 `sudo npm install -g` 或修复 npm 权限 |
| **claude 命令找不到** | 将 `~/.local/bin` 添加到 PATH，或重启终端 |
| **认证失败** | 检查 API Key 是否正确，网络是否能访问 claude.ai |

### 使用相关问题

| 问题 | 解决方法 |
|------|---------|
| **中文乱码** | 设置终端编码为 UTF-8，`chcp 65001` |
| **命令执行失败** | 检查文件权限，确保有执行权限 |
| **MCP 服务器无法连接** | 检查服务器配置路径和参数 |

---

## 快速参考

### 常用命令

```bash
# 启动 Claude Code
claude

# 检查版本
claude --version

# 更新
claude update

# 登录
claude login

# 查看帮助
claude --help
```

### 文件位置

| 文件/目录 | 位置 |
|----------|------|
| 安装目录 | `~/.local/bin/claude` |
| 配置目录 | `~/.claude/` |
| 配置文件 | `~/.claude/settings.json` |
| 日志文件 | `~/.local/state/claude/` |

---

## 参考链接

- [Claude Code 官网](https://claude.ai/code)
- [Claude Code 文档](https://code.claude.com/docs)
- [WSL2 安装指南](https://learn.microsoft.com/zh-cn/windows/wsl/install)
- [Node.js 下载](https://nodejs.org/)

---

*文档更新时间：2026 年 4 月*
