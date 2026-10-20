# Lingua · Vercel 部署指南（免费，约 20 分钟）

Lingua 是全栈应用，Vercel 上用 **Turso（云 SQLite，免费额度）** 做数据库。按顺序操作即可得到一个公开网址。

## 一、创建 Turso 数据库

1. 安装 Turso CLI（任选其一）：
   - macOS：`brew install tursodatabase/tap/turso`
   - Linux/macOS：`curl -sSfL https://get.tur.so/install.sh | bash`
2. 登录（浏览器授权）：
   ```bash
   turso auth login
   ```
3. 创建数据库：
   ```bash
   turso db create lingua
   ```
4. 获取连接地址和令牌（**待会要填到 Vercel**）：
   ```bash
   turso db show lingua --url        # 形如 libsql://lingua-<you>.turso.io
   turso db tokens create lingua     # 一长串 token
   ```

## 二、建表并写入内置词书

在项目根目录，临时用远程库执行（可在 shell 里临时设置环境变量）：

```bash
export DATABASE_URL="libsql://lingua-<you>.turso.io"
export DATABASE_AUTH_TOKEN="<上一步的 token>"
npm run db:push     # 建表
npm run db:seed     # 写入 CET-6 / JLPT N5 词书
```

> 之后本地开发仍可把 `.env` 改回 `DATABASE_URL=file:./data/lingua.db`。

## 三、推送代码到 GitHub

1. 在 GitHub 新建一个空仓库（例如 `lingua`），不要勾选 README。
2. 在项目目录执行：
   ```bash
   git remote add origin https://github.com/<你的用户名>/lingua.git
   git branch -M main
   git push -u origin main
   ```

## 四、在 Vercel 导入并配置

1. 打开 https://vercel.com/new ，用 GitHub 登录，选择刚才的 `lingua` 仓库，点 **Import**。
2. Framework 会自动识别为 **Next.js**，无需改构建命令。
3. 展开 **Environment Variables**，逐一添加：

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `libsql://lingua-<you>.turso.io` |
   | `DATABASE_AUTH_TOKEN` | Turso token |
   | `AUTH_SECRET` | 随机字符串，用 `openssl rand -base64 32` 生成 |
   | `AI_API_KEY` | （可选）你的 AI 服务密钥 |
   | `AI_BASE_URL` | （可选）如 `https://api.openai.com/v1` |
   | `AI_MODEL` | （可选）如 `gpt-4o-mini` |

4. 点 **Deploy**，等待 1–2 分钟，完成后得到 `https://lingua-<you>.vercel.app`。

## 五、使用

打开网址 → 注册账号 → 进入仪表盘，即可使用。之后每次 `git push`，Vercel 会自动重新部署。

## 常见问题

- **登录/注册报错**：检查 `AUTH_SECRET` 是否已设置；数据库相关错误检查 `DATABASE_URL` 与 `DATABASE_AUTH_TOKEN`。
- **数据没了**：Vercel 本身不存数据，数据都在 Turso；确认环境变量指向的是同一个 Turso 库。
- **AI 功能不可用**：未配置 `AI_API_KEY` 时会返回 503 提示，属正常；配置后即可用。
- **绑定自己的域名**：Vercel 项目 → Settings → Domains 添加，按提示解析即可。
- **免费额度**：Turso 与 Vercel 均有充足的免费额度供个人学习使用。
