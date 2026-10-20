# Lingua 外语学习网站 · 产品需求文档（PRD）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 创建日期 | 2026-10-20 |
| 产品名称 | Lingua（个人双语学习平台） |
| 目标语言 | 英语、日语（中文母语者） |
| 交付形态 | 响应式网站（PWA 优先），支持本地开发与自托管 |

---

## 1. 产品定位与目标

### 1.1 背景
使用者为大学生，目标是**精通英语与日语**。现有开源工具（Hanabira、KanaDojo、Lute、SpeakMate 等）各自只覆盖单一学习环节，且学习数据分散、无法统一追踪。

### 1.2 产品定位
一个**以"间隔重复（SRS）"为核心、打通"输入（阅读/听力）→ 词汇沉淀 → 复习 → 输出（口语/写作）"闭环**的个人双语学习网站。

### 1.3 核心目标
1. 英语：支撑 CET-6 / 考研英语、学术阅读与口语表达；
2. 日语：支撑 JLPT N5→N1 的词汇、语法、汉字、阅读与听说；
3. 所有学习行为沉淀为**个人词汇数据库**，统一用 FSRS 调度复习；
4. 学习数据可视化（掌握量、复习曲线、连续打卡）。

### 1.4 非目标（MVP 不做）
- 多用户社交、课程市场、UGC 公开分享（仅保留单用户/账号体系，后期可扩展）；
- 付费/订阅系统；
- 原生移动 App（以 PWA 替代）。

---

## 2. 用户与使用场景

### 2.1 核心用户
- 中文母语大学生，英语中高级、日语从零到进阶；
- 具备碎片时间（宿舍、通勤）与整块精读时间。

### 2.2 典型场景
| 场景 | 频次 | 功能 |
|---|---|---|
| 每日复习到期卡片 | 每日 1–2 次 | FSRS 复习队列、自评 |
| 背单词（CET-6 / JLPT 词书） | 每日 | 词书学习、新词推进 |
| 日语假名/汉字专项训练 | 入门期高频 | Kana/Kanji drill |
| 精读外文文章/网页 | 每周多次 | 阅读器、即点即查、生词入库 |
| AI 英语口语/日语对话 | 每周 | AI 对话 + 纠错 |
| 查看学习统计 | 每周 | 仪表盘 |

---

## 3. 功能清单（按优先级）

### P0 — MVP（必须）
- F01 账号：注册 / 登录 / 个人设置（目标语言、每日新词量、每日复习量）
- F02 词库管理：词书（Deck）导入与选择；内置 CET-6、JLPT N5–N1 词书
- F03 卡片学习：新词学习 + FSRS 复习队列；卡片正面/反面（词、释义、读音、例句、音频）
- F04 复习调度：集成 FSRS（`ts-fsrs`），支持 Again/Hard/Good/Easy 四档自评
- F05 日语假名表：平假名/片假名一览与认读练习
- F06 仪表盘：今日待复习/待学数量、掌握词汇总数、连续打卡天数、学习热力图
- F07 数据持久化：用户、卡片、复习记录、设置持久化存储

### P1 — 输入能力
- F08 阅读器：导入文本/URL，句子与词着色（按熟悉度）
- F09 即点即查：点击词查词典/翻译；一键加入生词本（自动生成卡片）
- F10 日语分词：MeCab/Kuromoji 分词，支持汉字读音标注（振假名）
- F11 发音：TTS 朗读（英/日），单词与例句发音
- F12 例句库：Tatoeba 数据接入，卡片关联双语例句

### P2 — AI 与输出
- F13 AI 精读助手：选中文本，AI 讲解词义、语法、句式
- F14 AI 对话：英语口语、日语情景对话；AI 纠错与表达建议
- F15 AI 写作批改：提交作文，逐句批改
- F16 个人音色 TTS（可选，对接既有语音工作流）

### P3 — 增强
- F17 游戏化：连击、经验值、生命值（参考 LEAF）
- F18 词汇图谱：按汉字/词根关联（参考 Hanabira Knowledge Map）
- F19 Anki 卡片导入导出
- F20 PWA 离线、多端同步

---

## 4. 用户流程

### 4.1 首次使用
```
注册/登录 → 选择目标语言（英语/日语，可都选）
→ 设置每日新词量与复习量 → 选择词书
→ 进入引导学习（日语先学假名 / 英语先做定级）
→ 进入今日学习
```

### 4.2 每日学习闭环
```
仪表盘查看今日任务
  ├─ 学新词（展示词义→例句→发音→加入学习队列）
  ├─ 复习到期卡片（FSRS 自评 Again/Hard/Good/Easy → 调度下一次）
  └─ 精读/对话（选做，生词一键入队）
→ 完成后展示当日统计与打卡
```

### 4.3 精读闭环
```
导入文本/URL → 阅读（熟词弱化、生词高亮）
→ 点击生词查词/听发音 → 加入生词本（生成卡片）
→ 生词进入 FSRS 复习队列
```

---

## 5. 页面结构（信息架构）

```
/                     落地页/重定向
/login /register      登录注册
/dashboard            仪表盘（今日任务、统计、热力图）
/decks                词书列表与管理
/decks/[id]           词书详情（学习进度、开始学习）
/study                学习/复习会话（卡片流）
/kana                 日语假名表与练习
/reader               阅读器（文本列表）
/reader/[id]          精读页
/practice/chat        AI 对话
/practice/writing     AI 写作批改
/stats                学习统计
/settings             设置
```

---

## 6. 数据模型（核心表）

### users
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | 用户 ID |
| email / password_hash | string | 凭证 |
| nickname | string | 昵称 |
| daily_new_target / daily_review_target | int | 每日目标 |
| created_at | timestamp | |

### decks（词书）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| name | string | 如 CET-6、JLPT N5 |
| language | enum | en / ja |
| description | string | |

### cards（卡片/词汇）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| deck_id | fk | 所属词书 |
| user_id | fk | 所属用户（生词本用户自建） |
| word | string | 单词/日语词 |
| reading | string | 日语假名读音 |
| meaning | text | 中文释义 |
| example / example_translation | text | 例句及译文 |
| audio_url | string | 发音 |
| lang | enum | en / ja |
| state | enum | 新卡/学习中/已掌握/暂停 |
| fsrs_data | json | FSRS 调度状态（稳定性、难度、上次复习、到期时间等） |
| created_at / updated_at | timestamp | |

### reviews（复习记录）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| card_id | fk | |
| rating | enum | again/hard/good/easy |
| elapsed_days | int | 距上次复习天数 |
| reviewed_at | timestamp | |

### texts（阅读材料）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| title / content | text | |
| source_url | string | |
| lang | enum | |

### study_sessions（学习会话，用于统计）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| type | enum | learn/review/reading/chat |
| cards_count | int | |
| started_at / ended_at | timestamp | |

---

## 7. 技术架构

### 7.1 技术栈
| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 15（App Router）+ React 19 + TypeScript | 与 KanaDojo/LEAF 一致 |
| 样式 | Tailwind CSS | |
| 数据库 | PostgreSQL（开发可用 SQLite 兼容） | |
| ORM | Drizzle ORM | |
| 鉴权 | Auth.js（NextAuth） | |
| 复习算法 | ts-fsrs | |
| 日语分词 | kuromoji（浏览器端）/ MeCab（服务端） | |
| 校验 | Zod | |
| 测试 | Vitest + Playwright | |
| 部署 | Docker（自托管） | |

### 7.2 架构分层
```
app/                Next.js App Router 页面与路由
components/         通用组件
features/           按领域组织（cards, study, reader, chat, stats, auth）
lib/                工具库（fsrs 调度、db、auth）
server/             服务端逻辑、API
db/                 Drizzle schema、迁移
public/             静态资源
```

### 7.3 API 设计（REST 草案）
| 方法 | 路径 | 功能 |
|---|---|---|
| POST | /api/auth/* | 鉴权 |
| GET | /api/decks | 词书列表 |
| GET | /api/decks/:id/cards | 词书卡片 |
| GET | /api/study/queue | 今日学习+复习队列 |
| POST | /api/study/review | 提交复习评分（触发 FSRS 调度） |
| GET/POST | /api/cards | 卡片查询/新建（生词本） |
| GET/POST | /api/texts | 阅读材料 |
| POST | /api/ai/explain | AI 精读讲解 |
| POST | /api/ai/chat | AI 对话 |
| POST | /api/ai/writing | 写作批改 |
| GET | /api/stats/summary | 统计数据 |

---

## 8. 里程碑

| 里程碑 | 内容 | 验收标准 |
|---|---|---|
| M1 工程骨架 | Next.js 工程、TS、Tailwind、ESLint、目录结构、DB 连接 | 可本地启动、lint/typecheck 通过 |
| M2 鉴权与设置 | 注册登录、用户设置 | 可注册登录并保存设置 |
| M3 词库与卡片 | 词书导入、卡片数据 | 可选择词书、浏览卡片 |
| M4 FSRS 学习闭环 | 学习队列、复习、调度 | 评分后到期时间正确更新，统计入库 |
| M5 假名与仪表盘 | 假名表、今日任务、打卡、热力图 | 首页数据准确 |
| M6 阅读器 | 文本导入、分词、查词、生词入库 | 精读闭环可用 |
| M7 AI 模块 | 精读讲解、对话、写作 | 真实 AI 响应 |
| M8 增强与部署 | PWA、Docker、Anki 互导 | 可自托管访问 |

---

## 9. 数据与内容来源
- 日语词汇/语法/例句：Hanabira 内容仓库（CC BY-SA，注明来源）
- 双语例句：Tatoeba（CC 许可）
- 复习算法：FSRS（ts-fsrs）
- 英语词书：CET-6 / 考研词汇开源数据（导入时确认许可）

## 10. 许可证合规
- MIT / Apache-2.0 依赖可自由使用；
- AGPL 项目仅作思路参考，不直接复制代码；
- CC 内容按要求署名。
