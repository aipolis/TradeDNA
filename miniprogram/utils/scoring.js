const { questions: defaultQuestions } = require('./questions')
const { getPersonality } = require('./personalities')
const { DIM_META, poleLabel } = require('./dimensions')

function sumScores(answers, questions){
  const score = { R:0, X:0, T:0, E:0, C:0, G:0, D:0, F:0 }
  answers.forEach((selectedIndex, i)=>{
    const q = questions[i]
    if(!q || selectedIndex === undefined || selectedIndex === null) return
    const opt = q.options[selectedIndex]
    if(!opt || !opt.score) return
    Object.keys(opt.score).forEach(k=>{ score[k] = (score[k] || 0) + opt.score[k] })
  })
  return score
}

function deriveCode(score){
  return {
    information: score.R >= score.X ? 'R' : 'X',
    emotion:     score.T >= score.E ? 'T' : 'E',
    risk:        score.C >= score.G ? 'C' : 'G',
    execution:   score.D >= score.F ? 'D' : 'F'
  }
}

function detectValidityWarnings(timings, mainScore, divergenceCount){
  const warnings = []
  // 信号 1:答题反应时过快
  if(timings && timings.length){
    const valid = timings.filter(t => t > 0)
    if(valid.length){
      const fast = valid.filter(t => t < 1000).length
      if(fast / valid.length >= 0.6) warnings.push({
        type:'reactionFast',
        text:'⚠️ 你的答题速度过快(超过一半题目用时不足 1 秒),结果仅供参考,建议重测'
      })
    }
  }
  // 信号 2:得分极端 AND 主测与行为题人格不一致
  const dimsExtreme = [
    Math.abs(mainScore.R - mainScore.X) === 5,
    Math.abs(mainScore.T - mainScore.E) === 5,
    Math.abs(mainScore.C - mainScore.G) === 5,
    Math.abs(mainScore.D - mainScore.F) === 5
  ].filter(Boolean).length
  if(dimsExtreme >= 4 && divergenceCount >= 1) warnings.push({
    type:'anomalyPattern',
    text:'⚠️ 你的答题模式接近随机/极端(主测全部满分一致,但行为题与之背离),结果仅供参考,建议重测'
  })
  return warnings
}

function calculateResult(answers, questions, timings){
  const qs = questions || defaultQuestions
  const score = sumScores(answers, qs)

  // 主测题(前 20)与行为题(后 5)分轨,用于一致性提示
  const mainAnswers = answers.slice(0, 20)
  const mainQs = qs.slice(0, 20)
  const behaviorAnswers = answers.slice(20)
  const behaviorQs = qs.slice(20)

  const mainScore = sumScores(mainAnswers, mainQs)
  const behaviorScore = sumScores(behaviorAnswers, behaviorQs)

  const totalCode = deriveCode(score)
  const cognitiveCode = deriveCode(mainScore)
  const behaviorCode  = behaviorAnswers.length ? deriveCode(behaviorScore) : null

  const code = totalCode.information + totalCode.emotion + totalCode.risk + totalCode.execution
  const cognitiveCodeStr = cognitiveCode.information + cognitiveCode.emotion + cognitiveCode.risk + cognitiveCode.execution
  const behaviorCodeStr = behaviorCode ? (behaviorCode.information + behaviorCode.emotion + behaviorCode.risk + behaviorCode.execution) : null

  // 计算认知 vs 行为的背离维度
  const divergence = []
  if(behaviorCode){
    const dimNames = {
      information: DIM_META.information.name,
      emotion: DIM_META.emotion.name,
      risk: DIM_META.risk.name,
      execution: DIM_META.execution.name
    }
    Object.keys(cognitiveCode).forEach(dim=>{
      if(cognitiveCode[dim] !== behaviorCode[dim]){
        divergence.push({
          dimension: dim,
          dimName: dimNames[dim],
          cognitive: poleLabel(cognitiveCode[dim]),
          behavior: poleLabel(behaviorCode[dim])
        })
      }
    })
  }

  const personality = getPersonality(code)
  const validityWarnings = detectValidityWarnings(timings, mainScore, divergence.length)
  return {
    code,
    score,
    information: totalCode.information,
    emotion:     totalCode.emotion,
    risk:        totalCode.risk,
    execution:   totalCode.execution,
    personality,
    cognitiveCode: cognitiveCodeStr,
    behaviorCode: behaviorCodeStr,
    divergence,
    validityWarnings,
    timestamp: Date.now()
  }
}

module.exports = { calculateResult }
