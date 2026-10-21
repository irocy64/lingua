# Lingua · 英语 / 日语学习平台

以**间隔重复（FSRS）**为核心、覆盖英语与日语**听、说、读、写、背词**的全栈学习应用。

## 线上地址

**https://lingua-irocy64.netlify.app**

- 托管：Netlify（免费 HTTPS 子域名）
- 数据库：Turso（东京区域，libSQL）
- 自动部署：推送 `main` 分支后由 GitHub Actions 构建并发布（`.github/workflows/deploy-netlify.yml`）
- 新用户直接在 `/register` 注册，无需预置账号

## 功能一览

- **大词库**：内置 CET-6 6005 词、考研红宝书 6702 词、雅思 3575 词、托福 4264 词、JLPT N2 2496 词、N5 663 词（共 2.37 万模板词条）
- **按需加载**：注册只加载 300 个起步词，进入词书时自动分批补充，也可在词书详情“加入全部”
- **FSRS 复习闭环**：`ts-fsrs` 调度，Again / Hard / Good / Easy 四档自评；每日新词与复习量可在设置中调整
- **记忆曲线强化**：到期复习优先于新词；答错的词在本轮末尾“回炉重学”；仪表盘展示未来 7 天复习量
- **今日目标**：仪表盘展示新词/复习完成进度与连续打卡，学习页实时显示目标进度
- **发音（TTS）**：浏览器 `speechSynthesis` 朗读单词、例句和句子，无需联网或 API Key
- **智能阅读器**：`Intl.Segmenter` 分词，点击词语查词、一键加入生词本、逐句朗读与 AI 讲解
- **查词**：英语 dictionaryapi.dev、日语 jisho（服务端代理）
- **AI 能力**（OpenAI 兼容接口）：精读讲解、口语对话、写作批改
- **假名训练**：五十音表（点击发音）+ 罗马音认读测验
- **词书进度**：词书详情展示未学 / 学习中 / 已掌握分布
- **内置词书同步**：设置页可把新增的内置词条补充到个人词库，不覆盖已有进度
- **Anki 互导**：导出 / 导入 TSV（word/reading/meaning/example）
- **词汇图谱**：按汉字聚合日语词汇
- **PWA**：可安装到主屏幕、Service Worker 离线缓存
- **自托管**：Docker 多阶段构建，SQLite 数据卷持久化

## 技术栈

- Next.js 16（App Router、Cache Components、standalone）
- React 19、TypeScript、Tailwind CSS 4
- Drizzle ORM + libSQL / Turso（云 SQLite）
- Auth.js v5（Credentials + bcrypt）
- ts-fsrs、OpenAI SDK、React Markdown、zod、Vitest

## 快速开始

```bash
# 1. 安装依赖（Node.js >= 20.9，推荐 22/24）
npm install

# 2. 配置环境变量
cp .env.example .env.local
#   至少修改 AUTH_SECRET；如需 AI 功能，填写 AI_API_KEY / AI_BASE_URL / AI_MODEL

# 3. 建表并写入内置词书
npm run db:push
npm run db:seed

# 4. 启动
npm run dev          # 开发
# 或
npm run build && npm run start
```

访问 http://localhost:3000 ，先注册账号，再进入仪表盘。

> 本地数据库默认位于 `data/lingua.db`（`DATABASE_URL=file:./data/lingua.db`）。
> 生产环境请使用 Turso：`DATABASE_URL=libsql://...` + `DATABASE_AUTH_TOKEN`（当前部署在 Netlify）。

## 学习方式（记忆曲线）

- **FSRS 间隔重复**：根据每张卡的稳定性与难度计算下次复习时间，四档评分（重来/困难/一般/简单）决定间隔
- **每日配额**：默认新词 15 + 复习 100，可在设置中调整；队列会扣除当天已完成量
- **到期优先**：每次学习先清到期复习，再学新词，避免旧词堆积
- **错词回炉**：评“重来”的词会在本轮末尾再次出现，形成短时强化
- **复习预测**：仪表盘展示未来 7 天到期量，提前看到学习压力
- **按需加载**：不一次性复制整本词书，首次学习加载 300 词，学完自动补下一批

## 学习流程

1. 仪表盘查看今日目标、未来 7 天复习量与连续打卡
2. 进入学习页，可下拉切换词书：空格翻面，键盘 1–4 评分；单词与例句可点击 🔊 朗读
3. 学完展示本轮统计与今日目标完成度，可“再学一组”
4. 在阅读器中点词查词、加入生词本，生词自动进入 FSRS 队列
5. 设置页可调整每日新词/复习目标，或补全已加入词书的更新

## Docker 部署

```bash
docker compose up -d --build
```

- 数据持久化在宿主机 `./data`（容器内 `/app/data`）
- 环境变量在 `.env` 或 shell 中提供（见 `docker-compose.yml`）

## PWA

生产构建后用浏览器打开，即可“添加到主屏幕”；Service Worker 对导航采用网络优先、静态资源缓存优先（不缓存 API）。

## Anki 互导

- 仪表盘 → 工具 → 导出 Anki（英语/日语 TSV），在 Anki 中“导入”即可
- 也可将 Anki 导出的 TSV 选语言后导入（自动去重）

## 目录结构

```
lingua/
├── app/                    # App Router 页面与 API
│   ├── api/                # auth、register、lookup、study、texts、ai、anki 等
│   ├── dashboard/ decks/ kana/ reader/ study/ practice/ settings/ stats/
├── components/             # 通用组件（Header、发音按钮等）
├── features/               # 按领域组织的功能组件
│   ├── auth/ reader/ practice/ stats/ study/ kana/
├── lib/                    # 基础设施（ai、auth、srs、date、speech、segment）
├── server/                 # 服务端业务逻辑与数据访问
├── db/                     # Drizzle schema、种子数据、迁移
├── public/                 # 图标、Service Worker
├── scripts/                # 开发校验脚本
├── docs/                   # PRD、开源项目调研、部署指南
├── Dockerfile docker-compose.yml
```

## 测试

```bash
npm test                   # Vitest 单元测试（FSRS 调度）
npm run lint               # ESLint
npm run build              # 生产构建
npx tsx scripts/sync-check.ts <邮箱>   # 内置词书同步校验（需本地数据库）
```

## 许可证

MIT。开源项目调研见 `docs/开源项目调研报告.md`；复用的 CC 内容按其要求署名。
