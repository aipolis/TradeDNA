/**
 * 题目乱序工具
 * - 同一维度内的题目顺序打乱
 * - 每题选项顺序也打乱(避免"全选第一项"刷出稳定人格)
 * - 行为题(behavior)整体保留在末尾
 */

function fisherYates(arr){
  const a = arr.slice()
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1))
    ;[a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

function shuffleOptions(q){
  return { ...q, options: fisherYates(q.options) }
}

function shuffleQuestions(questions){
  const mainOrder = ['information','emotion','risk','execution']
  const groups = {}
  const behaviorGroup = []
  questions.forEach(q=>{
    if(q.dimension === 'behavior'){ behaviorGroup.push(q); return }
    if(!groups[q.dimension]) groups[q.dimension] = []
    groups[q.dimension].push(q)
  })
  const mainQs = []
  mainOrder.forEach(dim=>{
    if(groups[dim]) fisherYates(groups[dim]).forEach(q=>mainQs.push(shuffleOptions(q)))
  })
  const behaviorQs = fisherYates(behaviorGroup).map(shuffleOptions)
  return [...mainQs, ...behaviorQs]
}

module.exports = { shuffleQuestions, fisherYates }
