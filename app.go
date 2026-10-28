package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.1password.io/spg"
)

// Generated 是返回给前端的结果:密码字符串与配方对应的熵(比特)
type Generated struct {
	Password string  `json:"password"`
	Entropy  float32 `json:"entropy"`
}

// App 结构体,方法绑定到前端
type App struct {
	ctx   context.Context
	words *spg.WordList
}

// NewApp 创建应用实例,并预构建 1Password 官方词表(去重与可大写化统计开销较大,只做一次)
func NewApp() *App {
	wl, err := spg.NewWordList(spg.AgileWords)
	if err != nil {
		panic("failed to build AgileWords word list: " + err.Error())
	}
	return &App{words: wl}
}

// startup 在应用启动时保存上下文,供运行时方法(剪贴板等)使用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GenerateRandom 生成随机字符密码,对应网页"随机"标签:
// 长度可调,字母恒有;"数字"/"符号"开关开启时保证至少含一个该类字符。
func (a *App) GenerateRandom(length int, digits, symbols bool) (*Generated, error) {
	if length < 1 {
		length = 1
	}
	r := spg.NewCharRecipe(length)
	r.Exclude = spg.None
	r.Allow = spg.Letters
	r.Require = spg.Uppers | spg.Lowers
	if digits {
		r.Allow |= spg.Digits
		r.Require |= spg.Digits
	}
	if symbols {
		r.Allow |= spg.Symbols
		r.Require |= spg.Symbols
	}
	p, err := r.Generate()
	if err != nil {
		return nil, err
	}
	return &Generated{Password: p.String(), Entropy: p.Entropy}, nil
}

// GenerateMemorable 生成"容易记住"密码:连字符连接的 AgileWords 单词,
// 可选首字母大写,可选在尾部附加两位数字(对应网页"容易记住"标签)。
func (a *App) GenerateMemorable(words int, capitalize, includeNumber bool) (*Generated, error) {
	if words < 1 {
		words = 1
	}
	r := spg.NewWLRecipe(words, a.words)
	r.SeparatorChar = "-"
	if capitalize {
		r.Capitalize = spg.CSAll
	} else {
		r.Capitalize = spg.CSNone
	}
	p, err := r.Generate()
	if err != nil {
		return nil, err
	}
	pw := p.String()
	ent := p.Entropy
	if includeNumber {
		nr := spg.CharRecipe{Length: 2, Allow: spg.Digits}
		np, err := nr.Generate()
		if err != nil {
			return nil, err
		}
		pw += np.String()
		ent += np.Entropy
	}
	return &Generated{Password: pw, Entropy: ent}, nil
}

// GeneratePIN 生成纯数字 PIN码,对应网页"PIN"标签。
func (a *App) GeneratePIN(length int) (*Generated, error) {
	if length < 1 {
		length = 1
	}
	r := spg.NewCharRecipe(length)
	r.Allow = spg.Digits
	r.Require = spg.None
	r.Exclude = spg.None
	p, err := r.Generate()
	if err != nil {
		return nil, err
	}
	return &Generated{Password: p.String(), Entropy: p.Entropy}, nil
}

// CopyToClipboard 将文本写入系统剪贴板
func (a *App) CopyToClipboard(text string) error {
	return runtime.ClipboardSetText(a.ctx, text)
}
