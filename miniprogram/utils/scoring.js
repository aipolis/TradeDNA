const { questions: defaultQuestions } = require('./questions')
const { getPersonality } = require('./personalities')

function sumScores(answers, questions){
  const score = { A:0, B:0, S:0, L:0, C:0, G:0, D:0, F:0 }
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
    decision:  score.A >= score.B ? 'A' : 'B',
    cycle:     score.S >= score.L ? 'S' : 'L',
    risk:      score.C >= score.G ? 'C' : 'G',
    execution: score.D >= score.F ? 'D' : 'F'
  }
}

function calculateResult(answers, questions){
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

  const code = totalCode.decision + totalCode.cycle + totalCode.risk + totalCode.execution
  const cognitiveCodeStr = cognitiveCode.decision + cognitiveCode.cycle + cognitiveCode.risk + cognitiveCode.execution
  const behaviorCodeStr = behaviorCode ? (behaviorCode.decision + behaviorCode.cycle + behaviorCode.risk + behaviorCode.execution) : null

  // 计算认知 vs 行为的背离维度
  const divergence = []
  if(behaviorCode){
    const dimNames = { decision:'决策方式', cycle:'交易周期', risk:'风险偏好', execution:'执行能力' }
    const labels = {
      A:'分析型', B:'盘感型', S:'短线型', L:'长线型',
      C:'保守型', G:'进攻型', D:'纪律型', F:'灵活型'
    }
    Object.keys(cognitiveCode).forEach(dim=>{
      if(cognitiveCode[dim] !== behaviorCode[dim]){
        divergence.push({
          dimension: dim,
          dimName: dimNames[dim],
          cognitive: labels[cognitiveCode[dim]],
          behavior: labels[behaviorCode[dim]]
        })
      }
    })
  }

  const personality = getPersonality(code)
  return {
    code,
    score,
    decision: totalCode.decision,
    cycle: totalCode.cycle,
    risk: totalCode.risk,
    execution: totalCode.execution,
    personality,
    cognitiveCode: cognitiveCodeStr,
    behaviorCode: behaviorCodeStr,
    divergence,
    timestamp: Date.now()
  }
}

module.exports = { calculateResult }
