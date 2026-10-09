/* tmm.js — 全站微型运行时 */

const SITE_URL = '/config/site.json';
const LS_PREFIX = 'tmm:';

/* 工具函数 */

/** HTML 转义 */
export function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

/** URL 校验 */
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(s)) return s;
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

/** 读取 JSON */
export async function getJSON(path) {
  if (memCache.has(path)) return memCache.get(path);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    memCache.set(path, data);
    store.set('json:' + path, data);
    return data;
  } catch (err) {
    const cached = store.get('json:' + path);
    if (cached != null) { memCache.set(path, cached); return cached; }
    throw new Error(`无法加载 ${path}（${err.message}）`);
  }
}

/** 读取站点总配置 */
export async function getConfig() {
  const cfg = await getJSON(SITE_URL);
  return {
    site: {}, profile: {}, projects: [], entrances: [], recent: {},
    sources: {},
    ...cfg,
  };
}

/** 列出目录内容 */
export async function listDir(dir, opts = {}) {
  if ((opts.strategy || 'manifest') === 'github-api') {
    const gh = opts.github || {};
    const api = `https://api.github.com/repos/${gh.user}/${gh.repo}/contents/${dir.replace(/^\/+/, '')}`;
    const res = await fetch(api, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const list = await res.json();
    return list.filter(f => f.type === 'file').map(f => ({ name: f.name, path: f.path }));
  }
  const manifest = await getJSON(dir.replace(/\/?$/, '/') + 'index.json');
  return (Array.isArray(manifest) ? manifest : manifest.files || [])
    .map(f => (typeof f === 'string' ? { name: f, path: `${dir}/${f}` } : f));
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

/** 错误横幅 */
export function showError(container, message) {
  const banner = el('div', { class: 'error-banner', role: 'status' },
    '数据加载失败：', el('code', {}, message),
    '。页面展示的是静态快照，内容可能不是最新。');
  container.prepend(banner);
}

/* 主题 */

/** 主题初始化 */
export function initTheme(toggleSelector) {
  const root = document.documentElement;
  const saved = store.get('theme');
  const initial = saved === 'dark' || saved === 'light'
    ? saved
    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.style.colorScheme = initial;

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
