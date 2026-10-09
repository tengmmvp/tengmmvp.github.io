/* back.js — 工具页返回挂件 */
(function () {
  var style = document.createElement('style');
  style.textContent = [
    '#__tmm_back{position:fixed;left:16px;bottom:16px;z-index:9999;',
    'font:12px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.05em;',
    'text-decoration:none;padding:9px 14px;border-radius:6px;',
    'border:1px solid rgba(128,128,128,.35);color:inherit;',
    'background:rgba(127,127,127,.12);backdrop-filter:blur(6px);',
    'opacity:.72;transition:opacity .15s,border-color .15s}',
    '#__tmm_back:hover{opacity:1;border-color:rgba(128,128,128,.6)}',
    '@media (prefers-color-scheme:dark){#__tmm_back{background:rgba(200,200,200,.08)}}',
    '@media (prefers-reduced-motion:reduce){#__tmm_back{transition:none}}',
  ].join('');
  var link = document.createElement('a');
  link.id = '__tmm_back';
  link.href = '/tools/';
  link.textContent = '← 工具列表';
  document.head.append(style);
  document.body.append(link);
})();
