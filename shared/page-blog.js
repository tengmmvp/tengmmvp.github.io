/* page-blog.js — 博客列表 */
import { getConfig, getJSON, dedupe, renderList, el, initTheme, showError, showStale, pad, entryNode, debounce } from './tmm.js';

initTheme('#themeToggle');

const state = { q: '', tag: '' };

function apply(list, region, status) {
  const q = state.q.toLowerCase();
  const items = list.filter(e => {
    if (state.tag && !(e.tags || []).includes(state.tag)) return false;
    if (!q) return true;
    const hay = [e.title, e.summary, ...(e.tags || [])].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  renderList({ container: region, items, render: entryNode, status });
}

(async () => {
  const main = document.querySelector('main');
  const onStale = at => showStale(main, at);
  try {
    const cfg = await getConfig({ onStale });
    const data = await getJSON(cfg.sources.blog, { onStale });
    const list = dedupe(data.entries).list
      .slice()
      .sort((a, b) => pad(b.date).localeCompare(pad(a.date)));

    const region = document.querySelector('[data-region="blog-list"]');
    const status = document.getElementById('listStatus');
    const search = document.getElementById('blogSearch');
    const tagBar = document.getElementById('blogTags');

    const tags = [...new Set(list.flatMap(e => e.tags || []).filter(Boolean))];
    if (tagBar && tags.length) {
      tagBar.append(el('button', {
        class: 'chip chip--filter', type: 'button',
        'aria-pressed': 'true', 'data-tag': '',
      }, '全部'));
      tags.forEach(t => tagBar.append(el('button', {
        class: 'chip chip--filter', type: 'button',
        'aria-pressed': 'false', 'data-tag': t,
      }, t)));
      tagBar.addEventListener('click', ev => {
        const btn = ev.target.closest('button[data-tag]');
        if (!btn) return;
        state.tag = btn.dataset.tag;
        tagBar.querySelectorAll('button[data-tag]')
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
