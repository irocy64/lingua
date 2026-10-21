# Render 部署指南（免费）

Lingua 已适配 Render Blueprint，仓库里的 `render.yaml` 会创建一个免费 Node Web Service。

## 限制先说清楚

- **免费实例**：512MB 内存，**15 分钟无访问会休眠**，下次打开约 30–60 秒冷启动
- 每月 750 小时免费额度，个人使用足够
- 数据库仍用现有 Turso 云库，不需要迁数据
- 想不休眠可升级 Render Starter（约 $7/月）

## 一、用 GitHub 登录 Render

1. 打开 https://dashboard.render.com/register
2. 选择 **GitHub** 登录并授权
3. 授权后 Render 能看到 `irocy64/lingua` 仓库

## 二、一键创建 Blueprint

打开：

https://render.com/deploy?repo=https://github.com/irocy64/lingua

Render 会读取 `render.yaml`，创建 `lingua` 服务。按提示填写环境变量：

| 变量 | 值 |
|---|---|
| `DATABASE_URL` | 现有 Turso 地址（`libsql://lingua-irocy64.aws-ap-northeast-1.turso.io`） |
| `DATABASE_AUTH_TOKEN` | `C:\Users\Mayn\Apps\lingua-db-token.txt` 里的 token |
| `AUTH_SECRET` | 可用 Render 自动生成；或 `C:\Users\Mayn\Apps\lingua-auth-secret.txt` |
| `OWNER_EMAIL` | `1245411039@qq.com` |
| `AI_API_KEY` | 现有 DeepSeek key（不填则不启用 AI） |
| `AI_BASE_URL` | 留空（默认 DeepSeek） |
| `AI_MODEL` | `deepseek-chat` |
| `AI_ALLOWED_EMAILS` | `1245411039@qq.com` |

> 不要把 token 提交到 Git；Render 的环境变量是加密存储的。

## 三、等待构建

Render 会执行：

```bash
npm ci && npm run build
npm run start:standalone
```

构建完成后访问 `https://lingua-xxxx.onrender.com`，检查：

- `/api/health` 返回 `{"status":"ok","db":"connected"}`
- `/login` 能打开
- 用 owner 账号登录，数据仍在

## 四、避免冷启动（可选）

免费实例 15 分钟休眠。可以用免费的 uptime 监控每 10 分钟访问一次 `/api/health`（如 cron-job.org、UptimeRobot），保持实例活跃。

## 五、以后更新

Render 已连接 GitHub，push 到 `main` 会自动重新部署。

## 回退到 Netlify

`.github/workflows/deploy-netlify.yml` 已改为手动触发；如果以后 Netlify 额度恢复，可在 Actions 里手动运行。
