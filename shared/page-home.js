/* page-home.js — 主页 */
import { getConfig, getJSON, dedupe, renderList, el, initTheme, showError } from './tmm.js';

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

(async () => {
  const main = document.querySelector('main');
  try {
    const cfg = await getConfig();
    document.title = `${cfg.site.name} · ${cfg.site.slogan}`;

    const [blog, tools] = await Promise.all([
      getJSON(cfg.sources.blog).catch(() => null),
      getJSON(cfg.sources.tools).catch(() => null),
    ]);

    if (blog) {
      const list = dedupe(blog.entries).list
        .slice()
        .sort((a, b) => pad(b.date).localeCompare(pad(a.date)));
      const count = document.querySelector('[data-stat="blog-count"]');
      const latest = document.querySelector('[data-stat="blog-latest"]');
      if (count) count.textContent = String(list.length);
      if (latest) latest.textContent = list[0] ? list[0].title : '暂无';
      const region = document.querySelector('[data-region="recent-blogs"]');
      if (region) renderList({
        container: region,
        items: list.slice(0, cfg.recent.blogCount || 4),
        render: entryNode,
        empty: '还没有文章，去控制台加一条吧。',
      });
    }

    if (tools) {
      const list = dedupe(tools.entries, 'id').list
        .slice()
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      const count = document.querySelector('[data-stat="tools-count"]');
      const latest = document.querySelector('[data-stat="tools-latest"]');
      if (count) count.textContent = String(list.length);
      if (latest) latest.textContent = list[0] ? list[0].name : '暂无';
    }
  } catch (err) {
    showError(main, err.message);
  }
})();
