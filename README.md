# tengmmvp.github.io

个人站点：主页、博客链接目录与工具集合。零构建纯静态，内容全部由 JSON 注册表驱动。

线上地址：<https://tengmmvp.cn>

## 目录结构

```
├── index.html / 404.html      静态骨架页面壳
├── blog/index.html            博客链接列表
├── tools/
│   ├── index.html             工具卡片墙
│   ├── shared/back.js         工具页返回挂件
│   └── <tool-id>/             工具沙盒
├── shared/
│   ├── tmm.js                 运行时
│   ├── theme.css              设计令牌
│   └── page-*.js              页面增强脚本
├── config/
│   ├── site.json              站点、个人、入口、项目与数据源
│   ├── blog.json              博客注册表
│   ├── tools.json             工具注册表
│   └── schema/                JSON Schema
├── assets/                    图片、字体与图标
├── admin/                     本地控制台
└── robots.txt · sitemap.xml · CNAME · docs/
```

工具沙盒的契约：`index.html` 为必需入口；`data/` 存放私属数据，其中的 `index.json` 为可选目录清单；`shared/back.js` 返回挂件按需引入，不引入不影响工具运行。

`admin/` 仅存在于本地，已列入 `.gitignore`，不随仓库分发，也不会出现在线上。

在 VS Code 中编辑 `config/` 下的 JSON 时，文件头部的 `$schema` 提供字段校验与补全。

## 日常操作

推荐通过控制台完成：双击 `admin/启动控制台.bat`，浏览器打开后用表单编辑，保存时自动校验、备份并重新生成页面骨架。

### 加一篇博客

控制台「博客」页添加文章，粘贴链接后点「抓取」自动填标题，补齐日期与摘要后保存。手改的等价操作是在 `config/blog.json` 的 `entries` 中增加一条 `{ id, title, url, date, summary, tags }`。

### 上一个新工具

1. 把工具文件夹放进 `tools/`，入口必须是 `index.html`
2. 控制台「工具」页会出现「+ 注册 xxx」按钮，点击后补全信息保存
3. 需要返回浮标时，在工具页加入 `<script src="/tools/shared/back.js" defer></script>`

### 改个人信息、项目或首页入口

控制台对应页签编辑保存，等价于修改 `config/site.json`。

## 本地预览

以 `file://` 协议直接打开页面无法运行：ESM 脚本会被浏览器 CORS 策略拦截，必须经本地 HTTP 服务。

- 通过控制台：双击 `admin/启动控制台.bat`，同时获得 `http://127.0.0.1:8765/` 的站点预览与控制台
- 临时预览：在仓库根目录运行 `python -m http.server 8000`

## 数据文件三禁

`.nojekyll` 已旁路平台的 Jekyll 处理，以下三条是它失效时的防线，控制台体检会扫描：

1. 禁 YAML front matter：文件以 `---` 开头会被 Jekyll 当作页面消费，原路径 404
2. 禁下划线开头的目录：会被 Jekyll 从发布产物中丢弃
3. 禁注册表重复 id：`JSON.parse` 静默取后者，条目凭空消失，由体检与运行时双重拦截

## 平台备忘

- `.nojekyll` 必须存在
- 推送后线上最长约 10 分钟内仍是旧内容，这是 CDN 缓存的正常表现
- 配额：发布站不超过 1GB，单文件不超过 50MiB，月带宽软上限 100GB
- 域名 `tengmmvp.cn` 由根目录 CNAME 声明，保持 GitHub Pages 设置中域名为已验证状态

## 架构决策

见 [docs/DESIGN.md](docs/DESIGN.md)。
