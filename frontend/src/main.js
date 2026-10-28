import './style.css';

import { BrowserOpenURL } from '../wailsjs/runtime/runtime';
import {
  GenerateRandom,
  GenerateMemorable,
  GeneratePIN,
  CopyToClipboard,
} from '../wailsjs/go/main/App';

// 各模式滑块/数字输入的上下限与默认值(与原网页一致)
const LIMITS = {
  random: { min: 8, max: 100, def: 20 },
  memorable: { min: 3, max: 15, def: 3 },
  pin: { min: 3, max: 12, def: 7 },
};

const state = {
  mode: 'random',
  length: LIMITS.random.def,
  digits: true,
  symbols: false,
  words: LIMITS.memorable.def,
  capitalize: true,
  number: true,
  pinLength: LIMITS.pin.def,
};

const ICON_RANDOM = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M3 12h18M5.8 5.8l12.4 12.4M18.4 5.8L5.8 18.2"/></svg>`;
const ICON_BULB = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4.2 10.3c.9.8 1.2 1.6 1.2 2.7h6c0-1.1.3-1.9 1.2-2.7A6 6 0 0 0 12 3z"/></svg>`;
const ICON_PIN = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><rect x="2.5" y="6" width="19" height="12" rx="3" stroke="currentColor" stroke-width="2"/><text x="12" y="15.5" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" font-family="inherit">123</text></svg>`;
const ICON_REFRESH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>`;
const ICON_COPY = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/></svg>`;

const TAB_ICONS = { random: ICON_RANDOM, memorable: ICON_BULB, pin: ICON_PIN };
const TAB_LABELS = { random: '随机', memorable: '容易记住', pin: 'PIN' };

function sliderBlock(key, label, cfg, value) {
  return `
    <div class="opt">
      <div class="opt-head"><span>${label}</span>
        <input class="opt-value num" id="v-${key}" data-key="${key}" value="${value}" inputmode="numeric" autocomplete="off"/>
      </div>
      <input type="range" id="s-${key}" data-key="${key}" min="${cfg.min}" max="${cfg.max}" step="1" value="${value}"/>
    </div>`;
}

function switchBlock(id, label, checked) {
  return `
    <label class="switch-line">
      <span class="switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}/><i></i></span>
      <span>${label}</span>
    </label>`;
}

function optionsHTML(mode) {
  if (mode === 'random') {
    return `
      ${sliderBlock('length', '字符', LIMITS.random, state.length)}
      <div class="opt-row">
        ${switchBlock('c-digits', '数字', state.digits)}
        ${switchBlock('c-symbols', '符号', state.symbols)}
      </div>`;
  }
  if (mode === 'memorable') {
    return `
      ${sliderBlock('words', '单词数', LIMITS.memorable, state.words)}
      <div class="opt-row">
        ${switchBlock('c-cap', '首字母大写', state.capitalize)}
        ${switchBlock('c-num', '包含数字', state.number)}
      </div>`;
  }
  return sliderBlock('pin', 'PIN 长度', LIMITS.pin, state.pinLength);
}

document.querySelector('#app').innerHTML = `
  <div class="page">
    <header class="hero">
      <div class="hero-row">
        <span class="hero-icon">${ICON_LOCK}</span>
        <h1>密码生成器</h1>
      </div>
    </header>

    <main class="card">
      <p class="label">选择密码类型</p>
      <div class="tabs" id="tabs">
        <span class="tab-ind" id="tab-ind"></span>
        ${Object.keys(TAB_LABELS).map((m) => `
          <button class="tab${m === state.mode ? ' active' : ''}" data-mode="${m}">
            ${TAB_ICONS[m]}<span>${TAB_LABELS[m]}</span>
          </button>`).join('')}
      </div>

      <p class="label">自定义新密码</p>
      <div class="options" id="options">${optionsHTML(state.mode)}</div>

      <p class="label">生成密码</p>
      <div class="pw-box"><span id="password">…</span></div>

      <div class="strength">
        <div class="strength-bar"><i id="bar"></i></div>
        <div class="strength-meta">
          <span id="strength-label">—</span>
          <span id="entropy">— bits</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" id="btn-copy">${ICON_COPY}<span>复制密码</span></button>
        <button class="btn ghost" id="btn-refresh" title="重新生成">${ICON_REFRESH}<span>刷新密码</span></button>
      </div>
      <div class="toast" id="toast">已复制到剪贴板</div>
    </main>

    <footer class="foot">由 <a href="https://github.com/1Password/spg" id="spg-link">spg</a> 强力驱动</footer>
  </div>`;

const $ = (id) => document.getElementById(id);
const pwEl = $('password');
const barEl = $('bar');
const labelEl = $('strength-label');
const entropyEl = $('entropy');
const toastEl = $('toast');

function strengthOf(bits) {
  if (bits >= 100) return { text: '极强', color: '#0e9f5d', pct: 100 };
  if (bits >= 75) return { text: '很强', color: '#28a745', pct: 82 };
  if (bits >= 50) return { text: '强', color: '#f5a623', pct: 62 };
  if (bits >= 35) return { text: '一般', color: '#f2801e', pct: 45 };
  if (bits >= 28) return { text: '弱', color: '#e5533d', pct: 30 };
  return { text: '极弱', color: '#d64545', pct: 15 };
}

let copyTimer = null;
function showToast() {
  toastEl.classList.add('show');
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

// 逐字符着色:随机模式 字母默认黑/数字#4d68b6/符号#e46a49;
// 容易记住模式 连字符#e46a49;PIN 模式数字同随机模式的数字色
function renderPassword(pw) {
  pwEl.textContent = '';
  for (const ch of pw) {
    const s = document.createElement('span');
    s.textContent = ch;
    if (state.mode === 'random') {
      if (/[0-9]/.test(ch)) s.className = 'ch-digit';
      else if (/[!@.\-*_]/.test(ch)) s.className = 'ch-symbol';
    } else if (state.mode === 'pin') {
      s.className = 'ch-digit';
    } else if (ch === '-') {
      s.className = 'ch-symbol';
    }
    pwEl.appendChild(s);
  }
}

function render(res) {
  renderPassword(res.password);
  const s = strengthOf(res.entropy);
  barEl.style.width = s.pct + '%';
  barEl.style.background = s.color;
  labelEl.textContent = s.text;
  labelEl.style.color = s.color;
  entropyEl.textContent = res.entropy.toFixed(1) + ' bits';
}

function generate() {
  let p;
  if (state.mode === 'random') {
    p = GenerateRandom(state.length, state.digits, state.symbols);
  } else if (state.mode === 'memorable') {
    p = GenerateMemorable(state.words, state.capitalize, state.number);
  } else {
    p = GeneratePIN(state.pinLength);
  }
  p.then(render).catch((err) => {
    pwEl.textContent = '生成失败: ' + err;
    labelEl.textContent = '—';
    entropyEl.textContent = '';
    barEl.style.width = '0';
  });
}

function syncFill(input) {
  if (!input) return;
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--fill', pct + '%');
}

// 滑块 + 可编辑数字框联动;数字越界自动钳制回上下限,非法输入回弹当前值
function bindPair(key, onChange) {
  const slider = $('s-' + key);
  const num = $('v-' + key);
  if (!slider || !num) return;
  const min = +slider.min;
  const max = +slider.max;
  const apply = (v) => {
    slider.value = v;
    num.value = v;
    syncFill(slider);
    onChange(v);
    generate();
  };
  slider.addEventListener('input', () => apply(+slider.value));
  num.addEventListener('focus', () => num.select());
  num.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') num.blur();
  });
  num.addEventListener('change', () => {
    let n = parseInt(num.value.trim(), 10);
    if (Number.isNaN(n)) n = +slider.value;
    apply(Math.min(max, Math.max(min, n)));
  });
  syncFill(slider);
}

function bindOptions() {
  const cd = $('c-digits');
  if (cd) cd.onchange = () => { state.digits = cd.checked; generate(); };
  const cs = $('c-symbols');
  if (cs) cs.onchange = () => { state.symbols = cs.checked; generate(); };
  const cc = $('c-cap');
  if (cc) cc.onchange = () => { state.capitalize = cc.checked; generate(); };
  const cn = $('c-num');
  if (cn) cn.onchange = () => { state.number = cn.checked; generate(); };

  bindPair('length', (v) => { state.length = v; });
  bindPair('words', (v) => { state.words = v; });
  bindPair('pin', (v) => { state.pinLength = v; });
}

// 白色焦点框:绝对定位滑块,切换时左右平移
const tabInd = $('tab-ind');
function moveInd() {
  const active = document.querySelector('.tab.active');
  if (!active || !tabInd) return;
  tabInd.style.width = active.offsetWidth + 'px';
  tabInd.style.transform = `translateX(${active.offsetLeft}px)`;
}

$('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
  moveInd();
  state.mode = btn.dataset.mode;
  $('options').innerHTML = optionsHTML(state.mode);
  bindOptions();
  generate();
});

$('spg-link').addEventListener('click', (e) => {
  e.preventDefault();
  BrowserOpenURL(e.currentTarget.href);
});

window.addEventListener('resize', moveInd);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
moveInd();

$('btn-refresh').addEventListener('click', generate);
$('btn-copy').addEventListener('click', () => {
  CopyToClipboard(pwEl.textContent).then(showToast).catch(console.error);
});

bindOptions();
generate();
