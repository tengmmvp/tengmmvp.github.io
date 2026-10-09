/* page-home.js — 主页 */
import { getConfig, getJSON, dedupe, renderList, initTheme, showError, showStale, pad, entryNode } from './tmm.js';

initTheme('#themeToggle');

(async () => {
  const main = document.querySelector('main');
  const onStale = at => showStale(main, at);
  try {
    const cfg = await getConfig({ onStale });
    document.title = [cfg.site.name, cfg.site.slogan].filter(Boolean).join(' · ');

    const [blog, tools] = await Promise.allSettled([
      getJSON(cfg.sources.blog, { onStale }),
      getJSON(cfg.sources.tools, { onStale }),
    ]);

    if (blog.status === 'fulfilled') {
      const list = dedupe(blog.value.entries).list
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
    } else {
      showError(main, blog.reason.message);
    }

    if (tools.status === 'fulfilled') {
      const list = dedupe(tools.value.entries, 'id').list
        .slice()
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      const count = document.querySelector('[data-stat="tools-count"]');
      const latest = document.querySelector('[data-stat="tools-latest"]');
      if (count) count.textContent = String(list.length);
      if (latest) latest.textContent = list[0] ? list[0].name : '暂无';
    } else {
      showError(main, tools.reason.message);
    }
  } catch (err) {
    showError(main, err.message);
  }
})();
