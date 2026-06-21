/**
 * TradeDNA 题库 V2.0
 *
 * 设计原则：
 *   1. 强制选择(ipsative)格式：两个选项都是合理的交易风格，没有明显优劣
 *   2. 去社会期许偏差：不让某一侧听起来"更专业/更聪明/更有纪律"
 *   3. 场景化优于抽象自我描述：行为题用具体情境，减少自我美化
 *
 * 学术框架参考(仅作概念性参考，所有题目原创设计，未引用任何量表条目)：
 *   - REI / 认知-经验自我理论(Epstein, 1996)
 *       双系统理论：理性分析 vs 经验直觉 → 维度 A/B
 *   - CFC 未来后果考量量表(Strathman et al., 1994; Joireman et al., 2012)
 *       即时取向 vs 远期取向 → 维度 S/L
 *   - 金融风险容忍框架(Grable & Lytton, 1999)
 *       概率赌局、确定损失 vs 期望收益、波动容忍 → 维度 C/G
 *   - 自我控制量表(Tangney et al., 2004)
 *       规则遵从 vs 情境调适 → 维度 D/F
 *   - Pompian 行为型投资者类型(BIT)
 *       Preserver / Follower / Independent / Accumulator → 启发 16 人格命名
 *
 * 题目结构：
 *   Q1-Q5   决策方式(decision)  A 分析 / B 经验
 *   Q6-Q10  交易周期(cycle)     S 短期 / L 长期
 *   Q11-Q15 风险偏好(risk)      C 保守 / G 进攻
 *   Q16-Q20 执行能力(execution) D 纪律 / F 灵活
 *   Q21-Q25 行为题(behavior)    场景化，0.5 权重，跨维度交叉打分
 */

const questions = [
  // ============ 决策方式 (REI: Rational vs Experiential) ============
  { id:1, dimension:'decision',
    text:'看到一个新机会时，你判断价值的第一步通常是？',
    options:[
      { key:'A', text:'列出关键变量，逐项分析', score:{A:1} },
      { key:'B', text:'综合感受，形成整体判断', score:{B:1} }
    ]
  },
  { id:2, dimension:'decision',
    text:'你更信任哪类信息？',
    options:[
      { key:'A', text:'可量化、可重复验证的数据', score:{A:1} },
      { key:'B', text:'多年实战积累的经验判断', score:{B:1} }
    ]
  },
  { id:3, dimension:'decision',
    text:'当数据分析和你的市场直觉冲突时，你倾向？',
    options:[
      { key:'A', text:'按数据所示，重新审视情境', score:{A:1} },
      { key:'B', text:'按直觉所感，重新审视数据', score:{B:1} }
    ]
  },
  { id:4, dimension:'decision',
    text:'研究一只股票，你更愿意深挖？',
    options:[
      { key:'A', text:'财务结构、行业模型、量化因子', score:{A:1} },
      { key:'B', text:'资金动向、市场情绪、机构行为', score:{B:1} }
    ]
  },
  { id:5, dimension:'decision',
    text:'你更欣赏哪种交易者？',
    options:[
      { key:'A', text:'能用明确规则解释每一笔交易的人', score:{A:1} },
      { key:'B', text:'能在复杂行情里读懂主线节奏的人', score:{B:1} }
    ]
  },

  // ============ 交易周期 (CFC: Immediate vs Future Consequences) ============
  { id:6, dimension:'cycle',
    text:'你更喜欢哪种反馈节奏？',
    options:[
      { key:'S', text:'几小时到几天就能见结果', score:{S:1} },
      { key:'L', text:'几周到几个月慢慢兑现', score:{L:1} }
    ]
  },
  { id:7, dimension:'cycle',
    text:'你持有一笔满意仓位的舒适区间通常是？',
    options:[
      { key:'S', text:'数日到两周', score:{S:1} },
      { key:'L', text:'数月到数年', score:{L:1} }
    ]
  },
  { id:8, dimension:'cycle',
    text:'你查看账户的习惯更接近？',
    options:[
      { key:'S', text:'每天甚至盘中多次', score:{S:1} },
      { key:'L', text:'每周或更长周期看一次即可', score:{L:1} }
    ]
  },
  { id:9, dimension:'cycle',
    text:'你更愿意把研究时间花在？',
    options:[
      { key:'S', text:'跟踪当下市场节奏与板块切换', score:{S:1} },
      { key:'L', text:'研究长期产业逻辑与企业基本面', score:{L:1} }
    ]
  },
  { id:10, dimension:'cycle',
    text:'你认为账户更应该如何增长？',
    options:[
      { key:'S', text:'在关键节点抓爆发，阶段性跳台阶', score:{S:1} },
      { key:'L', text:'稳步复利，接受慢但确定的增长', score:{L:1} }
    ]
  },

  // ============ 风险偏好 (Risk Tolerance: Conservative vs Aggressive) ============
  { id:11, dimension:'risk',
    text:'同样的预期年化收益下，你更愿意？',
    options:[
      { key:'C', text:'选波动较小、回撤可控的路径', score:{C:1} },
      { key:'G', text:'选波动较大、弹性更高的路径', score:{G:1} }
    ]
  },
  { id:12, dimension:'risk',
    text:'面对一个 60% 概率赚 30%、40% 概率亏 15% 的机会，你的仓位会？',
    options:[
      { key:'C', text:'用试探性的小仓位', score:{C:1} },
      { key:'G', text:'用较显著的仓位', score:{G:1} }
    ]
  },
  { id:13, dimension:'risk',
    text:'账户出现 -15% 浮亏时，你的真实感受？',
    options:[
      { key:'C', text:'强烈不适，优先想止血', score:{C:1} },
      { key:'G', text:'可以承受，关注是否出现反转信号', score:{G:1} }
    ]
  },
  { id:14, dimension:'risk',
    text:'你更担心哪种结局？',
    options:[
      { key:'C', text:'承担过多风险而损失本金', score:{C:1} },
      { key:'G', text:'过于保守而错过本可参与的机会', score:{G:1} }
    ]
  },
  { id:15, dimension:'risk',
    text:'决定重仓的时机，你倾向？',
    options:[
      { key:'C', text:'等到多重信号共振、确定性较高', score:{C:1} },
      { key:'G', text:'核心信号出现就果断行动', score:{G:1} }
    ]
  },

  // ============ 执行能力 (Self-Control: Discipline vs Flexibility) ============
  { id:16, dimension:'execution',
    text:'制定好的交易计划，你？',
    options:[
      { key:'D', text:'按计划执行，不轻易改动', score:{D:1} },
      { key:'F', text:'视盘面动态灵活调整', score:{F:1} }
    ]
  },
  { id:17, dimension:'execution',
    text:'当预设的止损位被触及，你倾向？',
    options:[
      { key:'D', text:'机械执行，不做二次判断', score:{D:1} },
      { key:'F', text:'二次判断，排除假突破可能', score:{F:1} }
    ]
  },
  { id:18, dimension:'execution',
    text:'你的复盘习惯更接近？',
    options:[
      { key:'D', text:'每日结构化记录、分类归档', score:{D:1} },
      { key:'F', text:'凭印象与感受，关键事件才系统复盘', score:{F:1} }
    ]
  },
  { id:19, dimension:'execution',
    text:'有人强烈推荐一只股票，你？',
    options:[
      { key:'D', text:'不轻易改变自己的节奏', score:{D:1} },
      { key:'F', text:'会先关注，看是否符合自己的框架', score:{F:1} }
    ]
  },
  { id:20, dimension:'execution',
    text:'你的交易决策更像？',
    options:[
      { key:'D', text:'一套写下来、可被审计的规则', score:{D:1} },
      { key:'F', text:'一个根据情境调整的动态判断过程', score:{F:1} }
    ]
  },

  // ============ 行为题 (Scenario-based, cross-loaded, weight 0.5) ============
  { id:21, dimension:'behavior',
    text:'刚买入的股票当天就跌了 5%。第二天开盘前，你最可能？',
    options:[
      { key:'A', text:'重新核对买入逻辑，逻辑成立就持有', score:{A:0.5, D:0.5} },
      { key:'B', text:'优先看盘面强弱，弱势先减仓再说', score:{B:0.5, F:0.5} }
    ]
  },
  { id:22, dimension:'behavior',
    text:'你看好的板块连涨 3 天，你还没买入。第 4 天开盘，你？',
    options:[
      { key:'A', text:'等回调再说，追高胜率不高', score:{L:0.5, C:0.5} },
      { key:'B', text:'至少先建一部分，怕错过主升', score:{S:0.5, G:0.5} }
    ]
  },
  { id:23, dimension:'behavior',
    text:'账户连续盈利 5 个交易日，第 6 天你的真实状态是？',
    options:[
      { key:'A', text:'刻意收一收，避免连胜带来的膨胀', score:{D:0.5, C:0.5} },
      { key:'B', text:'顺势加力，趁状态好乘胜追击', score:{F:0.5, G:0.5} }
    ]
  },
  { id:24, dimension:'behavior',
    text:'持有 3 个月的股票刚跌破关键支撑，但你的长期逻辑没变，你？',
    options:[
      { key:'A', text:'按预设规则减仓或离场，纪律优先', score:{D:0.5, S:0.5} },
      { key:'B', text:'坚守长期判断，等趋势重新确认', score:{L:0.5, F:0.5} }
    ]
  },
  { id:25, dimension:'behavior',
    text:'一次显著亏损之后，你最常做的事是？',
    options:[
      { key:'A', text:'写下交易日志，定位偏离系统的具体环节', score:{A:0.5, D:0.5} },
      { key:'B', text:'先暂停一两天，调整状态再回市场', score:{F:0.5, C:0.5} }
    ]
  }
]

module.exports = { questions }
