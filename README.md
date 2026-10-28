# PassGen - 密码生成器

仿 1Password 官网密码生成器的 Windows 桌面应用,基于 [Wails v2](https://wails.io) 构建,
生成内核直接复用 1Password 官方开源库 [spg](https://github.com/1Password/spg)(`go.1password.io/spg`,Apache-2.0)。

纯本地生成,不联网;随机熵来自 `crypto/rand`(spg 内部)。

## 功能

- **随机**:长度可调([8, 100]),可选数字/符号,开启的类型保证至少出现一个
- **容易记住**:AgileWords 词表([3, 15] 个单词),可选首字母大写、尾部附加两位数字
- **PIN**:纯数字([3, 12])
- 密码逐字符着色(数字 `#4d68b6`、符号/连字符 `#e46a49`)
- 强度条基于 spg 返回的配方熵(bits);数字框可直接键入,越界自动钳制回上下限
- 一键复制到剪贴板;标签切换白色指示框平移动效

## 开发

```bash
wails dev      # 热重载开发
wails build    # 产出 build/bin/PassGen.exe
go test ./...  # 后端单元测试
```

## 结构

```
app.go            生成逻辑:随机/易记/PIN + 熵值,绑定到前端
main.go           Wails 入口与窗口配置
frontend/         原生 JS + Vite,样式仿 1Password 官网
frontend/wailsjs/ Wails 自动生成的绑定与 runtime
build/            应用图标(锁形)与平台打包配置
```

## 版权

- [spg](https://github.com/1Password/spg):Apache-2.0(AgileBits Inc.)
- JetBrains Mono:SIL OFL 1.1(见 `frontend/src/assets/fonts/JetBrainsMono-OFL.txt`)
- Nunito:SIL OFL(见 `frontend/src/assets/fonts/OFL.txt`)
