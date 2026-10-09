/* page-tools.js — 工具列表 */
import { getConfig, getJSON, dedupe, renderList, el, initTheme, showError, showStale, debounce } from './tmm.js';

initTheme('#themeToggle');

function toolNode(t) {
  const href = t.path || t.url || '';
  const external = !t.path && /^https?:/i.test(href);
  const link = el('a', {
    href,
    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }, t.name || '(未命名)');

  const meta = el('p', { class: 'chips' });
  if (t.category) meta.append(el('span', { class: 'chip' }, t.category));
  if (external) meta.append(el('span', { class: 'chip' }, '外链'));
  if (t.date) meta.append(el('span', { class: 'chip' }, t.date));

  return el('article', { class: 'tool card' },
    el('div', { class: 'tool-head' },
      el('span', { class: 'tool-glyph', 'aria-hidden': 'true' }, (t.name || '?').trim().charAt(0).toUpperCase()),
      el('h3', { class: 'tool-name' }, link)),
    t.desc ? el('p', { class: 'tool-desc' }, t.desc) : null,
    el('div', { class: 'tool-foot' },
      meta,
      el('a', {
        class: 'tool-open', href,
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      }, external ? '前往 ↗' : '打开 →')),
  );
}

const state = { q: '', cat: '' };

function apply(list, region, status) {
  const q = state.q.toLowerCase();
  const items = list.filter(t => {
    if (state.cat && (t.category || '') !== state.cat) return false;
    if (!q) return true;
    const hay = [t.name, t.desc, t.category].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  renderList({ container: region, items, render: toolNode, status });
}

(async () => {
  const main = document.querySelector('main');
  const onStale = at => showStale(main, at);
  try {
    const cfg = await getConfig({ onStale });
    const data = await getJSON(cfg.sources.tools, { onStale });
    const list = dedupe(data.entries, 'id').list
      .slice()
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    const region = document.querySelector('[data-region="tools-list"]');
    const status = document.getElementById('listStatus');
    const search = document.getElementById('toolSearch');
    const catBar = document.getElementById('toolCats');

    const cats = [...new Set(list.map(t => t.category).filter(Boolean))];
    if (catBar && cats.length) {
      catBar.append(el('button', {
        class: 'chip chip--filter', type: 'button',
        'aria-pressed': 'true', 'data-cat': '',
      }, '全部'));
      cats.forEach(c => catBar.append(el('button', {
        class: 'chip chip--filter', type: 'button',
        'aria-pressed': 'false', 'data-cat': c,
      }, c)));
      catBar.addEventListener('click', ev => {
        const btn = ev.target.closest('button[data-cat]');
        if (!btn) return;
        state.cat = btn.dataset.cat;
        catBar.querySelectorAll('button[data-cat]')
          .forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        if (search) state.q = search.value.trim();
        apply(list, region, status);
      });
    }

    if (search) {
      search.addEventListener('input', debounce(() => {
        state.q = search.value.trim();
        apply(list, region, status);
      }));
    }

    apply(list, region, status);
  } catch (err) {
    showError(main, err.message);
  }
})();
