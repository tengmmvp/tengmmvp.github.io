/* tmm.js — 全站微型运行时 */

const SITE_URL = '/config/site.json';
const LS_PREFIX = 'tmm:';
const CHIP_ATTR = 'data-value';

/* 工具函数 */

/** URL 校验 */
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  /* 控制字符会被浏览器剥离，剥离后可绕过协议白名单 */
  if (/^(https?:\/\/|mailto:|#|\/(?!\/|\\))/i.test(s) && !/[\u0000-\u001F\u007F]/.test(s)) return s;
  return '';
}

/** 日期格式化 */
export function fmtDate(d) {
  const s = String(d ?? '').trim();
  if (!s) return '';
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s);
  if (!m) return s;
  return m[3]
    ? `${m[1]} 年 ${+m[2]} 月 ${+m[3]} 日`
    : `${m[1]} 年 ${+m[2]} 月`;
}

/** 日期补零为 YYYY-MM-DD，供排序比较 */
export function pad(d) {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(String(d || ''));
  return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3] || '01').padStart(2, '0')}` : '0000-00-00';
}

/** 提取主机：小写、保留端口、去 userinfo 与 www. 前缀 */
export function hostOf(u) {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; }
}

/** 创建元素 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'href' || k === 'src') node.setAttribute(k, safeUrl(v));
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/** 防抖 */
export function debounce(fn, wait = 150) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* 数据层 */

/* localStorage 读写 */
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key)); }
    catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); }
    catch { /* 忽略 */ }
  },
};

const memCache = new Map();

/** 读取 JSON；网络失败时回退本地缓存并回调 onStale */
export async function getJSON(path, opts = {}) {
  if (memCache.has(path)) return memCache.get(path);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    memCache.set(path, data);
    store.set('json:' + path, { at: Date.now(), data });
    return data;
  } catch (err) {
    const cached = store.get('json:' + path);
    if (cached && cached.data != null) {
      memCache.set(path, cached.data);
      if (opts.onStale) opts.onStale(cached.at);
      return cached.data;
    }
    throw new Error(`无法加载 ${path}（${err.message}）`);
  }
}

/** 读取站点总配置 */
export async function getConfig(opts) {
  const cfg = await getJSON(SITE_URL, opts);
  return {
    site: {}, profile: {}, projects: [], entrances: [], recent: {},
    sources: {},
    ...cfg,
  };
}

/** 列出目录内容，策略默认取自站点配置 */
export async function listDir(dir, opts = {}) {
  const strategy = opts.strategy ?? (await getConfig()).sources.dirStrategy ?? 'manifest';
  if (strategy === 'github-api') {
    const gh = { ...(await getConfig()).sources.github, ...opts.github };
    const api = `https://api.github.com/repos/${gh.user}/${gh.repo}/contents/${dir.replace(/^\/+/, '')}`;
    const res = await fetch(api, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const list = await res.json();
    return list.filter(f => f.type === 'file').map(f => ({ name: f.name, path: f.path }));
  }
  const base = dir.replace(/\/?$/, '/');
  const manifest = await getJSON(base + 'index.json');
  return (Array.isArray(manifest) ? manifest : manifest.files || [])
    .map(f => (typeof f === 'string' ? { name: f, path: base + f } : f));
}

/* 注册表处理 */

/** 去重 */
export function dedupe(items, key = 'id') {
  const map = new Map(); const dups = [];
  for (const it of items || []) {
    const k = it[key];
    if (k == null || k === '') continue;
    if (map.has(k)) { dups.push(String(k)); continue; }
    map.set(k, it);
  }
  if (dups.length) console.warn('注册表存在重复 id（已忽略后者）：', dups);
  return { list: [...map.values()], dups };
}

/** 列表渲染 */
export function renderList({ container, items, render, empty = '暂无内容', status }) {
  container.replaceChildren();
  let n = 0;
  for (let i = 0; i < (items || []).length; i++) {
    const node = render(items[i], i);
    if (!node) continue;
    container.append(node); n++;
  }
  if (!n) container.append(el('p', { class: 'empty-note' }, empty));
  if (status) status.textContent = n ? `共 ${n} 条` : '没有匹配的内容';
}

/** 列表筛选：facet 并集派生标签栏，select 判标签，fields 拼搜索文本 */
export function initFilter({ list, bar, search, facet, select, fields, render, container, status }) {
  const state = { q: '', tag: '' };
  const values = [...new Set(list.flatMap(facet).filter(Boolean))];
  const apply = () => {
    const q = state.q.toLowerCase();
    renderList({
      container,
      items: list.filter(it => select(it, state.tag)
        && (!q || fields(it).filter(Boolean).join(' ').toLowerCase().includes(q))),
      render,
      status,
    });
  };

  if (bar && values.length) {
    const btn = (v, pressed) => el('button', {
      class: 'chip chip--filter', type: 'button',
      'aria-pressed': String(pressed), [CHIP_ATTR]: v,
    }, v || '全部');
    bar.append(btn('', true));
    values.forEach(v => bar.append(btn(v, false)));
    bar.addEventListener('click', ev => {
      const target = ev.target.closest(`button[${CHIP_ATTR}]`);
      if (!target) return;
      state.tag = target.getAttribute(CHIP_ATTR) || '';
      bar.querySelectorAll(`button[${CHIP_ATTR}]`)
        .forEach(b => b.setAttribute('aria-pressed', String(b === target)));
      if (search) state.q = search.value.trim();
      apply();
    });
  }

  if (search) {
    search.addEventListener('input', debounce(() => {
      state.q = search.value.trim();
      apply();
    }));
  }

  apply();
}

/** 博客条目卡片 */
export function entryNode(e) {
  const meta = el('p', { class: 'entry-meta chips' });
  const h = hostOf(e.url);
  if (h) meta.append(el('span', { class: 'chip' }, h));
  (e.tags || []).filter(Boolean).forEach(t => meta.append(el('span', { class: 'chip' }, t)));
  return el('article', { class: 'entry' },
    el('p', { class: 'entry-date' }, fmtDate(e.date)),
    el('h3', { class: 'entry-title' },
      el('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer' }, e.title || '(未命名)')),
    e.summary ? el('p', { class: 'entry-summary' }, e.summary) : null,
    meta.children.length ? meta : null,
  );
}

/** 每容器每类别仅保留一条横幅 */
function banner(container, kind) {
  let node = container.querySelector(`:scope > .notice-banner[data-kind="${kind}"]`);
  if (!node) {
    node = el('div', { class: 'notice-banner', role: 'status', 'data-kind': kind });
    container.prepend(node);
  }
  return node;
}

/** 缓存时间：当天仅时分，跨天附月日 */
function staleTime(at) {
  if (!at) return '';
  const d = new Date(at);
  const hm = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? hm : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}

/** 错误横幅，重复调用在同一横幅内追加 */
export function showError(container, message) {
  const node = banner(container, 'error');
  const code = node.querySelector('code');
  if (code) { code.append(`、${message}`); return; }
  node.append('数据加载失败：', el('code', {}, message), '。页面展示的是静态快照，内容可能不是最新。');
}

/** 回退缓存提示，幂等单条 */
export function showStale(container, at) {
  const node = banner(container, 'stale');
  if (node.childNodes.length) return;
  const time = staleTime(at);
  node.append(`加载失败，已展示${time ? ` ${time} ` : ''}保存的本地缓存，内容可能不是最新。`);
}

/* 主题 */

/** 主题初始化 */
export function initTheme(toggleSelector) {
  const root = document.documentElement;
  const saved = store.get('theme');
  /* 自行设置当前主题，保证任何时序下切换方向正确 */
  root.style.colorScheme = saved === 'dark' || saved === 'light'
    ? saved
    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const btn = toggleSelector && document.querySelector(toggleSelector);
  if (!btn) return;
  const label = () => (root.style.colorScheme === 'dark' ? '亮色' : '暗色');
  btn.textContent = label();
  btn.addEventListener('click', () => {
    const next = root.style.colorScheme === 'dark' ? 'light' : 'dark';
    root.style.colorScheme = next;
    store.set('theme', next);
    btn.textContent = label();
  });
}
