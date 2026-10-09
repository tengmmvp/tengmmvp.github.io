/* page-tools.js — 工具列表 */
import { getConfig, getJSON, dedupe, el, initTheme, showError, showStale, initFilter } from './tmm.js';

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

(async () => {
  const main = document.querySelector('main');
  const onStale = at => showStale(main, at);
  try {
    const cfg = await getConfig({ onStale });
    const data = await getJSON(cfg.sources.tools, { onStale });
    const list = dedupe(data.entries, 'id').list
      .slice()
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    initFilter({
      list,
      bar: document.getElementById('toolCats'),
      search: document.getElementById('toolSearch'),
      facet: t => (t.category ? [t.category] : []),
      select: (t, cat) => !cat || (t.category || '') === cat,
      fields: t => [t.name, t.desc, t.category],
      render: toolNode,
      container: document.querySelector('[data-region="tools-list"]'),
      status: document.getElementById('listStatus'),
    });
  } catch (err) {
    showError(main, err.message);
  }
})();
