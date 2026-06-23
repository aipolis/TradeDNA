/**
 * TradeDNA 题库 V3.0（四维改造方案）
 *
 * V3 维度替换：
 *   - 决策方式 A/B → 信息驱动 R/X（自主研究 / 跟随外部）
 *   - 交易周期 S/L → 情绪反应 T/E（稳态 / 情绪型）
 *   - 风险偏好 C/G 保留
 *   - 执行能力 D/F 保留（F 由"灵活"修订为"机会驱动/随机应变"）
 *
 * 设计原则：
 *   1. 强制选择(ipsative)格式：两个选项都是合理的交易风格，没有明显优劣
 *   2. 去社会期许偏差：不让某一侧听起来"更专业/更聪明/更有纪律"
 *   3. 场景化优于抽象自我描述
 *
 * 学术框架参考：
 *   - 李心丹(2002)中国证券市场投资者行为研究 → 政策依赖/从众/归因偏差 → R/X
 *   - Big Five Neuroticism + 处置效应实证 → T/E
 *   - 金融风险容忍框架(Grable & Lytton, 1999) → C/G
 *   - 自我控制量表(Tangney et al., 2004) → D/F
 *
 * 题目结构：
 *   Q1-Q5   信息驱动(information) R 自主研究 / X 跟随外部
 *   Q6-Q10  情绪反应(emotion)     T 稳态 / E 情绪型
 *   Q11-Q15 风险偏好(risk)        C 保守 / G 进攻
 *   Q16-Q20 执行能力(execution)   D 纪律 / F 机会
 *   Q21-Q25 行为题(behavior)      场景化，0.5 权重，跨维度交叉打分
 */

const questions = [
  // ============ 信息驱动 (R 自主研究 / X 跟随外部) ============
  { id:1, dimension:'information',
    text:'看到一只股票一周涨了 50%，你的第一反应是？',
    options:[
      { key:'R', text:'翻它的财报、行业逻辑，判断是不是真机会', score:{R:1} },
      { key:'X', text:'上股吧/雪球/微信群看大家怎么说', score:{X:1} }
    ]
  },
  { id:2, dimension:'information',
    text:'你最常用的选股信息源是？',
    options:[
      { key:'R', text:'自己写的指标、筛选器、财报数据', score:{R:1} },
      { key:'X', text:'公众号、抖音、微信群、大V 推荐', score:{X:1} }
    ]
  },
  { id:3, dimension:'information',
    text:'央行突然降准，你会？',
    options:[
      { key:'R', text:'自己推演哪些行业链条受益，再去筛个股', score:{R:1} },
      { key:'X', text:'看市场喊的"受益板块"是哪个，跟一下', score:{X:1} }
    ]
  },
  { id:4, dimension:'information',
    text:'买入一只股票前，你通常会？',
    options:[
      { key:'R', text:'写下买入逻辑、目标位、止损位', score:{R:1} },
      { key:'X', text:'觉得"应该会涨"就买了，之后再补理由', score:{X:1} }
    ]
  },
  { id:5, dimension:'information',
    text:'复盘亏损时你更倾向于归因于？',
    options:[
      { key:'R', text:'自己的判断或系统哪个环节错了', score:{R:1} },
      { key:'X', text:'庄家洗盘、突发消息、政策变脸、运气不好', score:{X:1} }
    ]
  },

  // ============ 情绪反应 (T 稳态 / E 情绪型) ============
  { id:6, dimension:'emotion',
    text:'账户单日亏损 5%，你当晚？',
    options:[
      { key:'T', text:'该吃吃该睡睡，明天按计划操作', score:{T:1} },
      { key:'E', text:'翻来覆去睡不着，反复看盘后数据', score:{E:1} }
    ]
  },
  { id:7, dimension:'emotion',
    text:'持仓股突然涨停，你的第一反应是？',
    options:[
      { key:'T', text:'看一眼，回到原计划', score:{T:1} },
      { key:'E', text:'兴奋，开始盘算"还能涨多少"，加仓念头浮现', score:{E:1} }
    ]
  },
  { id:8, dimension:'emotion',
    text:'连续亏 3 天，第 4 天你最可能？',
    options:[
      { key:'T', text:'减小仓位继续执行系统', score:{T:1} },
      { key:'E', text:'要么不敢开仓、要么报复性加仓回本', score:{E:1} }
    ]
  },
  { id:9, dimension:'emotion',
    text:'群里别人晒涨停截图，你？',
    options:[
      { key:'T', text:'不太影响，继续自己节奏', score:{T:1} },
      { key:'E', text:'心里痒，翻自选股找类似机会', score:{E:1} }
    ]
  },
  { id:10, dimension:'emotion',
    text:'家人或同事质疑你炒股，你？',
    options:[
      { key:'T', text:'解释一下就过，不影响交易', score:{T:1} },
      { key:'E', text:'情绪受影响，第二天操作明显变形', score:{E:1} }
    ]
  },

  // ============ 风险偏好 (C 保守 / G 进攻) ============
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

  // ============ 执行能力 (D 纪律 / F 机会驱动) ============
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

  // ============ 行为题 (场景化，权重 0.5，跨维度) ============
  { id:21, dimension:'behavior',
    text:'刚买入的股票当天就跌了 5%。第二天开盘前，你最可能？',
    options:[
      { key:'R', text:'重新核对买入逻辑，逻辑成立就持有', score:{R:0.5, D:0.5} },
      { key:'X', text:'看群里和大V怎么说，跟着调整', score:{X:0.5, E:0.5} }
    ]
  },
  { id:22, dimension:'behavior',
    text:'你看好的板块连涨 3 天，你还没买入。第 4 天开盘，你？',
    options:[
      { key:'C', text:'等回调再说，追高胜率不高', score:{C:0.5, T:0.5} },
      { key:'G', text:'至少先建一部分，怕错过主升', score:{G:0.5, E:0.5} }
    ]
  },
  { id:23, dimension:'behavior',
    text:'账户连续盈利 5 个交易日，第 6 天你的真实状态是？',
    options:[
      { key:'D', text:'刻意收一收，避免连胜带来的膨胀', score:{D:0.5, T:0.5} },
      { key:'F', text:'顺势加力，趁状态好乘胜追击', score:{F:0.5, G:0.5} }
    ]
  },
  { id:24, dimension:'behavior',
    text:'持有 3 个月的股票刚跌破关键支撑，但你的长期逻辑没变，你？',
    options:[
      { key:'D', text:'按预设规则减仓或离场，纪律优先', score:{D:0.5, C:0.5} },
      { key:'F', text:'坚守长期判断，等趋势重新确认', score:{F:0.5, R:0.5} }
    ]
  },
  { id:25, dimension:'behavior',
    text:'一次显著亏损之后，你最常做的事是？',
    options:[
      { key:'R', text:'写下交易日志，定位偏离系统的具体环节', score:{R:0.5, D:0.5} },
      { key:'X', text:'去翻别人怎么看后市，先暂停几天再说', score:{X:0.5, E:0.5} }
    ]
  }
]

module.exports = { questions }
