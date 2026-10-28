# PassGen - 密码生成器

仿 1Password 官网密码生成器的 Windows 桌面应用，基于 [Wails v2](https://wails.io) 构建，
生成内核直接复用 1Password 官方开源库 [spg](https://github.com/1Password/spg)（`go.1password.io/spg`，Apache-2.0）。

纯本地生成，不联网；随机熵来自 `crypto/rand`（spg 内部）。

## 功能

- **随机**：长度可调（[8, 100]），可选数字/符号，开启的类型保证至少出现一个
- **容易记住**：AgileWords 词表（[3, 15] 个单词），可选首字母大写、尾部附加两位数字
- **PIN**：纯数字（[3, 12]）
- 密码逐字符着色（数字 `#4d68b6`、符号/连字符 `#e46a49`）
- 强度条基于 spg 返回的配方熵（bits），分六档文案与颜色（极弱 ~ 极强）
- 滑块 + 数字框双向联动，越界自动钳制回上下限
- 一键复制到剪贴板（Toast 提示）；标签切换白色指示框平移动效

## 环境要求

| 依赖 | 版本要求 | 说明 |
| --- | --- | --- |
| Go | >= 1.25.0 | 见 `go.mod` |
| Node.js + npm | Node 20.19+ / 22.12+ | Vite 7 的最低要求 |
| Wails CLI | v2.x | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| WebView2 Runtime | Windows 10/11 通常已内置 | 运行时依赖 |
| NSIS（可选） | 3.x | 仅 `-nsis` 打安装包时需要 |

## 构建与运行

```bash
# 开发模式（前端热重载，自动安装前端依赖）
wails dev

# 构建生产版本
wails build
# 产物：build/bin/PassGen.exe

# 构建 + 生成 NSIS 安装包
wails build -nsis

# 后端单元测试
go test ./...
```

## 架构设计

### 总体结构

```
main.go                Wails 入口：窗口配置（460x780）、go:embed 嵌入 frontend/dist、绑定 App 实例
app.go                 生成逻辑：GenerateRandom / GenerateMemorable / GeneratePIN / CopyToClipboard
app_test.go            后端单元测试
frontend/
  src/main.js          UI 渲染、状态管理（state）、滑块/开关/标签页交互、强度条与逐字符着色
  src/style.css        界面样式（仿 1Password 官网）
  wailsjs/             Wails 自动生成的 Go 绑定与 runtime（生成物，勿手动编辑）
build/                 应用图标与平台打包配置（manifest、plist、NSIS）
```

### 技术选型

- **后端**：Go + Wails v2 运行时；前端资源经 `//go:embed all:frontend/dist` 打进单一 exe
- **生成内核**：`go.1password.io/spg`——随机模式用 `CharRecipe`（`Allow`/`Require` 位标志控制字符集），
  易记模式用 `WLRecipe` + AgileWords 官方词表；熵值由配方直接给出
- **前端**：原生 JavaScript 模板字符串渲染 + Vite，无任何 UI 框架

### 数据流

```
main.js (state)
   │  调用 wailsjs 绑定
   ▼
Wails 桥接
   │
   ▼
app.go App 方法（长度 < 1 防御性钳制）
   │  构造 spg 配方并 Generate()
   ▼
Generated{Password, Entropy}  ──►  前端渲染密码、逐字符着色、强度条
```

- 强度条：前端按 bits 阈值映射六档（≥100 极强 / ≥75 很强 / ≥50 强 / ≥35 一般 / ≥28 弱 / 其余极弱）
- "容易记住"模式附加两位数字时，在 Go 侧拼接第二个 `CharRecipe` 生成结果并累加熵

## 目录导航

| 路径 | 内容 |
| --- | --- |
| `app.go` | 三个生成方法 + 剪贴板，`Generated` 返回结构 |
| `main.go` | Wails 启动与窗口配置 |
| `frontend/src/main.js` | 全部前端逻辑（约 270 行） |
| `frontend/wailsjs/` | 生成物，由 wails 命令刷新 |
| `build/windows/installer/` | NSIS 安装脚本 |

更多面向开发者的约定（前后端限制值同步、生成物勿改等）见 [AGENTS.md](AGENTS.md)。

## 安全说明

- 生成过程完全本地，无遥测、无网络请求；剪贴板经 Wails runtime API 写入
- 随机源为 spg 内部的 `crypto/rand`，非伪随机
- 应用不存储、不记录任何生成的密码

## 版权

- [spg](https://github.com/1Password/spg)：Apache-2.0（AgileBits Inc.）
- JetBrains Mono：SIL OFL 1.1（见 `frontend/src/assets/fonts/JetBrainsMono-OFL.txt`）
- Nunito：SIL OFL（见 `frontend/src/assets/fonts/OFL.txt`）
