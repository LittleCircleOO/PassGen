# AGENTS.md

面向 AI 编码助手与本仓库贡献者的工作指南。

## 项目概述

PassGen 是一个仿 1Password 官网密码生成器的 Windows 桌面应用，基于 Wails v2 构建。
生成内核复用 1Password 官方开源库 [spg](https://github.com/1Password/spg)（`go.1password.io/spg`）。

- 后端：Go（生成逻辑 + Wails 运行时）
- 前端：原生 JavaScript + Vite，无框架
- 纯本地生成，无任何网络请求

## 常用命令

```bash
wails dev        # 开发模式，前端热重载
wails build      # 构建生产版本，产出 build/bin/PassGen.exe
wails build -nsis  # 额外生成 NSIS 安装包（需安装 NSIS）
go test ./...    # 运行后端单元测试（app_test.go）
wails doctor     # 检查本机开发环境是否齐全
```

前端依赖安装由 `wails dev` / `wails build` 按 `wails.json` 自动执行（`npm install` + `npm run build`）；
若需单独调试前端，进入 `frontend/` 后执行 `npm install && npm run dev`。

## 环境要求

| 依赖 | 版本要求 | 说明 |
| --- | --- | --- |
| Go | >= 1.25.0（见 `go.mod`） | |
| Node.js + npm | Node 20.19+ / 22.12+（Vite 7 要求） | |
| Wails CLI | v2.x：`go install github.com/wailsapp/wails/v2/cmd/wails@latest` | |
| WebView2 Runtime | Windows 10/11 通常已内置 | 运行时依赖 |

## 架构设计

```
main.go            Wails 入口：窗口配置（460x780）、go:embed 嵌入 frontend/dist、绑定 App 实例
app.go             生成逻辑：GenerateRandom / GenerateMemorable / GeneratePIN / CopyToClipboard
app_test.go        后端单元测试
frontend/          Vite 前端（原生 JS）
frontend/src/main.js   UI 渲染、状态管理（state）、滑块/开关/标签页交互、强度条与逐字符着色
frontend/src/style.css 界面样式（仿 1Password 官网）
frontend/wailsjs/  Wails 自动生成的 Go 绑定与 runtime，勿手动编辑
build/             图标、清单、plist、NSIS 打包配置
```

数据流：前端 `main.js` 调用 `frontend/wailsjs/go/main/App.js` 中的绑定 → Wails 桥接 →
`app.go` 中 `App` 的导出方法 → spg 配方（`CharRecipe`/`WLRecipe`）生成 →
返回 `Generated{Password, Entropy}` → 前端渲染密码与强度条。

熵值直接来自 spg（内部使用 `crypto/rand`），前端仅按 bits 阈值映射为六档强度文案与颜色。

## 修改约定与注意事项

1. **前后端限制值必须同步**：各模式长度上下限在两处定义——前端 `main.js` 的 `LIMITS`
   （random [8,100]、memorable [3,15]、pin [3,12]）与后端 `app.go` 的防御性钳制
   （`< 1` 时回退为 1）。调整范围时两处都要改，并补/改 `app_test.go`。
2. **`frontend/wailsjs/` 为生成物**：由 `wails dev` / `wails build` 依据 `app.go` 导出方法自动重新生成，
   不要手工修改；新增后端方法后重新运行 wails 命令即可刷新绑定。
3. **`frontend/dist` 必须存在**：`main.go` 通过 `//go:embed all:frontend/dist` 嵌入资源，
   直接 `go build` 前需先完成一次前端构建（或使用 `wails build`）。
4. **生成结果约束**：随机模式开启"数字/符号"后保证至少含一个该类字符（`Require` 位标志）；
   "容易记住"模式尾附两位数字是在 Go 侧拼接第二个配方并累加熵，改动时保持该语义。
5. **不引入框架**：前端刻意保持原生 JS 模板字符串渲染，无 Vue/React 依赖；新增 UI 优先沿用
   `optionsHTML` / `switchBlock` / `sliderBlock` 的模式。
6. **纯本地原则**：不得引入任何遥测、网络请求或外部服务；剪贴板使用 Wails runtime API。
7. **符号集合**：随机模式符号集为 `!@.-*_`（spg Symbols + `Exclude = None` 的实际产出），
   前端着色正则 `/[!@.\-*_]/` 与之对应，两处需一致。
8. **提交规范**：首次提交使用 `init: <描述>` 风格；工作区为 CRLF/LF 混用时以仓库现有
   行尾为准，避免整文件行尾噪音。
9. **依赖来源**：生成内核必须继续使用官方 `go.1password.io/spg`，不要用自研随机逻辑替代。
