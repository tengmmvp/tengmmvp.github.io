/* page-blog.js — 博客列表 */
import { getConfig, getJSON, dedupe, initTheme, showError, showStale, pad, entryNode, initFilter } from './tmm.js';

initTheme('#themeToggle');

(async () => {
  const main = document.querySelector('main');
  const onStale = at => showStale(main, at);
  try {
    const cfg = await getConfig({ onStale });
    const data = await getJSON(cfg.sources.blog, { onStale });
    const list = dedupe(data.entries).list
      .slice()
      .sort((a, b) => pad(b.date).localeCompare(pad(a.date)));

    initFilter({
      list,
      bar: document.getElementById('blogTags'),
      search: document.getElementById('blogSearch'),
      facet: e => e.tags || [],
      select: (e, tag) => !tag || (e.tags || []).includes(tag),
      fields: e => [e.title, e.summary, ...(e.tags || [])],
      render: entryNode,
      container: document.querySelector('[data-region="blog-list"]'),
      status: document.getElementById('listStatus'),
    });
  } catch (err) {
    showError(main, err.message);
  }
})();
