# tengmmvp.github.io

TengMMVP 的个人站点，托管于 GitHub Pages，域名为 <https://tengmmvp.cn>。

站点分为主页、博客与工具三部分：主页展示个人名片、站点入口与精选项目；博客页是指向外部平台的文章索引；工具页收纳自制的在线工具。整站零构建、纯静态，页面为静态骨架加渐进增强，内容由 `config/` 下的 JSON 注册表驱动。

## 目录结构

```
index.html / 404.html      页面壳
blog/                      博客链接列表
tools/
  index.html               工具卡片墙
  shared/back.js           返回挂件
  <tool-id>/               工具沙盒
shared/                    运行时与设计令牌
config/                    注册表与 JSON Schema
assets/                    图片、字体与图标
admin/                     本地控制台
docs/                      架构文档
robots.txt / sitemap.xml / CNAME
```

工具沙盒以文件夹为单位自治，`index.html` 为必需入口，`data/` 存放私属数据，返回挂件按需引入。

## 日常操作

日常内容维护通过本地控制台完成：双击 `admin/启动控制台.bat`，在表单中编辑，保存时自动校验、备份并重新生成页面骨架。控制台仅本地使用。

**加一篇博客** 在控制台「博客」页添加文章，粘贴链接后点「抓取」自动补全标题。等价的手改方式是在 `config/blog.json` 的 `entries` 中增加一条记录，字段为 `id`、`title`、`url`、`date`、`summary`、`tags`。

**上一个新工具** 把工具文件夹放入 `tools/`，在控制台「工具」页点击出现的「注册」按钮补全信息。需要返回浮标时，在工具页加入一行 `<script src="/tools/shared/back.js" defer></script>`。

**修改个人信息、项目或首页入口** 在控制台对应页签编辑保存，等价于修改 `config/site.json`。

## 本地预览

页面使用原生 ES Module，以 `file://` 协议直接打开会因浏览器 CORS 策略失效，须经本地 HTTP 服务访问：

- 双击 `admin/启动控制台.bat`，同时获得站点预览与控制台；
- 或在仓库根目录运行 `python -m http.server 8000`。

## 编辑期校验

`config/` 下的 JSON 文件头部均声明了 `$schema`。在 VS Code 中编辑时，字段错误即时标红，并有补全提示。

## 数据文件三禁

`.nojekyll` 已旁路平台的 Jekyll 处理，以下三条是其失效时的防线，控制台体检会扫描：

1. 禁 YAML front matter：文件以 `---` 开头会被 Jekyll 当作页面消费，原路径 404；
2. 禁下划线开头的目录：会被 Jekyll 从发布产物中丢弃；
3. 禁注册表重复 id：`JSON.parse` 静默采用后者，条目会凭空消失，由体检与运行时双重拦截。

## 平台约束

- `.nojekyll` 必须存在于仓库根目录；
- 推送后线上内容最长延迟约 10 分钟更新，这是 CDN 缓存的正常表现；
- 发布站体积上限 1GB，单文件上限 50MiB，月带宽软上限 100GB；
- 域名由根目录 `CNAME` 声明，需在 GitHub Pages 设置中保持已验证状态。

## 架构说明

分层结构与设计决策见 [docs/DESIGN.md](docs/DESIGN.md)。
