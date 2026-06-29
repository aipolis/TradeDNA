# -*- coding: utf-8 -*-
"""
TradeDNA 16 人格详解全集 → PDF 生成器

输入: docs/marketing/人格详解_全集_16篇.md
输出: docs/marketing/交易人格体系详解---16种全集.pdf

用途:
- 作为微信 AI 知识库的源文件
- 16 个人格详解全集,带封面/简介/CTA 引导/结尾品牌页

依赖: pip install reportlab
字体: Windows 系统自带 SimHei (黑体)
"""

import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Image, HRFlowable, KeepTogether,
)


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
SRC = os.path.join(ROOT, "docs", "marketing", "人格详解_全集_16篇.md")
DST = os.path.join(ROOT, "docs", "marketing", "交易人格体系详解---16种全集.pdf")
LOGO = os.path.join(ROOT, "brand", "logo_avatar_512.png")


# ---------- 字体 ----------
pdfmetrics.registerFont(TTFont('SimHei', 'C:/Windows/Fonts/simhei.ttf'))


# ---------- 颜色 ----------
COLOR_GOLD = HexColor('#B8860B')
COLOR_GOLD_LIGHT = HexColor('#D4AF37')
COLOR_BLUE = HexColor('#1E5A9E')
COLOR_TEXT = HexColor('#1a2533')
COLOR_TEXT_LIGHT = HexColor('#5a6578')
COLOR_MUTED = HexColor('#8e8e93')
COLOR_QUOTE_BG = HexColor('#fdf6e3')


# ---------- 样式 ----------
def build_styles():
    base = dict(fontName='SimHei', textColor=COLOR_TEXT)
    return {
        'cover_title':  ParagraphStyle('CoverTitle',  **base, fontSize=34, leading=46, alignment=TA_CENTER, spaceAfter=14),
        'cover_sub':    ParagraphStyle('CoverSub',    fontName='SimHei', fontSize=18, leading=26, alignment=TA_CENTER, textColor=COLOR_GOLD, spaceAfter=24),
        'cover_slogan': ParagraphStyle('CoverSlogan', fontName='SimHei', fontSize=13, leading=22, alignment=TA_CENTER, textColor=COLOR_TEXT_LIGHT, spaceAfter=8),
        'h1':           ParagraphStyle('H1',          **base, fontSize=22, leading=32, alignment=TA_LEFT,   spaceBefore=18, spaceAfter=12),
        'h2':           ParagraphStyle('H2',          **base, fontSize=15, leading=24, alignment=TA_LEFT,   spaceBefore=14, spaceAfter=8),
        'h3':           ParagraphStyle('H3',          **base, fontSize=12, leading=20, alignment=TA_LEFT,   spaceBefore=10, spaceAfter=6),
        'body':         ParagraphStyle('Body',        **base, fontSize=10.5, leading=18, alignment=TA_JUSTIFY, spaceAfter=8),
        'quote':        ParagraphStyle('Quote',       fontName='SimHei', fontSize=10.5, leading=18, alignment=TA_LEFT, textColor=COLOR_GOLD, spaceAfter=10, leftIndent=14, rightIndent=14, borderPadding=6, borderColor=COLOR_GOLD_LIGHT, borderWidth=0.5, backColor=COLOR_QUOTE_BG),
        'list_item':    ParagraphStyle('ListItem',    **base, fontSize=10.5, leading=18, alignment=TA_LEFT, spaceAfter=4, leftIndent=14),
        'cta_title':    ParagraphStyle('CTATitle',    fontName='SimHei', fontSize=11, leading=18, alignment=TA_CENTER, textColor=COLOR_BLUE, spaceAfter=4),
        'cta_body':     ParagraphStyle('CTABody',     **base, fontSize=10, leading=16, alignment=TA_CENTER, spaceAfter=4),
        'small':        ParagraphStyle('Small',       fontName='SimHei', fontSize=9, leading=14, alignment=TA_CENTER, textColor=COLOR_MUTED, spaceAfter=4),
    }


# ---------- 内联格式 ----------
_BOLD = re.compile(r'\*\*([^*]+)\*\*')
_BACKTICK = re.compile(r'`([^`]+)`')


def inline_fmt(s):
    """转义 reportlab 特殊字符,处理 markdown 内联格式"""
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    s = _BOLD.sub(r'<b>\1</b>', s)
    s = _BACKTICK.sub(r'<font face="SimHei" color="#5a6578">\1</font>', s)
    return s


# ---------- 章中软引导(3 种轮换,避免重复感) ----------
INLINE_CTAS = [
    ('如果你还没测过自己的 4 字 DNA 码',
     '微信搜小程序「交易人格实验室」',
     '25 题 5 分钟看看你是不是这一格'),
    ('这一段如果让你感到熟悉',
     '关注公众号「交易人格实验室」',
     '每周更新一种人格的实战策略与陷阱'),
    ('看到这里如果想更深一层',
     '关注公众号「交易人格实验室」',
     '完整的 16 人格深度档案与大师案例'),
]


def inline_cta(idx, styles):
    a, b, c = INLINE_CTAS[idx % len(INLINE_CTAS)]
    txt = f'<font color="#8e8e93">— {a} · </font><b><font color="#1E5A9E">{b}</font></b><font color="#8e8e93"> · {c} —</font>'
    return [
        Spacer(1, 0.25 * cm),
        HRFlowable(width='25%', thickness=0.4, color=COLOR_GOLD_LIGHT, hAlign='CENTER'),
        Spacer(1, 0.12 * cm),
        Paragraph(txt, styles['small']),
        Spacer(1, 0.12 * cm),
        HRFlowable(width='25%', thickness=0.4, color=COLOR_GOLD_LIGHT, hAlign='CENTER'),
        Spacer(1, 0.25 * cm),
    ]


# ---------- Markdown → Flowables ----------
def parse_md(md_text, styles, chapter_idx=0):
    flows = []
    lines = md_text.split('\n')
    i = 0
    h2_count = 0  # 跟踪 H2 计数,用于在章中第 2 / 4 个 H2 前插入软引导
    while i < len(lines):
        line = lines[i].rstrip()

        # 空行
        if not line:
            i += 1
            continue

        # 分隔线
        if re.match(r'^-{3,}$', line):
            flows.append(Spacer(1, 0.2 * cm))
            flows.append(HRFlowable(width='100%', thickness=0.5, color=COLOR_MUTED))
            flows.append(Spacer(1, 0.2 * cm))
            i += 1
            continue

        # 一级标题(章节标题)
        if line.startswith('# '):
            flows.append(Paragraph(inline_fmt(line[2:]), styles['h1']))
            i += 1
            continue

        # 二级标题(在第 3 / 5 个 H2 前插入章中软引导,避开章首"开篇"和章末)
        if line.startswith('## '):
            h2_count += 1
            if h2_count in (3, 5):
                cta_idx = (chapter_idx * 2 + (h2_count // 2 - 1))
                flows.extend(inline_cta(cta_idx, styles))
            flows.append(Paragraph(inline_fmt(line[3:]), styles['h2']))
            i += 1
            continue

        # 三级 / 四级标题统一用 h3
        if line.startswith('### '):
            flows.append(Paragraph(inline_fmt(line[4:]), styles['h3']))
            i += 1
            continue
        if line.startswith('#### '):
            flows.append(Paragraph(inline_fmt(line[5:]), styles['h3']))
            i += 1
            continue

        # 引用(合并连续引用行)
        if line.startswith('>'):
            quote_lines = []
            while i < len(lines) and lines[i].rstrip().startswith('>'):
                ql = lines[i].rstrip()
                ql = ql[1:].lstrip() if ql.startswith('>') else ql
                if ql:
                    quote_lines.append(ql)
                i += 1
            quote_html = '<br/>'.join(inline_fmt(q) for q in quote_lines)
            flows.append(Paragraph(quote_html, styles['quote']))
            continue

        # 有序列表
        m = re.match(r'^(\d+)\.\s+(.+)$', line)
        if m:
            flows.append(Paragraph(f'{m.group(1)}. {inline_fmt(m.group(2))}', styles['list_item']))
            i += 1
            continue

        # 无序列表
        if line.startswith('- ') or line.startswith('* '):
            flows.append(Paragraph('• ' + inline_fmt(line[2:]), styles['list_item']))
            i += 1
            continue

        # 普通段落(合并到下一个空行)
        para_lines = [line]
        while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].lstrip().startswith(('#', '>', '-', '*', '|')) and not re.match(r'^-{3,}$', lines[i + 1]) and not re.match(r'^\d+\.', lines[i + 1]):
            i += 1
            para_lines.append(lines[i].rstrip())
        flows.append(Paragraph(inline_fmt(' '.join(para_lines)), styles['body']))
        i += 1

    return flows


# ---------- 章节内容 ----------
def cover_page(styles):
    items = [Spacer(1, 3.5 * cm)]
    if os.path.exists(LOGO):
        items.append(Image(LOGO, width=5.5 * cm, height=5.5 * cm, hAlign='CENTER'))
    items.extend([
        Spacer(1, 1 * cm),
        Paragraph('交易人格体系详解', styles['cover_title']),
        Paragraph('—— 16 种全集 ——', styles['cover_sub']),
        Spacer(1, 0.4 * cm),
        Paragraph('发现你的交易基因 · 找到最适合你的交易体系', styles['cover_slogan']),
        Spacer(1, 0.2 * cm),
        Paragraph('TradeDNA 四维模型 · R/X × T/E × C/G × D/F', styles['small']),
        Spacer(1, 3.5 * cm),
        Paragraph('TradeDNA · 交易人格实验室 出品', styles['small']),
        PageBreak(),
    ])
    return items


def intro_page(styles):
    items = [Paragraph('关于本手册', styles['h1'])]
    items.append(Paragraph(
        '本手册基于 TradeDNA 交易人格四维模型——'
        '<b>信息驱动(R 自主 / X 跟随)× 情绪反应(T 稳态 / E 敏感)× '
        '风险偏好(C 保守 / G 进攻)× 执行风格(D 纪律 / F 灵活)</b>——'
        '完整收录 16 种交易人格的深度档案,每种人格 5000~6000 字。',
        styles['body']
    ))
    items.append(Paragraph(
        '设计目的:帮你看清自己的交易模式,匹配适合的体系,'
        '而不是盲目寻找圣杯。',
        styles['body']
    ))

    items.append(Paragraph('每一种人格,你将看到', styles['h2']))
    for t in [
        '性格画像与决策模式',
        '对照交易大师(共 46 位国内外名家)与历史案例',
        '优势、风险、行动建议',
        '适合的交易体系与典型陷阱',
    ]:
        items.append(Paragraph('• ' + t, styles['list_item']))

    items.append(Paragraph('怎么用这份手册', styles['h2']))
    items.append(Paragraph('1. 先测出你的 4 字 DNA 码:微信搜小程序 <b>「交易人格实验室」</b>', styles['list_item']))
    items.append(Paragraph('2. 翻到对应章节,深度阅读(每篇约 12 分钟)', styles['list_item']))
    items.append(Paragraph('3. 关注公众号 <b>「交易人格实验室」</b>,获取持续更新的深度内容', styles['list_item']))

    items.append(Paragraph('16 种人格速览', styles['h2']))
    items.append(Paragraph('按四维结构(R/X × T/E × C/G × D/F)分类:', styles['body']))

    groups = [
        ('R-路径 · 信息自主分析', [
            ('RTCD', '量化工程师'), ('RTCF', '时间合伙人'),
            ('RTGD', '数据狙击手'), ('RTGF', '市场猎鹰'),
            ('RECD', '觉醒计算师'), ('RECF', '孤勇守仓人'),
            ('REGD', '孤狼猎手'), ('REGF', '宏观狙击手'),
        ]),
        ('X-路径 · 跟随外部信号', [
            ('XTCD', '复利守夜人'), ('XTCF', '灯塔守望者'),
            ('XTGD', '未来远征军'), ('XTGF', '风口骑士'),
            ('XECD', '短线刺客'), ('XECF', '迷雾行者'),
            ('XEGD', '龙头战将'), ('XEGF', '焰火追猎者'),
        ]),
    ]
    for group, code_list in groups:
        items.append(Paragraph(group, styles['h3']))
        for code, name in code_list:
            items.append(Paragraph(f'• <b>{code}</b> · {name}', styles['list_item']))

    items.append(Spacer(1, 0.6 * cm))
    items.append(HRFlowable(width='100%', thickness=0.5, color=COLOR_MUTED))
    items.append(Spacer(1, 0.3 * cm))
    items.append(Paragraph(
        '<b>声明:</b>本手册仅作个人交易认知与心理画像参考,'
        '不构成任何投资建议或证券咨询服务。投资有风险,决策需谨慎。',
        styles['small']
    ))
    items.append(PageBreak())
    return items


def cta_block(styles):
    """每章末尾的 CTA"""
    return [
        Spacer(1, 0.4 * cm),
        HRFlowable(width='50%', thickness=0.6, color=COLOR_GOLD_LIGHT, hAlign='CENTER'),
        Spacer(1, 0.25 * cm),
        Paragraph('▌ 想知道你是 16 种里的哪一种?', styles['cta_title']),
        Paragraph('微信搜小程序 <b>「交易人格实验室」</b> · 25 题 5 分钟测出你的 DNA 码', styles['cta_body']),
        Paragraph('关注公众号 <b>「交易人格实验室」</b> · 获取持续更新的深度内容', styles['cta_body']),
        Spacer(1, 0.2 * cm),
        HRFlowable(width='50%', thickness=0.6, color=COLOR_GOLD_LIGHT, hAlign='CENTER'),
    ]


def closing_page(styles):
    items = [Spacer(1, 3 * cm)]
    if os.path.exists(LOGO):
        items.append(Image(LOGO, width=4.5 * cm, height=4.5 * cm, hAlign='CENTER'))
    items.extend([
        Spacer(1, 0.8 * cm),
        Paragraph('交易人格实验室', styles['cover_title']),
        Paragraph('发现你的交易基因 · 找到最适合你的交易体系', styles['cover_sub']),
        Spacer(1, 0.6 * cm),
        Paragraph('我们用四维人格模型,帮你看清自己的交易模式。', styles['cta_body']),
        Paragraph('不卖策略 · 不荐个股 · 只帮你认识自己。', styles['cta_body']),
        Spacer(1, 1.2 * cm),
        Paragraph('测一测 → 微信搜小程序 <b>「交易人格实验室」</b>', styles['cta_body']),
        Paragraph('看深度 → 微信搜公众号 <b>「交易人格实验室」</b>', styles['cta_body']),
        Spacer(1, 2 * cm),
        HRFlowable(width='50%', thickness=0.5, color=COLOR_MUTED, hAlign='CENTER'),
        Spacer(1, 0.3 * cm),
        Paragraph(
            '本手册仅作个人交易认知与心理画像参考,不构成任何投资建议或证券咨询服务。<br/>'
            '档案中的大师业绩与策略案例均来自公开资料,仅作人格对照与学习参考,不代表未来收益。<br/>'
            '投资有风险,决策需谨慎。',
            styles['small']
        ),
    ])
    return items


# ---------- 主流程 ----------
def build():
    if not os.path.exists(SRC):
        raise SystemExit(f'源文件不存在: {SRC}')

    md = open(SRC, 'r', encoding='utf-8').read()

    # 用锚点切分 16 章
    parts = re.split(r'<a id="(\w+)"></a>', md)
    sections = []
    for j in range(1, len(parts), 2):
        code = parts[j]
        content = parts[j + 1].lstrip('\n').lstrip()
        # 去掉每章开头紧跟着的 --- 分隔线(避免和章节内部重复)
        content = re.sub(r'^-{3,}\s*\n', '', content)
        sections.append((code, content))

    print(f'解析到 {len(sections)} 个章节')

    styles = build_styles()
    story = []
    story.extend(cover_page(styles))
    story.extend(intro_page(styles))

    for idx, (code, content) in enumerate(sections, start=1):
        flowables = parse_md(content, styles, chapter_idx=idx - 1)
        story.extend(flowables)
        story.extend(cta_block(styles))
        if idx < len(sections):
            story.append(PageBreak())

    story.append(PageBreak())
    story.extend(closing_page(styles))

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    doc = SimpleDocTemplate(
        DST, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        title='交易人格体系详解 · 16 种全集',
        author='TradeDNA · 交易人格实验室',
        subject='TradeDNA 四维人格模型 · 16 种交易人格深度档案',
    )
    doc.build(story)

    size_kb = os.path.getsize(DST) / 1024
    print(f'OK -> {DST}')
    print(f'Size: {size_kb:.1f} KB')


if __name__ == '__main__':
    build()
