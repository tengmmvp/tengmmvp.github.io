# 架构设计

> 本文档记录站点的分层结构与关键决策及其理由，供后续维护者（人或 AI）接手时参考。

## 分层

```
配置层   config/*.json + schema/          唯一事实源
运行时   shared/tmm.js                    配置读取 / 安全渲染 / 主题
页面层   index / blog / tools / 404       静态骨架 + 渐进增强
沙盒层   tools/<id>/                      工具自治，不依赖主站
控制台   admin/（本地）                    表单编辑 + 骨架再生成 + 体检
```

依赖方向单向：页面 → 运行时 → 配置。沙盒与控制台不反向依赖页面层。

## 关键决策

### 零构建

无框架、无包管理、无 CI。页面是纯静态文件，GitHub Pages 直发。
代价：发布前无法预渲染列表内容。缓解见「静态骨架」。

### 静态骨架 + 渐进增强

页面 HTML 源码内直接包含真实内容（标题、导航、全部条目），JS 只做筛选、搜索、统计刷新与主题切换。
理由：搜索引擎（尤其百度）对 JS 渲染内容的收录不可依赖；无 JS 与 JS 失败时页面仍完整可读；首屏渲染链从四级串行压回 HTML+CSS。数据加载失败时展示错误横幅并保留骨架，永不白屏。

骨架由控制台在保存配置时自动重新生成（`<!--gen:REGION:start/end-->` 标记），注册表与骨架不会漂移；体检含骨架同步检查。

### 注册表而非 API 扫描

内容更新走 git push 随静态文件分发，前端零 GitHub API 依赖。
理由：匿名 API 限流 60 次/小时且按 IP 计（大陆运营商 NAT 下会被陌生人耗尽）；304 免计限流需带 Authorization，而静态站禁止内嵌 token。

工具目录读取提供 `TMM.listDir()`：默认 manifest（`data/index.json` 清单），可配置回退 GitHub API。

### 缓存策略

浏览器默认 HTTP 缓存（平台 `max-age=600`）+ localStorage 二级缓存兜底（网络失败时离线可开站）。
平台边缘缓存对 query string 不敏感（`?v=` 只击穿浏览器层），因此不依赖参数击穿，统一接受「推送后 ≤10 分钟陈旧」的窗口，该预期已在 README 说明。

### 安全

- 渲染：注册表字符串只经 `textContent` / `escapeHtml` 进 DOM
- URL：`safeUrl` 仅放行 http(s)、站内路径、锚点、mailto，堵 `javascript:` 伪协议
- 外链：`target="_blank"` 一律配 `rel="noopener noreferrer"`
- CSP：主站页面声明 `default-src 'self'`；工具页不声明，保持自包含
- 零第三方运行时依赖 = 零供应链面；本地控制台仅绑 127.0.0.1，写路径白名单

### 字体

中文走系统字体栈（零下载、零授权风险）；拉丁用自托管 latin 子集 woff2（EB Garamond + JetBrains Mono，共约 45KB）。
中文字体文件不入仓库：商业字库有维权风险，品牌定制协议可撤销，公共 CDN 在大陆不可用。

### 设计令牌

`theme.css` 两层结构：primitive（按值命名）→ semantic（按意图命名，`light-dark()` 明暗一份定义）。
明暗切换只改 `color-scheme` 一个属性。组件只允许消费 semantic 层。

### 平台红线

`.nojekyll` 旁路 Jekyll；该文件缺失时，下划线目录会被丢弃、带 front matter 的文件会被消费且原路径 404。
数据文件三禁（front matter / 下划线目录 / 重复 id）的拦截分工：缺失字段由 Schema 在编辑期拦截；重复 id 由控制台体检与运行时 `dedupe` 拦截；front matter 与下划线目录由体检扫描拦截。

## 行为契约

- `tmm.js`：导出 `escapeHtml / safeUrl / fmtDate / el / getJSON / getConfig / listDir / dedupe / renderList / showError / initTheme`
- 工具契约：`tools/<id>/index.html` 必需；`data/index.json` 为可选清单；`back.js` 为可选挂件
- 控制台保存链：JSON 序列化校验 → 备份 → 写盘 → 重新生成骨架（本地预览即时生效）；结构校验由 VS Code 经 `$schema` 在编辑期完成
