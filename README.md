# TradeDNA · 交易人格测评

中文名：交易人格测评  
品牌：TradeDNA  
内容 IP：交易DNA实验室

## 项目结构

```text
TradeDNA/
├── miniprogram/          # 微信小程序源码（上传打包目录）
│   ├── app.js / app.json / app.wxss
│   ├── assets/           # logo、公众号二维码等运行时资源
│   ├── components/       # 公共组件（tabbar）
│   ├── pages/            # 页面：index intro quiz result poster mine
│   └── utils/            # 题库、评分、人格库、Canvas 工具
├── docs/
│   ├── product/          # 产品文档（PRD、评分引擎、人格库、UI 说明）
│   ├── design/           # 设计稿（Figma PDF、概念图、高保真切图）
│   └── archive/          # 早期 txt 草稿（已被 md / 代码 supersede，仅留档）
├── project.config.json
└── project.private.config.json
```

## 核心配置

| 文件 | 用途 |
|---|---|
| `miniprogram/utils/questions.js` | 25 道题库 |
| `miniprogram/utils/scoring.js` | 评分引擎 |
| `miniprogram/utils/personalities.js` | 16 人格档案 |
| `miniprogram/assets/qrcode.jpg` | 海报/结果页公众号二维码 |
| `miniprogram/config/brand.js` | 公众号微信号（一键关注） |

## 公众号关注配置

编辑 `miniprogram/config/brand.js`，填入公众号 **微信号**（`gh_` 开头）：

```javascript
username: 'gh_你的公众号ID'
```

配置后，结果页/我的/海报页可 **一键跳转公众号主页**；同时二维码支持 **长按识别**。

## 导入与调试

1. 微信开发者工具 → **导入项目**
2. 目录选择 `TradeDNA`（含 `project.config.json` 的根目录）
3. AppID 填写你的小程序 ID（勿用游客模式）
4. 右上角登录微信，且账号需为该小程序开发者

## 迭代说明

- 改题：编辑 `questions.js` 的 `dimension` 与 `options[].score`
- 改人格文案：编辑 `personalities.js`
- 设计参考：见 `docs/design/mockups/`
- 产品规格：见 `docs/product/TradeDNA_PRD_V1.md`
