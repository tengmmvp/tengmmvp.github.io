# tengmmvp.github.io

个人站点：主页 + 博客链接目录 + 工具集合。零构建纯静态，内容全部由 JSON 注册表驱动。

线上地址：<https://tengmmvp.cn>

## 目录结构

```
├── index.html / 404.html      页面壳（静态骨架，无 JS 也可读）
├── blog/index.html            博客链接列表
├── tools/
│   ├── index.html             工具卡片墙
│   ├── shared/back.js         工具页返回挂件（可选）
│   └── <tool-id>/             工具沙盒：index.html 必需，data/、assets/ 可选
├── shared/
│   ├── tmm.js                 运行时（ESM / 零依赖）
│   ├── theme.css              设计令牌（改品牌只改这里）
│   └── page-*.js              各页面增强脚本
├── config/
│   ├── site.json              站点 / 个人 / 入口 / 项目 / 数据源
│   ├── blog.json              博客注册表
│   ├── tools.json             工具注册表
│   └── schema/                JSON Schema（VS Code 编辑即校验）
├── assets/                    图片与字体
├── admin/                     本地控制台（gitignore，不入库）
└── favicon 全套 · robots.txt · sitemap.xml · CNAME · docs/
```

## 日常操作

**推荐**：双击 `admin/启动控制台.bat`，浏览器打开后用表单编辑，保存时自动校验、备份并重新生成页面骨架。

### 加一篇博客

控制台「博客」页 → 添加文章 → 粘贴链接 → 点「抓取」自动填标题 → 补日期摘要 → 保存。
手改等价操作：在 `config/blog.json` 的 `entries` 里加一条 `{ id, title, url, date, summary, tags }`。

### 上一个新工具

1. 把工具文件夹放进 `tools/`（入口必须是 `index.html`）
2. 控制台「工具」页会出现「+ 注册 xxx」按钮，点击补全信息保存
3. 工具页里加一行 `<script src="/tools/shared/back.js" defer></script>` 可获得返回浮标（可选）

### 改个人信息 / 项目 / 首页入口

控制台对应页签编辑保存；等价于改 `config/site.json`。

## 本地预览

直接双击页面文件（`file://` 协议）无法运行——ESM 脚本会被浏览器 CORS 策略拦截，必须经本地 HTTP 服务：

- 有控制台：双击 `admin/启动控制台.bat`，同时获得 `http://127.0.0.1:8765/` 预览与控制台
- 临时预览：仓库根目录运行 `python -m http.server 8000`

## 数据文件三禁

`.nojekyll` 已旁路平台的 Jekyll 处理；以下三条是它失效时的防线，控制台体检会扫描：

1. 禁 YAML front matter——文件以 `---` 开头会被 Jekyll 当作页面消费，原路径 404
2. 禁下划线开头的目录——会被 Jekyll 从发布产物中丢弃
3. 禁注册表重复 id——`JSON.parse` 静默取后者，条目凭空消失；体检与运行时双重拦截

## 平台备忘

- `.nojekyll` 必须存在
- 推送后线上最长约 10 分钟内仍是旧内容（CDN 缓存，属预期）
- 配额：发布站 ≤1GB，单文件 ≤50MiB，月带宽软上限 100GB
- 域名 `tengmmvp.cn`（CNAME）；保持 GitHub Pages 设置中域名为已验证状态

## 架构决策

见 [docs/DESIGN.md](docs/DESIGN.md)。
