# 架构设计

本文档面向后续接手本站的人或 AI，记录分层结构、行为契约与关键决策及其理由。

## 分层

```
配置层   config/*.json + schema/   唯一事实源
运行时   shared/tmm.js             配置读取、安全渲染、明暗主题
页面层   index / blog / tools / 404   静态骨架 + 渐进增强
沙盒层   tools/<id>/               工具自治，不依赖主站
控制台   admin/                    表单编辑、骨架再生成、体检
```

依赖方向单向：页面层依赖运行时，运行时依赖配置层；沙盒层与控制台不反向依赖页面层。

## 行为契约

- `tmm.js` 以 ESM 具名导出提供 `safeUrl`、`fmtDate`、`pad`、`hostOf`、`el`、`debounce`、`getJSON`、`getConfig`、`listDir`、`dedupe`、`renderList`、`initFilter`、`entryNode`、`showError`、`showStale`、`initTheme`；
- 页面壳内的静态骨架由 `<!--gen:REGION:start/end-->` 标记划分区域，控制台在保存配置时重新生成；
- 工具沙盒以 `tools/<id>/index.html` 为入口，`data/index.json` 为可选的数据目录清单，清单为字符串数组或 `{files:[...]}` 对象，`listDir` 两种皆收，`shared/back.js` 为可选挂件；
- 控制台保存链为校验、备份、原子写、再生成四个页面壳、sitemap 与 robots；校验失败不写盘，再生成失败自动回滚。

## 关键决策

### 零构建

不使用框架、包管理与 CI，页面为纯静态文件由 GitHub Pages 直接分发。代价是发布前无法预渲染列表内容，由静态骨架兜底。

### 静态骨架与渐进增强

页面源码直接包含标题、导航与全部条目，脚本只负责筛选、搜索、统计与主题切换。理由有三：搜索引擎对客户端渲染内容的收录不可依赖，百度尤甚；脚本失败或被禁用时页面仍然完整；首屏渲染链从 HTML、CSS、脚本、数据四级串行缩短为 HTML 与 CSS 两级。数据加载失败时回退本地缓存并注明缓存时间；无缓存可用时展示错误横幅并保留骨架，任何情况下不出现空白页。

### 注册表而非目录扫描

数据源 `sources` 恒为站内路径，内容更新随 git push 以静态文件分发，前端不依赖 GitHub API。理由：匿名调用限额为每小时 60 次且按 IP 计，运营商 NAT 环境下额度会被无关流量耗尽；条件请求免计限额要求携带 Authorization，而公开静态站禁止内嵌令牌。目录读取由 `tmm.js` 的具名导出 `listDir` 提供，主站与工具沙盒均可引入；策略默认取站点配置 `sources.dirStrategy`，`manifest` 读取目录内的 `index.json` 清单，`github-api` 改走 GitHub API。主站页面的 CSP 不放行 `api.github.com`，仅用 `manifest`；`github-api` 仅适用于不声明 CSP 的工具沙盒。

### 缓存

浏览器默认 HTTP 缓存受益于平台的 `max-age=600`；localStorage 作为二级缓存，网络失败时站点仍可离线打开。平台边缘缓存不区分 query string，`?v=` 只能击穿浏览器缓存，因此不依赖参数击穿，统一接受推送后不超过 10 分钟的陈旧窗口。

### 安全

- 注册表字符串仅经 `el` 工厂以文本节点进入 DOM；
- 链接经 `safeUrl` 校验，仅放行 http(s)、站内路径、锚点与 mailto，杜绝 `javascript:` 伪协议；
- 外部链接一律 `rel="noopener noreferrer"`；
- 四个页面壳声明同一份 CSP，`connect-src` 恒为 `self`，并含 `form-action 'self'`；工具沙盒页不声明，保持自包含；
- 运行时零第三方依赖；本地控制台仅绑定 127.0.0.1 并限制写路径。

### 字体

中文使用系统字体栈，无下载与授权成本；拉丁字符使用自托管的 latin 子集，即 EB Garamond 与 JetBrains Mono 各一个字重，合计约 45KB。中文字体文件不入仓库，原因有三：商业字库存在维权先例，品牌定制协议可撤销，公共字体 CDN 在大陆不可用。

### 设计令牌

`theme.css` 分两层：primitive 层按值命名，semantic 层按意图命名并以 `light-dark()` 一份定义明暗两套值。明暗切换仅改动 `color-scheme` 一个属性；已存主题由 head 内先于样式加载的 `theme-boot.js` 在首帧前设置，避免闪错色；组件只消费 semantic 层。

## 平台红线

`.nojekyll` 旁路 Jekyll。该文件缺失时，下划线目录会被丢弃，带 front matter 的文件会被消费且原路径 404。数据文件三禁的拦截分工：front matter 与下划线目录由体检扫描拦截；重复 id 由控制台体检与运行时 `dedupe` 拦截；缺失字段由 Schema 在编辑期拦截。
