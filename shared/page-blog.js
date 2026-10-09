/* page-blog.js — 博客列表 */
import { getConfig, getJSON, dedupe, renderList, el, initTheme, showError, escapeHtml } from './tmm.js';

initTheme('#themeToggle');

const pad = d => {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(String(d || ''));
  return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3] || '01').padStart(2, '0')}` : '0000-00-00';
};
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

function entryNode(e) {
  const meta = el('p', { class: 'entry-meta chips' });
  const h = host(e.url);
  if (h) meta.append(el('span', { class: 'chip' }, h));
  (e.tags || []).forEach(t => meta.append(el('span', { class: 'chip' }, t)));
  return el('article', { class: 'entry' },
    el('p', { class: 'entry-date' }, e.date || ''),
    el('h3', { class: 'entry-title' },
      el('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer' }, e.title || '(未命名)')),
    e.summary ? el('p', { class: 'entry-summary' }, e.summary) : null,
    meta.children.length ? meta : null,
  );
}

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
  try {
    const cfg = await getConfig();
    const data = await getJSON(cfg.sources.blog);
    const list = dedupe(data.entries).list
      .slice()
      .sort((a, b) => pad(b.date).localeCompare(pad(a.date)));

    const region = document.querySelector('[data-region="blog-list"]');
    const status = document.getElementById('listStatus');
    const search = document.getElementById('blogSearch');
    const tagBar = document.getElementById('blogTags');

    const tags = [...new Set(list.flatMap(e => e.tags || []))];
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
        apply(list, region, status);
      });
    }

    if (search) {
      search.addEventListener('input', () => {
        state.q = search.value.trim();
        apply(list, region, status);
      });
    }

    apply(list, region, status);
  } catch (err) {
    showError(main, err.message);
  }
})();
