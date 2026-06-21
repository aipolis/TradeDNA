# TradeDNA V2 UI还原说明

V2 重点不是增加功能，而是让微信小程序页面接近前期高保真设计稿。

## 视觉方向

- 深蓝黑背景
- 金色金融科技点缀
- DNA双螺旋Logo作为主视觉
- 玻璃拟态卡片
- 发光按钮和渐变进度条

## 关键文件

- 全局设计系统：`miniprogram/app.wxss`
- 首页：`miniprogram/pages/index`
- 答题页：`miniprogram/pages/quiz`
- 结果页：`miniprogram/pages/result`
- 题库：`miniprogram/utils/questions.js`
- 评分：`miniprogram/utils/scoring.js`
- 人格库：`miniprogram/utils/personalities.js`

## 后续建议

如果要继续提高还原度，下一步应单独生成：

1. 透明背景DNA主视觉
2. K线粒子背景
3. 16个人格徽章
4. Canvas真实海报保存功能
