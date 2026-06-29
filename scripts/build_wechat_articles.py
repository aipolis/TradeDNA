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

        # 去掉文件开头第 3-4 行的 "本文是 TradeDNA 16 人格深度解析系列的第 N 篇..." 元信息引用块
        # (这是分册视角的元信息,作为公众号文章不需要)
        lines = content.split("\n")
        cleaned_lines = []
        skip = False
        for i, line in enumerate(lines):
            # 跳过开头的 "> 本文是 TradeDNA..." 引用块
            if i < 6 and line.startswith("> 本文是 TradeDNA") or (skip and line.startswith(">")):
                skip = True
                continue
            if skip and not line.startswith(">"):
                skip = False
            cleaned_lines.append(line)
        content = "\n".join(cleaned_lines)

        # 追加文末 CTA
        new_content = content + FOOTER

        with open(dst, "w", encoding="utf-8") as f:
            f.write(new_content)

        size_kb = os.path.getsize(dst) / 1024
        print(f"  OK  {fname}  ({size_kb:.1f} KB)")

    print(f"\n输出目录: {DST_DIR}")
    print(f"共 {len(src_files)} 个发布版")


if __name__ == "__main__":
    build()
