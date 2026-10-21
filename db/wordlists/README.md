# 内置词库数据说明

这些 JSON 文件由 `scripts/build-wordlists.mjs` 从开源词库生成，供 `npm run db:seed` 写入数据库。

| 文件 | 词书 | 词数 | 来源 |
|---|---|---:|---|
| `builtin-cet6.json` | CET-6 词汇（星火全本） | 6005（去重后） | 星火六级词库，经 qwerty-learner 整理 |
| `builtin-kaoyan.json` | 考研英语红宝书 | 6702 | 2025 考研红宝书词库，经 qwerty-learner 整理 |
| `builtin-ielts.json` | 雅思核心词汇 | 3575 | qwerty-learner 词库 |
| `builtin-toefl.json` | 托福核心词汇 | 4264 | qwerty-learner 词库 |
| `builtin-jlpt-n2.json` | JLPT N2 词汇 | 2496 | 日语 N2 高频词（含音调/词性/中文释义） |
| `builtin-jlpt-n5.json` | JLPT N5 词汇 | 663 | 日语 N5 入门词 |

## 来源与许可

- 数据源仓库：[RealKai42/qwerty-learner](https://github.com/RealKai42/qwerty-learner)（MIT License）
- 词条释义为中文；英语附带音标，日语附带假名读音。
- 词表仅包含单词、读音与释义，不含例句；如需例句可在阅读器或 AI 功能中补充。
- 如词表版权方要求下架，可删除对应 JSON 并重新运行 seed。

## 重新生成

```bash
node scripts/build-wordlists.mjs   # 需要能访问 raw.githubusercontent.com
npm run db:seed
```
