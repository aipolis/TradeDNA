/** V3 四维展示文案（与 questions.js / scoring.js 一致） */
const DIM_META = {
  information: { name: '信息驱动', R: '自主研究', X: '跟随外部' },
  emotion:     { name: '情绪反应', T: '情绪稳态', E: '情绪敏感' },
  risk:        { name: '风险偏好', C: '保守',     G: '进攻' },
  execution:   { name: '执行能力', D: '纪律',     F: '机会驱动' }
}

const QUIZ_DIM = {
  information: '信息驱动',
  emotion: '情绪反应',
  risk: '风险偏好',
  execution: '执行能力',
  behavior: '行为情境'
}

const TRAIT_TAG = {
  R: { ico: '🔍', text: '自主研究', canvasChar: '研' },
  X: { ico: '📡', text: '跟随外部', canvasChar: '随' },
  T: { ico: '🧘', text: '情绪稳态', canvasChar: '稳' },
  E: { ico: '💗', text: '情绪敏感', canvasChar: '感' },
  C: { ico: '🛡', text: '保守', canvasChar: '守' },
  G: { ico: '⚔', text: '进攻', canvasChar: '进' },
  D: { ico: '📏', text: '纪律', canvasChar: '律' },
  F: { ico: '⚡', text: '机会驱动', canvasChar: '机' }
}

const DIFF_DIMS = ['信息', '情绪', '风险', '执行']

function poleLabel(letter){
  for (const dim of Object.values(DIM_META)) {
    if (dim[letter]) return dim[letter]
  }
  return letter
}

module.exports = { DIM_META, QUIZ_DIM, TRAIT_TAG, DIFF_DIMS, poleLabel }
