# -*- coding: utf-8 -*-
"""
生成 16 篇公众号发布版 md(原 md + 统一文末 CTA + 免责声明)

输入:  docs/marketing/人格详解_XXXX_*.md(16 个)
输出:  docs/marketing/公众号发布版/人格详解_XXXX_*.md(16 个)

使用流程:
1. 跑本脚本生成 16 个发布版
2. 打开 mdnice.com (或秀米 xiumi.us)
3. 把发布版 md 粘贴到 mdnice 左侧编辑区,选个公众号风格主题
4. 复制右侧渲染后的内容,粘贴到公众号编辑器
5. 微调封面图(可选),「保存」(不要点「发表」,避免群发)
6. 公众号后台 → 自动回复 → 关键词回复 → 绑定这篇图文
"""

import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
SRC_DIR = os.path.join(ROOT, "docs", "marketing")
DST_DIR = os.path.join(SRC_DIR, "公众号发布版")


FOOTER = """

---

━━━━━━━━━━━━━━━━━━━━

**▌ 想知道你是 16 种里的哪一种?**

🧪 **测一测**:微信搜小程序「**交易人格实验室**」
&nbsp;&nbsp;&nbsp;&nbsp;25 题 5 分钟测出你的 4 字 DNA 码

📚 **看全集**:本号回复「**全集**」
&nbsp;&nbsp;&nbsp;&nbsp;领取《交易人格体系详解 · 16 种全集》PDF(130 页)

📖 **看其他人格**:本号回复对应 DNA 码(如 RTCD / XECF)

━━━━━━━━━━━━━━━━━━━━

> 本文不构成投资建议,仅作个人交易认知与心理画像参考。
> 档案中的大师业绩与案例均来自公开资料,仅作人格对照与学习。
> 投资有风险,决策需谨慎。
"""


def build():
    os.makedirs(DST_DIR, exist_ok=True)

    src_files = sorted([
        f for f in os.listdir(SRC_DIR)
        if f.startswith("人格详解_") and f.endswith(".md") and "全集" not in f
    ])

    if not src_files:
        raise SystemExit(f"未找到 docs/marketing/人格详解_*.md")

    print(f"找到 {len(src_files)} 个分册")

    for fname in src_files:
        src = os.path.join(SRC_DIR, fname)
        dst = os.path.join(DST_DIR, fname)

        with open(src, "r", encoding="utf-8") as f:
            content = f.read().rstrip()

        # 清理:截断第 2 个 H1 及之后所有内容
        # (markdown 规范一篇文章只该有 1 个 H1,中间出现的 H1 通常是给作者看的写作模板/元说明)
        lines = content.split("\n")
        cleaned = []
        h1_count = 0
        for line in lines:
            if line.startswith("# "):
                h1_count += 1
                if h1_count >= 2:
                    break  # 遇到第 2 个 H1,后面全部丢弃
            cleaned.append(line)
        content = "\n".join(cleaned).rstrip()

        # 追加文末 CTA(元信息保留)
        new_content = content + FOOTER

        with open(dst, "w", encoding="utf-8") as f:
            f.write(new_content)

        size_kb = os.path.getsize(dst) / 1024
        print(f"  OK  {fname}  ({size_kb:.1f} KB)")

    print(f"\n输出目录: {DST_DIR}")
    print(f"共 {len(src_files)} 个发布版")


if __name__ == "__main__":
    build()
