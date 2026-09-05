# 子扬个人网站

本地升级版本：Vite + 原生 HTML/CSS/JavaScript，无后端、无客户端框架。

## 开发与验证

需要 Node.js >=22.12（本次验证环境为 Node 25.9）。

```sh
npm ci
npm run dev
npm run build
npm run check
npm run preview
```

预览访问终端显示地址下的 `/mywebsite/`。`check` 验证构建文件中的本地资源、锚点、重复 ID、基础元数据及 JSON-LD；它不是浏览器或无障碍审计。

## 文件

- `index.html`：当前首页正文与 SEO。现阶段单页内容直接维护在 HTML，尚未实现 Markdown 模板或数据驱动内容生成。
- `src/styles/main.css`：主题、版式、响应式样式，无外部字体请求。
- `src/scripts/main.js`：主题切换、复制邮箱；正文和导航不依赖 JS。
- `assets/`：保留原站资源；旧 hash JS/CSS 不再引用但不自动删除。
- `public/`：404、robots、sitemap，构建原样复制。
- `scripts/check.mjs`：生产产物静态检查。
- `docs/content-checklist.md`：内容缺口及发布前核验事项。

## 发布边界

未修改 GitHub Pages 设置或 CI/CD，未 push、未部署。当前根目录 HTML 引用源码，不能直接沿用“main 根目录原样发布”的方式上传。准备发布时须先确认部署方式，发布 `dist/` 构建产物，而不是直接推送当前根目录作为站点。

`base` 默认 `/mywebsite/`；更换域名或路径时同步修改 Vite 配置、canonical、OG、JSON-LD、sitemap、robots 和 404 返回链接。

GitHub 项目站的 `/mywebsite/robots.txt` 不等价于域名根 `/robots.txt`；只有能控制域名根时才能统一设置爬虫规则。当前 sitemap 可单独提交到搜索引擎站长工具。

## 人工检查

发布前浏览器检查 320、375、768、1440px，明暗主题、系统主题、禁用 JS、键盘焦点、details 展开、剪贴板拒绝场景。核对邮件主题、项目内容和外链有效性。不要把占位或待核验素材写成已验证结果。
